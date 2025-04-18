const mongoose = require("mongoose");

const callSchema = new mongoose.Schema({
    emotion: String,
    timestamp: Date,
    caller_id: Number,
    phone_number: String,
    latitude: Number,
    longitude: Number,
    time_spoken: Number
});

module.exports = mongoose.model("Call", callSchema);