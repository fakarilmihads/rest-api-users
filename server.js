require("dotenv").config(); // ✅ Load environment variables dari .env

const https = require("https");
const fs = require("fs");
const express = require("express");
const connectDB = require("./db");
const { body, validationResult } = require("express-validator");
const Task = require("./models/task");
const Sector = require("./models/sector");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

// ✅ Koneksi ke MongoDB di awal aplikasi
connectDB();

// ✅ Middleware Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ✅ Middleware CORS 
app.use(cors({
    origin: process.env.CORS_ORIGIN || "https://myfrontend.com",
    methods: (process.env.CORS_METHODS || "GET,POST,PUT,DELETE").split(",") // Ubah string jadi array
}));

// ✅ Middleware Rate Limiting 
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: process.env.RATE_LIMIT_MESSAGE || "❌ Too many requests, please try again later."
});
app.use(limiter);

// ✅ Endpoint untuk cek koneksi ke MongoDB
app.get("/connect/mongo", asyncHandler(async (req, res) => {
    res.json({ message: "✅ MongoDB connected successfully!" });
}));

// ✅ Middleware validasi input task
const validateTask = [
    body("title").notEmpty().withMessage("Title is required"),
    body("completed").isBoolean().withMessage("Completed must be a boolean"),
];

// ✅ CRUD Tasks
app.get("/tasks", asyncHandler(async (req, res) => {
    const tasks = await Task.find();
    res.json({ tasks, count: tasks.length });
}));

app.post("/tasks", validateTask, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const newTask = new Task(req.body);
    await newTask.save();
    res.status(201).json({ message: "✅ Task created successfully!", task: newTask });
}));

app.put("/tasks/:id", validateTask, asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ message: "❌ Task not found" });
    res.json({ message: "✅ Task updated successfully!", task });
}));

app.patch("/tasks/:id", asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ message: "❌ Task not found" });
    res.json({ message: "✅ Task partially updated successfully!", task });
}));

app.delete("/tasks/:id", asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "❌ Task not found" });
    res.json({ message: "✅ Task deleted successfully!" });
}));



// Endpoint Sectors
// 📌 GET Semua Data Sectors dengan Pagination
app.get("/sectors", asyncHandler(async (req, res) => {
    let { page = 1, limit = 100 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const sectors = await Sector.find()
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await Sector.countDocuments();
    
    res.json({ count: sectors.length, total, page, sectors });
}));

// 📌 GET Data Berdasarkan `site_id`
app.get("/sectors/:site_id", asyncHandler(async (req, res) => {
    const sectors = await Sector.find({ site_id: req.params.site_id });
    if (!sectors.length) return res.status(404).json({ message: "❌ Data not found" });
    res.json({ count: sectors.length, sectors });
}));

// 📌 POST Tambah Data Sectors
app.post("/sectors", asyncHandler(async (req, res) => {
    const { site_id, sector_id } = req.body;

    // ✅ Cek apakah data sudah ada (prevent duplicate)
    const existingSector = await Sector.findOne({ site_id, sector_id });
    if (existingSector) {
        return res.status(400).json({ message: "❌ Duplicate data not allowed!" });
    }

    const newSector = new Sector(req.body);
    await newSector.save();
    res.status(201).json({ message: "✅ Data inserted!", sector: newSector });
}));


// 📌 BULK INSERT untuk Data Besar
app.post("/sectors/bulk-insert", asyncHandler(async (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({ message: "❌ Data must be an array" });
        }

        await Sector.insertMany(data);
        res.status(201).json({ message: `✅ ${data.length} records inserted successfully!` });
    } catch (error) {
        res.status(400).json({ message: "❌ Failed to insert data", error: error.message });
    }
}));

// 📌 PUT Update Data Berdasarkan ID
app.put("/sectors/:id", asyncHandler(async (req, res) => {
    const { prb_dl_cell, prb_ul_cell } = req.body;

    // ✅ Cek apakah nilai numeric valid
    if (prb_dl_cell && isNaN(prb_dl_cell)) {
        return res.status(400).json({ message: "❌ Invalid data type for prb_dl_cell" });
    }
    if (prb_ul_cell && isNaN(prb_ul_cell)) {
        return res.status(400).json({ message: "❌ Invalid data type for prb_ul_cell" });
    }

    const sector = await Sector.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sector) return res.status(404).json({ message: "❌ Data not found" });

    res.json({ message: "✅ Data updated!", sector });
}));



// 📌 DELETE Hapus Data Berdasarkan ID
app.delete("/sectors/:id", asyncHandler(async (req, res) => {
    const sector = await Sector.findByIdAndDelete(req.params.id);
    if (!sector) return res.status(404).json({ message: "❌ Data not found" });
    res.json({ message: "✅ Data deleted!" });
}));


// ✅ Authentication Middleware dengan API Key
const authenticate = (req, res, next) => {
    const apiKey = process.env.API_KEY || "my-secret-key";
    if (apiKey !== req.headers["x-api-key"]) {
        return res.status(401).json({ message: "❌ Unauthorized: Invalid API Key" });
    }
    next();
};

app.get("/tasks-secure", authenticate, asyncHandler(async (req, res) => {
    const tasks = await Task.find();
    res.json({ message: "🔒 This is a protected route", tasks });
}));

// ✅ JWT Authentication Middleware (FIX SyntaxError)
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "❌ Token is required" });

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET || "supersecretkey123");
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "❌ Invalid Token" });
    }
};

// ✅ User Authentication
const User = require("./models/user");
app.post("/register", asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.json({ message: "✅ User registered successfully!" });
}));

app.post("/login", asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(401).json({ message: "❌ User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "❌ Invalid credentials" });

    const token = jwt.sign({ username }, process.env.JWT_SECRET || "supersecretkey123", { expiresIn: "1h" });
    res.json({ message: "✅ Login successful!", token });
}));

// ✅ Endpoint dengan JWT Authentication
app.get("/protected-tasks", verifyToken, asyncHandler(async (req, res) => {
    const tasks = await Task.find();
    res.json({ message: `🔒 Hello, ${req.user.username}. Here are your tasks`, tasks });
}));

// ✅ HTTPS Setup
let options = null;
if (process.env.NODE_ENV !== "test") {
    try {
        options = {
            key: fs.readFileSync("server.key"),
            cert: fs.readFileSync("server.cert")
        };
    } catch (error) {
        console.error("⚠️ Warning: SSL certificate files not found. Running server without HTTPS.");
    }
}

// ✅ Jalankan Server
if (process.env.NODE_ENV === "test") {
    module.exports = app;
} else {
    https.createServer(options, app).listen(3000, () => {
        console.log("🚀 Secure Server running on https://localhost:3000");
    });
}
