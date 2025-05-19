const express = require("express")
const router = express.Router()
const Brand = require("../models/Brand")

router.get("/brands", async (req, res) => {
  try {
    const brands = await Brand.getBrands()
    res.status(200).json(brands)
  } catch (error) {
    console.error("Error fetching brands:", error)
    res.status(500).json({ message: "Erreur serveur" })
  }
})

module.exports = router
