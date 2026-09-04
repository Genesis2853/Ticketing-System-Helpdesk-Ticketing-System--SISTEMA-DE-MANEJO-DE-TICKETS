// server.js o app.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../../config.js'; // Usar import en lugar de require
import tecnicoRoutes from './rutastecnico.js'; // Importa las rutas del técnico

// Cargar variables de entorno al inicio
dotenv.config();

const app = express();
const port = config.portSoliAsigTec || 3050;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(cors());

// Usar las rutas del técnico
app.use('/api/tecnico', tecnicoRoutes);

// Otras configuraciones y rutas pueden ir aquí

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
