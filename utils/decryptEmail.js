const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string
const CryptoJS = require("crypto-js");

// Fonction pour décrypter l'email
const decryptEmail = async (encryptedEmail) => {
  const secretKey = process.env.ENCRYPTION_KEY; // La clé secrète utilisée pour le déchiffrement
  const bytes = CryptoJS.AES.decrypt(encryptedEmail, secretKey);
  const decryptedEmail = bytes.toString(CryptoJS.enc.Utf8);
  return decryptedEmail;
};

module.exports = decryptEmail;
