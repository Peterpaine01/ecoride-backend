const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

dotenv.config()

const db = require("../config/mysql")

const authenticateToken = async (req, res, next) => {
  const token = req.header("Authorization")
  if (!token) return res.status(401).json({ error: "Acces denied" })

  jwt.verify(
    token.replace("Bearer ", ""),
    process.env.JWT_KEY,
    (error, user) => {
      if (error) return res.status(403).json({ error: "Invalid token" })
      req.user = user
      next()
    }
  )
}

const isStaffMember = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const [staff] = await db.query(
      "SELECT * FROM staff_members WHERE account_id = ?",
      [req.user.id]
    )

    if (staff.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied: Not a staff member" })
    }

    req.user.isStaff = true
    next()
  } catch (error) {
    console.error("Error checking staff member: " + error)
    res.status(500).json({ error: "Internal server error" })
  }
}

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const [staff] = await db.query(
      `
      SELECT s.*, r.label AS role 
      FROM staff_members s
      JOIN roles r ON s.role_id = r.id
      WHERE s.account_id = ? AND r.label = 'administrator'
    `,
      [req.user.id]
    )

    if (staff.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied: Administrator role required" })
    }

    req.user.isAdmin = true
    next()
  } catch (error) {
    console.error("Error checking admin role: " + error)
    res.status(500).json({ error: "Internal server error" })
  }
}

module.exports = { authenticateToken, isStaffMember, isAdmin }
