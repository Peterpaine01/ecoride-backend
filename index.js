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
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://ecoride-mobility.netlify.app",
    ]
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}

// create server
const app = express()
app.use(cors(corsOptions))
app.options("*", cors(corsOptions))
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
app.use(require("./routes/staffMemberRoutes"))
app.use(require("./routes/roleRoutes"))
app.use(require("./routes/statisticsRoutes"))
app.use(require("./routes/brandRoutes"))
app.use(require("./routes/energyRoutes"))
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
    console.log(`🌍 IP publique du serveur Northflank : ${response.data.ip}`)
  })
  .catch((error) => {
    console.error("❌ Impossible de récupérer l'IP publique", error)
  })

// Find Ip public local
axios
  .get("https://api.ipify.org?format=json")
  .then((res) => console.log("IP publique à autoriser :", res.data.ip))
  .catch((err) => console.error("Erreur récupération IP :", err))

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
  try {
    const res = await axios.get("https://google.com")
    console.log("✅ Test HTTP OK :", res.status)
  } catch (err) {
    console.error("❌ Impossible de joindre Google :", err.message)
  }
  // await connectToDatabase();
})
