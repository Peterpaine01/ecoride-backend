const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

// Fonction pour chiffrer l'email
const encryptEmail = async (email) => {
  const secretKey = process.env.ENCRYPTION_KEY; // Utiliser la clé secrète définie dans votre environnement
  const hmac = crypto.createHmac("sha256", secretKey); // Crée un HMAC avec l'algorithme SHA-256

  hmac.update(email); // Applique l'email à l'HMAC
  const encryptedEmail = hmac.digest("hex"); // Génère le hachage en format hexadécimal

  return encryptedEmail;
};

module.exports = encryptEmail;
