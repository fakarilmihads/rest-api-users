const express = require("express");
const router = express.Router();
const Task = require("../models/task");

// Endpoint ini akan terlindungi middleware authenticateApiKey atau authenticateToken

router.get("/", async (req, res) => {
    const tasks = await Task.find();
    res.json({ tasks });
});

module.exports = router;
