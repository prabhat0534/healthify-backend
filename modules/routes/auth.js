const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// --- THIS IS THE FIX ---
// The path must be '../models/User'
const User = require("../models/User"); 

require("dotenv").config();

// Signup API
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const hashedPass = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPass });
    res.json({ message: "Signup Successful ✅" });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ message: "Signup Error" });
  }
});

// Login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    res.json({ token, user });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Login Error" });
  }
});

module.exports = router;