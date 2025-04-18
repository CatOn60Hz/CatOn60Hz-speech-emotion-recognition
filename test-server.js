const express = require('express');
const app = express();

const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Test server running');
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Test server running at http://127.0.0.1:${PORT}`);
}); 