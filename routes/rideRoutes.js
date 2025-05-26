const express = require("express")
const router = express.Router()

const sanitizeInput = require("../middlewares/sanitizeInput")

const db = require("../config/mysql")
const mongoose = require("../config/mongodb")

// Import models
const { Ride, RideModel } = require("../models/Ride")
const { Booking, BookingModel } = require("../models/Booking")
const User = require("../models/User")
const Driver = require("../models/Driver")
const Car = require("../models/Car")

// Import middleware authenticateToken
const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken")

router.post(
  "/create-ride",
  authenticateToken,
  sanitizeInput,
  async (req, res) => {
    try {
      const user = req.user

      // Check if user is a driver
      const [driverResults] = await db.query(
        `SELECT user_id FROM drivers WHERE user_id = ?`,
        [user.id]
      )

      if (driverResults.length === 0) {
        return res.status(403).json({
          message: "Acces denied : you need to be a driver to set a ride",
        })
      }

      const {
        departureDate,
        departureAddress,
        destinationAddress,
        duration,
        availableSeats,
        creditsPerPassenger,
        description,
        vehicleId,
      } = req.body

      const ride = await RideModel.createRide(
        departureDate,
        departureAddress,
        destinationAddress,
        duration,
        availableSeats,
        creditsPerPassenger,
        description,
        vehicleId,
        user.id
      )

      res.status(201).json(ride)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }
)

router.get("/ride/:id", async (req, res) => {
  try {
    const { id } = req.params

    const ride = await RideModel.getRideById(id)
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" })
    }

    const driver = await User.getUserById(ride.driver.driverId)
    const driverDetails = await Driver.getDriverById(ride.driver.driverId)

    const car = await Car.getCarById(ride.car.carId)

    const rideWithDetails = {
      ...ride.toObject(),
      driver: {
        ...driver,
        ...driverDetails,
      },
      car,
      bookings: ride.bookings,
    }

    res.status(200).json(rideWithDetails)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// GET bookings for a given ride ID
router.get("/ride/:rideId/bookings", async (req, res) => {
  try {
    const { rideId } = req.params
    const bookings = await RideModel.getBookingsByRideId(rideId)
    res.json(bookings)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
})

router.patch(
  "/update-ride/:id",
  authenticateToken,
  sanitizeInput,
  async (req, res) => {
    try {
      const user = req.user
      const rideId = req.params.id
      const updateData = req.body

      // Check if user is a driver
      const [driverResults] = await db.query(
        `SELECT user_id FROM drivers WHERE user_id = ?`,
        [user.id]
      )

      if (driverResults.length === 0) {
        return res.status(403).json({
          message: "Acces denied : you need to be a driver to update a ride",
        })
      }

      // Update ride
      const updatedRide = await RideModel.updateRide(rideId, updateData)

      // If rideStatus === "completed", update related bookings
      const bookingStatus = updateData.rideStatus

      if (updateData.rideStatus) {
        console.log(`Ride ${rideId} is completed. Updating related bookings...`)
        await BookingModel.updateBookingsAndNotifyPassengers(
          rideId,
          bookingStatus
        )
      }

      res
        .status(200)
        .json({ message: "Ride updated successfully", ride: updatedRide })
    } catch (error) {
      console.error("Error while updating ride :" + error)
      res.status(500).json({ message: "Server error" + error.message })
    }
  }
)

router.get("/driver-rides", authenticateToken, async (req, res) => {
  try {
    const user = req.user

    // Check if user is a driver
    const [driverResults] = await db.query(
      `SELECT user_id FROM drivers WHERE user_id = ?`,
      [user.id]
    )

    if (driverResults.length === 0) {
      return res.status(403).json({
        message:
          "Accès refusé : vous devez être un conducteur pour voir vos trajets",
      })
    }

    // Get driver's rides
    const rides = await RideModel.getRidesByDriver(user.id)

    res.status(200).json({ message: "Rides recovered successfully", rides })
  } catch (error) {
    console.error("Error recovering rides :" + error)
    res.status(500).json({ message: "Server error" + error.message })
  }
})

router.get("/search-rides", async (req, res) => {
  console.log("appel API")

  try {
    const searchData = req.query

    // Fetch rides (MongoDB)
    let rides = await RideModel.getRides(searchData)

    // Add car & driver details
    rides = await Promise.all(
      rides.map(async (ride) => {
        let updatedRide = { ...ride.toObject() } // Convert Mongoose Doc to JS Object

        // Fetch car details
        if (ride.car && ride.car.carId) {
          const car = await Car.getCarById(ride.car.carId)
          updatedRide.car = car || null
        }

        // Fetch driver details
        if (ride.driver && ride.driver.driverId) {
          const driver = await Driver.getDriverById(ride.driver.driverId)
          if (driver) {
            updatedRide.driver = driver
          }
        }

        return updatedRide
      })
    )

    return res.status(200).json({
      message:
        rides.length > 0
          ? "Rides recovered successfully"
          : "No rides found with these criteria",
      count: rides.length,
      rides,
    })
  } catch (error) {
    console.error("Error fetching rides : " + error)
    res.status(500).json({ message: "Servor Error: " + error.message })
  }
})

router.delete("/delete-ride/:id", authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const rideId = req.params.id

    // Check if user is a driver
    const [driverResults] = await db.query(
      `SELECT user_id FROM drivers WHERE user_id = ?`,
      [user.id]
    )

    if (driverResults.length === 0) {
      return res.status(403).json({
        message: "Acces denied : you need to be a driver to delete a ride",
      })
    }

    // Check if user is ride's owner
    const ride = await RideModel.getRideById(rideId)
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" })
    }

    if (ride.driver.driverId !== user.id) {
      return res.status(403).json({
        message: "Acces denied : you can delete your rides only",
      })
    }

    await RideModel.deleteRide(rideId)
    res.status(200).json({ message: "Ride deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
