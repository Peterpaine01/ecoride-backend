const fs = require("fs")
const path = require("path")
const axios = require("axios")

const BOOKINGS_PATH = path.join(__dirname, "data", "seed-bookings.json")
const TOKENS_PATH = path.join(__dirname, "data", "created-users-tokens.json")
const BASE_URL = "http://localhost:3000"

const createBookings = async () => {
  const bookings = JSON.parse(fs.readFileSync(BOOKINGS_PATH, "utf-8"))
  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"))

  for (const booking of bookings) {
    const { rideId, passengerId, seats } = booking

    const token = tokens[passengerId]
    if (!token) {
      console.warn(`⚠️ Aucun token trouvé pour passengerId ${passengerId}`)
      continue
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/create-booking/${rideId}`,
        {
          bookingData: { seats },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log(
        `✅ Booking créé pour passenger ${passengerId} sur ride ${rideId}`
      )
    } catch (err) {
      console.error(
        `❌ Erreur pour passenger ${passengerId} sur ride ${rideId}`
      )
      if (err.response) {
        console.error(`→ Statut: ${err.response.status}`)
        console.error(
          `→ Message: ${
            err.response.data?.message || JSON.stringify(err.response.data)
          }`
        )
      } else if (err.request) {
        console.error("→ Aucune réponse reçue du serveur")
      } else {
        console.error(`→ Erreur : ${err.message}`)
      }
    }
  }
}

createBookings()
