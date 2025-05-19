const express = require("express")
const router = express.Router()
const Role = require("../models/Role")

// GET all roles
router.get("/roles", async (req, res) => {
  try {
    const roles = await Role.getAllRoles()
    res.status(200).json(roles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET role by ID
router.get("/role/:id", async (req, res) => {
  try {
    const role = await Role.getRoleById(req.params.id)
    if (!role) return res.status(404).json({ error: "Role not found" })
    res.status(200).json(role)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create role
router.post("/create-role", async (req, res) => {
  try {
    const { label } = req.body
    const role = await Role.createRole(label)
    res.status(201).json(role)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update role
router.put("/update-role/:id", async (req, res) => {
  try {
    const { label } = req.body
    const updated = await Role.updateRole(req.params.id, label)
    res.status(200).json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE role
router.delete("/delete-role/:id", async (req, res) => {
  try {
    const deleted = await Role.deleteRole(req.params.id)
    res.status(200).json(deleted)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
