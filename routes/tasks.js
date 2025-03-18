const express = require("express");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Task = require("../models/task");

const router = express.Router();

// ✅ Middleware validasi input untuk task
const validateTask = [
    body("title").notEmpty().withMessage("Title is required"),
    body("completed").isBoolean().withMessage("Completed must be a boolean"),
];

// 🚩 GET semua tasks
router.get("/", asyncHandler(async (req, res) => {
    const tasks = await Task.find();
    res.json({ tasks, count: tasks.length });
}));

// 🚩 POST buat task baru dengan validasi
router.post("/", validateTask, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const newTask = new Task(req.body);
    await newTask.save();

    res.status(201).json({ message: "✅ Task created successfully!", task: newTask });
}));

// 🚩 GET task berdasarkan ID
router.get("/:id", asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ message: "❌ Task not found" });
    }

    res.json({ task });
}));

// 🚩 PUT update seluruh field task berdasarkan ID dengan validasi
router.put("/:id", validateTask, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!task) {
        return res.status(404).json({ message: "❌ Task not found" });
    }

    res.json({ message: "✅ Task updated successfully!", task });
}));

// 🚩 PATCH update sebagian field task berdasarkan ID
router.patch("/:id", asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!task) {
        return res.status(404).json({ message: "❌ Task not found" });
    }

    res.json({ message: "✅ Task partially updated successfully!", task });
}));

// 🚩 DELETE task berdasarkan ID
router.delete("/:id", asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
        return res.status(404).json({ message: "❌ Task not found" });
    }

    res.json({ message: "✅ Task deleted successfully!" });
}));

module.exports = router;
