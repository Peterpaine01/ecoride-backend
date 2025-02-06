const bcrypt = require("bcrypt");

// funtion to hash password before save to database
const hashPassword = async (password) => {
  const saltRounds = 10; // set hash complexity
  if (!password) {
    throw new Error("Le mot de passe ne peut pas être vide.");
  }
  return await bcrypt.hash(password, saltRounds);
};

module.exports = hashPassword;
