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

  static async getBookingsByUser(userId) {
    try {
      const bookings = await Booking.find({
        "passenger.passengerId": userId,
      }).populate("ride");

      if (!bookings || bookings.length === 0) {
        throw new Error("No booking found for this user");
      }

      // Get driver infos from drivers table (SQL)
      for (let booking of bookings) {
        if (booking.driver && booking.driver.driverId) {
          const [driverResults] = await db.query(
            `SELECT * FROM drivers WHERE id = ?`,
            [booking.driver.driverId]
          );
          booking.driver = driverResults[0] || null; // Add car if car found
        }
      }

      return bookings;
    } catch (error) {
      console.error("Error while recovering user's bookings :" + error);
      throw new Error(
        "Error while recovering user's bookings : " + error.message
      );
    }
  }

  // update Booking
  static async updateBooking(bookingId, updateData) {
    try {
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        updateData,
        {
          new: true,
        }
      );

      if (!updatedBooking) {
        throw new Error("Booking not found");
      }

      // If bookingStatus === 'canceled'
      if (updateData.bookingStatus === "canceled") {
        const ride = await Ride.findById(updatedBooking.ride);

        if (ride) {
          // Hand over available seats
          ride.availableSeats += updatedBooking.bookingDetails.seats;

          // Withdraw booking id from ride -> if b === id, exclude from array
          ride.bookings = ride.bookings.filter((b) => b.toString() !== id);
          await ride.save();
        }

        // Credit again passenger
        const passengerId = updatedBooking.bookingDetails.passenger.passengerId;
        const refundCredits =
          ride.creditsPerPassenger * updatedBooking.bookingDetails.seats;

        // Update passenger's credits in table users (SQL)
        await db.query("UPDATE users SET credits = credits + ? WHERE id = ?", [
          refundCredits,
          passengerId,
        ]);
      }

      res.status(200).json({
        message: "Booking updated successfully",
        booking: updatedBooking,
      });
    } catch (error) {
      console.error("Error while updating user's booking:" + error);
      throw new Error("Error while updating user's booking: " + error.message);
    }
  }

  static async updateBookingsAndNotifyPassengers(rideId, bookingStatus) {
    try {
      // Get all bookings with rideId
      const bookings = await Booking.find({ ride: rideId });
      console.log(bookings);

      if (bookings.length === 0) {
        console.log("No bookings found for this ride:" + rideId);
        return;
      }

      // Update every booking found and send email to passenger
      for (const booking of bookings) {
        booking.bookingStatus = bookingStatus;
        await booking.save();

        const bookingId = booking._id;

        // Get passenger's infos
        const passengerId = booking.bookingDetails.passenger.passengerId;
        const passengerAccount = await Account.getAccountById(passengerId);
        const passengerDetails = await User.getUserById(passengerId);

        const passengerData = {
          passengerId,
          email: passengerAccount.email,
          username: passengerDetails.username,
        };

        // Send notification email according to booking status
        await sendNotificationRideEmail(
          passengerData,
          rideId,
          bookingStatus,
          bookingId
        );
      }

      console.log("All passengers have been notified.");
    } catch (error) {
      console.error("Error updating bookings and notifying passengers:", error);
    }
  }

  // Delete Booking
  static async deleteBooking(bookingId) {
    try {
      return await Booking.findByIdAndDelete(bookingId);
    } catch (error) {
      console.error("Error while deleting booking :" + error);
      throw new Error("Error while deleting booking : " + error.message);
    }
  }
}

// Export model Booking and class BookingModel
module.exports = { Booking, BookingModel };
