const express = require("express")
const router = express.Router()

const fileUpload = require("express-fileupload")
const jwt = require("jsonwebtoken")

// Import middleware authenticateToken
const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken")

const cloudinary = require("cloudinary").v2
const convertToBase64 = require("../utils/convertToBase64")

// Import models
const Account = require("../models/Account")
const User = require("../models/User")
const Driver = require("../models/Driver")
const Car = require("../models/Car")

// CREATE - add a user or a driver
router.post("/create-user", async (req, res) => {
  const {
    email,
    password,
    username,
    gender,
    is_driver,
    consent_data_retention,
  } = req.body

  try {
    // Create account
    const account_type = "user"
    const accountId = await Account.createAccount(email, password, account_type)

    // Create user inherited from account
    const userId = await User.createUser(
      accountId,
      username,
      gender,
      is_driver,
      consent_data_retention
    )

    // if `is_driver === 1`, create driver inherited from user
    if (is_driver === 1) {
      await Driver.createDriver(accountId)
    }

    // Generate token JWT
    const token = jwt.sign({ id: accountId, email }, process.env.JWT_KEY, {
      expiresIn: "7d",
    })

    // Return data for login
    return res.status(201).json({
      message:
        is_driver === 1
          ? "Driver created successfully"
          : "User created successfully",
      userId: accountId,
      token,
    })
  } catch (error) {
    console.error("Error creating user: " + error)
    return res.status(500).json({ message: "Error server: " + error.message })
  }
})

// READ - get one user by id
router.get("/user/:id", async (req, res) => {
  const userId = req.params.id

  try {
    let user = await User.getUserById(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const account = await Account.getAccountById(userId)
    if (!account) {
      return res.status(404).json({ error: "Account not found" })
    }
    user.email = account.email
    user.accountStatus = account.account_status

    if (user.is_driver === 1) {
      user.driverInfos = await Driver.getDriverById(userId)

      user.driverInfos.cars = await Car.getCarsByDriver(userId)
    }

    user.is_driver = Boolean(user.is_driver)

    // console.log(user)

    return res.status(200).json(user)
  } catch (error) {
    console.error("Error while recovering user:" + error)
    return res.status(500).json({ message: "Error server" + error.message })
  }
})

// READ - Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.getAllUsers()
    return res.status(200).json(users)
  } catch (error) {
    console.error("Error while recovering users :" + error)
    return res.status(500).json({ message: "Error server" + error.message })
  }
})

// UPDATE - update a user
router.patch(
  "/update-user/:id",
  fileUpload(),
  authenticateToken,
  async (req, res) => {
    const userId = req.params.id
    const photo = req.files?.photo
    let photoToUpdate

    try {
      if (photo) {
        const transformedPicture = convertToBase64(photo)
        const result = await cloudinary.uploader.upload(transformedPicture, {
          folder: `ecoride/users/user-${userId}`,
        })
        photoToUpdate = result.secure_url
      }

      const updateFields = {
        ...req.body,
        photoToUpdate,
      }

      await User.updateUser(userId, updateFields)

      res.status(200).json({ message: "User updated successfully" })
    } catch (error) {
      console.error("Error while updating user:", error)
      res.status(500).json({ message: "Erreur serveur : " + error.message })
    }
  }
)

// DELETE - soft delete a user
router.patch("/soft-delete-user/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id

    // if (req.user.id !== userId) {
    //   return res
    //     .status(403)
    //     .json({ error: "Acces denied. You can only delete your own accont." })
    // }

    await User.softDeleteUserById(userId)
    res.status(200).json({ message: "User anonymised successfully." })
  } catch (error) {
    console.error("Error soft delete:", error)
    res.status(500).json({ error: "Error anonymising user." })
  }
})

router.delete(
  "/hard-delete-user/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const userId = req.params.id
      // console.log(userId)

      await User.hardDeleteUserById(userId)
      res.status(200).json({ message: "User deleted permanently." })
    } catch (error) {
      console.error("Error hard delete:", error)
      res.status(500).json({ error: "Error deleting user." })
    }
  }
)

module.exports = router
