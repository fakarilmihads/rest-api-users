const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "❌ Token missing or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "yourstrongsecretkey");
        req.user = decoded;
        next();
    } catch (error) {
        console.error("❌ JWT Verification Error:", error.message);
        return res.status(403).json({ message: "❌ Invalid Token" });
    }
};

const authenticateApiKey = (req, res, next) => {
    const apiKey = req.header("x-api-key");

    if (!apiKey) {
        return res.status(401).json({ message: "❌ API Key is required" });
    }

    const validApiKey = process.env.API_KEY || "mysecureapikey456";
    if (apiKey !== validApiKey) {
        return res.status(401).json({ message: "❌ Unauthorized: Invalid API Key" });
    }

    next();
};

const authorizeRole = (role) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "❌ User authentication required" });
    }

    if (req.user.role !== role) {
        return res.status(403).json({ message: "❌ Forbidden: You don't have permission" });
    }

    next();
};

module.exports = {
    authenticateToken,
    authenticateApiKey,
    authorizeRole,
};
