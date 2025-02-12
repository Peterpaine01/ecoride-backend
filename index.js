const express = require("express");
require("dotenv").config();

const cors = require("cors");
require("./config/mysql");
require("./config/mongodb");
require("./config/cloudinary");

// create server
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// use routes
app.use(require("./routes/userRoutes"));
app.use(require("./routes/authRoutes"));
app.use(require("./routes/carRoutes"));
app.use(require("./routes/rideRoutes"));
app.use(require("./routes/bookingRoutes"));
app.use(require("./routes/reviewRoutes"));
app.use(require("./routes/adminRoutes"));

const PORT = process.env.PORT || 5000;
console.log(`Server running on port: ${PORT}`);

// -------- SET UP ----------

const axios = require("axios");

axios
  .get("https://api64.ipify.org?format=json")
  .then((response) => {
    console.log(`🌍 IP publique du serveur: ${response.data.ip}`);
  })
  .catch((error) => {
    console.error("❌ Impossible de récupérer l'IP publique", error);
  });

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Server Node.js running! Welcome to Ecoride project!" });
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port: ${PORT}`)
);
