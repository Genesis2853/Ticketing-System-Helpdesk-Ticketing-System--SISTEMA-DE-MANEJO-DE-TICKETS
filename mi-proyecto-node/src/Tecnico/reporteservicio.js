import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require

// Cargar variables de entorno al inicio
dotenv.config();

const app = express();
const port = config.portReporteServicio || 3053;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(cors());


app.get('/api/reportessolicitudescompletas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rc.id_reporte_serv, rc.tipo_solucion_falla, rc.herramientas_utilizadas, rc.solucion_efectuada, rc.tiempo_invertido, rc.fecha_creacion_reporte, rc.id_soli_completada, rc.estado_solicitud,
            sc.id_soli_completada, sc.comentario_trabajo_realizado, sc.tipo_solucion_falla, sc.fecha_caso_cerrado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio
            FROM reporte_servicio rc
            JOIN solicitud_cerrada_completada sc ON sc.id_soli_completada = rc.id_soli_completada
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});

app.get('/api/reportessolicitudesnorealizadas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rr.id_reporte_serv_norealizado, rr.fecha_creacion_reporte_norealizado, rr.motivo_norealizacion, rr.comentario_trabajo_norealizado, rr.id_soli_norealizada, rr.estado_solicitud,
            sn.id_soli_norealizada, sn.comentario_trabajo_norealizado, sn.motivo_norealizacion, sn.fecha_cierre_norealizado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio
            FROM reporte_servicio_norealizado rr
            JOIN solicitud_no_realizada sn ON sn.id_soli_norealizada = rr.id_soli_norealizada
            JOIN solicitudes s ON s.codigo_solicitud = sn.codigo_solicitud  -- Cambié sc por sn
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});





app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

