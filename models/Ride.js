const mongoose = require("../config/mongodb")
const db = require("../config/mysql")

const Driver = require("./Driver")
const { Booking, BookingModel } = require("./Booking")
const Car = require("./Car")

const normalizeCity = require("../utils/normalizeCity")

// Define schema
const rideSchema = new mongoose.Schema({
  departureDate: Date,
  departureAddress: Object, // { street: String, city: String, normalizedCity: String, zip: String }
  destinationAddress: Object,
  duration: Number,
  availableSeats: Number,
  remainingSeats: Number,
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
        remainingSeats: availableSeats,
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
      const ride = await Ride.findById(rideId).populate("bookings")
      return ride
    } catch (error) {
      throw new Error("Ride not found: " + error.message)
    }
  }

  static async getBookingsByRideId(rideId) {
    try {
      const ride = await Ride.findById(rideId)
      if (!ride) {
        throw new Error("Ride not found")
      }

      // Récupère les IDs des bookings (présumés stockés comme ObjectIds dans ride.bookings)
      const bookingIds = ride.bookings || []
      // console.log("bookingIds", bookingIds)

      // Appelle getBookingById pour chaque ID
      const populatedBookings = await Promise.all(
        bookingIds.map(async (bookingId) => {
          try {
            return await BookingModel.getBookingById(bookingId)
          } catch (error) {
            console.warn(
              `Booking ${bookingId} could not be fetched:`,
              error.message
            )
            return null // tu peux aussi filtrer après
          }
        })
      )
      console.log("populatedBookings", populatedBookings)

      // Nettoie les bookings nulls (éventuelles erreurs)
      return populatedBookings.filter((b) => b !== null)
    } catch (error) {
      console.error("Error fetching bookings for ride:", error)
      throw new Error("Error fetching bookings for ride: " + error.message)
    }
  }

  static async getRidesByDriver(driverId) {
    try {
      const rides = await Ride.find({ "driver.driverId": driverId })

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
      departureDate,
      maxCreditsPerPassenger,
      maxDuration,
      fuzzy,
      gender,
      minRating,
      acceptSmoking,
      acceptAnimals,
      remainingSeats,
      isElectric,
    } = searchData

    isElectric = isElectric === "true" ? true : false

    console.log("isElectric", isElectric)

    const isFuzzy = fuzzy === "true"

    try {
      const filter = { rideStatus: "forthcoming" }

      if (departureCity?.trim()) {
        filter["departureAddress.normalizedCity"] = {
          $exists: true,
          $regex: new RegExp(normalizeCity(departureCity), "i"),
        }
      }

      if (destinationCity?.trim()) {
        filter["destinationAddress.normalizedCity"] = {
          $exists: true,
          $regex: new RegExp(normalizeCity(destinationCity), "i"),
        }
      }

      if (!isNaN(Number(remainingSeats))) {
        filter.remainingSeats = { $gte: Number(remainingSeats) }
      }

      const now = new Date()

      const offsetMs = now.getTimezoneOffset() * 60 * 1000 // en ms
      const localMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
      const todayLocal = new Date(localMidnight.getTime() - offsetMs)
      todayLocal.setHours(0, 0, 0, 0)

      if (departureDate) {
        const startOfDay = new Date(departureDate)
        startOfDay.setHours(0, 0, 0, 0) // début du jour à minuit

        const endOfDay = new Date(departureDate)
        endOfDay.setHours(23, 59, 59, 999) // fin du jour

        const isSameDay =
          startOfDay.getFullYear() === todayLocal.getFullYear() &&
          startOfDay.getMonth() === todayLocal.getMonth() &&
          startOfDay.getDate() === todayLocal.getDate()

        if (isFuzzy) {
          const endOfFuzzyWindow = new Date(startOfDay)
          endOfFuzzyWindow.setDate(endOfFuzzyWindow.getDate() + 3)
          endOfFuzzyWindow.setHours(23, 59, 59, 999) // fin du 3e jour

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

      if (
        !gender &&
        !acceptSmoking &&
        !acceptAnimals &&
        !minRating &&
        !isElectric
      ) {
        return rides
      }

      // Driver criteria
      const filteredRides = []
      acceptSmoking = acceptSmoking === "true" ? 1 : 0
      acceptAnimals = acceptAnimals === "true" ? 1 : 0
      for (const ride of rides) {
        const driver = await Driver.getDriverById(ride.driver.driverId)
        if (!driver) continue

        if (isElectric) {
          const car = await Car.getCarById(ride.car.carId)
          console.log("car.energy_id", car.energy_id)

          if (!car || car.energy_id !== 3) continue
        }

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
      console.log("filteredRides after", filteredRides.length)
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
