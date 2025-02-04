class Account {
  constructor(id, email, password, account_type) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.account_type = account_type;
  }

  static createAccount(connection, email, password, account_type, callback) {
    const query = "INSERT INTO accounts (email, password) VALUES (?, ?)";
    connection.query(query, [email, password], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results.insertId);
    });
  }

  static getAccountById(connection, id, callback) {
    const query = "SELECT * FROM accounts WHERE id = ?";
    connection.query(query, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0]);
    });
  }
}

module.exports = Account;
