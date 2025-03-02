const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

// User registration & authentication via Roblox
app.post('/auth', async (req, res) => {
    const { robloxId } = req.body;
    if (!robloxId) {
        return res.status(400).json({ error: 'Roblox ID is required' });
    }
    
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`);
        if (response.data) {
            return res.json({ success: true, user: response.data });
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid Roblox ID' });
    }
});

// Fetch friends list
app.get('/friends/:robloxId', async (req, res) => {
    const { robloxId } = req.params;
    
    try {
        const response = await axios.get(`https://friends.roblox.com/v1/users/${robloxId}/friends`);
        return res.json(response.data);
    } catch (error) {
        return res.status(400).json({ error: 'Failed to fetch friends list' });
    }
});

// Real-time messaging
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('sendMessage', (data) => {
        io.emit('receiveMessage', data); // Broadcast message to all users
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
