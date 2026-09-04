import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js';
import axios from "axios";
import {emitirNotificacion} from '../Modulo_Usuario/socketio.js';
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "../Modulo_Usuario/modulo_usuario.js";
import { corsOptions } from "../corsOptions.js";

dotenv.config();

const app = express();
const port = config.portRetroCliente || 3061;

app.use(bodyParser.json());
app.use(corsOptions); 


// 📌 Ruta para que los clientes envíen su calificación sobre un técnico
app.post('/api/desempeno/calificacion', async (req, res) => {
    const { id_soli_completada, codigo_trabajador, id_cliente, calificacion_cliente } = req.body;

    if (!id_soli_completada || !codigo_trabajador || !id_cliente || !calificacion_cliente) {
        return res.status(400).json({ message: "❌ Todos los campos son requeridos." });
    }

    try {
        await pool.query(`
            INSERT INTO retroalimentacion_cliente (id_soli_completada, codigo_trabajador, id_cliente, calificacion_cliente, fecha)
            VALUES ($1, $2, $3, $4, NOW());
        `, [id_soli_completada, codigo_trabajador, id_cliente, calificacion_cliente]);

        res.json({ message: '✅ Calificación guardada correctamente' });

    } catch (error) {
        console.error('❌ Error guardando calificación:', error);
        res.status(500).json({ message: '❌ Error en el servidor al guardar la calificación' });
    }
});

// 📌 Ruta para obtener la calificación de un técnico específico
app.get('/api/desempeno/calificacion/:codigo_trabajador', async (req, res) => {
    const { codigo_trabajador } = req.params;

    try {
        const result = await pool.query(
            `SELECT AVG(calificacion_cliente) AS promedio_calificacion_cliente FROM retroalimentacion_cliente WHERE codigo_trabajador = $1`,
            [codigo_trabajador]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: "❌ No hay calificaciones para este técnico." });
        }
    } catch (error) {
        console.error("❌ Error obteniendo calificaciones:", error);
        res.status(500).json({ error: "❌ Error en el servidor al obtener calificaciones." });
    }
});

// 📌 Ruta para obtener el historial de calificaciones con detalles de técnico y cliente
app.get('/api/desempeno/historial_calificacion', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id_retro_cliente, r.id_soli_completada, r.calificacion_cliente, r.fecha,
            sc.id_soli_completada, sc.codigo_solicitud, sc.comentario_trabajo_realizado, sc.tipo_solucion_falla, sc.herramientas_utilizadas, sc.tiempo_invertido, sc.fecha_caso_cerrado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            t.codigo_trabajador, t.nombre_tecnico, t.apellido_tecnico,
            tk.codigo_ticket, tk.descripcion_servicio, tk.prioridad_solicitud, tk.id_cliente, tk.motivo_visita, tk.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.email_cliente, c.nro_contrato, c.tipo_servicio, c.direccion_cliente, c.fecha_creacion, c.n_tlf_cliente
            FROM retroalimentacion_cliente r
            JOIN solicitud_cerrada_completada sc ON sc.id_soli_completada = r.id_soli_completada
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tecnicos t ON t.codigo_trabajador = s.codigo_trabajador
            JOIN tb_crear_ticket tk ON s.codigo_ticket = tk.codigo_ticket
            JOIN cliente c ON c.id_cliente = tk.id_cliente;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error obteniendo historial de calificaciones:', error);
        res.status(500).send('❌ Error en el servidor al obtener historial de calificaciones');
    }
});

// 📌 Ruta para obtener lista de solicitudes completadas
app.get('/api/desempeno/solicitudes_completadas', async (req, res) => {
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
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Error obteniendo solicitudes:', error);
        res.status(500).json({ error: '❌ Error en el servidor al obtener solicitudes' });
    }
});

// 📌 Ruta para obtener técnicos
app.get('/api/desempeno/tecnicos', async (req, res) => {
  try {
    const activo = true; // o 1, según cómo esté guardado en la DB

    const result = await pool.query(
      `SELECT codigo_trabajador, nombre_tecnico, apellido_tecnico,
              ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla,
              activo, fecha_baja, fecha_creacion_tecnico
       FROM tecnicos
       WHERE activo = $1`,
      [activo]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo lista de técnicos:", error);
    res.status(500).json({ error: "❌ Error en el servidor al obtener técnicos." });
  }
});


// 📌 Ruta para obtener solicitudes completadas por cliente y técnico
app.get('/api/desempeno/getSolicitudByCliente/:idCliente/:codigoTrabajador', async (req, res) => {
    const { idCliente, codigoTrabajador } = req.params;

    try {
        const query = `
            SELECT id_soli_completada 
            FROM solicitud_cerrada_completada 
            WHERE codigo_solicitud IN (
                SELECT codigo_solicitud 
                FROM solicitudes 
                WHERE id_cliente = $1 AND codigo_trabajador = $2
            )
        `;

        const result = await pool.query(query, [idCliente, codigoTrabajador]);

        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({ error: "❌ No hay solicitudes completadas para este cliente y técnico." });
        }
    } catch (error) {
        console.error("❌ Error obteniendo solicitud completada:", error);
        res.status(500).json({ error: "❌ Error en el servidor al obtener la solicitud completada." });
    }
});

// 📌 Ruta para guardar feedback
app.post('/api/desempeno/guardarFeedback', async (req, res) => {
    try {
        const { 
            id_soli_completada,
            codigo_trabajador, 
            id_cliente, 
            correo_feedback_cliente, 
            nombre_apellido_cliente, 
            marca_temporal, 
            calificacion_cliente, 
            comentarios_cliente,
            opinion_cliente 
        } = req.body;



        // Insertar datos en la tabla feedback_tecnico_prueba
        await pool.query(
            `INSERT INTO feedback_tecnico_prueba 
            (id_soli_completada, codigo_trabajador, id_cliente, correo_feedback_cliente, nombre_apellido_cliente, marca_temporal, calificacion_cliente, comentarios_cliente, opinion_cliente, fecha_feedback_prueba)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [
                id_soli_completada,
                codigo_trabajador, 
                id_cliente, 
                correo_feedback_cliente, 
                nombre_apellido_cliente, 
                marca_temporal, 
                calificacion_cliente, 
                comentarios_cliente,
                opinion_cliente
            ]
        );

        res.status(200).json({ mensaje: '✅ Opinión guardada exitosamente.' });

    } catch (error) {
        console.error('❌ Error guardando la opinión:', error);
        res.status(500).json({ error: '❌ Error en el servidor al guardar la opinión del cliente.' });
    }
});

// 📌 Ruta para obtener feedbacks
app.get('/api/desempeno/feedbacks', async (req, res) => {
  const { codigo_trabajador, fecha_inicio, fecha_fin } = req.query;

  try {
    let query = `
      SELECT 
        f.id_feedback, 
        f.codigo_trabajador, 
        f.calificacion_cliente,
        f.comentarios_cliente, 
        f.fecha_feedback_prueba, 
        f.marca_temporal,
        f.correo_feedback_cliente, 
        f.nombre_apellido_cliente,
        f.id_soli_completada, 
        f.id_cliente, 
        f.opinion_cliente,

        tc.codigo_trabajador,
        tc.nombre_tecnico,
        tc.apellido_tecnico,

        s.codigo_solicitud,
        t.codigo_ticket,
        c.nombre_cliente,
        c.apellido_cliente

      FROM feedback_tecnico_prueba f
      JOIN tecnicos tc ON tc.codigo_trabajador = f.codigo_trabajador
      JOIN solicitud_cerrada_completada scc ON scc.id_soli_completada = f.id_soli_completada
      JOIN solicitudes s ON s.codigo_solicitud = scc.codigo_solicitud
      JOIN tb_crear_ticket t ON t.codigo_ticket = s.codigo_ticket
      JOIN cliente c ON c.id_cliente = t.id_cliente
    `;

    const conditions = [];
    const values = [];

    if (codigo_trabajador) {
      values.push(codigo_trabajador);
      conditions.push(`f.codigo_trabajador = $${values.length}`);
    }

    if (fecha_inicio && fecha_fin) {
      values.push(fecha_inicio, fecha_fin);
      conditions.push(`f.fecha_feedback_prueba BETWEEN $${values.length - 1} AND $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY f.fecha_feedback_prueba DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo feedbacks:", error);
    res.status(500).json({ error: "❌ Error en el servidor al obtener feedbacks." });
  }
});


// 📌 Ruta para obtener feedbacks
app.get('/api/desempeno/feedbacks/total', async (req, res) => {


  try {
    let query = `
      SELECT 
        f.id_feedback, 
        f.codigo_trabajador, 
        f.calificacion_cliente,
        f.comentarios_cliente, 
        f.fecha_feedback_prueba, 
        f.marca_temporal,
        f.correo_feedback_cliente, 
        f.nombre_apellido_cliente,
        f.id_soli_completada, 
        f.id_cliente, 
        f.opinion_cliente,

        tc.codigo_trabajador,
        tc.nombre_tecnico,
        tc.apellido_tecnico,
        s.codigo_solicitud,
        t.codigo_ticket


      FROM feedback_tecnico_prueba f
      JOIN tecnicos tc ON tc.codigo_trabajador = f.codigo_trabajador
      LEFT JOIN solicitud_cerrada_completada scc ON scc.id_soli_completada = f.id_soli_completada
      LEFT JOIN solicitudes s ON s.codigo_solicitud = scc.codigo_solicitud
      LEFT JOIN tb_crear_ticket t ON t.codigo_ticket = s.codigo_ticket

    `;

   

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo feedbacks:", error);
    res.status(500).json({ error: "❌ Error en el servidor al obtener feedbacks." });
  }
});



// Suponiendo que ya tienes el pool configurado de pg

app.get('/api/desempeno/feedbacks-sin-evaluacion', async (req, res) => {
  try {
    const query = `
      SELECT 
        f.id_feedback, 
        f.codigo_trabajador, 
        f.calificacion_cliente,
        f.comentarios_cliente, 
        f.fecha_feedback_prueba, 
        f.marca_temporal,
        f.correo_feedback_cliente, 
        f.nombre_apellido_cliente,
        f.id_soli_completada, 
        f.id_cliente AS feedback_id_cliente, 
        f.opinion_cliente,

        tc.codigo_trabajador,
        tc.nombre_tecnico,
        tc.apellido_tecnico,

        scc.id_soli_completada,
        scc.codigo_solicitud,
        s.codigo_solicitud,
        s.codigo_ticket,
        t.codigo_ticket,
        t.id_cliente,
        c.nombre_cliente,
        c.apellido_cliente

      FROM feedback_tecnico_prueba f
      JOIN tecnicos tc ON tc.codigo_trabajador = f.codigo_trabajador

      LEFT JOIN evaluaciones e ON f.id_feedback = e.id_feedback
      LEFT JOIN solicitud_cerrada_completada scc ON scc.id_soli_completada = f.id_soli_completada
      LEFT JOIN solicitudes s ON s.codigo_solicitud = scc.codigo_solicitud
      LEFT JOIN tb_crear_ticket t ON t.codigo_ticket = s.codigo_ticket
      LEFT JOIN cliente c ON c.id_cliente = t.id_cliente

      WHERE e.id_feedback IS NULL
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener feedbacks sin evaluación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Endpoint para obtener evaluaciones sin feedback
app.get('/api/desempeno/evaluaciones/sin-feedback', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM evaluaciones WHERE id_feedback IS NULL');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener evaluaciones sin feedback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



// Ruta para guardar la solicitud esperada
app.post('/api/desempeno/guardarSolicitudEsperada', async (req, res) => {
    const { id_soli_completada, codigo_trabajador, id_cliente, email, nombre_cliente, apellido_cliente } = req.body;

    // Verifica que todos los campos requeridos estén presentes
    if (!id_soli_completada || !codigo_trabajador || !id_cliente || !email || !nombre_cliente || !apellido_cliente) {
        return res.status(400).json({ message: "❌ Todos los campos son requeridos." });
    }

    try {
        // Realiza una solicitud POST a tu Google Apps Script
        const response = await axios.post('https://script.google.com/macros/s/AKfycbytt4iKzPNxLijvNTiIeEQwRawqZdB9BHH4iOXPOVnzBTccycL7dbPl0TKgkC9NaDSr5Q/exec', {
            id_soli_completada,
            codigo_trabajador,
            id_cliente,
            email,
            nombre_cliente, // Enviar nuevo campo
            apellido_cliente // Enviar nuevo campo
        });

        // Devuelve la respuesta de la API de Google Apps Script
        res.json({ message: response.data.message });
    } catch (error) {
        console.error('❌ Error guardando la solicitud:', error);
        res.status(500).json({ message: '❌ Error en el servidor al guardar la solicitud' });
    }
});

// 📌 Ruta para obtener solicitudes pendientes
app.get('/api/desempeno/solicitudes', async (req, res) => {
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
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener solicitudes');
    }
});

app.get('/api/desempeno/evaluadas', async (req, res) => {
    try {
        const query = `
          SELECT e.*, e.calificacion_cliente, e.puntuacion_tecnico, e.fecha_evaluacion_tecnico, s.id_soli_completada, s.codigo_solicitud, s.comentario_trabajo_realizado, s.tipo_solucion_falla, s.herramientas_utilizadas, s.tiempo_invertido, s.fecha_caso_cerrado, 
          sl.codigo_solicitud, sl.codigo_trabajador, sl.id_cliente, sl.codigo_ticket, sl.estado_solicitud, sl.prioridad_solicitud, sl.descripcion_servicio, sl.fecha_solicitud, 
          tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla, tc.fecha_creacion_tecnico,
          t.id_cliente, t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.motivo_visita, t.fecha_creacion,
          c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio
          FROM evaluaciones e
          JOIN solicitud_cerrada_completada s ON e.id_soli_completada = s.id_soli_completada
            JOIN solicitudes sl ON s.codigo_solicitud = sl.codigo_solicitud
            JOIN tb_crear_ticket t ON sl.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN tecnicos tc ON tc.codigo_trabajador = sl.codigo_trabajador

        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener evaluaciones con JOIN');
    }
});

// 📌 Ruta para guardar evaluación
// Route to insert or update evaluation with comentarios_cliente on update
app.post('/api/desempeno/evaluaciones', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('crear_evaluacion'), async (req, res) => {
  const {
    id_soli_completada,
    codigo_trabajador,
    puntuacion_tecnico,
    comentario_puntuacion_tecnico,
    id_feedback,
    calificacion_cliente,
    comentarios_cliente
  } = req.body;

  // 🛂 0. Validación mínima
  if (!id_soli_completada || !codigo_trabajador) {
    return res
      .status(400)
      .json({ message: '❌ id_soli_completada y codigo_trabajador son requeridos.' });
  }

  try {
    // 1️⃣ Buscar si ya existe evaluación para esa solicitud y técnico
    const { rows: evaluacionesPrevias } = await pool.query(
      'SELECT * FROM evaluaciones WHERE id_soli_completada = $1 AND codigo_trabajador = $2',
      [id_soli_completada, codigo_trabajador]
    );

    if (evaluacionesPrevias.length > 0) {
      // 🔄 Existe → actualizar solo feedback
      const oldEval = evaluacionesPrevias[0];

      const updatedCalificacionCliente =
        typeof calificacion_cliente === 'number' && calificacion_cliente > 0
          ? calificacion_cliente
          : oldEval.calificacion_cliente;

      const updatedComentariosCliente =
        typeof comentarios_cliente === 'string' && comentarios_cliente.trim() !== ''
          ? comentarios_cliente
          : oldEval.comentarios_cliente;

      const updatedIdFeedback =
        id_feedback !== undefined ? id_feedback : oldEval.id_feedback;

      const { rows: updated } = await pool.query(
        `UPDATE evaluaciones SET 
           calificacion_cliente = $1,
           comentarios_cliente = $2,
           id_feedback = $3
         WHERE id_soli_completada = $4 AND codigo_trabajador = $5
         RETURNING *`,
        [
          updatedCalificacionCliente,
          updatedComentariosCliente,
          updatedIdFeedback,
          id_soli_completada,
          codigo_trabajador
        ]
      );

      // 🗄️  Registrar notificación en BD
      await pool.query(
        `INSERT INTO notificaciones (
           user_id, tipo, entidad, entidad_id, mensaje, datos_extra
         ) VALUES ($1,$2,$3,$4,$5,$6);`,
        [
          req.user.id,
          'ACTUALIZAR_EVALUACION',
          'evaluaciones',
          `${codigo_ticket}-${codigo_trabajador}`,
          `Se actualizó la evaluación del técnico ${codigo_trabajador}`,
          JSON.stringify({ actualizadoPor: req.user.usuario })
        ]
      );

      // 📡  Emitir en tiempo real
      emitirNotificacion({
        mensaje: `Se actualizó la evaluación del técnico ${codigo_trabajador}`,
        tipo: 'ACTUALIZAR_EVALUACION',
        leida: false,
        fecha: new Date(),
        usuario: req.user.usuario
      });

      return res.status(200).json(updated[0]);
    }

    // ➕ No existe → insertar nueva evaluación
    const { rows: creada } = await pool.query(
      `INSERT INTO evaluaciones (
         id_soli_completada, codigo_trabajador,
         puntuacion_tecnico, comentario_puntuacion_tecnico,
         calificacion_cliente, comentarios_cliente, id_feedback
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        id_soli_completada,
        codigo_trabajador,
        puntuacion_tecnico || 0,
        comentario_puntuacion_tecnico || '',
        calificacion_cliente || null,
        comentarios_cliente || null,
        id_feedback || null
      ]
    );

    // 🗄️  Registrar notificación en BD
    await pool.query(
      `INSERT INTO notificaciones (
         user_id, tipo, entidad, entidad_id, mensaje, datos_extra
       ) VALUES ($1,$2,$3,$4,$5,$6);`,
      [
        req.user.id,
        'CREAR_EVALUACION',
        'evaluaciones',
        `${id_soli_completada}-${codigo_trabajador}`,
        `Se creó una evaluación para el técnico ${codigo_trabajador}`,
        JSON.stringify({ creadoPor: req.user.usuario })
      ]
    );

    // 📡  Emitir en tiempo real
    emitirNotificacion({
      mensaje: `Se creó una evaluación para el técnico ${codigo_trabajador}`,
      tipo: 'CREAR_EVALUACION',
      leida: false,
      fecha: new Date(),
      usuario: req.user.usuario
    });

    return res.status(201).json(creada[0]);
  } catch (error) {
    console.error('Error al guardar la evaluación:', error);
    res.status(500).json({ message: 'Error al guardar la evaluación.' });
  }
});

app.put('/api/desempeno/evaluaciones/:id', async (req, res) => {
    const { id } = req.params; // Obtener el ID de la URL
    const { calificacion_cliente, comentarios_cliente, id_feedback } = req.body;

    try {
        // Verificar si existe la evaluación
        const existingEvaluation = await pool.query(
            'SELECT * FROM evaluaciones WHERE id_evaluaciones = $1',
            [id]
        );

        if (existingEvaluation.rows.length === 0) {
            return res.status(404).json({ message: "❌ Evaluación no encontrada." });
        }

        // Actualizar la evaluación
        const result = await pool.query(
            `UPDATE evaluaciones SET 
                calificacion_cliente = $1,
                comentarios_cliente = $2,
                id_feedback = $3
             WHERE id_evaluaciones = $4
             RETURNING *`,
            [
                calificacion_cliente || existingEvaluation.rows[0].calificacion_cliente,
                comentarios_cliente || existingEvaluation.rows[0].comentarios_cliente,
                id_feedback || existingEvaluation.rows[0].id_feedback,
                id
            ]
        );

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error al actualizar la evaluación:", error);
        res.status(500).json({ message: "Error al actualizar la evaluación." });
    }
});


// Endpoint para actualizar el promedio del técnico
app.put('/api/desempeno/tecnicos/promedio/:codigo_trabajador',  async (req, res) => {
  const { codigo_trabajador } = req.params;
  const { promedio_tecnico } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tecnicos SET promedio_tecnico = $1 WHERE codigo_trabajador = $2',
      [promedio_tecnico, codigo_trabajador]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Promedio actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Técnico no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el promedio' });
  }
});


app.post('/api/desempeno/comentarios-evaluacion', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('crear_evaluacion_cerrada'), async (req, res) => {
  const {
    id_soli_cerrada,
    id_soli_norealizada,
    comentario
  } = req.body;

  if (!comentario || (!id_soli_cerrada && !id_soli_norealizada)) {
    return res.status(400).json({
      message: '❌ El comentario es obligatorio y debe estar vinculado a una solicitud cerrada o no realizada.'
    });
  }

  try {
    let codigo_ticket = '';
    let entidadId = '';
    let valorFK = [null, null];

    if (id_soli_cerrada) {
      // Obtener el código_ticket desde solicitud_cerrada_completada → solicitudes
      const { rows } = await pool.query(
        `SELECT s.codigo_ticket
         FROM solicitudes_cerradas sc
         JOIN solicitudes s ON sc.codigo_solicitud = s.codigo_solicitud
         WHERE sc.id_soli_cerrada = $1`,
        [id_soli_cerrada]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: '❌ No se encontró la solicitud cerrada vinculada.' });
      }

      codigo_ticket = rows[0].codigo_ticket;
      entidadId = id_soli_cerrada;
      valorFK = [id_soli_cerrada, null];

    } else if (id_soli_norealizada) {
      // Obtener el código_ticket desde solicitud_norealizada → solicitudes
      const { rows } = await pool.query(
        `SELECT s.codigo_ticket
         FROM solicitud_no_realizada sn
         JOIN solicitudes s ON sn.codigo_solicitud = s.codigo_solicitud
         WHERE sn.id_soli_norealizada = $1`,
        [id_soli_norealizada]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: '❌ No se encontró la solicitud no realizada vinculada.' });
      }

      codigo_ticket = rows[0].codigo_ticket;
      entidadId = id_soli_norealizada;
      valorFK = [null, id_soli_norealizada];
    }

    // ➕ Insertar comentario
    const { rows: creados } = await pool.query(
      `INSERT INTO comentarios_evaluacion (
         id_soli_cerrada, id_soli_norealizada, comentario
       ) VALUES ($1, $2, $3)
       RETURNING *`,
      [...valorFK, comentario]
    );

    // 🗄️ Notificación en BD
    await pool.query(
      `INSERT INTO notificaciones (
         user_id, tipo, entidad, entidad_id, mensaje, datos_extra
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'CREAR_COMENTARIO_EVALUACION',
        'comentarios_evaluacion',
        entidadId,
        `Nuevo comentario de evaluación sobre el ticket ${codigo_ticket}`,
        JSON.stringify({ creadoPor: req.user.usuario, codigo_ticket })
      ]
    );

    // 📡 Emitir notificación en tiempo real
    emitirNotificacion({
      mensaje: `Nuevo comentario de evaluación sobre el ticket ${codigo_ticket}`,
      tipo: 'CREAR_COMENTARIO_EVALUACION',
      leida: false,
      fecha: new Date(),
      usuario: req.user.usuario
    });

    return res.status(201).json(creados[0]);
  } catch (error) {
    console.error('Error al guardar el comentario de evaluación:', error);
    return res.status(500).json({ message: 'Error al guardar el comentario de evaluación.' });
  }
});

app.get('/api/desempeno/comentarios-evaluacion-lista', autenticarToken, autorizarRoles('Admin', 'Moderador'), async (req, res) => {
  try {
    const query = `
      SELECT 
        ce.id_comentario_evaluacion,
        ce.id_soli_cerrada,
        ce.id_soli_norealizada,
        ce.comentario,
        ce.fecha_comentario,

        -- Datos comunes desde solicitudes
        s.codigo_solicitud,
        s.estado_solicitud,
        s.fecha_solicitud,
        t.codigo_ticket,
        t.prioridad_solicitud,
        t.motivo_visita,
        t.descripcion_servicio,
        sn.id_soli_norealizada, sn.comentario_trabajo_norealizado, sn.motivo_norealizacion, sn.fecha_cierre_norealizado,
        sc.id_soli_cerrada, sc.motivo_cierre, sc.comentarios_tecnico, sc.intentos_resolucion, sc.fecha_cierre,
        -- Cliente
        c.id_cliente,
        c.nombre_cliente,
        c.apellido_cliente,
        c.nro_contrato,

        -- Técnico
        tec.codigo_trabajador,
        tec.nombre_tecnico,
        tec.apellido_tecnico

      FROM comentarios_evaluacion ce

      -- LEFT JOIN con cerradas y no realizadas
      LEFT JOIN solicitudes_cerradas sc ON ce.id_soli_cerrada = sc.id_soli_cerrada
      LEFT JOIN solicitud_no_realizada sn ON ce.id_soli_norealizada = sn.id_soli_norealizada

      -- Unificamos por codigo_solicitud (de sc o sn)
      LEFT JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud OR s.codigo_solicitud = sn.codigo_solicitud

      -- Ticket
      LEFT JOIN tb_crear_ticket t ON t.codigo_ticket = s.codigo_ticket

      -- Cliente
      LEFT JOIN cliente c ON c.id_cliente = s.id_cliente

      -- Técnico
      LEFT JOIN tecnicos tec ON tec.codigo_trabajador = s.codigo_trabajador
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo lista de comentarios de evaluación:', error);
    res.status(500).json({ error: 'Error al obtener las evaluaciones' });
  }
});

// Para solicitudes cerradas
app.get('/api/desempeno/comentarios-evaluacion-lista/cerrada/:id', async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
        ce.id_comentario_evaluacion,
        ce.comentario,
        ce.fecha_comentario,
        sc.id_soli_cerrada,
        sc.motivo_cierre,
        sc.comentarios_tecnico,
        sc.intentos_resolucion,
        sc.fecha_cierre
    FROM comentarios_evaluacion ce
    LEFT JOIN solicitudes_cerradas sc ON ce.id_soli_cerrada = sc.id_soli_cerrada
    WHERE ce.id_soli_cerrada = $1 AND ce.id_soli_norealizada IS NULL
  `;

  try {
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return res.status(404).send('No hay comentarios');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Para solicitudes no realizadas
app.get('/api/desempeno/comentarios-evaluacion-lista/norealizada/:id', async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
        ce.id_comentario_evaluacion,
        ce.comentario,
        ce.fecha_comentario,
        sn.id_soli_norealizada,
        sn.comentario_trabajo_norealizado,
        sn.motivo_norealizacion,
        sn.fecha_cierre_norealizado
    FROM comentarios_evaluacion ce
    LEFT JOIN solicitud_no_realizada sn ON ce.id_soli_norealizada = sn.id_soli_norealizada
    WHERE ce.id_soli_norealizada = $1 AND ce.id_soli_cerrada IS NULL
  `;

  try {
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return res.status(404).send('No hay comentarios');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});




// 🔥 Inicializa el servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
