const express = require("express");
const router = express.Router();
const db = require("../config/mysql");

// Import models
const Account = require("../models/Account");

// Verify Account Route
router.get("/user/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const query = `
      UPDATE accounts 
      SET account_status = 'active', verification_token = NULL
      WHERE verification_token = ? AND account_status = 'pending';
    `;

    const [result] = await db.query(query, [token]);

    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json({ error: "Invalid token or already activated" });
    }

    res.json({ message: "Account activated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token, userId } = await Account.login(email, password);
    res.json({ token, userId });
  } catch (error) {
    res.status(401).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
