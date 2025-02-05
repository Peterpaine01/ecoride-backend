const express = require("express");
// can't use 'app' anymore (already set in index.js ), so I use express.Router to set my routes
const router = express.Router();
const db = require("../config/mysql");

// Import model User
const User = require("../models/User");
const Driver = require("../models/Driver");

// CREATE - add a user or a driver
router.post("/create-user", (req, res) => {
  const { email, password, username, gender, is_driver } = req.body;

  // Create user
  User.createUser(
    db,
    email,
    password,
    username,
    gender,
    is_driver,
    (err, userId) => {
      if (err) return res.status(500).json({ error: err.message });

      // if user is a driver, insert in table `drivers`
      if (is_driver === 1) {
        return Driver.createDriver(db, userId, (err, driverId) => {
          if (err) return res.status(500).json({ error: err.message });
          return res
            .status(201)
            .json({ message: "Driver created successfully", userId: driverId });
        });
      }

      // else return simple user
      return res
        .status(201)
        .json({ message: "User created successfully", userId });
    }
  );
});

module.exports = router;
