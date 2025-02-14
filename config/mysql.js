const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  port: process.env.MYSQL_PORT,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
async function testConnection() {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS total_users FROM users;"
    );
    console.log("✅ MySQL connected!");
    console.log(rows[0]);
  } catch (error) {
    console.error("❌ MySQL Connection Error: " + error.message);
  }
}

testConnection();

module.exports = db;
