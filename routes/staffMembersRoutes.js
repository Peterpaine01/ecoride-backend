const express = require("express")
const router = express.Router()

const jwt = require("jsonwebtoken")

// Import models
const StaffMembers = require("../models/StaffMembers")
const Account = require("../models/Account")

const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken")

router.post("/create-staff", async (req, res) => {
  try {
    const { email, password, firstname, lastname, roleId } = req.body

    // Create account
    const account_type = "webmaster"
    const accountId = await Account.createAccount(email, password, account_type)

    const result = await StaffMembers.createStaffMembers(
      accountId,
      firstname,
      lastname,
      roleId
    )

    // Generate token JWT
    const token = jwt.sign({ id: accountId, email }, process.env.JWT_KEY, {
      expiresIn: "7d",
    })

    // Return data for login
    return res.status(201).json({
      message: "Staff created successfully",
      userId: accountId,
      token,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get("/staff-members", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("hey")
    const staffList = await StaffMembers.getAllStaffMembers()
    console.log(staffList)

    res.status(200).json(staffList)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get(
  "/staff-member/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const staff = await StaffMembers.getStaffById(req.params.id)
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" })
      }
      res.status(200).json(staff)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)

router.patch(
  "/update-staff-member/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const result = await StaffMembers.updateStaffMembers(
        req.params.id,
        req.body
      )
      res.status(200).json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)

router.delete(
  "/delete-staff-member/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const result = await StaffMembers.deleteStaffMember(req.params.id)
      res.status(200).json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
)

module.exports = router
