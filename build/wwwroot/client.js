$(function() {

  var socket = io();
  var clients = {};
  var countDiv = $('<div id=count>').insertAfter('h1');

  socket.on('count', function(count) {
    countDiv.text(count);
  });

  function updateClient(id, scroll) {
    if (!clients[id]) {
      clients[id] = $('<div class=client>')
        .css({color: 'hsl(' + (360 * Math.random()) + ',50%,50%)'})
        .appendTo('.markdown-body');
    }
    clients[id].css({top: scroll});
  }

  function removeClient(id) {
    if (clients[id]) {
      clients[id].remove();
    }
    delete clients[id];
  }

  socket.on('join', function(id) {
    updateClient(id, 0);
  });

  socket.on('scroll', function(o) {
    updateClient(o.id, o.val);
  });

  socket.on('leave', removeClient);

  $(window).on('scroll', function() {
    socket.emit('scroll', $(window).scrollTop());
  });

  socket.emit('ready');

});
