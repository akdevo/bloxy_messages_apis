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
    const { robloxId, accessToken } = req.body;
    if (!robloxId || !accessToken) {
        return res.status(400).json({ error: 'Roblox ID and Access Token are required' });
    }
    
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        
        if (response.data) {
            return res.json({ success: true, user: response.data });
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid Roblox ID or Access Token' });
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
    
    // This will be your in-memory user mapping (for example, a user map)
    let currentUser;

    socket.on('login', (user) => {
        currentUser = user; // Store user data temporarily (you could persist this in a DB)
    });

    socket.on('sendMessage', async (data) => {
        if (currentUser) {
            // Check if the sender and receiver are friends
            try {
                const friendsResponse = await axios.get(`https://friends.roblox.com/v1/users/${currentUser.robloxId}/friends`);
                const friendsList = friendsResponse.data.data;
                const isFriend = friendsList.some(friend => friend.id === data.receiverRobloxId);

                if (isFriend) {
                    io.emit('receiveMessage', data); // Broadcast message to the receiver
                } else {
                    socket.emit('errorMessage', { message: 'You can only send messages to your friends.' });
                }
            } catch (error) {
                socket.emit('errorMessage', { message: 'Could not fetch friends list.' });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


server.listen(3000, () => {
    console.log('Server running on port 3000');
});
