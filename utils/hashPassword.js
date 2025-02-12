const bcrypt = require("bcrypt");

// funtion to hash password before save to database
const hashPassword = async (password) => {
  const saltRounds = 10; // set hash complexity
  if (!password) {
    throw new Error("Password can't be empty");
  }
  return await bcrypt.hash(password, saltRounds);
};

module.exports = hashPassword;
