const mongoose = require('mongoose');
const Call = require('./models/Call');

mongoose.connect('mongodb://localhost:27017/emotional_analysis', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');
    try {
        const calls = await Call.find({ phone_number: "9597990305" });
        console.log('Found calls:', JSON.stringify(calls, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
    mongoose.connection.close();
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
}); 