const fs = require("fs")
const path = require("path")
const axios = require("axios")

const CARS_FILE_PATH = path.join(__dirname, "data", "seed-cars.json")
const TOKENS_FILE_PATH = path.join(
  __dirname,
  "data",
  "created-users-tokens.json"
)
const BASE_URL = "http://localhost:3000"

const seedCars = async () => {
  const carsData = JSON.parse(fs.readFileSync(CARS_FILE_PATH, "utf-8"))
  const tokenMap = JSON.parse(fs.readFileSync(TOKENS_FILE_PATH, "utf-8"))

  function decodeJWT(token) {
    const payload = token.split(".")[1]
    const decoded = Buffer.from(payload, "base64").toString("utf8")
    return JSON.parse(decoded)
  }

  // On crée une map email → token (car les voitures utilisent `email`)
  const emailToToken = {}

  for (const [userId, token] of Object.entries(tokenMap)) {
    const payload = decodeJWT(token)
    emailToToken[payload.email] = token
  }

  for (const car of carsData) {
    const token = emailToToken[car.email]

    if (!token) {
      console.error(`❌ Aucun token trouvé pour ${car.email}`)
      continue
    }

    const payload = { ...car }
    delete payload.email // pas utile dans la requête

    try {
      const res = await axios.post(`${BASE_URL}/create-car`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(
        `🚗 Voiture ajoutée pour ${car.email} → id: ${res.data.carId}`
      )
    } catch (err) {
      console.error(`❌ Erreur pour ${car.email}:`)
      if (err.response) {
        console.error(
          `→ ${err.response.status}: ${JSON.stringify(err.response.data)}`
        )
      } else {
        console.error(`→ ${err.message}`)
      }
    }
  }
}

seedCars()

// node scripts/seedCars.js
