const express = require("express");
const {createProxyMiddleware} = require("http-proxy-middleware");
const rateLimiter = require("./middleware/rateLimiter");
const { connectRedis} = require("./redisClient");
const connectMongoDB = require("./mongoClient");
const authenticateToken = require("./middleware/authMiddleware");
const requestLogger = require("./middleware/requestLogger");


const app = express();
const PORT = 5000;


// ------------------------------------------------------

//Gateway home route
app.get("/",(req,res) => {
    res.json({
        service:"API Gateway",
        status:"running"
    });
});

app.use(requestLogger);
// Rate limiter
app.use(rateLimiter);

// Auth Service
app.use(
    "/api/auth",
    createProxyMiddleware({
        target: "http://localhost:5001",
        changeOrigin: true,
        pathRewrite: {
            "^/api/auth": ""
        },
        on: {
            error: (err, req, res) => {
                console.error("Auth Service Error:", err.message);

                res.status(503).json({
                    message: "Auth service is unavailable"
                });
            }
        }
    })
);

// User Service
app.use(
    "/api/users",
    authenticateToken,
    createProxyMiddleware({
        target: "http://localhost:5002",
        changeOrigin: true,
        pathRewrite: {
            "^/api/users": ""
        },
        on: {
            error: (err, req, res) => {
                console.error("User Service Error:", err.message);

                res.status(503).json({
                    message: "User service is unavailable"
                });
            }
        }
    })
);

// Product Service
app.use(
    "/api/products",
    authenticateToken,
    createProxyMiddleware({
        target: "http://localhost:5003",
        changeOrigin: true,
        pathRewrite: {
            "^/api/products": ""
        },
        on: {
            error: (err, req, res) => {
                console.error("Product Service Error:", err.message);

                res.status(503).json({
                    message: "Product service is unavailable"
                });
            }
        }
    })
);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

async function startServer() {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
        console.log(`API Gateway running on http://localhost:${PORT}`);
    });
}

startServer();