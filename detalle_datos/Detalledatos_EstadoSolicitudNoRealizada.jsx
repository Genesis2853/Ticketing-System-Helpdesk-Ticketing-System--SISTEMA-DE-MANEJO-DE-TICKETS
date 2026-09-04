import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // parte de historial cambio de estado
import { Button, Modal } from '@mui/material';

const DetalleSolicitudNoRealizadoadm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [solicitudNoRealizada, setSolicitudAsig] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historial, setHistorial] = useState([]); // parte de historial cambio de estado
    const [open, setOpen] = useState(false);
    const [selectedRegistro, setSelectedRegistro] = useState(null);

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const fetchSolicitudAsig = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/soliNoReTec/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                if (isMounted) {
                    setSolicitudAsig(data);
                    console.log('Codigo que se pasa al modal:', data.codigo_solicitud);
                }
            } catch (error) {
                console.error('Error fetching solicitud:', error);
                if (isMounted) {
                    setError(error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSolicitudAsig();

        // Función de limpieza
        return () => {
            isMounted = false; // Cambia el flag a false cuando el componente se desmonte
        };
    }, [id]);


    
    const formatearFecha = (fecha) => {
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const año = date.getFullYear();
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    };

    const handleDownloadClick = () => {
        navigate('/descargarreportes', { state: {solicitud: solicitudNoRealizada} });
    };
  
    const obtenerHistorial = async () => {// parte para obtener historial
        if (!solicitudNoRealizada || !solicitudNoRealizada.codigo_solicitud) {
            console.error('La solicitud no está definida o no tiene codigo_solicitud');
            return; // Salir si solicitudNoRealizada no está definido
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/historial/${solicitudNoRealizada.codigo_solicitud}`);
            setHistorial(response.data);
        } catch (error) {
            console.error('Error al obtener el historial:', error);
        }
    };

    const toggleSidebar = () => {
    setOpen(!open);
    if (!open) {
        obtenerHistorial(); // Cargar historial al abrir el sidebar
    }
    };

    const handleRegistroClick = (registro) => {
    setSelectedRegistro(registro);
    };


        const formatDate = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};
    
    if (solicitudNoRealizada === null) {
        return <div>Cargando solicitud...</div>; // Mensaje de carga
    }
    
    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar la solicitud: {error}</div>;
    }

    if (!solicitudNoRealizada) {
        return <div>No se encontró la solicitudNoRealizada.</div>;
    }

    
    return (
        <main className="detalle-solicitudEstado-container">
  <button className="detalle-solicitudEstado-boton-volver" onClick={() => navigate(-1)}>
    Volver
  </button>
  <div className="detalle-solicitudEstado-contenido">
    <h2 className="detalle-solicitudEstado-titulo">Registro de la Solicitud</h2>
    <div className="detalle-solicitudEstado-card">
      <div className="detalle-solicitudEstado-header">
        <p><span className="negrita">ID:</span> {solicitudNoRealizada.codigo_ticket}</p>
        <p><span className="negrita">Fecha C.:</span> {formatearFecha(solicitudNoRealizada.fecha_solicitud)}</p>
      </div>
      <h3 className="detalle-solicitudEstado-subtitulo">Datos Solicitud</h3>
      <div className="detalle-solicitudEstado-info">
        <p><span className="negrita">Técnico encargado:</span> {solicitudNoRealizada.nombre_tecnico} {solicitudNoRealizada.apellido_tecnico}</p>
        <p><span className="negrita">Cliente:</span> <Link to={`/cliver/vercliente/${solicitudNoRealizada.id_cliente}`}>{solicitudNoRealizada.nombre_cliente} {solicitudNoRealizada.apellido_cliente}</Link></p>
        <p><span className="negrita">Descripción del Servicio:</span></p>
        <p className="detalle-solicitudEstado-descripcion">{solicitudNoRealizada.descripcion_servicio}</p>
        <p><span className="negrita">Estado:</span> {solicitudNoRealizada.estado_solicitud}</p>
        <p><span className="negrita">Prioridad:</span> {solicitudNoRealizada.prioridad_solicitud}</p>
      </div>
    </div>

    <div className="detalle-solicitudEstado-card">
      <h3 className="detalle-solicitudEstado-subtitulo">Datos de Visita</h3>
      <div className="detalle-solicitudEstado-info">
        <p>No hay información de registro</p>
      </div>
    </div>

    <div className="detalle-solicitudEstado-card">
      <h3 className="detalle-solicitudEstado-subtitulo">Comentarios Técnico</h3>
      <div className="detalle-solicitudEstado-info">
        <p><span className="negrita">Estado:</span> {solicitudNoRealizada.estado_solicitud}</p>
        <p><span className="negrita">Motivo de No Realización:</span> {solicitudNoRealizada.motivo_norealizacion}</p>
        <p><span className="negrita">Comentarios:</span> {solicitudNoRealizada.comentario_trabajo_norealizado}</p>
        <p><span className="negrita">Fecha de cierre:</span> {formatDate(solicitudNoRealizada.fecha_cierre_norealizado)}</p>
      </div>
    </div>

    <div className="detalle-solicitudEstado-card">
      <h3 className="detalle-solicitudEstado-subtitulo">Historial</h3>
      <Button onClick={toggleSidebar} className="detalle-solicitudEstado-boton-historial">
        Ver Historial
      </Button>
      <Modal open={open} onClose={toggleSidebar} className="detalle-solicitudEstado-modal">
        <div className="detalle-solicitudEstado-modal-contenido">
          <h2 className="detalle-solicitudEstado-modal-titulo">Historial de Solicitudes No Realizadas</h2>
          <div className="detalle-solicitudEstado-modal-body">
            <ul className="detalle-solicitudEstado-historial-lista">
              {historial.length > 0 ? (
                historial.map((registro) => (
                  <li
                    key={registro.codigo_solicitud}
                    className="detalle-solicitudEstado-historial-item"
                    onClick={() => handleRegistroClick(registro)}
                  >
                    <div><span className="negrita">ID:</span> {registro.codigo_ticket}</div>
                    <div><span className="negrita">Cambio de estado:</span> {registro.estado_solicitud}</div>
                  </li>
                ))
              ) : (
                <p>No hay historial disponible.</p>
              )}
            </ul>
            <div className="detalle-solicitudEstado-detalles-historial">
              {selectedRegistro ? (
                <>
                  <h3>Detalles del Reporte</h3>
                  <p><strong>ID:</strong> {selectedRegistro.codigo_ticket}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedRegistro.fecha_historial_cambioestado).toLocaleString()}</p>
                  <p><strong>Cambio de estado:</strong> {selectedRegistro.estado_solicitud}</p>
                  <p><strong>Razón:</strong> {selectedRegistro.razon_cambioestado}</p>
                </>
              ) : (
                <p>Selecciona un registro para ver los detalles.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>

    <Button onClick={handleDownloadClick} className="detalle-solicitudEstado-boton-descarga">
      Descargar Información
    </Button>
  </div>
</main>

    );
};

export default DetalleSolicitudNoRealizadoadm;