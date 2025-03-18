const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// ✅ Register endpoint
router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.json({ message: "✅ User registered successfully!" });
});

// ✅ Login endpoint
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "❌ User not found!" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "❌ Invalid credentials!" });

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET || "supersecretkey123");
    res.status(200).json({ token });
});

module.exports = router;
