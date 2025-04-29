import express from "express"
import axios from "axios"
const router = express.Router()

router.post("/route", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.ORS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )
    res.json(response.data)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ error: "Erreur OpenRouteService" })
  }
})

export default router
