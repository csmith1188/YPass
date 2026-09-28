/* Example Socket.IO client. Identity and roles must never be sent by this script. */
(function () {
  if (!window.io) {
    return;
  }
  const socket = window.io('/', { transports: ['websocket'] });
  socket.on('connect', function () {
    socket.emit('ping', { message: 'hello' });
  });
  socket.on('pong', function (payload) {
    console.info('pong', payload);
  });
})();
