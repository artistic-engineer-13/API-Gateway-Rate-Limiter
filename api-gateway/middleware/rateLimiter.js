// const { redisClient } = require("../redisClient");

// const MAX_TOKENS = 5;
// const REFILL_RATE = 1; // 1 token per second

// async function rateLimiter(req, res, next) {
//     const clientId = req.ip;
//     const key = `rate_limit:${clientId}`;

//     let data = await redisClient.hGetAll(key);

//     let tokens = data.tokens ? Number(data.tokens) : MAX_TOKENS;
//     let lastRefill = data.lastRefill
//         ? Number(data.lastRefill)
//         : Date.now();

//     // Calculate how much time has passed
//     const now = Date.now();
//     const secondsPassed = (now - lastRefill) / 1000;

//     // Add new tokens according to the refill rate
//     tokens = Math.min(
//         MAX_TOKENS,
//         tokens + secondsPassed * REFILL_RATE
//     );

//     // Check if a token is available
//     if (tokens < 1) {
//         return res.status(429).json({
//             message: "Too many requests. Please try again later."
//         });
//     }

//     // Consume one token
//     tokens -= 1;

//     // Save updated values in Redis
//     await redisClient.hSet(key, {
//         tokens: tokens.toString(),
//         lastRefill: now.toString()
//     });

//     next();
// }

// module.exports = rateLimiter;




// Request
//    ↓
// Find client's tokens in Redis
//    ↓
// Refill tokens if necessary
//    ↓
// Is token available?
//    │
//    ├── YES → remove 1 token → next()
//    │
//    └── NO  → 429


// This is the flow without lua script where race condition occurs :
//         Request
//            │
//            ▼
//       Node.js
//            │
//            ▼
//       READ Redis
//            │
//            ▼
//     Calculate tokens
//            │
//            ▼
//       WRITE Redis
//            │
//            ▼
//         next()



const { redisClient } = require("../redisClient");

const MAX_TOKENS = 5;
const REFILL_RATE = 1; // 1 token per second

const rateLimitScript = `
local tokens = redis.call("HGET", KEYS[1], "tokens")
local lastRefill = redis.call("HGET", KEYS[1], "lastRefill")

local maxTokens = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

if not tokens then
    tokens = maxTokens
else
    tokens = tonumber(tokens)
end

if not lastRefill then
    lastRefill = now
else
    lastRefill = tonumber(lastRefill)
end

local secondsPassed = (now - lastRefill) / 1000

tokens = math.min(
    maxTokens,
    tokens + secondsPassed * refillRate
)

if tokens < 1 then
    redis.call("HSET", KEYS[1],
        "tokens", tokens,
        "lastRefill", now
    )

    return 0
end

tokens = tokens - 1

redis.call("HSET", KEYS[1],
    "tokens", tokens,
    "lastRefill", now
)

return 1
`;

async function rateLimiter(req, res, next) {

    try {

        // Identify client
        const clientId = req.ip;

        // Redis key for this client
        const key = `rate_limit:${clientId}`;

        // Execute atomic Lua script
        const result = await redisClient.eval(rateLimitScript, {
            keys: [key],
            arguments: [
                MAX_TOKENS.toString(),
                REFILL_RATE.toString(),
                Date.now().toString()
            ]
        });

        // Token unavailable
        if (Number(result) === 0) {
            return res.status(429).json({
                message: "Too many requests. Please try again later."
            });
        }

        // Token available
        next();

    } catch (error) {

        console.error("Rate limiter error:", error);

        return res.status(500).json({
            message: "Rate limiter error"
        });
    }
}

module.exports = rateLimiter;