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

    const [result] = await db.promise().query(query, [token]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Token invalide ou déjà activé" });
    }

    res.json({ message: "Compte activé avec succès !" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
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
