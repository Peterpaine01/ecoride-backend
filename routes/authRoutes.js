const express = require("express");
const router = express.Router();
const db = require("../config/mysql");

const decryptEmail = require("../utils/decryptEmail");

// Import models
const Account = require("../models/Account");

// Route de connexion
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token, userId } = await Account.login(db, email, password);
    res.json({ token, userId });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
