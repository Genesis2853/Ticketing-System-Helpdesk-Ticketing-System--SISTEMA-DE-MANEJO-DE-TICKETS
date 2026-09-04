import express from 'express';
import bodyParser from 'body-parser';
import { pool } from "./bd/serverPGSQL.js";

const app = express();
const port = 3000;



// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());

// Ruta para manejar la solicitud POST del formulario
app.post('/submit', async (req, res) => {
    const { codigo, nombre, apellido, cedula, telefono, email, mensaje, prioridad } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tb_crear_ticket (codigo_ticket, nombre_cliente, apellido_cliente, CI_cliente, N_tlf_cliente, email_cliente, descripcion_servicio, prioridad_solicitud) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [codigo, nombre, apellido, cedula, telefono, email, mensaje, prioridad]
        );
        res.send('Datos insertados correctamente');
    } catch (error) {
        console.error('Error insertando datos:', error);
        res.send('Error insertando datos');
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});