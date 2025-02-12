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

router.post("/create-booking/:id", authenticateToken, async (req, res) => {
  try {
    const passengerId = req.user.id;
    const { bookingData } = req.body;
    const rideId = req.params.id;

    const newBooking = await BookingModel.createBooking(
      passengerId,
      bookingData,
      rideId
    );

    res.status(201).json(newBooking);
  } catch (error) {
    return res.status(500).json({ message: "Error server" + error.message });
  }
});

router.get("/booking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Get booking by id
    const booking = await BookingModel.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    // Get driver's infos
    const driver = await User.getUserById(
      booking.bookingDetails.driver.driverId
    );

    const driverDetails = await Driver.getDriverById(
      booking.bookingDetails.driver.driverId
    );

    // Get passenger's infos
    const passenger = await User.getUserById(
      booking.bookingDetails.passenger.passengerId
    );

    // Get car's details
    const car = await db.query("SELECT * FROM cars WHERE id = ?", [
      booking.ride.car.carId,
    ]);

    const carDetails = car[0][0];
    console.log("carDetails ->", carDetails);
    const bookingWithDetails = {
      _id: booking._id,
      bookingDetails: {
        passenger: passenger,
        driver: { ...driver, driverDetails },
        seats: booking.bookingDetails.seats,
        totalCredits: booking.bookingDetails.totalCredits,
      },
      ride: {
        _id: booking.ride._id,
        departureDate: booking.ride.departureDate,
        departureAddress: booking.ride.departureAddress,
        destinationAddress: booking.ride.destinationAddress,
        duration: booking.ride.duration,
        availableSeats: booking.ride.availableSeats,
        creditsPerPassenger: booking.ride.creditsPerPassenger,
        description: booking.ride.description,
        rideStatus: booking.ride.rideStatus,
        car: { ...carDetails },
      },
    };

    res.status(200).json(bookingWithDetails);
  } catch (error) {
    return res.status(500).json({ message: "Error server" + error.message });
  }
});

router.put("/update-booking/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedBooking = await BookingModel.updateBooking(id, updateData);

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error("Error while updating booking: " + error);
    res
      .status(500)
      .json({ message: "Error while updating booking:" + error.message });
  }
});

router.delete("/delete-booking/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBooking = await BookingModel.deleteBooking(id);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error while deleting booking: " + error);
    res
      .status(500)
      .json({ message: "Error while deleting booking:" + error.message });
  }
});

module.exports = router;
