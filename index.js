const express = require("express");
require("dotenv").config();

const fileUpload = require("express-fileupload");
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

const PORT = process.env.PORT || 5000;

// -------- SET UP ----------

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.get("/", (req, res) => {
  res.send("Server Node.js running !");
});

app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
