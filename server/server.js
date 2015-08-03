const io = require('socket.io').listen(5000);

var count = 0;
io.on('connection', function(socket) {
  count++;
  io.sockets.emit('count', count);

  socket.broadcast.emit('join', socket.id);

  socket.on('scroll', function(val) {
    socket.broadcast.emit('scroll', {id: socket.id, val: val});
  });

  socket.on('disconnect', function() {
    count--;
    socket.broadcast.emit('count', count);
    socket.broadcast.emit('leave', socket.id);
  });
});
