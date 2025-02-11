const mongoose = require("../config/mongodb");
const db = require("../config/mysql");

const sendNotificationRideEmail = require("../utils/sendNotificationRideEmail");

const { Ride, RideModel } = require("../models/Ride");
const User = require("../models/User");
const Account = require("../models/Account");

const bookingSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
  },
  bookingDetails: {
    passenger: {
      passengerId: Number,
    },
    driver: {
      driverId: Number,
    },
    seats: Number,
    totalCredits: Number,
  },
  bookingStatus: {
    type: String,
    enum: ["forthcoming", "canceled", "ongoing", "completed"],
    default: "forthcoming",
  },
});

// Set mongoose model
const Booking = mongoose.model("Booking", bookingSchema);

// Class to encapsulate methods
class BookingModel {
  // create new booking
  static async createBooking(passengerId, bookingData, rideId) {
    try {
      const { seats } = bookingData;

      // Get ride by id
      const ride = await Ride.findById(rideId);
      if (!ride) {
        throw new Error("Ride not found");
      }

      const driverId = ride.driver.driverId;

      // Check passenger's credits in users table (SQL)
      const [userResult] = await db.query(
        "SELECT credits FROM users WHERE account_id = ?",
        [passengerId]
      );

      if (userResult.length === 0) {
        throw new Error("User not found");
      }
      console.log(userResult[0]);
      const userCredits = userResult[0].credits;
      const totalCredits = ride.creditsPerPassenger * seats;

      if (userCredits < totalCredits) {
        throw new Error("Insufficient number of credits");
      }

      // Check if enough available seats
      if (ride.availableSeats < seats) {
        throw new Error("Not enough available seats");
      }

      // Deduct credits from passenger's credits in users table (SQL)
      await db.query(
        "UPDATE users SET credits = credits - ? WHERE account_id = ?",
        [totalCredits, passengerId]
      );

      // Deduct number of seat from ride (MongoDB)
      ride.availableSeats -= seats;

      // Create booking (MongoDB)
      const newBooking = new Booking({
        ride: rideId,
        bookingDetails: {
          passenger: { passengerId },
          driver: { driverId },
          seats,
          totalCredits,
        },
      });

      await newBooking.save();

      // Add new booking id in ride's bookings array
      ride.bookings.push(newBooking._id);
      await ride.save();

      // Send notification email to confirm booking
      // Get passenger's infos
      const passengerAccount = await Account.getAccountById(passengerId);
      const passengerDetails = await User.getUserById(passengerId);

      const passengerData = {
        passengerId,
        email: passengerAccount.email,
        username: passengerDetails.username,
      };

      // Get booking Id and status
      const bookingId = newBooking._id;
      const bookingStatus = newBooking.bookingStatus;

      await sendNotificationRideEmail(
        passengerData,
        rideId,
        bookingStatus,
        bookingId
      );

      return newBooking;
    } catch (error) {
      console.error("Error while creating booking: " + error);
      throw new Error("Error while creating booking: " + error.message);
    }
  }

  // Get booking by id
  static async getBookingById(bookingId) {
    try {
      const booking = await Booking.findById(bookingId).populate("ride");
      return booking;
    } catch (error) {
      console.log("Booking not found: " + error);

      throw new Error("Booking not found: " + error.message);
    }
  }
}

// Export model Booking and class BookingModel
module.exports = { Booking, BookingModel };
