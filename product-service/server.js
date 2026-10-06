const express = require("express");

const app = express();
const connectMongoDB = require("./mongoClient");
const Product = require("./models/Product");
const {connectRedis,redisClient} = require("./redisClient");

app.use(express.json());

const PORT = 5003;

// Test route
app.get("/", (req, res) => {
    res.json({
        service: "Product Service",
        status: "running"
    });
});

// Get all products
app.get("/products", async (req, res) => {
    try {
        const cachedProducts = await redisClient.get("products:all");

        if (cachedProducts) {
            console.log("Cache HIT");
            return res.json(JSON.parse(cachedProducts));
        }

        console.log("Cache MISS");

        const products = await Product.find();

        await redisClient.set(
            "products:all",
            JSON.stringify(products),
            {
                EX: 60
            }
        );

        res.json(products);

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get a single product
app.get("/products/:id", (req, res) => {
    const productId = req.params.id;

    res.json({
        id: productId,
        name: "Laptop",
        price: 55000
    });
});

app.post("/products", async (req, res) => {

    try {

        const { name, price } = req.body;

        const product = await Product.create({
            name,
            price
        });
        await redisClient.del("products:all");

        res.status(201).json({
            message: "Product created successfully",
            product
        });

    } catch (error) {

        console.error("Product creation error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

async function startServer() {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
        console.log(`Product Service running on http://localhost:${PORT}`);
    });
}

startServer();