const fs = require("fs")
const path = require("path")
const axios = require("axios")

const FILE_PATH = path.join(__dirname, "data", "seed-rides.json")
const BASE_URL = "http://localhost:3000"
const TOKENS_PATH = path.join(__dirname, "data", "created-users-tokens.json")

const seedRides = async () => {
  const rides = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
  const tokenMap = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"))

  function decodeJWT(token) {
    const payload = token.split(".")[1]
    const decoded = Buffer.from(payload, "base64").toString("utf8")
    return JSON.parse(decoded)
  }

  // Construire une map email → { token, userId }
  const emailToAuth = {}

  for (const [userId, token] of Object.entries(tokenMap)) {
    const payload = decodeJWT(token)
    emailToAuth[payload.email] = { token, userId }
  }

  for (const ride of rides) {
    const auth = emailToAuth[ride.email]

    if (!auth) {
      console.error(`❌ Aucun token trouvé pour l'email : ${ride.email}`)
      continue
    }

    const payload = {
      departureDate: ride.departureDate,
      departureAddress: ride.departureAddress,
      destinationAddress: ride.destinationAddress,
      duration: ride.duration,
      availableSeats: ride.availableSeats,
      creditsPerPassenger: ride.creditsPerPassenger,
      description: ride.description,
      vehicleId: ride.vehicleId,
    }

    try {
      const res = await axios.post(`${BASE_URL}/create-ride`, payload, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      })

      console.log(
        `🚗 Trajet de ${payload.departureAddress.city} à ${payload.destinationAddress.city} publié.`
      )
    } catch (err) {
      console.error(
        `❌ Erreur pour le trajet de ${payload.departureAddress.city} → ${payload.destinationAddress.city}`
      )

      if (err.response) {
        console.error(`→ Statut: ${err.response.status}`)
        console.error(
          `→ Message: ${
            err.response.data?.message || JSON.stringify(err.response.data)
          }`
        )
      } else if (err.request) {
        console.error("→ Aucune réponse du serveur.")
      } else {
        console.error(`→ Erreur: ${err.message}`)
      }
    }
  }
}

seedRides()

// node scripts/seedRides.js
