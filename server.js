const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);

        // Get all other users currently in the room
        const room = io.adapter.rooms.get(roomId);
        const usersInRoom = room ? Array.from(room).filter(id => id !== socket.id) : [];
        
        // Send existing users list to the newly joined user
        socket.emit('existing-users', usersInRoom);
    });

    // Relay WebRTC Offers
    socket.on('offer', (data) => {
        socket.to(data.target).emit('offer', {
            offer: data.offer,
            sender: socket.id
        });
    });

    // Relay WebRTC Answers
    socket.on('answer', (data) => {
        socket.to(data.target).emit('answer', {
            answer: data.answer,
            sender: socket.id
        });
    });

    // Relay ICE Candidates
    socket.on('ice-candidate', (data) => {
        socket.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            sender: socket.id
        });
    });

    // Interactive Features: Buzz, Likes, and Text Chat
    socket.on('buzz-user', (targetId) => {
        socket.to(targetId).emit('buzzed', { sender: socket.id });
    });

    socket.on('send-like', (roomId) => {
        socket.to(roomId).emit('receive-like');
    });

    socket.on('send-chat', ({ roomId, message, sender }) => {
        io.to(roomId).emit('receive-chat', { message, sender });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        io.emit('user-disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Signaling server running live at http://localhost:${PORT}`);
});
