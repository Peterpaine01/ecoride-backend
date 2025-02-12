const express = require("express");
// can't use 'app' anymore (already set in index.js ), so I use express.Router to set my routes
const router = express.Router();

const fileUpload = require("express-fileupload");

// Import middleware authenticateToken
const {
  authenticateToken,
  isStaffMember,
  isAdmin,
} = require("../middlewares/authenticateToken");

const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");

// Import models
const Account = require("../models/Account");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Car = require("../models/Car");

// CREATE - add a user or a driver
router.post("/create-user", async (req, res) => {
  const {
    email,
    password,
    username,
    gender,
    is_driver,
    consent_data_retention,
  } = req.body;

  try {
    // Create account
    const accountId = await Account.createAccount(email, password);

    // Create user inherited from account
    const userId = await User.createUser(
      accountId,
      username,
      gender,
      is_driver,
      consent_data_retention
    );

    // if `is_driver === 1`, create driver inherited from user
    if (is_driver === 1) {
      await Driver.createDriver(accountId);
      return res
        .status(201)
        .json({ message: "Driver created successfully", accountId });
    }

    return res
      .status(201)
      .json({ message: "User created successfully", userId });
  } catch (error) {
    console.error("Error while creating user :" + error);
    return res.status(500).json({ message: "Error server" + error.message });
  }
});

// READ - get one user by id
router.get("/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    let user = await User.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const account = await Account.getAccountById(userId);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    user.email = account.email;

    if (user.is_driver === 1) {
      user.driverInfos = await Driver.getDriverById(userId);

      user.driverInfos.cars = await Car.getCarsByDriver(userId);
    }

    user.is_driver = Boolean(user.is_driver);

    console.log(user);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error while recovering user:" + error);
    return res.status(500).json({ message: "Error server" + error.message });
  }
});

// READ - Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error while recovering users :" + error);
    return res.status(500).json({ message: "Error server" + error.message });
  }
});

// UPDATE - update a user
router.put(
  "/update-user/:id",
  fileUpload(),
  authenticateToken,
  async (req, res) => {
    const userId = req.params.id;
    const {
      username,
      gender,
      is_driver,
      email,
      password,
      accept_smoking,
      accept_animals,
    } = req.body;
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

      await User.updateUser(userId, {
        username,
        gender,
        is_driver,
        email,
        password,
        accept_smoking,
        accept_animals,
        photoToUpdate,
      });

      return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error while updating user :" + error);
      return res.status(500).json({ message: "Error server" + error.message });
    }
  }
);

module.exports = router;
