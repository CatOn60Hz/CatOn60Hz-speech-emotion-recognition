# Emotional Analysis Backend

A backend service for real-time emotional analysis of audio data, built with Node.js and Express.

## Features

- Real-time audio processing and emotional analysis
- RESTful API endpoints
- User authentication
- MongoDB integration
- WebSocket support for real-time communication
- Data visualization with Chart.js

## Tech Stack

- Node.js
- Express
- MongoDB
- Python (for audio processing)
- WebSocket
- Chart.js

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with your configuration
4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

- POST /api/analyze - Analyze audio data
- GET /api/results - Get analysis results
- POST /api/auth/register - User registration
- POST /api/auth/login - User login

## License

ISC 