const express = require("express");
// can't use 'app' anymore (already set in index.js ), so I use express.Router to set my routes
const router = express.Router();
const db = require("../config/mysql");

// Import models
const Account = require("../models/Account");
const User = require("../models/User");
const Driver = require("../models/Driver");

// CREATE - add a user or a driver
router.post("/create-user", async (req, res) => {
  const { email, password, username, gender, is_driver } = req.body;

  try {
    // Creeate account
    const accountId = await Account.createAccount(db, email, password);

    // Create user inherited from account
    const userId = await User.createUser(
      db,
      accountId,
      username,
      gender,
      is_driver
    );

    // if `is_driver === 1`, create driver inherited from user
    if (is_driver === 1) {
      await Driver.createDriver(db, accountId);
      return res
        .status(201)
        .json({ message: "Driver created successfully", accountId });
    }

    return res
      .status(201)
      .json({ message: "User created successfully", userId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
