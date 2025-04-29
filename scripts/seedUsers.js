const fs = require("fs")
const path = require("path")
const axios = require("axios")

const FILE_PATH = path.join(__dirname, "data", "seeded-users.json")
const BASE_URL = "http://localhost:3000"

const createUsers = async () => {
  const rawData = fs.readFileSync(FILE_PATH, "utf-8")
  const users = JSON.parse(rawData)

  for (const user of users) {
    const payload = {
      email: user.email,
      password: user.password,
      username: user.username,
      gender: user.gender,
      is_driver: user.is_driver,
      consent_data_retention: user.consent_data_retention,
    }

    try {
      const res = await axios.post(`${BASE_URL}/create-user`, payload)

      console.log(
        `✅ Créé: ${payload.email} (${payload.is_driver ? "driver" : "user"})`
      )
      console.log(`🔑 Email: ${payload.email} | Password: ${payload.password}`)
    } catch (err) {
      console.error(`❌ Erreur pour ${payload.email}:`)

      if (err.response) {
        console.error(`→ Statut: ${err.response.status}`)
        console.error(
          `→ Message: ${
            err.response.data?.message || JSON.stringify(err.response.data)
          }`
        )
      } else if (err.request) {
        console.error(
          "→ Aucune réponse reçue du serveur (peut-être hors ligne ?)"
        )
      } else {
        console.error(`→ Erreur : ${err.message}`)
      }
    }
  }
}

createUsers()

// node scripts/seedUsers.js
