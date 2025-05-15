const express = require("express")
const router = express.Router()
const axios = require("axios")

const ORS_API_KEY = process.env.ORS_API_KEY

router.post("/directions", async (req, res) => {
  try {
    const { coordinates } = req.body
    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      { coordinates },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    )
    res.json(response.data)
  } catch (err) {
    console.error("ORS error:", err.response?.data || err.message)
    res.status(500).json({ error: "Failed to get route" })
  }
})

module.exports = router
