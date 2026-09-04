// socketio.js

import { Server } from 'socket.io';

let io = null;

export function configurarSocket(server) {
  io = new Server(server, {
    cors: {
  origin: ['https://08d8-149-34-244-143.ngrok-free.app',
  'http://10.98.0.16:3031',
  'http://localhost:3031',
  'http://192.168.0.103:3031',
  'capacitor://localhost'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
  });

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    socket.on('unirseSala', (codigo) => {
    console.log(`📡 Cliente ${socket.id} se unió a la sala ${codigo}`);
    socket.join(codigo);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
  });
  
return io;
}

export function emitirNotificacion(data, destinatarios = []) {
  console.log('🔊 Emitiendo notificación:', data);
  if (!io) return;

  if (destinatarios.length === 0) {
    // Emitir a todos
    io.emit('nueva-notificacion', data);
  } else {
    // Emitir solo a los destinatarios específicos
    destinatarios.forEach(destino => {
      io.to(destino).emit('nueva-notificacion', data);
    });
  }
}

