import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Modal } from '@mui/material';
import axios from 'axios'; // parte de historial cambio de estado
import './detalle2.css';

const DetalleSoliCeeradoadm = () => {
    const { id, codigo_solicitud } = useParams();
    const navigate = useNavigate();
    const [SoliCerrado, setSoliCerrada] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedRegistro, setSelectedRegistro] = useState(null);
    const [visitas, setDatosVisita] = useState([]);
    const [loading2, setLoading2] = useState(true);
    const [error2, setError2] = useState(null);

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const fetchSolicitudAsig = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/soliCerradoTec/${id}`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                if (isMounted) {
                    setSoliCerrada(data);
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

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const obtenerEventos = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/visitas`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                console.log('Datos de la API:', data);
                if (Array.isArray(data)) {
                    if (isMounted) {
                        setDatosVisita(data);
                    }
                } else {
                    console.error('La respuesta no es un array:', data);
                    if (isMounted) {
                        setDatosVisita([]);
                    }
                }
            } catch (error) {
                console.error('Error al obtener los datos de visita:', error);
                if (isMounted) {
                    setError2(error.message);
                    setDatosVisita([]);
                }
            } finally {
                if (isMounted) {
                    setLoading2(false);
                }
            }
        };

        obtenerEventos();

        // Función de limpieza
        return () => {
            isMounted = false; // Cambia el flag a false cuando el componente se desmonte
        };
    }, [codigo_solicitud]);


    const formatearFecha = (fecha) => {
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const año = date.getFullYear();
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    };

    const obtenerHistorial = async () => {
        if (!SoliCerrado || !SoliCerrado.codigo_solicitud) {
            console.error('La solicitud no está definida o no tiene codigo_solicitud');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/historial/${SoliCerrado.codigo_solicitud}`);
            setHistorial(response.data);
        } catch (error) {
            console.error('Error al obtener el historial:', error);
        }
    };

    const toggleSidebar = () => {
        setOpen(!open);
        if (!open) {
            obtenerHistorial();
        }
    };

    const handleRegistroClick = (registro) => {
        setSelectedRegistro(registro);
    };

    const visitasFiltradas = Array.isArray(visitas) && SoliCerrado?.codigo_solicitud
        ? visitas.filter(evento => evento.codigo_solicitud === SoliCerrado.codigo_solicitud)
        : [];

        const handleDownloadClick = () => {
        navigate('/descargarreportes', { state: {solicitud: SoliCerrado} });
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
    
    if (SoliCerrado === null) {
        return <div>Cargando solicitud...</div>; // Mensaje de carga
    }
    
    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar la solicitud: {error}</div>;
    }

    if (!SoliCerrado) {
        return <div>No se encontró la SoliCerrado.</div>;
    }
    
    if (loading2) {
        return <div>Cargando...</div>;
    }

    if (error2) {
        return <div>Error al cargar los datos de visita: {error2}</div>;
    }

    if (!visitas) {
        return <div>No se encontraron datos de visita.</div>;
    }

    if (!Array.isArray(visitas)) {
        return <p>Error: Las visitas no están disponibles.</p>;
    }
    
    return (
        <main className="detalle-solicitudEstado-container">
            <button className="detalle-solicitudEstado-boton-volver" onClick={() => navigate(-1)}>
      Volver
    </button>
  <div className="detalle-solicitudEstado-contenido">
    

    <h2 className="detalle-solicitudEstado-titulo">Registro de la Solicitud</h2>

    {/* Card 1: Datos Solicitud */}
    <div className="detalle-solicitudEstado-card">
      <div className="detalle-solicitudEstado-header">
        <p><span className="negrita">ID:</span> {SoliCerrado.codigo_ticket}</p>
        <p><span className="negrita">Fecha C.:</span> {formatearFecha(SoliCerrado.fecha_solicitud)}</p>
      </div>

      <h3 className="detalle-solicitudEstado-subtitulo">Datos Solicitud</h3>

      <div className="detalle-solicitudEstado-info">
        <p><span className="negrita">Técnico encargado:</span> {SoliCerrado.nombre_tecnico} {SoliCerrado.apellido_tecnico}</p>
        <p><span className="negrita">Cliente:</span> <Link to={`/cliver/vercliente/${SoliCerrado.id_cliente}`}>{SoliCerrado.nombre_cliente} {SoliCerrado.apellido_cliente}</Link></p>
        <p><span className="negrita">Descripción del Servicio:</span></p>
        <p className="detalle-solicitudEstado-descripcion">{SoliCerrado.descripcion_servicio}</p>
        <p><span className="negrita">Motivo de visita:</span> {SoliCerrado.motivo_visita}</p>
        <p><span className="negrita">Estado:</span> {SoliCerrado.estado_solicitud}</p>
        <p><span className="negrita">Prioridad:</span> {SoliCerrado.prioridad_solicitud}</p>
      </div>
    </div>

    {/* Card 2: Datos Visita */}
    <div className="detalle-solicitudEstado-card">
      <h3 className="detalle-solicitudEstado-subtitulo">Datos de Visita</h3>
      {visitasFiltradas.length > 0 ? (
        visitasFiltradas.map((evento) => (
          <div key={evento.id_datosvisita} className="detalle-solicitudEstado-info">
            <p><span className="negrita">Solicitud:</span> {evento.codigo_ticket}</p>
            <p><span className="negrita">Días disponibles:</span> {evento.dias_disponibles}</p>
            <p><span className="negrita">Comentario:</span> {evento.comentario_datosvisita}</p>
          </div>
        ))
      ) : (
        <p className="detalle-solicitudEstado-info">No hay información de registro aún</p>
      )}
    </div>

    {/* Card 3: Comentarios Técnico */}
    <div className="detalle-solicitudEstado-card">
      <h3 className="detalle-solicitudEstado-subtitulo">Comentarios Técnico</h3>
      <div className="detalle-solicitudEstado-info">
        <p><span className="negrita">Estado:</span> {SoliCerrado.estado_solicitud}</p>
        <p><span className="negrita">Motivo de Cierre:</span> {SoliCerrado.motivo_cierre}</p>
        <p><span className="negrita">Comentarios:</span> {SoliCerrado.comentarios_tecnico}</p>
        <p><span className="negrita">Fecha de cierre:</span> {formatDate(SoliCerrado.fecha_cierre)}</p>
      </div>
    </div>

    {/* Card 4: Historial */}
    <div className="detalle-solicitudEstado-card">
      <h3 className="detalle-solicitudEstado-subtitulo">Historial</h3>
      <Button onClick={toggleSidebar} className="detalle-solicitudEstado-boton-historial">
        Ver Historial
      </Button>

      <Modal open={open} onClose={toggleSidebar} className="detalle-solicitudEstado-modal">
        <div className="detalle-solicitudEstado-modal-contenido">
          <h2 className="detalle-solicitudEstado-modal-titulo">Historial de Solicitudes</h2>
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

    {/* Botón Final */}
    <Button onClick={handleDownloadClick} className="detalle-solicitudEstado-boton-descarga">
      Descargar Información
    </Button>
  </div>
</main>



    );
};

export default DetalleSoliCeeradoadm;