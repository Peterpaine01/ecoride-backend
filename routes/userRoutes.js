const express = require("express");
// can't use 'app' anymore (already set in index.js ), so I use express.Router to set my routes
const router = express.Router();
const db = require("../config/mysql");

const fileUpload = require("express-fileupload");

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");

// Import models
const Account = require("../models/Account");
const User = require("../models/User");
const Driver = require("../models/Driver");

// CREATE - add a user or a driver
router.post("/create-user", async (req, res) => {
  const { email, password, username, gender, is_driver } = req.body;

  try {
    // Create account
    const accountId = await Account.createAccount(db, email, password);

    // Create user inherited from account
    const userId = await User.createUser(
      db,
      accountId,
      username,
      gender,
      is_driver
    );

    // if `is_driver === 1`, create driver inherited from user
    if (is_driver === 1) {
      await Driver.createDriver(db, accountId);
      return res
        .status(201)
        .json({ message: "Driver created successfully", accountId });
    }

    return res
      .status(201)
      .json({ message: "User created successfully", userId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// READ - one user
router.get("/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // 🔹 Récupération des données de l'utilisateur
    const account = await Account.getAccountById(db, userId);
    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    const user = await User.getUserById(db, userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    let driver = null;
    if (user.is_driver === 1) {
      driver = await Driver.getDriverById(db, userId);
    }

    // 🔹 Formatage de la réponse
    return res.status(200).json({
      id: account.id,
      email: account.email,
      username: user.username,
      gender: user.gender,
      is_driver: Boolean(user.is_driver),
      preferences:
        {
          accept_smoking: Boolean(driver.accept_smoking),
          accept_animals: Boolean(driver.accept_animals),
        } || null,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// READ - Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.getAllUsers(db);
    return res.status(200).json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// UPDATE - put user
router.put(
  "/update-user/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    const userId = req.params.id;
    const { username, gender, is_driver } = req.body;
    const photo = req.files?.photo;
    let photoOnCloudinary = "";
    try {
      if (photo) {
        // transforming image in string readable by cloudinary
        const transformedPicture = convertToBase64(photo);
        // sending request to cloudianry for uploading my image
        const result = await cloudinary.uploader.upload(transformedPicture, {
          folder: `ecoride/users/user-${userId}`,
        });

        photoOnCloudinary = result;
      }
      console.log(photoOnCloudinary.secure_url);
      const photoToUpdate = photoOnCloudinary.secure_url;

      await User.updateUser(db, userId, {
        username,
        gender,
        is_driver,
        photoToUpdate,
      });

      return res
        .status(200)
        .json({ message: "Utilisateur mis à jour avec succès" });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

module.exports = router;
