import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js';
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "../Modulo_Usuario/modulo_usuario.js";
import {emitirNotificacion} from '../Modulo_Usuario/socketio.js';
import { corsOptions } from "../corsOptions.js";


dotenv.config();

console.log(config.dbHost);
console.log(config.dbUser);
console.log(config.dbPass);
console.log(config.portCreateTickets);
console.log(config.portAssignTickets);
console.log(config.portCrearCliente);

const getLanguages = async () => {
    try {
        const result = await pool.query("SELECT id_cliente, nro_contrato, nombre_cliente, apellido_cliente, n_tlf_cliente, email_cliente, fecha_creacion, direccion_cliente, tipo_servicio FROM cliente;");
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const port = config.portCrearCliente || 3034;

app.use(bodyParser.json());
app.use(corsOptions); 


app.post('/api/clientes/crearclientes', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('crear_clientes'), async (req, res) => {
  const {
    nombre_cliente,
    apellido_cliente,
    n_tlf_cliente,
    email_cliente,
    nro_contrato,
    direccion_cliente,
    tipo_servicio
  } = req.body;

  console.log('Datos recibidos:', req.body);
  try {
    const result = await pool.query(
      `INSERT INTO cliente (
        nombre_cliente, apellido_cliente, n_tlf_cliente,
        email_cliente, nro_contrato, direccion_cliente, tipo_servicio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_cliente;`,
      [nombre_cliente, apellido_cliente, n_tlf_cliente, email_cliente, nro_contrato, direccion_cliente, tipo_servicio]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ message: 'Error insertando datos' });
    }

    const nuevoCodigoCliente = result.rows[0].id_cliente;

    // 👉 Insertar la notificación
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
        req.user.id, // quien ejecutó la acción
        'CREAR_CLIENTE',
        'cliente',
        nuevoCodigoCliente,
        `Se creó el cliente ${nombre_cliente} ${apellido_cliente}`,
        JSON.stringify({ creadoPor: req.user.usuario }) // info adicional opcional
      ]
    );
    // ✅ Justo después de guardar la notificación en la base de datos:
emitirNotificacion({
  mensaje: `Se creó el cliente ${nombre_cliente} ${apellido_cliente}`,
  tipo: 'CREAR_CLIENTE',
  leida: false,
  fecha: new Date(),
  usuario: req.user.usuario
});

    console.log('Filas insertadas:', result.rowCount);
    res.json({ message: 'Cliente creado correctamente', id_cliente: nuevoCodigoCliente });
  } catch (error) {
    console.error('Error insertando datos:', error);
    res.status(500).send('Error insertando datos');
  }
});
 
app.get('/api/clientes/validar-contrato', async (req, res) => {
  const { nro_contrato } = req.query;

  try {
    const result = await pool.query(
      'SELECT 1 FROM cliente WHERE nro_contrato = $1 LIMIT 1',
      [nro_contrato]
    );

    res.json({ existe: result.rowCount > 0 });
  } catch (error) {
    console.error('Error validando contrato:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

app.get('/submit', (req, res) => {
    res.send('Esta ruta maneja solicitudes GET');
});

getLanguages();