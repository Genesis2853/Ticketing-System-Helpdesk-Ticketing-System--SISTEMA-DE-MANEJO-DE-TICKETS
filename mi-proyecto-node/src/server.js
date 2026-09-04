// server.js
import express from 'express';
import cors from 'cors';
import backupRoutes from './backups.js';
import  modoMantenimiento  from './modoMantenimiento.js'; // ruta correcta

const app = express();
const PORT = process.env.PORTB || 4005; // puedes cambiar el puerto

app.use(cors());
app.use(express.json());
app.use(modoMantenimiento);
app.use('/api/backups', backupRoutes);


app.listen(PORT, () => {
  console.log(`Microservicio de backups corriendo en http://localhost:${PORT}`);
});
