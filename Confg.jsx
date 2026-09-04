import React, { useState, useEffect, useRef, useMemo } from 'react';


import { Modal, Box, Button, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from "notistack";
import axios from 'axios';
import './Confg.css';

const INTERVAL_MS = 3 * 60 * 1000;                     
const API_URL     = process.env.REACT_APP_BACKUPS_API; 

function BackupManager({user}) {
  const [backups,         setBackups]         = useState([]);
  const [archivo,         setArchivo]         = useState(null);
  const [mensaje,         setMensaje]         = useState('');
  const [tiempoRestante,  setTiempoRestante]  = useState(0);     
  const [confirmar, setConfirmar] = useState(null); // backup a confirmar
const [restaurando, setRestaurando] = useState(false);
  const [openModal, setOpenModal] = useState(false);

const { enqueueSnackbar } = useSnackbar();

  const pollRef     = useRef(null);
  const countdownRef= useRef(null);

  /* ----- cargar lista y tiempo restante al montar ----- */
  useEffect(() => {
    cargarBackups();
    syncTiempoRestante();                      // lee /tiempo-restante

  
    countdownRef.current = setInterval(() => {
  setTiempoRestante(prev => {
    if (prev > 1000) {
      return prev - 1000;
    } else {
      // ⏰ Llegó a 0 → resetea y sincroniza desde backend
      syncTiempoRestante();
      cargarBackups();
      return 0;
    }
  });
}, 1000);


    
    pollRef.current = setInterval(() => {
      cargarBackups();
      syncTiempoRestante();                    // re‑sincroniza
    }, INTERVAL_MS);

    return () => {
      clearInterval(countdownRef.current);
      clearInterval(pollRef.current);
    };
  }, []);

  /* ---------- helpers ---------- */
  const cargarBackups = async () => {
    try {
      const { data } = await axios.get(API_URL);
      setBackups(data);
    } catch (err) {
      console.error('Error al obtener backups:', err);
    }
  };

  const syncTiempoRestante = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/tiempo-restante`);
      setTiempoRestante(data.tiempoRestante);
    } catch (err) {
      console.error('Error obteniendo tiempo restante:', err);
    }
  };

  const crearBackup = async () => {
    try {
      await axios.post(API_URL);
      enqueueSnackbar('✅ Backup creado manualmente', { variant: 'success' });
      cargarBackups();
      syncTiempoRestante();                    // reinicia contador
    } catch (err) {
      console.error('Error al crear backup:', err);
    }
  };

  const subirBackup = async () => {
    if (!archivo) return alert('Selecciona un .zip');
    try {
      const fd = new FormData();
      fd.append('backup', archivo);
      await axios.post(`${API_URL}/upload`, fd);
      enqueueSnackbar('✅ Backup subido correctamente', { variant: 'success' });
      setArchivo(null);
      cargarBackups();
    } catch (err) {
      console.error('Error al subir backup:', err);
      enqueueSnackbar("Error al subir backup", { variant: "error" });
    }
  };

  const restaurarBackup = async (nombre) => {
  setRestaurando(true);
  try {
    await activarMantenimiento();

    const response = await axios.post(`${API_URL}/${nombre}/restore`);

    enqueueSnackbar(`✅ Backup restaurado: ${nombre}`, { variant: 'success' });

    // Esperamos a que el backend termine, y luego cerramos sesión
    localStorage.removeItem('token');
    window.location.href = '/login'; // Esto se ejecuta solo si no hubo error

  } catch (err) {
    console.error('Error al restaurar backup:', err);
    enqueueSnackbar("Error al restaurar backup", { variant: "error" });
  } finally {
    try {
      await desactivarMantenimiento();
    } catch(e) {
      console.warn("Error al desactivar mantenimiento:", e);
    }
    setRestaurando(false);
  }
};



const horas = String(Math.floor(tiempoRestante / 3600000)).padStart(2, '0');
const min   = String(Math.floor((tiempoRestante % 3600000) / 60000)).padStart(2, '0');
const seg   = String(Math.floor((tiempoRestante % 60000) / 1000)).padStart(2, '0');

const activarMantenimiento = async () => {
  const token = localStorage.getItem('token');
  await axios.post(`${API_URL}/activar-mantenimiento`, null, {
    headers: { Authorization: `Bearer ${token}` }
  });
  enqueueSnackbar("Modo mantenimiento activado", { variant: "info" });
};

const desactivarMantenimiento = async () => {
  const token = localStorage.getItem('token');
  await axios.post(`${API_URL}/desactivar-mantenimiento`, null, {
    headers: { Authorization: `Bearer ${token}` }
  });
  enqueueSnackbar("Modo mantenimiento desactivado", { variant: "info" });
};







 return (
  <div className="backup-container">
    <div className="backup-container-2">
    {user.tipo_usuario === 'Admin' && (
      <>
      <div className="baku-container">
        <h2 className="backup-titulo">📦 Gestión de Backups</h2>
        <p className="backup-timer">
          ⏳ Próximo backup automático en: <span className="tiempo-bold">{horas}:{min}:{seg}</span>
        </p>

        <div className="botonera">
          <button className="btn-azul" onClick={crearBackup}>➕ Crear Backup</button>

          <div className="upload-section">
            <input
              type="file"
              id="archivo-backup"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={(e) => setArchivo(e.target.files[0])}
            />
            <label htmlFor="archivo-backup" className="btn-elegir-archivo">
              📁 Elegir archivo
            </label>
            <button className="btn-azul" onClick={subirBackup}>Subir Backup</button>
          </div>


          <button className="btn-ver-backups" onClick={() => setOpenModal(true)}>📁 Ver Backups</button>
        </div>

        <Modal open={openModal} onClose={() => setOpenModal(false)}>
  <Box className="modal-backups-box">
    <div className="modal-header">
      <Typography variant="h6" className="modal-titulo">📁 Backups disponibles</Typography>
      <IconButton onClick={() => setOpenModal(false)} size="small">
        <CloseIcon />
      </IconButton>
    </div>

    <div className="lista-backups-scroll">
      <ul className="lista-backups">
        {[...backups]
          .sort((a, b) => {
            const getName = (x) => (typeof x === "string" ? x : x.nombre);
            return getName(b).localeCompare(getName(a)); // más nuevos primero
          })
          .map((f, i) => (
            <li key={i} className="backup-item">
              <span>{typeof f === 'string' ? f : f.nombre}</span>
              <button
                onClick={() => {
                  setConfirmar(typeof f === 'string' ? f : f.nombre);
                  setOpenModal(false);
                }}
                className="btn-azul btn-restaurar"
              >
                🔁 Restaurar
              </button>
            </li>
        ))}
      </ul>
    </div>
  </Box>
</Modal>
</div>

        {confirmar && (
          <div className="confirm-modal">
            <div className="confirm-box">
              {restaurando ? (
                <h2 className="restaurando-text">🔄 Restaurando...</h2>
              ) : (
                <>
                  <h3 className="confirm-titulo">¿Restaurar backup?</h3>
                  <p>Se borrarán los datos actuales y se restaurará <b>{confirmar}</b>.</p>
                  <p className="alerta">⚠️ Esta acción es irreversible</p>
                  <div className="confirm-buttons">
                    <button
                      onClick={async () => {
    try {
      await restaurarBackup(confirmar);
      setConfirmar(null);
    } catch (error) {
      // Error intencionalmente ignorado
    }
  }}
                      className="btn-azul"
                      disabled={restaurando}
                    >
                      Sí, restaurar
                    </button>

                    <button
                      onClick={() => setConfirmar(null)}
                      className="btn-cancelar"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )}

    <div className="manual-container">
      <h2 className="manual-titulo">📘 Manual de Usuario</h2>
      <p className="manual-texto">
        ¡Puedes descargar el Manual de Usuario aqui!
      </p>

      {user.tipo_usuario === 'Tecnico' ? (
        <a href="/Manual_Usuario_Tec.pdf" download className="btn-manual">
          📥 Descargar Manual para Técnico
        </a>
      ) : (user.tipo_usuario === 'Admin' || user.tipo_usuario === 'Moderador') ? (
        <a href="/Manual_Usuario_Adm.pdf" download className="btn-manual">
          📥 Descargar Manual para Administrador/Moderador
        </a>
      ) : null}
    </div>
  </div>
  </div>
);


}

export default BackupManager;
