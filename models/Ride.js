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
  // bookings: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Booking",
  //   },
  // ],
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

      if (!rides || rides.length === 0) {
        throw new Error("No ride found for this driver");
      }

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
      isElectric,
      minDriverRating,
      acceptSmoking,
      acceptAnimals,
    } = searchData;
    try {
      // Build the filters according to the criteria passed as params
      const filter = {};

      // Filter according to ride status => only forthcoming rides
      filter["rideStatus"] = "forthcoming";

      // Departure city -> ignore case
      if (departureCity) {
        filter["departureAddress.city"] = {
          $regex: new RegExp(departureCity, "i"), // Regex to ignore string case
        };
      }

      // destination city -> ignore case
      if (destinationCity) {
        filter["destinationAddress.city"] = {
          $regex: new RegExp(destinationCity, "i"),
        };
      }

      // Available seats
      if (availableSeats) {
        filter.availableSeats = { $gte: availableSeats }; // greater than or egal to available seats
      }

      // Departure date
      if (departureDate) {
        // Convert departureDate to ignore time => only comparing dates
        const startOfDay = new Date(departureDate);
        startOfDay.setHours(0, 0, 0, 0); // Set to 00:00:00
        const endOfDay = new Date(departureDate);
        endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59

        filter.departureDate = { $gte: startOfDay, $lte: endOfDay }; // greater than or egal to starDay AND lesser than or egal to endDay
      }

      // Filter according to credits
      if (maxCreditsPerPassenger) {
        filter.creditsPerPassenger = { $lte: maxCreditsPerPassenger };
      }

      // Filter according to maxDuration
      if (maxDuration) {
        filter.duration = { $lte: maxDuration }; // lesser than or egal to maxDuration
      }

      // Get rides according to filters
      let rides = await Ride.find(filter).sort({ departureDate: 1 }); // Sort by ascendant date (1)

      // Get car details from cars table
      for (let ride of rides) {
        if (ride.car && ride.car.carId) {
          const [carResults] = await db.query(
            `SELECT * FROM cars WHERE id = ?`,
            [ride.car.carId]
          );
          ride.car = carResults[0] || null;

          // Filter accrording to energy's car => electric car = id n°3 in energies table
          if (isElectric && ride.car && ride.car.energy_id !== 3) {
            continue; // Continue if not electric
          }
        }

        // Get driver's infos to check driver's rating
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

          ride.driver = driverResults[0] || null;

          // Check driver's rating
          if (minDriverRating && ride.driver.average_rating < minDriverRating) {
            continue; // Exclude if lower rating
          }

          // Filter according to driver's preferences (smoking & animals)
          if (acceptSmoking && ride.driver && !ride.driver.accept_smoking) {
            continue;
          }
          if (acceptAnimals && ride.driver && !ride.driver.accept_animals) {
            continue;
          }
        }
      }

      // Count rides
      const count = rides.length;

      return { count, rides };
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
