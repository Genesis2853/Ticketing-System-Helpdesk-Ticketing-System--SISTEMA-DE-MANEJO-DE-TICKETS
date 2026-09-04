/* ---------------------------  index.js  --------------------------- */
// 1️⃣  Cargar variables de entorno (.env)
import 'dotenv/config';               // equivale a require('dotenv').config()
import dotenv from 'dotenv';
// 2️⃣  Imports de librerías
import express from 'express';
import cors from 'cors';

// 3️⃣  Imports de utilidades internas
import config from './config.js';      // aquí lees todos los PORT_, DB_, etc.
import { corsOptions } from "./corsOptions.js";

// 4️⃣  Imports de routers (cada uno es un archivo independiente)
import estadoRouter   from './Administrador/estadoSolicitud.js';
import crearclientesRouter      from './Administrador/form_crearCliente.js';

// …importa los que te falten

/* ----------------------------------------------------------------- */
// 5️⃣  Crear instancia de Express
const app = express();
dotenv.config();
/* ----------------------------------------------------------------- */
// 6️⃣  Middlewares globales
app.use(corsOptions);      // sólo UNA vez
app.use(express.json());         // reemplaza a body‑parser en Express 4.16+

/* ----------------------------------------------------------------- */
// 7️⃣  Montar routers con prefijos claros
app.use('/api/estado', estadoRouter);
app.use('/api/clientes',     crearclientesRouter);

// …y así con el resto (máximo ~10 archivos, como comentaste)

/* ----------------------------------------------------------------- */
// 8️⃣  Arrancar el servidor en **un solo puerto**
const PORT = process.env.PORT_ESTADO_SOLI || config.portEstadoSoli || 3045;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  Backend unificado escuchando en http://localhost:${PORT}`);
});
