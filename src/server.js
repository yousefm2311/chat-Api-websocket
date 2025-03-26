require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const WebSocket = require('ws');
const authRoutes = require('./controllers/authRoutes');
const Message = require('./models/message'); // Make sure you have this model

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const jwt = require('jsonwebtoken');
// server.js
wss.on('connection', async (ws, req) => {
    const token = req.url.split('token=')[1];
    if (!token) {
        console.log('No token, connection rejected');
        ws.close();
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ws.userId = decoded.id;
        ws.username = decoded.username || 'Anonymous'; // Store username from token
        console.log(`User ${ws.username} (${ws.userId}) connected`);

        // Send previous messages
        const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
        ws.send(JSON.stringify({ type: 'INIT_MESSAGES', data: messages }));

        ws.on('message', async (message) => {
            try {
                const msgData = JSON.parse(message);
                console.log('Received:', msgData);

                // Save to database with proper sender info
                const newMessage = new Message({
                    sender: ws.username, // Use the username from WebSocket connection
                    content: msgData.content,
                    timestamp: new Date(msgData.timestamp || Date.now())
                });

                await newMessage.save();

                // Broadcast to all clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'NEW_MESSAGE',
                            data: {
                                sender: ws.username,
                                content: msgData.content,
                                timestamp: newMessage.timestamp
                            }
                        }));
                    }
                });
            } catch (err) {
                console.error('Error handling message:', err);
            }
        });

        ws.on('close', () => {
            console.log(`User ${ws.username} (${ws.userId}) disconnected`);
        });

    } catch (err) {
        console.log('Invalid token:', err);
        ws.close();
    }
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));