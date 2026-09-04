import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js';
import axios from "axios";
import { corsOptions } from "../corsOptions.js";


dotenv.config();

const app = express();
const port = config.portSistemaResolucion || 3064;

app.use(bodyParser.json());
app.use(corsOptions); 



// Función para convertir un intervalo a minutos
function intervalToMinutes(interval) {
    const days = interval.days || 0;
    const hours = interval.hours || 0;
    const minutes = interval.minutes || 0;
    const totalMinutes = (days * 24 * 60) + (hours * 60) + minutes;
    return totalMinutes;
}

// 📌 Ruta para obtener solicitudes completadas
app.get('/api/sistemaresolucion/solicitudes_completadas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.id_soli_completada, sc.codigo_solicitud, sc.comentario_trabajo_realizado, sc.tipo_solucion_falla, sc.herramientas_utilizadas, sc.tiempo_invertido, sc.fecha_caso_cerrado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            d.id_datosvisita, h.id_historial_cambioestado,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio
            FROM solicitud_cerrada_completada sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
            JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sc.id_historial_cambioestado;
        `);

        // Formatear el tiempo_invertido a minutos
        const solicitudesFormateadas = result.rows.map(row => ({
            ...row,
            tiempo_invertido: intervalToMinutes(row.tiempo_invertido) // Convertir a minutos
        }));

        res.json(solicitudesFormateadas);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener solicitudes');
    }
});

// Ruta para obtener la lista de técnicos
// Ruta para obtener la lista de técnicos activos
app.get('/api/sistemaresolucion/tecnicos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT codigo_trabajador, nombre_tecnico, apellido_tecnico,
                   ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla,
                   activo, fecha_baja, fecha_creacion_tecnico
            FROM tecnicos
            WHERE activo = true
            ORDER BY fecha_creacion_tecnico DESC;
        `);
        console.log('Resultados de la consulta:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo técnicos:', error);
        res.status(500).send('Error obteniendo técnicos');
    }
});


// Ruta para insertar o actualizar promedios
app.post('/api/sistemaresolucion/promedios', async (req, res) => {
    const { codigo_trabajador, promedio_minutos } = req.body;

    try {
        // Verificar si ya existe un promedio para el técnico
        const existing = await pool.query('SELECT * FROM promedio_tiempo_tecnico WHERE codigo_trabajador = $1', [codigo_trabajador]);

        if (existing.rows.length > 0) {
            // Si existe, actualiza el promedio
            await pool.query('UPDATE promedio_tiempo_tecnico SET promedio_minutos = $1, fecha_actualizacion_promedio_tiempo = NOW() WHERE codigo_trabajador = $2', [promedio_minutos, codigo_trabajador]);
        } else {
            // Si no existe, inserta un nuevo registro
            await pool.query('INSERT INTO promedio_tiempo_tecnico (codigo_trabajador, promedio_minutos) VALUES ($1, $2)', [codigo_trabajador, promedio_minutos]);
        }

        res.status(200).send('Promedio actualizado correctamente');
    } catch (error) {
        console.error('Error al insertar/actualizar promedio:', error);
        res.status(500).send('Error al insertar/actualizar promedio');
    }
});

app.get('/api/sistemaresolucion/motivo_vs_falla', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
  t.motivo_visita,
  sc.tipo_solucion_falla,
  COUNT(*) AS total
FROM solicitud_cerrada_completada sc
JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
GROUP BY t.motivo_visita, sc.tipo_solucion_falla
ORDER BY t.motivo_visita, total DESC;

    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener motivo vs falla:', error);
    res.status(500).send('Error al procesar motivo_vs_falla');
  }
});

app.get('/api/sistemaresolucion/comparativa_tiempos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sc.codigo_solicitud,
        sc.tiempo_invertido,
        t.descripcion_servicio
      FROM solicitud_cerrada_completada sc
      JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
      JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket;
    `);

    const TIEMPO_ESTANDAR_MIN = 120;

    const comparativa = result.rows.map(row => {
      const tiempo_real_min = intervalToMinutes(row.tiempo_invertido);

      return {
        codigo_solicitud: row.codigo_solicitud,
        descripcion_servicio: row.descripcion_servicio,
        tiempo_real_minutos: tiempo_real_min,
        tiempo_estandar_minutos: TIEMPO_ESTANDAR_MIN,
        diferencia: tiempo_real_min - TIEMPO_ESTANDAR_MIN,
        estado_comparacion:
          tiempo_real_min > TIEMPO_ESTANDAR_MIN ? 'superado' :
          tiempo_real_min < TIEMPO_ESTANDAR_MIN ? 'menor' : 'igual'
      };
    });

    res.json(comparativa);
  } catch (error) {
    console.error('Error al obtener comparativa de tiempos:', error);
    res.status(500).send('Error al procesar comparativa');
  }
});

// ➕  agrega esto a tu servidor Express (mismo archivo donde están las otras rutas)

app.get('/api/sistemaresolucion/porcentaje_pendientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE s.estado_solicitud = 'pendiente')  AS pendientes,
        COUNT(*)                                               AS total
      FROM solicitud_cerrada_completada sc
      JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud;
    `);

    const { pendientes, total } = result.rows[0];

    const porcentaje = total > 0
      ? (pendientes / total * 100).toFixed(2)
      : '0.00';

    res.json({ porcentaje });
  } catch (err) {
    console.error('Error porcentaje pendientes:', err);
    res.status(500).send('Error al calcular porcentaje');
  }
});


// 🔥 Inicializa el servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
