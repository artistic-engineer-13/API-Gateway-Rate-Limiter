# API Gateway & Distributed Rate Limiting System

A backend system built using **Node.js, Express.js, Redis, MongoDB, and JWT** that demonstrates API Gateway architecture, distributed rate limiting, authentication, caching, request logging, and centralized error handling.

---

## 🚀 Features

- API Gateway for centralized request routing
- JWT-based authentication
- Redis-based distributed rate limiting
- Token Bucket rate limiting algorithm
- Redis caching for product data
- MongoDB-based request logging
- Centralized error handling
- Multiple backend microservices
- HTTP 429 response for excessive requests
- HTTP 503 response when a downstream service is unavailable

---

## 🏗️ System Architecture

```text
                         CLIENT
                           |
                           v
                  +------------------+
                  |   API GATEWAY    |
                  |      :5000       |
                  |                  |
                  |  JWT Auth        |
                  |  Rate Limiter    |
                  |  Request Routing |
                  |  Error Handling  |
                  |  Request Logging |
                  +--------+---------+
                           |
              +------------+------------+
              |            |            |
              v            v            v
        Auth Service   User Service  Product Service
           :5001          :5002          :5003
              |            |            |
              +------------+------------+
                           |
                    +------+------+
                    |             |
                    v             v
                  Redis        MongoDB
```

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- HTTP Proxy Middleware

### Database
- MongoDB
- Mongoose

### Caching & Rate Limiting
- Redis
- Token Bucket Algorithm
- Redis Lua Script

### Authentication
- JWT
- bcrypt

### Tools
- Docker
- Postman
- Git & GitHub

---

## 📁 Project Structure

```text
API-Gateway-Rate-Limiter/
│
├── api-gateway/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── requestLogger.js
│   │
│   ├── models/
│   │   └── RequestLog.js
│   │
│   ├── mongoClient.js
│   ├── redisClient.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── auth-service/
│   ├── models/
│   │   └── User.js
│   ├── mongoClient.js
│   ├── server.js
│   └── package.json
│
├── user-service/
│   ├── models/
│   │   └── User.js
│   ├── mongoClient.js
│   ├── server.js
│   └── package.json
│
├── product-service/
│   ├── models/
│   │   └── Product.js
│   ├── mongoClient.js
│   ├── redisClient.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# 🔐 Authentication

The project uses **JWT-based authentication**.

### Login Flow

1. Client sends email and password to the API Gateway.
2. Gateway forwards the request to the Auth Service.
3. Auth Service verifies the credentials.
4. A JWT token is generated after successful authentication.
5. Client sends the token when accessing protected APIs.
6. API Gateway verifies the JWT before forwarding the request.

Example:

```text
Client
   |
   | Login
   v
API Gateway
   |
   v
Auth Service
   |
   | JWT Token
   v
Client
   |
   | Bearer Token
   v
API Gateway
   |
   | Token Verified
   v
Protected Service
```

Passwords are hashed using **bcrypt** before being stored in MongoDB.

---

# 🚦 Distributed Rate Limiting

The API Gateway implements a **Redis-based Token Bucket rate limiter**.

### Configuration

```text
Maximum Tokens = 5
Refill Rate    = 1 token/second
```

Each client is identified using its IP address.

Example:

```text
Request 1 → Allowed
Request 2 → Allowed
Request 3 → Allowed
Request 4 → Allowed
Request 5 → Allowed
Request 6 → HTTP 429
```

After waiting for tokens to refill, requests can be accepted again.

### Why Redis?

Redis stores the rate-limit state centrally.

This makes the rate limiter suitable for a distributed gateway architecture because multiple gateway instances can share the same rate-limit state through Redis.

### Lua Script

A Redis Lua script performs the following operations atomically:

```text
Read token count
      ↓
Calculate token refill
      ↓
Check available token
      ↓
Consume token
      ↓
Update Redis
```

This prevents race conditions when multiple requests arrive at nearly the same time.

---

# ⚡ Redis Caching

Redis is also used for caching product data.

The product service uses the cache key:

```text
products:all
```

### Cache Flow

```text
Client
   |
   v
Product Service
   |
   v
Check Redis
   |
   +---- Cache HIT ----> Return cached data
   |
   +---- Cache MISS ---> MongoDB
                           |
                           v
                      Store in Redis
                           |
                           v
                      Return data
```

The cached data has a **60-second TTL**.

When a new product is created, the existing product cache is invalidated so that the next request retrieves fresh data from MongoDB.

---

# 📝 Request Logging

The API Gateway records request information in MongoDB.

The following information is stored:

- HTTP method
- Endpoint
- Status code
- Response time
- Timestamp

Example:

```text
GET /api/products/products
Status: 200
Response Time: 25ms
```

These logs can be used for monitoring and debugging API requests.

---

# 🌐 API Gateway Routing

The API Gateway acts as the single entry point for clients.

### Public APIs

```text
POST /api/auth/register
POST /api/auth/login
```

### Protected APIs

```text
GET /api/users/users
GET /api/products/products
```

The Gateway forwards requests to the appropriate internal service.

```text
/api/auth/*      → Auth Service :5001
/api/users/*     → User Service :5002
/api/products/*  → Product Service :5003
```

Clients do not need to directly access the internal service ports.

---

# ⚠️ Error Handling

The API Gateway handles different types of failures.

### 401 Unauthorized

Returned when:

- JWT token is missing
- JWT token is invalid
- JWT token has expired

Example:

```json
{
  "message": "Access token required"
}
```

### 429 Too Many Requests

Returned when the client exceeds the rate limit.

```json
{
  "message": "Too many requests. Please try again later."
}
```

### 503 Service Unavailable

Returned when a downstream microservice is unavailable.

```json
{
  "message": "Product service is unavailable"
}
```

### 404 Not Found

Returned when an invalid Gateway route is requested.

```json
{
  "message": "Route not found"
}
```

---

# 🐳 Running Redis and MongoDB

Redis and MongoDB can be run using Docker.

### Start Redis

```bash
docker run -d --name redis -p 6379:6379 redis
```

Check Redis:

```bash
docker exec -it redis redis-cli ping
```

Expected:

```text
PONG
```

### Start MongoDB

```bash
docker run -d --name mongodb -p 27017:27017 mongo
```

---

# ▶️ Running the Project

Clone the repository:

```bash
git clone <your-github-repository-url>
```

Navigate into the project:

```bash
cd API-Gateway-Rate-Limiter
```

Install dependencies inside each service:

```bash
cd api-gateway
npm install
```

```bash
cd ../auth-service
npm install
```

```bash
cd ../user-service
npm install
```

```bash
cd ../product-service
npm install
```

Start the services in separate terminals.

### Auth Service

```bash
cd auth-service
node server.js
```

Runs on:

```text
http://localhost:5001
```

### User Service

```bash
cd user-service
node server.js
```

Runs on:

```text
http://localhost:5002
```

### Product Service

```bash
cd product-service
node server.js
```

Runs on:

```text
http://localhost:5003
```

### API Gateway

```bash
cd api-gateway
node server.js
```

Runs on:

```text
http://localhost:5000
```

---

# 🧪 Testing

The APIs can be tested using **Postman**.

### 1. Register

```text
POST http://localhost:5000/api/auth/register
```

Example body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "123456"
}
```

---

### 2. Login

```text
POST http://localhost:5000/api/auth/login
```

Example body:

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

The response contains a JWT token.

---

### 3. Access Protected API

```text
GET http://localhost:5000/api/products/products
```

Add the token in the request header:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

### 4. Test Rate Limiting

Send multiple requests quickly to the Gateway.

After the available tokens are consumed:

```text
HTTP 429 Too Many Requests
```

---

### 5. Test Redis Cache

First request:

```text
Cache MISS
```

Following requests:

```text
Cache HIT
```

---

### 6. Test Error Handling

Stop the Product Service and send:

```text
GET http://localhost:5000/api/products/products
```

The Gateway returns:

```text
503 Service Unavailable
```

---

# 📊 Main Components

| Component | Responsibility |
|---|---|
| API Gateway | Routing, authentication, rate limiting and error handling |
| Auth Service | User registration, login and JWT generation |
| User Service | User data APIs |
| Product Service | Product APIs and Redis caching |
| Redis | Rate-limit state and caching |
| MongoDB | Persistent data and request logs |
| JWT | Authentication |
| Docker | Running Redis and MongoDB |

---

# 🔮 Future Improvements

- Environment variables for secrets and configuration
- Separate databases for individual microservices
- Refresh token implementation
- API monitoring dashboard
- Rate-limit configuration per API/user
- Docker Compose for running all infrastructure together
- Automated testing
- Load testing and performance benchmarking

---

# 👨‍💻 Author

**Ankush Bhardwaj**

MCA Student | Backend & Full-Stack Developer
```

### Important

For your project, **don't add claims like "50% faster", "handles 10,000 requests/sec", or "real-time monitoring"** unless you actually measured/implemented them.

Also, replace:

```text
<your-github-repository-url>
```



