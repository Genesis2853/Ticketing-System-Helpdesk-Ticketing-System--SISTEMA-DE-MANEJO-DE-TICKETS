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
console.log(config.portVerTecnico); // 3038


const getLanguages = async () => {
    try {
        const result = await pool.query("SELECT id_cliente, nombre_cliente, apellido_cliente, n_tlf_cliente, email_cliente, fecha_creacion, nro_contrato, direccion_cliente, tipo_servicio FROM cliente;");
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const port = config.portVerTecnico || 3038;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(corsOptions); 

// Ruta para obtener la lista de clientes
// GET /api/tecnicos  ó /api/tecnicos?inactivos=true
app.get(
  '/api/tecver/tecnicos',
  autenticarToken,
  autorizarRoles('Admin', 'Moderador'),
  autorizarPorPermiso('ver_tecnicos'),
  async (req, res) => {
    const showTrash = req.query.inactivos === 'true';      // 👈
    try {
      const { rows } = await pool.query(
        `
        SELECT  codigo_trabajador, nombre_tecnico, apellido_tecnico,
                ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla,
                activo, fecha_baja, fecha_creacion_tecnico
        FROM    tecnicos
        WHERE   activo = $1
        ORDER BY fecha_creacion_tecnico DESC;
        `,
        [!showTrash]        // TRUE → activos, FALSE → papelera
      );
      res.json(rows);
    } catch (err) {
      console.error('Error obteniendo técnicos:', err);
      res.status(500).send('Error obteniendo técnicos');
    }
  }
);


// Ruta para obtener los detalles de un cliente por ID
app.get('/api/tecver/tecnicos/:id', async (req, res) => {
    const tecnicoId = req.params.id;
    try {
        const result = await pool.query(`
            SELECT codigo_trabajador, nombre_tecnico, apellido_tecnico, ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla, fecha_creacion_tecnico
            FROM tecnicos
            WHERE codigo_trabajador = $1;
        `, [tecnicoId]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Cliente no encontrado');
        }
    } catch (error) {
        console.error(`Error obteniendo el cliente con ID ${tecnicoId}:`, error);
        res.status(500).send('Error obteniendo el cliente');
    }
});

// Soft delete técnico
app.put('/api/tecver/tecnicos/delete/:id', autenticarToken, autorizarRoles('Admin'), autorizarPorPermiso('eliminar_tecnicos'), async (req, res) => {
  const tecnicoId = req.params.id;

  try {
    const result = await pool.query(`
      UPDATE tecnicos
SET activo = FALSE,
    fecha_baja = NOW()
WHERE codigo_trabajador = $1
 RETURNING *;
    `, [tecnicoId]);

    if (result.rowCount === 0) {
      return res.status(404).send('Técnico no encontrado');
    }

    res.json({ message: 'Técnico desactivado correctamente', tecnico: result.rows[0] });
  } catch (error) {
    console.error('Error al desactivar técnico:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.put('/api/tecver/tecnicos/restore/:id', autenticarToken, autorizarRoles('Admin'), autorizarPorPermiso('restaurar_tecnicos'), async (req, res) => {
  const tecnicoId = req.params.id;

  try {
    const result = await pool.query(`
      UPDATE tecnicos
      SET activo = TRUE,
          fecha_baja = NULL
      WHERE codigo_trabajador = $1
      RETURNING *;
    `, [tecnicoId]);

    if (result.rowCount === 0) {
      return res.status(404).send('Técnico no encontrado');
    }

    res.json({ message: 'Técnico restaurado correctamente', tecnico: result.rows[0] });
  } catch (error) {
    console.error('Error al restaurar técnico:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// PATCH /api/tecnicos/editar/:id
app.patch(
  '/api/tecver/tecnicos/editar/:id',
  autenticarToken,
  autorizarRoles('Admin', 'Moderador'),
  autorizarPorPermiso('editar_tecnicos'),
  async (req, res) => {
    const { id } = req.params;
    const {
      nombre_tecnico,
      apellido_tecnico,
      ci_tecnico,
      n_tlf_tecnico,
      email_tecnico,
      cuadrilla
    } = req.body;

    try {
      // 1️⃣ Comprobar cédula duplicada (excepto el mismo registro)
      const { rows: rep } = await pool.query(
        `SELECT 1 FROM tecnicos WHERE ci_tecnico = $1 AND codigo_trabajador <> $2`,
        [ci_tecnico, id]
      );
      if (rep.length) {
        return res.status(409).json({ msg: 'Esa cédula ya pertenece a otro técnico' });
      }

      // 2️⃣ Actualizar
      const { rowCount } = await pool.query(
        `
        UPDATE tecnicos
           SET nombre_tecnico   = $1,
               apellido_tecnico = $2,
               ci_tecnico       = $3,
               n_tlf_tecnico    = $4,
               email_tecnico    = $5,
               cuadrilla        = $6
         WHERE codigo_trabajador = $7
           AND activo = TRUE;
        `,
        [
          nombre_tecnico,
          apellido_tecnico,
          ci_tecnico,
          n_tlf_tecnico,
          email_tecnico,
          cuadrilla,
          id
        ]
      );

      if (!rowCount) return res.status(404).json({ msg: 'Técnico no encontrado o inactivo' });
      res.json({ msg: 'Técnico actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error actualizando técnico');
    }
  }
);




app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

getLanguages();