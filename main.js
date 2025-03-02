const express = require('express');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

const ROBLOX_CLIENT_ID = '4458072035176138313'; // Replace with your Roblox application client ID
const ROBLOX_CLIENT_SECRET = 'RBX-UugkXNUFAECL-nuF5UkE7wtzWA3Blm0r9vNZml0CPU9BcTiXfeh5nlPpY5_F-aRy'; // Replace with your Roblox application client secret
const ROBLOX_REDIRECT_URI = 'https://bloxy-messages-apis.onrender.com/callback'; // Replace with your callback URL
const SCOPE = 'openid profile'; // The scope you need (this requests basic user info)

// Step 1: Redirect users to Roblox login page
app.get('/auth', (req, res) => {
    // Roblox OAuth URL
    const robloxLoginUrl = `https://authorize.roblox.com/?client_id=${ROBLOX_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(ROBLOX_REDIRECT_URI)}&scope=${SCOPE}&state=abc123`;
    res.redirect(robloxLoginUrl);
});

// Step 2: Handle callback and exchange code for access token
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('Code not provided');
    }

    try {
        // Exchange authorization code for an access token
        const tokenResponse = await axios.post('https://apis.roblox.com/oauth/token', null, {
            params: {
                code: code,
                client_id: ROBLOX_CLIENT_ID,
                client_secret: ROBLOX_CLIENT_SECRET,
                redirect_uri: ROBLOX_REDIRECT_URI,
                grant_type: 'authorization_code'
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Use the access token to get user info
        const userResponse = await axios.get('https://users.roblox.com/v1/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const user = userResponse.data;

        // Return the user data
        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Authentication failed');
    }
});

// Real-time messaging (Socket.io)
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('sendMessage', (data) => {
        io.emit('receiveMessage', data); // Broadcast message to all users
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start server
server.listen(3000, () => {
    console.log('Server running on port 3000');
});
