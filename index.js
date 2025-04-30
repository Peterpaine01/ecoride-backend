const express = require("express")
require("dotenv").config()
const axios = require("axios")
const cron = require("node-cron")
const { updateDailyStatistics } = require("./services/statisticsService")

const cors = require("cors")
require("./config/mysql")
require("./config/mongodb")
require("./config/cloudinary")

const corsOptions = {
  origin: ["http://localhost:5173/", "https://ecoride-mobility.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

// create server
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// use routes
app.use(require("./routes/userRoutes"))
app.use(require("./routes/authRoutes"))
app.use(require("./routes/carRoutes"))
app.use(require("./routes/rideRoutes"))
app.use(require("./routes/bookingRoutes"))
app.use(require("./routes/reviewRoutes"))
app.use(require("./routes/adminRoutes"))
app.use(require("./routes/openRoutes"))

const PORT = process.env.PORT || 5000
console.log(`Server running on port: ${PORT}`)

// -------- SET UP ----------

// Exécuter la fonction tous les jours à minuit UTC
cron.schedule("0 0 * * *", async () => {
  console.log("⏳ Running updateDailyStatistics...")
  try {
    await updateDailyStatistics()
    console.log("✅ Statistics updated !")
  } catch (error) {
    console.error("❌ Error updating statistics : " + error)
  }
})

// Find Ip public Northflank
axios
  .get("https://api64.ipify.org?format=json")
  .then((response) => {
    console.log(`🌍 IP publique du serveur: ${response.data.ip}`)
  })
  .catch((error) => {
    console.error("❌ Impossible de récupérer l'IP publique", error)
  })

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Server Node.js running! Welcome to Ecoride project!" })
})

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" })
})

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port: ${PORT}`)
  // await connectToDatabase();
})
