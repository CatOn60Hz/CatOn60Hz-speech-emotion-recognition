const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/calls');
const cyberRoutes = require('./routes/cyber');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow frontend origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Emotional Analysis API' });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ status: 'API is working' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/cyber', cyberRoutes);

const PORT = 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/emotional_analysis', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Only start the server after MongoDB connects
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://localhost:${PORT}`);
        }).on('error', (err) => {
            console.error('Server startup error:', err);
            process.exit(1);
        });

        // Handle server errors
        server.on('error', (err) => {
            console.error('Server error:', err);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    app.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});