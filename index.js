'use strict';

require('dotenv').config();
const server = require('http').createServer();
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on('connection', (socket) => {
  // when connecting
  console.log('A USER CONNECTED', socket.id);
  // take userId and socketId from user
  socket.on('addUser', (userId) => {
    addUser(userId, socket.id);
    // to send a list of online users to the currentUser
    io.emit('getUsers', users);
  });

  // send and get message
  socket.on('sendMessage', ({ senderId, receiverId, text }) => {
    // get receiver socketId
    const user = getUser(receiverId);
    // if other user is not connected, we need the below condition
    user && io.to(user.socketId).emit('getMessage', {
      senderId,
      text
    });
  });

  // when disconnecting
  socket.on('disconnect', () => {
    console.log('A USER DISCONNECTED', socket.id);
    removeUser(socket.id);
    // to send an updated list of who's online and who's not
    io.emit('getUsers', users);
  });
});

server.listen(process.env.PORT, () => console.log(`SOCKET RUNNING ON ${process.env.PORT}`))
