const mongoose = require("mongoose");

const requestLogSchema = new mongoose.Schema({
    method: String,
    endpoint: String,
    statusCode: Number,
    responseTime: Number,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const RequestLog = mongoose.model("RequestLog", requestLogSchema);

module.exports = RequestLog;