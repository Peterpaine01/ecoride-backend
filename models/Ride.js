const mongoose = require("../config/mongodb")
const db = require("../config/mysql")

const Driver = require("./Driver")
const User = require("./User")

const normalizeCity = require("../utils/normalizeCity")

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
    let {
      departureCity,
      destinationCity,
      availableSeats,
      departureDate,
      maxCreditsPerPassenger,
      maxDuration,
      fuzzy,
      gender,
      minRating,
      acceptSmoking,
      acceptAnimals,
    } = searchData

    const isFuzzy = fuzzy === "true"

    try {
      const filter = { rideStatus: "forthcoming" }

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

      if (!isNaN(Number(availableSeats))) {
        filter.availableSeats = { $gte: Number(availableSeats) }
      }

      const now = new Date()
      // console.log("now", now)

      const offsetMs = now.getTimezoneOffset() * 60 * 1000 // en ms
      const localMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
      const todayLocal = new Date(localMidnight.getTime() - offsetMs) // convertie en UTC
      todayLocal.setHours(0, 0, 0, 0)

      // console.log("todayLocal", todayLocal)

      if (departureDate) {
        const startOfDay = new Date(departureDate)
        startOfDay.toLocaleString()
        // console.log("startOfDay", startOfDay)

        const endOfDay = new Date(departureDate)
        endOfDay.setHours(23, 59, 59, 999).toLocaleString()
        // console.log("endOfDay", endOfDay)

        const isSameDay =
          startOfDay.getFullYear() === todayLocal.getFullYear() &&
          startOfDay.getMonth() === todayLocal.getMonth() &&
          startOfDay.getDate() === todayLocal.getDate()
        // console.log("isSameDay", isSameDay)

        if (isFuzzy) {
          const endOfFuzzyWindow = new Date(startOfDay)
          endOfFuzzyWindow.setDate(endOfFuzzyWindow.getDate() + 3)

          filter.departureDate = {
            $gte: startOfDay,
            $lte: endOfFuzzyWindow,
          }

          if (isSameDay) {
            filter.departureDate = { $gte: now, $lte: endOfFuzzyWindow }
          }
        } else {
          if (isSameDay) {
            filter.departureDate = {
              $gte: now,
              $lte: endOfDay,
            }
          } else {
            filter.departureDate = {
              $gte: startOfDay,
              $lte: endOfDay,
            }
          }
        }
      } else {
        filter.departureDate = {
          $gte: now,
        }
      }

      if (!isNaN(Number(maxCreditsPerPassenger))) {
        filter.creditsPerPassenger = { $lte: Number(maxCreditsPerPassenger) }
      }

      if (!isNaN(Number(maxDuration))) {
        filter.duration = { $lte: Number(maxDuration) }
      }
      // console.log("filter >", filter)
      const rides = await Ride.find(filter).sort({
        departureDate: 1,
        departureTime: 1,
      })

      if (!gender && !acceptSmoking && !acceptAnimals && !minRating) {
        return rides
      }

      // Driver criteria
      const filteredRides = []
      acceptSmoking = acceptSmoking === "true" ? 1 : 0
      acceptAnimals = acceptAnimals === "true" ? 1 : 0

      for (const ride of rides) {
        const driver = await Driver.getDriverById(ride.driver.driverId)
        if (!driver) continue

        if (gender && gender !== "all") {
          const acceptedGenders =
            gender === "male" ? ["male", "other"] : ["female", "other"]
          if (!acceptedGenders.includes(driver.gender)) continue
        }
        if (acceptSmoking && driver.accept_smoking !== acceptSmoking) continue
        if (acceptAnimals && driver.accept_animals !== acceptAnimals) continue
        if (minRating && driver.average_rating < Number(minRating)) continue

        filteredRides.push(ride)
      }
      return filteredRides
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
