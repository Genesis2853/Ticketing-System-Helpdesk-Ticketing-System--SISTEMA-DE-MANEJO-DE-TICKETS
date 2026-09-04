// socketio.js

import { Server } from 'socket.io';

let io = null;

export function configurarSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
  });
}

export function emitirNotificacion(data) {
  console.log('🔊 Emitiendo notificación:', data); // 👈 Asegúrate de ver esto
  if (io) {
    io.emit('nueva-notificacion', data);
  }
}

