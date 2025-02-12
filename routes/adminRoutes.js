const express = require("express");
const router = express.Router();

// Import Models
const Account = require("../models/Account");
const StaffMembers = require("../models/StaffMembers");

// Import Middlewares
const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken");

// Create Staff members -> need to be 'administrator'
router.post(
  "/create-staff-member",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    const { email, password, firstname, lastname, roleId } = req.body;

    try {
      // Create account
      const accountId = await Account.createAccount(email, password);

      // Create staff inherited from account
      const staffId = await StaffMembers.createStaffMembers(
        accountId,
        firstname,
        lastname,
        roleId
      );
      res
        .status(201)
        .json({ message: "Staff member created successfully", staffId });
    } catch (error) {
      console.error("Error creating staff member:" + error);
      res
        .status(500)
        .json({ message: "Error creating staff member:" + error.message });
    }
  }
);

// Read staff members by id -> need to be a staff member
router.get(
  "/staff-member/:id",
  authenticate,
  isStaffMember,
  async (req, res) => {
    const staffId = req.params.id;

    try {
      const staff = await StaffMembers.getStaffById(staffId);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const account = await Account.getAccountById(staffId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      staff.email = account.email;
      staff.accountStatus = account.accountSatus;

      res.status(200).json(staff);
    } catch (error) {
      console.error("Error recovering staff member:", error);
      res.status(500).json({
        message: "Error recovering staff member",
        error: error.message,
      });
    }
  }
);

module.exports = router;
