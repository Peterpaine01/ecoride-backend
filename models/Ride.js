const mongoose = require("../config/mongodb")
const db = require("../config/mysql")

// Define schema
const rideSchema = new mongoose.Schema({
  departureDate: Date,
  departureAddress: Object, // { street: String, city: String, normalizedCity: String, zip: String }
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
})

// Set mongoose model
const Ride = mongoose.model("Ride", rideSchema)

// Class to encapsulate methods
class RideModel {
  // Add new ride
  static async createRide(
    departureDate,
    departureAddress,
    destinationAddress,
    duration,
    availableSeats,
    creditsPerPassenger,
    description,
    vehicleId,
    userId
  ) {
    try {
      const newRide = new Ride({
        departureDate,
        departureAddress: {
          ...departureAddress,
          normalizedCity: normalizeCity(departureAddress.city),
        },
        destinationAddress: {
          ...destinationAddress,
          normalizedCity: normalizeCity(destinationAddress.city),
        },
        duration,
        availableSeats,
        creditsPerPassenger,
        description,
        driver: { driverId: userId },
        car: {
          carId: vehicleId,
        },
      })
      return await newRide.save()
    } catch (error) {
      throw new Error("Error creating ride: " + error.message)
    }
  }

  static async getRideById(rideId) {
    try {
      const ride = await Ride.findById(rideId)
      return ride
    } catch (error) {
      throw new Error("Ride not found: " + error.message)
    }
  }

  static async getRidesByDriver(driverId) {
    try {
      const rides = await Ride.find({ "driver.driverId": driverId })
      // const rides = await Ride.find({ "driver.driverId": driverId }).populate(
      //   "bookings"
      // );

      // Get car details from cars table (SQL)
      for (let ride of rides) {
        if (ride.car && ride.car.carId) {
          const [carResults] = await db.query(
            `SELECT * FROM cars WHERE id = ?`,
            [ride.car.carId]
          )
          ride.car = carResults[0] || null // Add car details
        }
      }

      return rides
    } catch (error) {
      console.error("Error fetching rides:" + error)
      throw new Error("Error fetching rides: " + error.message)
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
    } = searchData

    try {
      const filter = { rideStatus: "forthcoming" }

      const normalizeCity = (str) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

      if (departureCity) {
        filter["departureAddress.normalizedCity"] = {
          $exists: true,
          $regex: new RegExp(normalizeCity(departureCity), "i"),
        }
      }

      if (destinationCity) {
        filter["destinationAddress.normalizedCity"] = {
          $exists: true,
          $regex: new RegExp(normalizeCity(destinationCity), "i"),
        }
      }

      if (availableSeats) {
        filter.availableSeats = { $gte: Number(availableSeats) }
      }

      const now = new Date()

      if (departureDate) {
        const startOfDay = new Date(departureDate)
        startOfDay.setHours(0, 0, 0, 0)

        if (startOfDay.toDateString() === now.toDateString()) {
          const currentTime = now.toTimeString().slice(0, 5)
          filter.$or = [
            { departureDate: { $gt: startOfDay } },
            {
              departureDate: startOfDay,
              departureTime: { $gt: currentTime },
            },
          ]
        } else {
          const endOfDay = new Date(departureDate)
          endOfDay.setHours(23, 59, 59, 999)
          filter.departureDate = { $gte: startOfDay, $lte: endOfDay }
        }
      } else {
        // Si aucune date précisée : tous les trajets à partir de maintenant
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const currentTime = now.toTimeString().slice(0, 5)

        filter.$or = [
          { departureDate: { $gt: startOfToday } },
          {
            departureDate: startOfToday,
            departureTime: { $gt: currentTime },
          },
        ]
      }

      if (maxCreditsPerPassenger) {
        filter.creditsPerPassenger = { $lte: Number(maxCreditsPerPassenger) }
      }

      if (maxDuration) {
        filter.duration = { $lte: Number(maxDuration) }
      }
      console.log("filter >", filter)
      const rides = await Ride.find(filter).sort({
        departureDate: 1,
        departureTime: 1,
      })

      return rides
    } catch (error) {
      throw new Error("Error fetching rides: " + error.message)
    }
  }

  // Update ride
  static async updateRide(rideId, updateData) {
    try {
      if (updateData.departureAddress?.city) {
        updateData.departureAddress.normalizedCity = normalizeCity(
          updateData.departureAddress.city
        )
      }

      if (updateData.destinationAddress?.city) {
        updateData.destinationAddress.normalizedCity = normalizeCity(
          updateData.destinationAddress.city
        )
      }

      const updatedRide = await Ride.findByIdAndUpdate(rideId, updateData, {
        new: true,
      })

      if (!updatedRide) {
        throw new Error("Ride not found")
      }

      return updatedRide
    } catch (error) {
      console.error("Error updating ride:" + error)
      throw new Error("Error updating ride:" + error.message)
    }
  }

  // Delete ride
  static async deleteRide(rideId) {
    try {
      return await Ride.findByIdAndDelete(rideId)
    } catch (error) {
      throw new Error("Error deleting ride: " + error.message)
    }
  }
}

// Export model Ride and class RideModel
module.exports = { Ride, RideModel }
