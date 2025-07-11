const express = require("express")
const router = express.Router()

const sanitizeInput = require("../middlewares/sanitizeInput")

// Import models
const Car = require("../models/Car")

// Import middleware authenticateToken
const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken")

// CREATE - Add a car
router.post(
  "/create-car",
  authenticateToken,
  sanitizeInput,
  async (req, res) => {
    const {
      registration_number,
      first_registration_date,
      model,
      color,
      energy_id,
      brand_id,
      available_seats,
    } = req.body

    const driver_id = req.user.id

    try {
      const carId = await Car.createCar({
        registration_number,
        first_registration_date,
        model,
        color,
        energy_id,
        brand_id,
        available_seats,
        driver_id,
      })

      res.status(201).json({
        message: "Car added successfully",
        carId: carId,
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)

router.get("/car/:id", async (req, res) => {
  const carId = req.params.id

  try {
    const car = await Car.getCarById(carId)
    if (!car) {
      return res.status(404).json({ message: "Car not found" })
    }
    res.status(200).json(car) // Return car
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get("/user-cars/:id", authenticateToken, async (req, res) => {
  const driverId = req.params.id

  try {
    const cars = await Car.getCarsByDriver(driverId)

    res.status(200).json(cars)
  } catch (error) {
    console.error("Erreur fetching cars", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// UPDATE - Update a car
router.put(
  "/update-car/:id",
  authenticateToken,
  sanitizeInput,
  async (req, res) => {
    const carId = req.params.id
    const {
      registration_number,
      first_registration_date,
      model,
      color,
      energy_id,
      brand_id,
      available_seats,
    } = req.body

    try {
      const updated = await Car.updateCar(carId, {
        registration_number,
        first_registration_date,
        model,
        color,
        energy_id,
        brand_id,
        available_seats,
      })

      if (updated) {
        res.status(200).json({ message: "Car updated successfully" })
      } else {
        res.status(404).json({ message: "Car not found" })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)

// DELETE - Delete a car
router.delete("/delete-car/:id", authenticateToken, async (req, res) => {
  const carId = req.params.id

  try {
    const deleted = await Car.deleteCar(carId)
    if (deleted) {
      res.status(200).json({ message: "Car deleted successfully" })
    } else {
      res.status(404).json({ message: "Car not found" })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
