const fs = require("fs")
const path = require("path")
const axios = require("axios")

const FILE_PATH = path.join(__dirname, "data", "seeded-users.json")
const OUTPUT_PATH = path.join(__dirname, "data", "created-users-tokens.json")
const BASE_URL = "http://localhost:3000"

const createUsers = async () => {
  const rawData = fs.readFileSync(FILE_PATH, "utf-8")
  const users = JSON.parse(rawData)

  const tokenMap = {} // Pour stocker { userId: token }

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

      const { token, userId } = res.data
      tokenMap[userId] = token

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
        console.error("→ Aucune réponse reçue du serveur")
      } else {
        console.error(`→ Erreur : ${err.message}`)
      }
    }
  }

  // Sauvegarde le mapping { userId: token } dans un fichier JSON
  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tokenMap, null, 2), "utf-8")
    console.log(`📁 Fichier de tokens sauvegardé dans ${OUTPUT_PATH}`)
  } catch (err) {
    console.error(`❌ Erreur d’écriture dans ${OUTPUT_PATH} :`, err.message)
  }
}

createUsers()

// node scripts/seedUsers.js
