// routes/verClienteServer.js (o como lo tengas)

import { pool } from "../bd/serverPGSQL.js";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import config from "../config.js";
import {
  autenticarToken,
  autorizarRoles,
  autorizarPorPermiso,
} from "../Modulo_Usuario/modulo_usuario.js";
import { corsOptions } from "../corsOptions.js";

dotenv.config();

const app = express();
const port = config.portVerCliente || 3035;

/* ------------ Middleware global ------------ */
app.use(bodyParser.json());
app.use(corsOptions); 

/* ===========================================================
   RUTAS CLIENTES
   =========================================================== */

/* ---------- 1. LISTAR ACTIVOS / INACTIVOS ---------- */
// Ej.: GET /api/vercliente           -> activos
//       GET /api/vercliente?inactivos=true  -> papelera
app.get(
  "/api/cliver/vercliente",
  autenticarToken,
  autorizarRoles("Admin", "Moderador", "Tecnico"),
  autorizarPorPermiso("ver_clientes"),
  async (req, res) => {
    res.header("Content-Type", "application/json");
    const showTrash = req.query.inactivos === "true"; // ?inactivos=true
    try {
      const { rows } = await pool.query(
        `
        SELECT id_cliente, nombre_cliente, apellido_cliente, n_tlf_cliente,
               email_cliente, fecha_creacion, nro_contrato, direccion_cliente,
               tipo_servicio, activo, fecha_baja
        FROM cliente
        WHERE activo = $1
        ORDER BY fecha_creacion DESC;
        `,
        [!showTrash] // TRUE => activos, FALSE => papelera
      );
      res.json(rows);
    } catch (error) {
      console.error("Error obteniendo clientes:", error);
      res.status(500).send("Error obteniendo clientes");
    }
  }
);

/* ---------- 2. DETALLE POR ID ---------- */
app.get("/api/cliver/vercliente/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `
      SELECT id_cliente, nombre_cliente, apellido_cliente, n_tlf_cliente,
             email_cliente, fecha_creacion, nro_contrato, direccion_cliente,
             tipo_servicio, activo, fecha_baja
      FROM cliente
      WHERE id_cliente = $1;
      `,
      [id]
    );
    if (!rows.length) return res.status(404).send("Cliente no encontrado");
    res.json(rows[0]);
  } catch (error) {
    console.error(`Error obteniendo el cliente con ID ${id}:`, error);
    res.status(500).send("Error obteniendo el cliente");
  }
});

/* ---------- 3. SOFT-DELETE (mueve a papelera) ---------- */
// DELETE /api/vercliente/eliminar/:id
app.delete(
  "/api/cliver/vercliente/eliminar/:id",
  autenticarToken,
  autorizarRoles("Admin"),
  autorizarPorPermiso("eliminar_clientes"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { rowCount } = await pool.query(
        `
        UPDATE cliente
           SET activo = FALSE,
               fecha_baja = NOW()
         WHERE id_cliente = $1
           AND activo = TRUE
        RETURNING id_cliente;
        `,
        [id]
      );
      if (!rowCount)
        return res
          .status(404)
          .json({ msg: "Cliente no encontrado o ya inactivo" });
      res.json({ msg: "Cliente enviado a la papelera" });
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
      res.status(500).send("Error al eliminar el cliente");
    }
  }
);

/* ---------- 4. RESTAURAR ---------- */
// PATCH /api/vercliente/restaurar/:id
app.patch(
  "/api/cliver/vercliente/restaurar/:id",
  autenticarToken,
  autorizarRoles("Admin"),
  autorizarPorPermiso("eliminar_clientes"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const { rowCount } = await pool.query(
        `
        UPDATE cliente
           SET activo = TRUE,
               fecha_baja = NULL
         WHERE id_cliente = $1
           AND activo = FALSE;
        `,
        [id]
      );
      if (!rowCount)
        return res
          .status(404)
          .json({ msg: "Cliente no encontrado o ya activo" });
      res.json({ msg: "Cliente restaurado" });
    } catch (error) {
      console.error("Error al restaurar el cliente:", error);
      res.status(500).send("Error al restaurar el cliente");
    }
  }
);

/* ---------- 5. EDITAR (UPDATE) ---------- */
// PATCH /api/vercliente/editar/:id
app.patch(
  "/api/cliver/vercliente/editar/:id",
  autenticarToken,
  autorizarRoles("Admin", "Moderador"),
  autorizarPorPermiso("editar_clientes"),          // ⬅️ crea este permiso en tu sistema
  async (req, res) => {
    const { id } = req.params;
    const {
      nro_contrato,
      nombre_cliente,
      apellido_cliente,
      n_tlf_cliente,
      email_cliente,
      direccion_cliente,
      tipo_servicio,
    } = req.body;

    try {
      /* 1️⃣ — opcional — comprueba que el contrato no esté repetido
         (excepto su propio registro)                               */
      const { rows: rep } = await pool.query(
        `SELECT 1 FROM cliente
          WHERE nro_contrato = $1 AND id_cliente <> $2`,
        [nro_contrato, id]
      );
      if (rep.length)
        return res
          .status(409)
          .json({ msg: "Ese número de contrato ya existe en otro cliente" });

      /* 2️⃣ — actualiza */
      const { rowCount } = await pool.query(
        `UPDATE cliente
            SET nro_contrato     = $1,
                nombre_cliente   = $2,
                apellido_cliente = $3,
                n_tlf_cliente    = $4,
                email_cliente    = $5,
                direccion_cliente= $6,
                tipo_servicio    = $7
          WHERE id_cliente = $8
            AND activo = TRUE`,
        [
          nro_contrato,
          nombre_cliente,
          apellido_cliente,
          n_tlf_cliente,
          email_cliente,
          direccion_cliente,
          tipo_servicio,
          id,
        ]
      );

      if (!rowCount)
        return res.status(404).json({ msg: "Cliente no encontrado o inactivo" });

      res.json({ msg: "Cliente actualizado" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error actualizando cliente");
    }
  }
);


/* ===========================================================
   ARRANQUE DEL SERVIDOR
   =========================================================== */
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

/* (Opcional) test rápido */
const checkDB = async () => {
  try {
    const r = await pool.query("SELECT COUNT(*) FROM cliente;");
    console.log("Clientes totales:", r.rows[0].count);
  } catch (e) {
    console.error(e);
  }
};
checkDB();
