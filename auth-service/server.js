const express = require("express");
const jwt = require("jsonwebtoken");
const connectMongoDB = require("./mongoClient");
const User = require("./models/User");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());

const PORT = 5001;
const JWT_SECRET = "mysecretkey";

app.get("/", (req, res) => {
    res.json({
        service: "Auth Service",
        status: "running"
    });
});

app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});
app.post("/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

async function startServer() {
    await connectMongoDB();

    app.listen(PORT, () => {
        console.log(`Auth Service running on http://localhost:${PORT}`);
    });
}

startServer();