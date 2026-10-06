const express = require("express");
const app = express();
const connectMongoDB = require("./mongoClient");
const User = require("./models/User");

app.use(express.json());

const PORT = 5002;

// Test route
app.get("/", (req, res) => {
    res.json({
        service: "User Service",
        status: "running"
    });
});

// Get users
app.get("/users", async (req, res) => {

    try {

        const users = await User.find().select("-password");

        res.json(users);

    } catch (error) {

        console.error("Error fetching users:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

// Get single user
app.get("/users/:id", (req, res) => {
    const userId = req.params.id;

    res.json({
        id: userId,
        name: "Ankush",
        email: "ankush@example.com"
    });
});

async function startServer() {

    await connectMongoDB();

    app.listen(PORT, () => {
        console.log(`User Service running on http://localhost:${PORT}`);
    });
}

startServer();