const express = require("express");
// can't use 'app' anymore (already set in index.js ), so I use express.Router to set my routes
const router = express.Router();
const db = require("../config/mysql");

// Import model User
const User = require("../models/User");

// CREATE - add a user
router.post("/create-user", (req, res) => {
  const { email, password, username, gender, is_driver } = req.body;

  User.createUser(
    db,
    email,
    password,
    username,
    gender,
    is_driver,
    (err, userId) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "User created with succes", userId });
    }
  );
});

module.exports = router;
