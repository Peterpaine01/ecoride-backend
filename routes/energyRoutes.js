const express = require("express")
const router = express.Router()
const Energy = require("../models/Energy")

router.get("/energies", async (req, res) => {
  try {
    const energies = await Energy.getEnergies()

    res.status(200).json(energies)
  } catch (error) {
    console.error("Error fetching energies:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

module.exports = router
