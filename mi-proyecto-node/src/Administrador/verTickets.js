import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "../Modulo_Usuario/modulo_usuario.js";
import { corsOptions } from "../corsOptions.js";


// Cargar variables de entorno al inicio
dotenv.config();

console.log(config.dbHost); // localhost
console.log(config.dbUser); // root
console.log(config.dbPass); // s1mpl3
console.log(config.portCreateTickets); // 3031
console.log(config.portVerTickets); // 3036


const getLanguages = async () => {
    try {
        const result = await pool.query("SELECT id_cliente, nro_contrato, nombre_cliente, apellido_cliente, n_tlf_cliente, email_cliente, fecha_creacion, direccion_cliente, tipo_servicio FROM cliente;");
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const port = config.portVerTickets || 3036;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(corsOptions); 



// Ruta para obtener la lista de solicitudes
app.get('/api/verti/vertickets', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('ver_tickets'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.nro_contrato
            FROM tb_crear_ticket t
            JOIN cliente c ON t.id_cliente = c.id_cliente
            WHERE t.codigo_ticket NOT IN (SELECT s.codigo_ticket FROM solicitudes s);
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});

app.get(
  '/api/verti/vertickets/total',
  autenticarToken,
  autorizarRoles('Admin', 'Moderador'),
  autorizarPorPermiso('ver_tickets'),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          t.codigo_ticket,
          t.descripcion_servicio,
          t.prioridad_solicitud,
          t.id_cliente,
          t.motivo_visita,
          t.fecha_creacion,
          c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.nro_contrato
        FROM tb_crear_ticket t
        JOIN cliente c ON t.id_cliente = c.id_cliente;
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error obteniendo tickets:', error);
      res.status(500).send('Error obteniendo tickets');
    }
  }
);




// Nueva ruta para obtener los detalles de un ticket por ID
app.get('/api/verti/vertickets/:id',  async (req, res) => {
    const ticketId = req.params.id;
    try {
        const result = await pool.query(`
            SELECT t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.nro_contrato
            FROM tb_crear_ticket t
            JOIN cliente c ON t.id_cliente = c.id_cliente
            WHERE t.codigo_ticket = $1;
        `, [ticketId]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Ticket no encontrada');
        }
    } catch (error) {
        console.error('Error obteniendo el ticket:', error);
        res.status(500).send('Error obteniendo el ticket');
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

getLanguages();