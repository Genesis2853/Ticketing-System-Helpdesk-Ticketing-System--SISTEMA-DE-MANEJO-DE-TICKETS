import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button, Modal } from '@mui/material';

const DetallesolicitudComplTec = ({user}) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [solicitudComplTec, setSolicitudAsig] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedRegistro, setSelectedRegistro] = useState(null);
    const [visitas, setDatosVisita] = useState([]);
    const [loading2, setLoading2] = useState(true);
    const [error2, setError2] = useState(null);
    const [evaluaciones, setEvaluaciones] = useState([]); // Nuevo estado para evaluaciones
    const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(true); // Estado de carga para evaluaciones
    const [errorEvaluaciones, setErrorEvaluaciones] = useState(null); // Estado de error para evaluaciones

    useEffect(() => {
        const controller = new AbortController(); // Crear un AbortController
        const signal = controller.signal; // Obtener la señal

        const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", token);

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }

        const fetchSolicitudAsig = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLICOMPLETADA}/api/solicomcerr/solicitudcompltecnico/${id}`, { signal, 
                  headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                setSolicitudAsig(data);
                console.log('Codigo que se pasa al modal:', data.codigo_solicitud);
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Solicitud abortada');
                } else {
                    console.error('Error fetching solicitud:', error);
                    setError(error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSolicitudAsig();

        return () => {
            controller.abort(); // Limpiar la solicitud al desmontar
        };
    }, [id]);

    useEffect(() => {
        const controller = new AbortController(); // Crear un AbortController
        const signal = controller.signal; // Obtener la señal

        const obtenerEventos = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLICOMPLETADA}/api/solicomcerr/visitas`, { signal });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                console.log('Datos de la API:', data);
                if (Array.isArray(data)) {
                    setDatosVisita(data);
                } else {
                    console.error('La respuesta no es un array:', data);
                    setDatosVisita([]);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Solicitud abortada');
                } else {
                    console.error('Error al obtener los datos de visita:', error);
                    setError2(error.message);
                    setDatosVisita([]);
                }
            } finally {
                setLoading2(false);
            }
        };

        obtenerEventos();

        return () => {
            controller.abort(); // Limpiar la solicitud al desmontar
        };
    }, [id]);

 

// 🔄 nuevo efecto: depende de solicitudComplTec.id_soli_completada
useEffect(() => {
  const idEval = solicitudComplTec.id_soli_completada;
  if (!idEval) return;           // aún no llegó la primera petición

  const controller = new AbortController();
  const url = `${process.env.REACT_APP_API_URL_SOLICOMPLETADA}/api/solicomcerr/evaluaciones/${idEval}`;

  const fetchEval = async () => {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setEvaluaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') setErrorEvaluaciones(err.message);
    } finally {
      setLoadingEvaluaciones(false);
    }
  };

  fetchEval();
  return () => controller.abort();
}, [solicitudComplTec.id_soli_completada]);





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
        if (!solicitudComplTec || !solicitudComplTec.codigo_solicitud) {
            console.error('La solicitud no está definida o no tiene codigo_solicitud');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL_SOLICOMPLETADA}/api/solicomcerr/historial/${solicitudComplTec.codigo_solicitud}`);
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

    const visitasFiltradas = Array.isArray(visitas) && solicitudComplTec?.codigo_solicitud
        ? visitas.filter(evento => evento.codigo_solicitud === solicitudComplTec.codigo_solicitud)
        : [];




    // FUNCION BOTON DE DESCARGA DE REPORTE DE SERVICIO
    const handleDownloadClick = () => {
        navigate('/descargarreportestec', { state: { solicitud: solicitudComplTec, evaluaciones: evaluaciones, user:user } });
    };




    function formatTiempoInvertido(tiempo) {
        if (!tiempo || typeof tiempo !== 'object') {
            return 'Tiempo no disponible';
        }
        const {
            days = 0,
            hours = 0,
            minutes = 0,
            seconds = 0,
        } = tiempo;
        // Mostrar solo hasta el nivel máximo significativo con formato legible:
        if (days > 0) {
            return `${days} día${days !== 1 ? 's' : ''}, ${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
        if (hours > 0) {
            return `${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
        if (minutes > 0) {
            return `${minutes} minuto${minutes !== 1 ? 's' : ''}` + (seconds > 0 ? `, ${seconds} segundo${seconds !== 1 ? 's' : ''}` : '');
        }
        // Si solo hay segundos
        return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }

    

    if (solicitudComplTec === null) {
        return <div>Cargando solicitud...</div>; // Mensaje de carga
    }

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar la solicitud: {error}</div>;
    }

    if (!solicitudComplTec) {
        return <div>No se encontró la solicitudComplTec.</div>;
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
    {/* Botón volver */}
    <div>
      <button
        className="detalle-solicitudEstado-boton-volver"
        onClick={() => navigate(-1)}
      >
        Volver
      </button>
    </div>

    {/* CONTENIDO PRINCIPAL */}
    <div className="detalle-solicitudEstado-contenido">
      <h2 className="detalle-solicitudEstado-titulo">Registro de la Solicitud</h2>

      {/* ---------- CARD 1: Datos Solicitud ---------- */}
      <div className="detalle-solicitudEstado-card">
        <div className="detalle-solicitudEstado-header">
          <p>
            <span className="negrita">ID:</span>{" "}
            {solicitudComplTec.codigo_ticket}
          </p>
          <p>
            <span className="negrita">Fecha C.:</span>{" "}
            {formatearFecha(solicitudComplTec.fecha_solicitud)}
          </p>
        </div>

        <h3 className="detalle-solicitudEstado-subtitulo">Datos Solicitud</h3>

        <div className="detalle-solicitudEstado-info">
          <p>
            <span className="negrita">Técnico encargado:</span>{" "}
            {solicitudComplTec.nombre_tecnico} {solicitudComplTec.apellido_tecnico}
          </p>
          <p>
            <span className="negrita">Cliente:</span>{" "}
            <Link to={`/cliver/vercliente/${solicitudComplTec.id_cliente}`}>
              {solicitudComplTec.nombre_cliente} {solicitudComplTec.apellido_cliente}
            </Link>
          </p>
          <p>
            <span className="negrita">Motivo de la Visita:</span>{" "}
            {solicitudComplTec.motivo_visita}
          </p>
          <p>
            <span className="negrita">Descripción del Servicio:</span>
          </p>
          <p className="detalle-solicitudEstado-descripcion">
            {solicitudComplTec.descripcion_servicio}
          </p>
          <p>
            <span className="negrita">Estado:</span>{" "}
            {solicitudComplTec.estado_solicitud}
          </p>
          <p>
            <span className="negrita">Prioridad:</span>{" "}
            {solicitudComplTec.prioridad_solicitud}
          </p>
        </div>
      </div>

      {/* ---------- CARD 2: Datos de Visita ---------- */}
      <div className="detalle-solicitudEstado-card">
        <h3 className="detalle-solicitudEstado-subtitulo">Datos de Visita</h3>
        {visitasFiltradas.length > 0 ? (
          visitasFiltradas.map((evento) => (
            <div
              key={evento.id_datosvisita}
              className="detalle-solicitudEstado-info"
            >
              <p>
                <span className="negrita">Días disponibles:</span>{" "}
                {evento.dias_disponibles}
              </p>
              <p>
                <span className="negrita">Dirección:</span>{" "}
                {solicitudComplTec.direccion_cliente}
              </p>
              <p>
                <span className="negrita">Comentario:</span>{" "}
                {evento.comentario_datosvisita}
              </p>
            </div>
          ))
        ) : (
          <p className="detalle-solicitudEstado-info">
            No hay información de registro aún
          </p>
        )}
      </div>

      {/* ---------- CARD 3: Comentarios Técnico ---------- */}
      <div className="detalle-solicitudEstado-card">
        <h3 className="detalle-solicitudEstado-subtitulo">
          Comentarios Técnico
        </h3>
        <div className="detalle-solicitudEstado-info">
          <p>
            <span className="negrita">Estado:</span>{" "}
            {solicitudComplTec.estado_solicitud}
          </p>
          <p>
            <span className="negrita">Tipo Solución/Falla:</span>{" "}
            {solicitudComplTec.tipo_solucion_falla}
          </p>
          <p>
            <span className="negrita">Comentarios:</span>{" "}
            {solicitudComplTec.comentario_trabajo_realizado}
          </p>
          <p>
            <span className="negrita">Herramientas:</span>{" "}
            {solicitudComplTec.herramientas_utilizadas}
          </p>
          <p>
            <span className="negrita">Tiempo Invertido:</span>{" "}
            {formatTiempoInvertido(solicitudComplTec.tiempo_invertido)}
          </p>
          <p>
            <span className="negrita">Fecha de cierre:</span>{" "}
            {formatearFecha(solicitudComplTec.fecha_caso_cerrado)}
          </p>
        </div>
      </div>

      {/* ---------- CARD 4: Evaluaciones ---------- */}
      <div className="detalle-solicitudEstado-card">
        <h3 className="detalle-solicitudEstado-subtitulo">
          Evaluaciones de la Solicitud
        </h3>
        {evaluaciones.length === 0 ? (
          <p className="detalle-solicitudEstado-info">
            No se han realizado evaluaciones para esta solicitud aún.
          </p>
        ) : (
          evaluaciones.map((evaluacion) => (
            <div key={evaluacion.id_evaluaciones} className="detalle-solicitudEstado-info">
              <p>
                <strong>ID Solicitud Completada:</strong>{" "}
                {evaluacion.codigo_ticket}
              </p>
              <p>
                <strong>Código Trabajador:</strong>{" "}
                {evaluacion.codigo_trabajador}
              </p>
              <p>
                <strong>Puntuación Técnico:</strong>{" "}
                {evaluacion.puntuacion_tecnico}
              </p>
              <p>
                <strong>Comentario Puntuación Técnico:</strong>{" "}
                {evaluacion.comentario_puntuacion_tecnico}
              </p>
              <p>
                <strong>Fecha de Evaluación:</strong>{" "}
                {new Date(evaluacion.fecha_evaluacion_tecnico).toLocaleDateString()}
              </p>
              <p>
                <strong>Comentarios del Cliente:</strong>{" "}
                {evaluacion.comentarios_cliente}
              </p>
              <p>
                <strong>Calificación Cliente:</strong>{" "}
                {evaluacion.calificacion_cliente}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ---------- CARD 5: Historial ---------- */}
      <div className="detalle-solicitudEstado-card">
        <h3 className="detalle-solicitudEstado-subtitulo">Historial</h3>

        <Button
          onClick={toggleSidebar}
          className="detalle-solicitudEstado-boton-historial"
        >
          Ver Historial
        </Button>

        <Modal
          open={open}
          onClose={toggleSidebar}
          className="detalle-solicitudEstado-modal"
        >
          <div className="detalle-solicitudEstado-modal-contenido">
            <h2 className="detalle-solicitudEstado-modal-titulo">
              Historial de Solicitudes
            </h2>

            <div className="detalle-solicitudEstado-modal-body">
              <ul className="detalle-solicitudEstado-historial-lista">
                {historial.length > 0 ? (
                  historial.map((registro) => (
                    <li
                      key={registro.codigo_solicitud}
                      className="detalle-solicitudEstado-historial-item"
                      onClick={() => handleRegistroClick(registro)}
                    >
                      <div>
                        <span className="negrita">ID:</span>{" "}
                        {registro.codigo_ticket}
                      </div>
                      <div>
                        <span className="negrita">Cambio de estado:</span>{" "}
                        {registro.estado_solicitud}
                      </div>
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
                    <p>
                      <strong>ID:</strong>{" "}
                      {selectedRegistro.codigo_ticket}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {new Date(
                        selectedRegistro.fecha_historial_cambioestado
                      ).toLocaleString()}
                    </p>
                    <p>
                      <strong>Cambio de estado:</strong>{" "}
                      {selectedRegistro.estado_solicitud}
                    </p>
                    <p>
                      <strong>Razón:</strong>{" "}
                      {selectedRegistro.razon_cambioestado}
                    </p>
                  </>
                ) : (
                  <p>Selecciona un registro para ver los detalles.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      </div>

      {/* ---------- BOTÓN DESCARGAR ---------- */}
      <Button
        onClick={handleDownloadClick}
        className="detalle-solicitudEstado-boton-descarga"
      >
        Descargar Información
      </Button>
    </div>
  </main>
);

};

export default DetallesolicitudComplTec;
