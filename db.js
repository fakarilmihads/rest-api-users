const mongoose = require("mongoose");

const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mockdatahadi_database", {
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
