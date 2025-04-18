const express = require('express');
const router = express.Router();
const Call = require('../models/Call');

router.get('/search', async (req, res) => {
    try {
        const { type, query } = req.query;
        console.log('Search request received:', req.url);
        console.log('Search params:', { type, query });
        console.log('Full request query:', req.query);

        if (!type || !query) {
            console.log('Missing parameters detected');
            return res.status(400).json({ error: 'Missing parameters' });
        }

        let searchQuery = {};
        if (type === 'phone') {
            searchQuery = { phone_number: query };
        } else if (type === 'uid') {
            searchQuery = { caller_id: parseInt(query) };
        }

        console.log('MongoDB query:', JSON.stringify(searchQuery));

        const calls = await Call.find(searchQuery);
        console.log('Found calls:', JSON.stringify(calls));

        if (!calls || calls.length === 0) {
            console.log('No records found for query');
            return res.status(404).json({ error: 'No records found' });
        }

        console.log('Successfully returning calls');
        res.json(calls);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get overall statistics for the dashboard
router.get('/statistics', async (req, res) => {
    try {
        console.log('Statistics request received');
        
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('Today:', today);

        // Get total calls today
        const totalCallsToday = await Call.countDocuments({
            timestamp: { $gte: today }
        });
        console.log('Total calls today:', totalCallsToday);

        // Get high priority cases (calls with negative emotions)
        const highPriorityCases = await Call.countDocuments({
            timestamp: { $gte: today },
            emotion: { $in: ['angry', 'fear', 'sad'] }
        });
        console.log('High priority cases:', highPriorityCases);

        // Get active investigations (calls in the last 24 hours)
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);
        const activeInvestigations = await Call.countDocuments({
            timestamp: { $gte: last24Hours }
        });
        console.log('Active investigations:', activeInvestigations);

        // Get daily call volume for the last 7 days
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        console.log('Last 7 days:', last7Days);
        
        const dailyCalls = await Call.aggregate([
            {
                $match: {
                    timestamp: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        console.log('Daily calls:', dailyCalls);

        // Get emotion distribution
        const emotionDistribution = await Call.aggregate([
            {
                $match: {
                    timestamp: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: "$emotion",
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('Emotion distribution:', emotionDistribution);

        // Get call types distribution (based on emotions)
        const callTypes = await Call.aggregate([
            {
                $match: {
                    timestamp: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $in: ["$emotion", ["angry", "fear", "sad"]] }, then: "High Priority" },
                                { case: { $eq: ["$emotion", "neutral"] }, then: "Normal" },
                                { case: { $eq: ["$emotion", "happy"] }, then: "Positive" }
                            ],
                            default: "Other"
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('Call types:', callTypes);

        // Format the response
        const statistics = {
            totalCallsToday,
            highPriorityCases,
            activeInvestigations,
            dailyCallVolume: {
                labels: dailyCalls.map(d => d._id),
                data: dailyCalls.map(d => d.count)
            },
            emotionDistribution: {
                labels: emotionDistribution.map(e => e._id),
                data: emotionDistribution.map(e => e.count)
            },
            callTypes: {
                labels: callTypes.map(c => c._id),
                data: callTypes.map(c => c.count)
            }
        };
        console.log('Final statistics:', statistics);

        res.json(statistics);
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
