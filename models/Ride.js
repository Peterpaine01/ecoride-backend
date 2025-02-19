const mongoose = require("../config/mongodb");
const db = require("../config/mysql");

// Define schema
const rideSchema = new mongoose.Schema({
  departureDate: Date,
  departureAddress: Object, // { street: String, city: String, zip: String }
  destinationAddress: Object,
  duration: Number,
  availableSeats: Number,
  creditsPerPassenger: Number,
  description: String,
  rideStatus: {
    type: String,
    enum: ["forthcoming", "canceled", "ongoing", "completed"],
    default: "forthcoming",
  },
  driver: {
    driverId: Number,
  },
  car: {
    carId: Number,
  },
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  ],
});

// Set mongoose model
const Ride = mongoose.model("Ride", rideSchema);

// Class to encapsulate methods
class RideModel {
  // Add new ride
  static async createRide(
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
    userId
  ) {
    try {
      const newRide = new Ride({
        departureDate: departureDate,
        departureAddress: {
          street: departureStreet,
          city: departureCity,
          zip: departureZip,
        },
        destinationAddress: {
          street: destinationStreet,
          city: destinationCity,
          zip: destinationZip,
        },
        duration: duration,
        availableSeats: availableSeats,
        creditsPerPassenger: creditsPerPassenger,
        description: description,
        driver: { driverId: userId },
        car: { carId: car },
      });
      return await newRide.save();
    } catch (error) {
      throw new Error("Error creating ride: " + error.message);
    }
  }

  static async getRideById(rideId) {
    try {
      const ride = await Ride.findById(rideId);
      return ride;
    } catch (error) {
      throw new Error("Ride not found: " + error.message);
    }
  }

  static async getRidesByDriver(driverId) {
    try {
      const rides = await Ride.find({ "driver.driverId": driverId });
      // const rides = await Ride.find({ "driver.driverId": driverId }).populate(
      //   "bookings"
      // );

      // Get car details from cars table (SQL)
      for (let ride of rides) {
        if (ride.car && ride.car.carId) {
          const [carResults] = await db.query(
            `SELECT * FROM cars WHERE id = ?`,
            [ride.car.carId]
          );
          ride.car = carResults[0] || null; // Add car details
        }
      }

      return rides;
    } catch (error) {
      console.error("Error fetching rides:" + error);
      throw new Error("Error fetching rides: " + error.message);
    }
  }

  static async getRides(searchData) {
    const {
      departureCity,
      destinationCity,
      availableSeats,
      departureDate,
      maxCreditsPerPassenger,
      maxDuration,
    } = searchData;

    try {
      const filter = { rideStatus: "forthcoming" };

      if (departureCity) {
        filter["departureAddress.city"] = {
          $regex: new RegExp(departureCity, "i"),
        };
      }
      if (destinationCity) {
        filter["destinationAddress.city"] = {
          $regex: new RegExp(destinationCity, "i"),
        };
      }
      if (availableSeats) {
        filter.availableSeats = { $gte: availableSeats };
      }
      if (departureDate) {
        const startOfDay = new Date(departureDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(departureDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.departureDate = { $gte: startOfDay, $lte: endOfDay };
      }
      if (maxCreditsPerPassenger) {
        filter.creditsPerPassenger = { $lte: maxCreditsPerPassenger };
      }
      if (maxDuration) {
        filter.duration = { $lte: maxDuration };
      }

      let rides = await Ride.find(filter).sort({ departureDate: 1 });

      return rides;
    } catch (error) {
      throw new Error("Error fetching rides: " + error.message);
    }
  }

  // Update ride
  static async updateRide(rideId, updateData) {
    try {
      const updatedRide = await Ride.findByIdAndUpdate(rideId, updateData, {
        new: true,
      });

      if (!updatedRide) {
        throw new Error("Ride not found");
      }

      return updatedRide;
    } catch (error) {
      console.error("Error updating ride:" + error);
      throw new Error("Error updating ride:" + error.message);
    }
  }

  // Delete ride
  static async deleteRide(rideId) {
    try {
      return await Ride.findByIdAndDelete(rideId);
    } catch (error) {
      throw new Error("Error deleting ride: " + error.message);
    }
  }
}

// Export model Ride and class RideModel
module.exports = { Ride, RideModel };
