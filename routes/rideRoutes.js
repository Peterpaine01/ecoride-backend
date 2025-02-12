const express = require("express");
const router = express.Router();

const db = require("../config/mysql");
const mongoose = require("../config/mongodb");

// Import models
const { Ride, RideModel } = require("../models/Ride");
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
    const { departureCity, destinationCity, availableSeats, departureDate } =
      req.query;

    console.log(req.query);

    const rides = await RideModel.getRides({
      departureCity,
      destinationCity,
      availableSeats,
      departureDate,
    });

    if (rides.length === 0) {
      return res.status(404).json({
        message: "Aucun trajet trouvé avec ces critères.",
      });
    }

    res.status(200).json({
      message: "Rides recovered successfully",
      rides,
    });
  } catch (error) {
    console.error("Error while recovering rides :" + error);
    res.status(500).json({ message: "Server error" + error.message });
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
