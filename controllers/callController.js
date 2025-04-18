const Call = require("../models/Call");

exports.saveCall = async (req, res) => {
    const { emotion, priority, caller_id } = req.body;

    try {
        const newCall = new Call({ emotion, priority, caller_id });
        await newCall.save();
        res.status(201).json({ status: "success", data: newCall });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: "failure", message: "Server error" });
    }
};

exports.getEmotions = async (req, res) => {
    try {
        const calls = await Call.find();
        res.status(200).json({ status: "success", data: calls });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: "failure", message: "Server error" });
    }
};

exports.analyzeBehavior = async (req, res) => {
    try {
        const calls = await Call.find();
        const emotionCounts = calls.reduce((acc, call) => {
            acc[call.emotion] = (acc[call.emotion] || 0) + 1;
            return acc;
        }, {});
        res.status(200).json({ status: "success", data: emotionCounts });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: "failure", message: "Server error" });
    }
};