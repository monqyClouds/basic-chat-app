const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);    // to support socketio
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
  console.log('New websocket conection');

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error)
    }

		socket.join(user.room);

		// Emitting to only the current client
		socket.emit("message", generateMessage('Admin', `Welcome ${user.username}`));

		// Emitiing to all except current client
    socket.broadcast.to(user.room).emit("message", generateMessage('Admin', `${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsers(user.room)
    })
    
    callback();
	})
  
  // Emitting to every single client, callback sends aknowledgement.
  socket.on('sendMessage', (text, callback) => {
    const filter = new Filter();

    if (filter.isProfane(text)) {
      return callback('Profanity is not allowed');
    }

    const { username, room } = getUser(socket.id);

    io.to(room).emit('message', generateMessage(username,text));
    callback();   // call runs the aknowledgement function
  })

  // Emitting a message when a user leaves 
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsers(user.room)
      })
    }
  })

  socket.on('sendLocation', ({ latitude, longitude }, callback) => {
    const { username, room } = getUser(socket.id);
    io.to(room).emit('locationMessage', generateLocationMessage(username, `https://google.com/maps?q=${longitude},${latitude}`));
    callback();
  })
})


server.listen(port, () => {
  console.log('Server is up on port ' + port)
});