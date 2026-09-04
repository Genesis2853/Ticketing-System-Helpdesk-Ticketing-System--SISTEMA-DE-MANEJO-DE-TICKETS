import { pool } from "./bd/serverPGSQL.js";
import express from "express";
import bodyParser from "body-parser";

const getLanguage2 = async() => {
    try{
        const result= await pool.query("SELECT id, nombre, tlf FROM ejemplo;");
        console.log(result);
    }catch(error){
        console.error(error);
    }
};

const app = express();
const port = 3030;

app.use(bodyParser.json());

app.post('/submit', async (req,res) => {
    const {nombre, telefono} = req.body;
    try{
        const result = await pool.query(
            "INSERT INTO ejemplo (nombre, tlf)" + "VALUES ($1, $2);", [nombre, telefono]
        );
        console.log(result.rowCount);
        res.send('Datos insertados correctamente');
    }catch(error) {
        console.error('Error insertando datos:', error);
        res.send('Error insertando datos');
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

app.get('/submit', (req, res) => {
    res.send('Esta ruta maneja solicitudes GET');
  });

getLanguage2();