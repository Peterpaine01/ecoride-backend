const express = require("express");
require("dotenv").config();

const fileUpload = require("express-fileupload");
const cors = require("cors");
require("./config/mysql");
require("./config/mongodb");
require("./config/cloudinary");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Server Node.js running !");
});

app.listen(PORT, () => console.log(`Serveur running on port: ${PORT}`));
