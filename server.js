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
const NodeCache = require("node-cache");

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

// ✅ Caching
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

// Middleware untuk caching - only for GET requests
const cacheMiddleware = (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
        return next();
    }
    
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
        console.log(`Cache hit for ${key}`);
        return res.json(cachedResponse);
    }
    
    res.originalJson = res.json;
    res.json = (body) => {
        cache.set(key, body);
        res.originalJson(body);
    };
    next();
};

app.use(cacheMiddleware);

// Additional debug middleware for POST requests
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('POST body:', JSON.stringify(req.body, null, 2));
    }
    
    // Add a response hook to clear cache after modifying data
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        // After successful data modification requests, clear relevant caches
        if ((req.method === 'POST' || req.method === 'PUT' || 
             req.method === 'PATCH' || req.method === 'DELETE') && 
            res.statusCode >= 200 && res.statusCode < 300) {
            
            console.log(`Clearing cache after ${req.method} request`);
            
            // Clear the specific resource cache if it's an update/delete
            if (req.params.id || req.params.site_id) {
                const resourcePath = req.originalUrl;
                console.log(`Clearing specific cache for: ${resourcePath}`);
                cache.del(resourcePath);
            }
            
            // Always clear the collection list cache after any modification
            if (req.originalUrl.includes('/sectors')) {
                console.log('Clearing sectors list cache');
                cache.del('/sectors');
            }
        }
        
        return originalEnd.call(this, chunk, encoding);
    };
    
    next();
});

// ✅ Endpoint untuk cek koneksi ke MongoDB
app.get("/connect/mongo", asyncHandler(async (req, res) => {
    res.json({ message: "✅ MongoDB connected successfully!" });
}));

// ✅ Middleware validasi input task
const validateTask = [
    body("title").notEmpty().withMessage("Title is required"),
    body("completed").isBoolean().withMessage("Completed must be a boolean"),
];

// ✅ Import routes
const tasksRoutes = require('./routes/tasks');
const sectorsRoutes = require('./routes/sectors');
const authRoutes = require('./routes/auth');

// ✅ Use routes
app.use('/tasks', tasksRoutes);
app.use('/sectors', sectorsRoutes);
app.use('/', authRoutes);



// ✅ Bulk insert endpoint for sectors
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


// ✅ Authentication Middleware dengan API Key
const authenticate = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    const validApiKey = process.env.API_KEY || "mysecureapikey456";
    
    if (apiKey !== validApiKey) {
        return res.status(401).json({ message: "❌ Unauthorized: Invalid API Key" });
    }
    next();
};

app.get("/tasks-secure", authenticate, asyncHandler(async (req, res) => {
    const tasks = await Task.find();
    res.json({ message: "🔒 This is a protected route", tasks });
}));

// ✅ JWT Authentication Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(403).json({ message: "❌ Token is required" });
    
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(403).json({ message: "❌ Token format invalid" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "yourstrongsecretkey");
        req.user = decoded;
        console.log("Token successfully verified for user:", decoded.username);
        next();
    } catch (err) {
        console.error("JWT verification error:", err.message);
        res.status(401).json({ message: "❌ Invalid Token" });
    }
};

// These routes are now handled by authRoutes

// ✅ Endpoint dengan JWT Authentication
app.get("/protected-tasks", verifyToken, asyncHandler(async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json({ 
            message: `🔒 Hello, ${req.user.username}. Here are your tasks`, 
            tasks: tasks 
        });
    } catch (error) {
        console.error("Error fetching protected tasks:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}));

// Import and use tasksSecure routes
const tasksSecureRoutes = require('./routes/tasksSecure');
app.use('/tasks-secure', asyncHandler(async (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    const validApiKey = process.env.API_KEY || "mysecureapikey456";
    
    if (!apiKey) {
        return res.status(401).json({ message: "❌ API Key is required" });
    }
    
    if (apiKey !== validApiKey) {
        return res.status(401).json({ message: "❌ Unauthorized: Invalid API Key" });
    }
    
    next();
}), tasksSecureRoutes);

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
