// config/corsOptions.js
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config(); // Cargar variables del .env

const defaultOrigins = [
  'https://08d8-149-34-244-143.ngrok-free.app',
  'http://10.98.0.16:3031',
  'http://localhost:3031',
  'http://192.168.0.100:3031',
  'capacitor://localhost'
];

// Si existe ALLOWED_ORIGINS en .env, lo usamos; si no, usamos los de arriba
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : defaultOrigins;

export const corsOptions = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

