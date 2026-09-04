// tecnicoRoutes.js
import express from 'express';
import { pool } from '../../bd/serverPGSQL.js';// Asegúrate de que la ruta sea correcta
import { authenticateToken,
  authorizeRoles } from './autorizacion.js'; // Importa tus middlewares

const router = express.Router();

// Ruta para obtener la lista de solicitudes asignadas a técnicos
router.get('/solicitudAsigTec', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
    const { tipo_usuario, codigo_trabajador } = req.user; // Extraer información del usuario

   try {
           let result;
           if (tipo_usuario === 'Tecnico') {
               // Los técnicos solo ven las solicitudes asignadas a ellos
               result = await pool.query(`
                   SELECT s.codigo_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.estado_solicitud, s.fecha_solicitud
                   FROM solicitudes s
                   JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
                   WHERE s.codigo_trabajador = $1 AND s.estado_solicitud != 'Completado' AND s.estado_solicitud != 'No Realizado';
               `, [codigo_trabajador]);
               console.log('Resultados de la consulta:', result.rows);
           } else {
               return res.status(403).json({ message: 'No autorizado' }); // Manejo de roles no válidos
           }
           res.json(result.rows); // Devolver las solicitudes encontradas
           console.log('codigo del trabajador:', codigo_trabajador);
       } catch (error) {
           console.error('Error obteniendo solicitudes:', error);
           res.status(500).send('Error obteniendo solicitudes');
       }
   });

   // Nueva ruta para obtener los detalles de una solicitud por ID
   router.get('/solicitudAsigTec/:id', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       const solicitudAsigId = req.params.id;
       try {
           const result = await pool.query(`
               SELECT s.codigo_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.estado_solicitud, s.fecha_solicitud
               FROM solicitudes s
               JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
               WHERE s.codigo_solicitud = $1;
           `, [solicitudAsigId]);
           
           if (result.rows.length > 0) {
               res.json(result.rows[0]);
           } else {
               res.status(404).send('Solicitud no encontrada');
           }
       } catch (error) {
           console.error('Error obteniendo la solicitud:', error);
           res.status(500).send('Error obteniendo la solicitud');
       }
   });

   // Ruta para actualizar el estado de la solicitud
   router.post('/actualizarEstado', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       const { codigo_solicitud, estado_solicitud, razon_cambioestado } = req.body; // Asegúrate de recibir la razón
   
       try {
           // Actualizar el estado de la solicitud
           const result = await pool.query(`
               UPDATE solicitudes
               SET estado_solicitud = $1
               WHERE codigo_solicitud = $2
               RETURNING *;
           `, [estado_solicitud, codigo_solicitud]);
   
           if (result.rows.length === 0) {
               return res.status(404).json({ message: 'Solicitud no encontrada' });
           }
   
           // Registrar en el historial
           await pool.query(`
               INSERT INTO historial_cambioestado_solicitudes (codigo_solicitud, estado_solicitud, razon_cambioestado)
               VALUES ($1, $2, $3);
           `, [codigo_solicitud, estado_solicitud, razon_cambioestado]);
   
           res.json({ message: 'Estado de la solicitud actualizado correctamente', solicitud: result.rows[0] });
       } catch (error) {
           console.error('Error al actualizar el estado de la solicitud:', error);
           res.status(500).json({ message: 'Error al actualizar el estado de la solicitud' });
       }
   });
   
   router.get('/historial/:codigo_solicitud', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       const { codigo_solicitud } = req.params;
       try {
           const result = await pool.query(`
               SELECT * FROM historial_cambioestado_solicitudes
               WHERE codigo_solicitud = $1
               ORDER BY fecha_historial_cambioestado DESC;
           `, [codigo_solicitud]);
   
           res.json(result.rows);
       } catch (error) {
           console.error('Error al obtener el historial:', error);
           res.status(500).json({ message: 'Error al obtener el historial' });
       }
   });
   
   
   router.post('/datosvisita', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       const { codigo_solicitud, dias_disponibles,  comentario_datosvisita} = req.body;
   
       try {
           const result = await pool.query(`
               INSERT INTO datos_visita_cliente (codigo_solicitud, dias_disponibles, comentario_datosvisita)
               VALUES ($1, $2, $3)
               RETURNING id_datosvisita;
           `, [ codigo_solicitud, dias_disponibles, comentario_datosvisita]);
   
           res.status(201).json(result.rows[0]);
       } catch (error) {
           console.error('Error al registrar los datos de visita:', error);
           res.status(500).json({ message: 'Error al registrar los datos' });
       }
   });
   
   router.get('/visitas', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       try {
           const result = await pool.query('SELECT * FROM datos_visita_cliente');
           res.json(result.rows);
       } catch (err) {
           res.status(500).json({ error: err.message });
       }
   });

   router.get('/datosdeVisitas/:codigo_solicitud', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       const { codigo_solicitud } = req.params;
   
       try {
           // Consulta individual para obtener datos de visita
           const datosVisita = await pool.query(`
               SELECT d.id_datosvisita, d.dias_disponibles, s.codigo_solicitud, d.fecha_datovisita, d.comentario_datosvisita
               FROM datos_visita_cliente d
               JOIN solicitudes s ON d.codigo_solicitud = s.codigo_solicitud
               WHERE s.codigo_solicitud = $1;
           `, [codigo_solicitud]);
   
           // Verificar si se encontraron datos
           if (datosVisita.rows.length === 0) {
               // Si no hay datos, devolver un array vacío
               return res.status(200).json([]); // O puedes devolver un objeto vacío {}
           }
   
           // Si hay datos, devolver el primer registro
           res.status(200).json(datosVisita.rows[0]);
       } catch (error) {
           console.error('Error al obtener los datos completos:', error);
           res.status(500).json({ message: 'Error al obtener los datos completos.' });
       }
   });
   
   
   router.get('/historial/todos/:codigo_solicitud', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       const { codigo_solicitud } = req.params;
       try {
           const result = await pool.query(`
               SELECT * FROM historial_cambioestado_solicitudes
               WHERE codigo_solicitud = $1
               ORDER BY fecha_historial_cambioestado DESC;
           `, [codigo_solicitud]);
   
           res.json(result.rows);
       } catch (error) {
           console.error('Error al obtener el historial:', error);
           res.status(500).json({ message: 'Error al obtener el historial' });
       }
   });
   
   router.post('/guardarsolicitudcompleta', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       console.log('Datos recibidos:', req.body);
   
       const {codigo_solicitud, estado_solicitud, id_historial_cambioestado, id_datosvisita, tipo_solucion_falla, comentario_trabajo_realizado} = req.body;
       
   
       try{
           const result = await pool.query(`
           INSERT INTO solicitud_cerrada_completada (codigo_solicitud, estado_solicitud, id_historial_cambioestado, id_datosvisita, tipo_solucion_falla, comentario_trabajo_realizado)
           VALUES ( $1, $2, $3, $4, $5, $6)
           RETURNING *;
           `, [codigo_solicitud, estado_solicitud, id_historial_cambioestado, id_datosvisita, tipo_solucion_falla, comentario_trabajo_realizado]);
       
           res.status(201).json({message: 'Datos Guardados corectamente en solicitud_cerrada_completada', solicitud_cerrada_completada: result.rows[0] });
   
      
       }catch (error){
           console.error('Error al guardar la solicitud completa:', error);
           res.status(500).json({ message: 'Error al guardar la solicitud completa.'});
       }
   });
   
   router.post('/guardarsolicitudnorealizada', authenticateToken, authorizeRoles('Tecnico'), async (req, res) => {
       console.log('Datos recibidos:', req.body);
   
       const {codigo_solicitud, estado_solicitud, id_historial_cambioestado, motivo_norealizacion, comentario_trabajo_norealizado} = req.body;
       
   
       try{
           const result = await pool.query(`
           INSERT INTO solicitud_no_realizada (codigo_solicitud, estado_solicitud, id_historial_cambioestado, motivo_norealizacion, comentario_trabajo_norealizado)
           VALUES ( $1, $2, $3, $4, $5)
           RETURNING *;
           `, [codigo_solicitud, estado_solicitud, id_historial_cambioestado, motivo_norealizacion, comentario_trabajo_norealizado]);
       
           res.status(201).json({message: 'Datos Guardados corectamente en solicitud_no_realizada', solicitud_no_realizada: result.rows[0] });
   
      
       }catch (error){
           console.error('Error al guardar la solicitud completa:', error);
           res.status(500).json({ message: 'Error al guardar la solicitud completa.'});
       }
   });
   

export default router;
