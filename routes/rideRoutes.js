const express = require("express");
const router = express.Router();

const db = require("../config/mysql");
const mongoose = require("../config/mongodb");

// Import models
const { Ride, RideModel } = require("../models/Ride");
const { Booking, BookingModel } = require("../models/Booking");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Car = require("../models/Car");

// Import middleware authenticateToken
const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken");

router.post("/create-ride", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Check if user is a driver
    const [driverResults] = await db.query(
      `SELECT user_id FROM drivers WHERE user_id = ?`,
      [user.id]
    );

    if (driverResults.length === 0) {
      return res.status(403).json({
        message: "Acces denied : you need to be a driver to set a ride",
      });
    }

    const {
      departureDate,
      departureStreet,
      departureCity,
      departureZip,
      destinationStreet,
      destinationCity,
      destinationZip,
      duration,
      availableSeats,
      creditsPerPassenger,
      description,
      car,
    } = req.body;

    const ride = await RideModel.createRide(
      departureDate,
      departureStreet,
      departureCity,
      departureZip,
      destinationStreet,
      destinationCity,
      destinationZip,
      duration,
      availableSeats,
      creditsPerPassenger,
      description,
      car,
      user.id
    );

    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/ride/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get ride by id
    const ride = await RideModel.getRideById(id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Get driver's infos
    const driver = await User.getUserById(ride.driver.driverId);
    const driverDetails = await Driver.getDriverById(ride.driver.driverId);

    // Get car's details
    const car = await Car.getCarById(ride.car.carId);

    // Concate details
    const rideWithDetails = {
      ...ride.toObject(), // Convert to JS Objet
      driver: {
        ...driver,
        ...driverDetails,
      },
      car: car,
    };

    res.status(200).json(rideWithDetails);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/update-ride/:id", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const rideId = req.params.id;
    const updateData = req.body;

    // Check if user is a driver
    const [driverResults] = await db.query(
      `SELECT user_id FROM drivers WHERE user_id = ?`,
      [user.id]
    );

    if (driverResults.length === 0) {
      return res.status(403).json({
        message: "Acces denied : you need to be a driver to update a ride",
      });
    }

    // Update ride
    const updatedRide = await RideModel.updateRide(rideId, updateData);

    // If rideStatus === "completed", update related bookings and send mail
    const bookingStatus = updateData.rideStatus;

    if (updateData.rideStatus) {
      console.log(`Ride ${rideId} is completed. Updating related bookings...`);
      await BookingModel.updateBookingsAndNotifyPassengers(
        rideId,
        bookingStatus
      );
    }

    res
      .status(200)
      .json({ message: "Ride updated successfully", ride: updatedRide });
  } catch (error) {
    console.error("Error while updating ride :" + error);
    res.status(500).json({ message: "Server error" + error.message });
  }
});

router.get("/driver-rides", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Check if user is a driver
    const [driverResults] = await db.query(
      `SELECT user_id FROM drivers WHERE user_id = ?`,
      [user.id]
    );

    if (driverResults.length === 0) {
      return res.status(403).json({
        message:
          "Accès refusé : vous devez être un conducteur pour voir vos trajets",
      });
    }

    // Get driver's rides
    const rides = await RideModel.getRidesByDriver(user.id);

    res.status(200).json({ message: "Rides recovered successfully", rides });
  } catch (error) {
    console.error("Error while recovering rides :" + error);
    res.status(500).json({ message: "Server error" + error.message });
  }
});

router.get("/search-rides", async (req, res) => {
  try {
    const searchData = req.query;

    console.log("Recherche avec :", searchData);

    // Fetch rides (MongoDB)
    let rides = await RideModel.getRides(searchData);

    if (rides.length === 0) {
      return res
        .status(404)
        .json({ message: "No ride found with these criteria" });
    }

    // Add car & driver details
    rides = await Promise.all(
      rides.map(async (ride) => {
        let updatedRide = { ...ride.toObject() }; // Convert Mongoose Doc in JS Object

        // Fetch car (SQL)
        if (ride.car && ride.car.carId) {
          const [carResults] = await db.query(
            `SELECT * FROM cars WHERE id = ?`,
            [ride.car.carId]
          );
          updatedRide.car = carResults.length > 0 ? carResults[0] : null;

          // Filter electrical car
          if (
            searchData.isElectric &&
            updatedRide.car &&
            updatedRide.car.energy_id !== 3
          ) {
            return null;
          }
        }

        // Fetch driver (SQL)
        if (ride.driver && ride.driver.driverId) {
          const [driverResults] = await db.query(
            `SELECT d.user_id, u.username, d.accept_smoking, d.accept_animals, 
                    rs.average_rating, rs.total_reviews
             FROM drivers d
             JOIN users u ON d.user_id = u.account_id
             LEFT JOIN reviews_summaries rs ON d.user_id = rs.driver_id
             WHERE d.user_id = ?`,
            [ride.driver.driverId]
          );

          if (driverResults.length > 0) {
            updatedRide.driver = driverResults[0];

            // Filter according to driver's rating
            if (
              searchData.minDriverRating &&
              updatedRide.driver.average_rating < searchData.minDriverRating
            ) {
              return null;
            }

            // Filter according to driver's preferences
            if (
              searchData.acceptSmoking &&
              !updatedRide.driver.accept_smoking
            ) {
              return null;
            }
            if (
              searchData.acceptAnimals &&
              !updatedRide.driver.accept_animals
            ) {
              return null;
            }
          }
        }

        return updatedRide;
      })
    );

    // Delete ride which don't meet filters
    rides = rides.filter((ride) => ride !== null);

    return res.status(200).json({
      message: "Rides recovered successfully",
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Error fetching rides : " + error);
    res.status(500).json({ message: "Servor Error: " + error.message });
  }
});

router.delete("/delete-ride/:id", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const rideId = req.params.id;

    // Check if user is a driver
    const [driverResults] = await db.query(
      `SELECT user_id FROM drivers WHERE user_id = ?`,
      [user.id]
    );

    if (driverResults.length === 0) {
      return res.status(403).json({
        message: "Acces denied : you need to be a driver to delete a ride",
      });
    }

    // Check if user is ride's owner
    const ride = await RideModel.getRideById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driver.driverId !== user.id) {
      return res.status(403).json({
        message: "Acces denied : you can delete your rides only",
      });
    }

    await RideModel.deleteRide(rideId);
    res.status(200).json({ message: "Ride deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
