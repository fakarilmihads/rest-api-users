const mongoose = require("mongoose");

const connectMongoDB = async () => {
    try {
        // In test environment, use the MONGODB_URI set in jest.setup.js
        const dbURI = process.env.NODE_ENV === "test" 
            ? process.env.MONGODB_URI 
            : (process.env.MONGO_URI || "mongodb://localhost:27017/mockdatahadi_database");
            
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

module.exports = connectMongoDB;
