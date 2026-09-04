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
console.log(config.portCrearTecnico);

const getLanguages = async () => {
    try {
        const result = await pool.query("SELECT codigo_trabajador, nombre_tecnico, apellido_tecnico, ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla, fecha_creacion_tecnico FROM tecnicos;");
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const port = config.portCrearTecnico || 3037;

app.use(bodyParser.json());
app.use(corsOptions); 


app.post('/api/ctecnico/creartecnicos', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('crear_tecnicos'), async (req, res) => {
    const { nombre_tecnico, apellido_tecnico, ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla } = req.body;
    console.log('Datos recibidos:', req.body);
    try {
        const result = await pool.query(
            `INSERT INTO tecnicos (nombre_tecnico, apellido_tecnico, ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING codigo_trabajador;`,
            [nombre_tecnico, apellido_tecnico, ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla]
        );

        if (result.rows.length === 0) {
            return res.status(500).json({ message: 'Error insertando datos' });
        }

        const nuevoCodigoTecnico = result.rows[0].codigo_trabajador;

        // Guardar notificación en la base de datos
        await pool.query(
          `INSERT INTO notificaciones (
            user_id, tipo, entidad, entidad_id, mensaje, datos_extra
          ) VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            req.user.id,
            'CREAR_TECNICO',
            'tecnicos',
            nuevoCodigoTecnico,
            `Se creó el técnico ${nombre_tecnico} ${apellido_tecnico}`,
            JSON.stringify({ creadoPor: req.user.usuario })
          ]
        );

        // Emitir notificación en tiempo real
        emitirNotificacion({
          mensaje: `Se creó el técnico ${nombre_tecnico} ${apellido_tecnico}`,
          tipo: 'CREAR_TECNICO',
          leida: false,
          fecha: new Date(),
          usuario: req.user.usuario
        });

        console.log('Filas insertadas:', result.rowCount);
        res.json({ message: 'Datos insertados correctamente', codigo_trabajador: nuevoCodigoTecnico });
    } catch (error) {
        console.error('Error insertando datos:', error);
        res.status(500).send('Error insertando datos');
    }
});




app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

app.get('/submit', (req, res) => {
    res.send('Esta ruta maneja solicitudes GET');
});

getLanguages();