import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "../Modulo_Usuario/modulo_usuario.js";
import {emitirNotificacion} from '../Modulo_Usuario/socketio.js';
import { configurarSocket } from '../Modulo_Usuario/socketio.js';
import { corsOptions } from "../corsOptions.js";


// Cargar variables de entorno al inicio
dotenv.config();

console.log(config.dbHost); // localhost
console.log(config.dbUser); // root
console.log(config.dbPass); // s1mpl3
console.log(config.portCreateTickets); // 3031
console.log(config.portAssignTickets); // 3032
console.log(config.portCrearCliente);

const getLanguages = async () => {
    try {
        const result = await pool.query("SELECT codigo_ticket, descripcion_servicio, prioridad_solicitud, id_cliente, motivo_visita, fecha_creacion FROM tb_crear_ticket;");
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const port = config.portCreateTickets || 3039;

import http from 'http';
const servidorHttp = http.createServer(app);

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(corsOptions); 
configurarSocket(servidorHttp);





// Ruta para manejar la solicitud POST del formulario
app.post('/api/posgre/submit', autenticarToken, async (req, res) => {
  const { descripcion_servicio, prioridad_solicitud, id_cliente, motivo_visita } = req.body;

  try {
    // 🛡️ 1. Verificar que el cliente exista y esté activo
    const { rowCount: clienteExiste } = await pool.query(
      "SELECT 1 FROM cliente WHERE id_cliente = $1 AND activo = TRUE;",
      [id_cliente]
    );

    if (!clienteExiste) {
      return res.status(400).json({ msg: "El cliente no existe o está inactivo" });
    }

    // ✅ 2. Insertar el ticket
    const insertResult = await pool.query(
      "INSERT INTO tb_crear_ticket (descripcion_servicio, prioridad_solicitud, id_cliente, motivo_visita) VALUES ($1, $2, $3, $4) RETURNING codigo_ticket",
      [descripcion_servicio, prioridad_solicitud, id_cliente, motivo_visita]
    );

    const nuevoCodigoTicket = insertResult.rows[0].codigo_ticket;

    // 📩 3. Guardar notificación en la BD
    await pool.query(
      `INSERT INTO notificaciones (
        user_id,
        tipo,
        entidad,
        entidad_id,
        mensaje,
        datos_extra
      ) VALUES ($1, $2, $3, $4, $5, $6);`,
      [
        req.user.id,
        'CREAR_TICKET',
        'tb_crear_ticket',
        nuevoCodigoTicket,
        `Se creó un nuevo ticket para el cliente con ID ${id_cliente}`,
        JSON.stringify({ creadoPor: req.user.usuario })
      ]
    );

    // 📡 4. Emitir notificación en tiempo real
    emitirNotificacion({
      mensaje: `Se creó un nuevo ticket para el cliente con ID ${id_cliente}`,
      tipo: 'CREAR_TICKET',
      leida: false,
      fecha: new Date(),
      usuario: req.user.usuario
    });

    

    res.json({ message: 'Datos insertados correctamente', codigo_ticket: nuevoCodigoTicket });
  } catch (error) {
    console.error('Error insertando datos:', error);
    res.status(500).send('Error insertando datos');
  }
});



servidorHttp.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

app.get('/submit', (req, res) => {
    res.send('Esta ruta maneja solicitudes GET');
});

getLanguages();