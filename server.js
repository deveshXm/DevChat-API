const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server, {cors : { origin : "*"}});
const {addUsers , removeUser , getUser, getUserInRoom} = require('./entity')

let port = process.env.PORT || 8000;


app.get('/', (req, res) => {
  res.send("server working");
});

io.on('connect', (socket) => {
  console.log('a user connected');

  socket.on('join',({name, room}, callBack) => {
    const {user , error} = addUsers({id:socket.id, name:name , room:room})

    console.log(user);

    if(error){
      callBack(error)
      return;
    }

    socket.join(user.room);

    socket.emit('message',{user:'admin',text:`Welcome ${user.name}`});

    socket.broadcast.to(user.room).emit('message',{user:'admin',text: `${user.name} has joined`});

    io.to(user.room).emit('activeUsers',getUserInRoom(user.room));
  });

  socket.on('sendMsg',(message,callBack) => {
    const user = getUser(socket.id);

    if(user){
      io.to(user.room).emit('message',{user:user.name,text :message});
    }
    
    callBack();
  });

  socket.on('disconnect' , ()=> {
    console.log('user disconnected');
    const user = removeUser(socket.id);

    if(user){
      io.to(user.room).emit('message',{user:'admin',text:`${user.name} has left`});
      io.to(user.room).emit('activeUsers',getUserInRoom(user.room));
    }
  });
});

server.listen(port, () => {
  console.log('listening on *:8000');
});