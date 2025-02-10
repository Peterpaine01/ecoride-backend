const Account = require("./Account");
const db = require("../config/mysql");

class User extends Account {
  constructor(
    id,
    email,
    password,
    account_type = "user",
    account_status,
    created_at,
    deleted_at,
    verification_token,
    username,
    photo,
    credits,
    gender,
    is_driver,
    consent_data_retention
  ) {
    super(
      id,
      email,
      password,
      account_type,
      account_status,
      created_at,
      deleted_at,
      verification_token
    );
    this.username = username;
    this.photo = photo;
    this.credits = credits;
    this.gender = gender;
    this.account_status = account_status;
    this.is_driver = is_driver;
    this.consent_data_retention = consent_data_retention;
  }

  static async createUser(
    account_id,
    username,
    gender,
    is_driver,
    consent_data_retention
  ) {
    try {
      const query =
        "INSERT INTO users (account_id, username, gender, is_driver, consent_data_retention) VALUES (?, ?, ?, ?, ?)";
      const [results] = await db.query(query, [
        account_id,
        username,
        gender,
        is_driver,
        consent_data_retention,
      ]);

      return account_id;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = User;
