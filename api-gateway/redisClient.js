const { createClient } = require("redis");

const redisClient = createClient({
    url: "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => {
    console.log("Redis Error:", err);
});

async function connectRedis() {
    await redisClient.connect();
    console.log("Connected to Redis");
}

module.exports = {
    redisClient,
    connectRedis
};