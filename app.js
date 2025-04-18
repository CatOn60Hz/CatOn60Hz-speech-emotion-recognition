require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const WebSocket = require('ws');
const http = require('http');
const audioProcessor = require('./audio_processor');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // React app's address
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

// Middleware
app.use(bodyParser.json());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/emotional-analysis', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Define the MongoDB schema for call data
const callSchema = new mongoose.Schema({
    emotion: String,
    confidence: Number,
    timestamp: Date,
    caller_id: Number,
    phone_number: String,
    latitude: Number,
    longitude: Number,
    time_spoken: Number,
    emotion_predictions: {
        angry: Number,
        fear: Number,
        happy: Number,
        neutral: Number,
        sad: Number
    }
});

const Call = mongoose.model('Call', callSchema);

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send initial data
    const sendInitialData = async () => {
        try {
            const recentCalls = await Call.find()
                .sort({ timestamp: -1 })
                .limit(20);
            
            if (recentCalls.length > 0) {
                ws.send(JSON.stringify({
                    type: 'new_call',
                    call: recentCalls[0]
                }));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    sendInitialData();

    // Handle incoming messages
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'audio_data') {
                // Process audio data through SER model
                const analysis = await audioProcessor.processAudioStream(
                    Buffer.from(data.audio, 'base64'),
                    data.caller_id
                );

                if (analysis.error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: analysis.error
                    }));
                    return;
                }

                // Save to database
                const newCall = new Call({
                    emotion: analysis.emotion,
                    confidence: analysis.confidence,
                    timestamp: new Date(),
                    caller_id: data.caller_id,
                    phone_number: data.phone_number,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    time_spoken: data.duration || 0,
                    emotion_predictions: analysis.predictions
                });

                await newCall.save();

                // Broadcast to all connected clients
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'new_call',
                            call: newCall
                        }));
                    }
                });

                // Send detailed analysis to the original client
                ws.send(JSON.stringify({
                    type: 'emotion_analysis',
                    analysis: analysis
                }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Failed to process audio data'
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Clean up old audio files periodically
setInterval(() => {
    audioProcessor.cleanupOldFiles();
}, 60 * 60 * 1000); // Every hour

// Add the search endpoint
app.get('/api/cyber/search', async (req, res) => {
    try {
        const { type, query } = req.query;
        
        if (!type || !query) {
            return res.status(400).json({ 
                error: 'Missing required parameters' 
            });
        }

        let searchQuery = {};
        if (type === 'uid') {
            searchQuery = { caller_id: query };
        } else if (type === 'phone') {
            searchQuery = { phone_number: query };
        }

        // Log the search query for debugging
        console.log('Searching with query:', searchQuery);

        const calls = await Call.find(searchQuery);
        
        if (!calls || calls.length === 0) {
            return res.status(404).json({ 
                error: 'No data found for this search' 
            });
        }

        // Log successful response
        console.log('Found data:', calls);
        res.json(calls);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Add the all-calls endpoint
app.get('/api/cyber/all-calls', async (req, res) => {
    try {
        const calls = await Call.find({})
            .sort({ timestamp: -1 }) // Sort by most recent first
            .limit(1000); // Limit to prevent overwhelming response
        
        if (!calls || calls.length === 0) {
            return res.status(404).json({ 
                error: 'No calls found in the database' 
            });
        }

        res.json(calls);
    } catch (error) {
        console.error('Error fetching all calls:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});