const RequestLog = require("../models/RequestLog");

function requestLogger(req, res, next) {
    const startTime = Date.now();

    res.on("finish", async () => {
        const responseTime = Date.now() - startTime;

        try {
            await RequestLog.create({
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: res.statusCode,
                responseTime: responseTime
            });

            console.log(
                `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`
            );
        } catch (error) {
            console.error("Request logging error:", error);
        }
    });

    next();
}

module.exports = requestLogger;