const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public'))); // Or current dir if index.html is in root

io.on('connection', (socket) => {
    console.log(`Family member connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);

        const room = io.adapter.rooms.get(roomId);
        const usersInRoom = room ? Array.from(room).filter(id => id !== socket.id) : [];
        socket.emit('existing-users', usersInRoom);
    });

    socket.on('offer', (data) => {
        socket.to(data.target).emit('offer', { offer: data.offer, sender: socket.id });
    });

    socket.on('answer', (data) => {
        socket.to(data.target).emit('answer', { answer: data.answer, sender: socket.id });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.target).emit('ice-candidate', { candidate: data.candidate, sender: socket.id });
    });

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
    console.log(`Family server running on port ${PORT}`);
});
