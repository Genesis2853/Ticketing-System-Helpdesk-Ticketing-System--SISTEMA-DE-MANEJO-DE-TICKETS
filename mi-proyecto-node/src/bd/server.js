import dotenv from 'dotenv';
import { pool } from './serverPGSQL.js';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';


dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());



app.post('/guardar', async (req, res) => {
  try {
    const { marca_temporal, confirmacion, asistentes, origen_evento, comentarios } = req.body;
    await pool.query(
      'INSERT INTO asistencia (marca_temporal, confirmacion, asistentes, origen_evento, comentarios) VALUES ($1, $2, $3, $4, $5)',
      [marca_temporal, confirmacion, asistentes, origen_evento, comentarios]
    );
    res.status(200).json({ mensaje: 'Datos guardados exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar los datos' });
  }
});

app.listen(3000, () => {
  console.log('Servidor escuchando en puerto 3000');
});
