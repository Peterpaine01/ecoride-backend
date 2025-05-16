const fs = require("fs")
const path = require("path")
const axios = require("axios")

const REVIEWS_PATH = path.join(__dirname, "data", "seed-reviews.json")
const TOKENS_PATH = path.join(__dirname, "data", "created-users-tokens.json")
const BASE_URL = "http://localhost:3000"

const createReviews = async () => {
  const reviews = JSON.parse(fs.readFileSync(REVIEWS_PATH, "utf-8"))
  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"))

  for (const review of reviews) {
    const { bookingId, passengerId, comment, rating, wasRideOk } = review

    const token = tokens[passengerId]
    if (!token) {
      console.warn(`⚠️ Aucun token trouvé pour passengerId ${passengerId}`)
      continue
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/create-review/${bookingId}`,
        { comment, rating, wasRideOk },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      console.log(
        `✅ Review créée pour booking ${bookingId} par user ${passengerId}`
      )
    } catch (err) {
      console.error(`❌ Erreur pour booking ${bookingId}, user ${passengerId}`)
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

createReviews()
