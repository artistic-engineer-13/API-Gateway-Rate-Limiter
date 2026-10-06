const mongoose = require("mongoose");

async function connectMongoDB() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/api_gateway");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

module.exports = connectMongoDB;