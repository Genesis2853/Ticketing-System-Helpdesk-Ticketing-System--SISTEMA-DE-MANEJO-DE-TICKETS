import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button, Modal} from '@mui/material';

const DetaleSoliNoRealizasaTec = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [solicitudNoRealizada, setSolicitudAsig] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedRegistro, setSelectedRegistro] = useState(null);
    
   const [evaluaciones, setEvaluaciones] = useState([]); // Nuevo estado para evaluaciones
    const [loadingEvaluaciones, setLoadingEvaluaciones] = useState(true); // Estado de carga para evaluaciones
    const [errorEvaluaciones, setErrorEvaluaciones] = useState(null); // Estado de error para evaluaciones

    useEffect(() => {
        const controller = new AbortController(); // Crear un AbortController
        const signal = controller.signal; // Obtener la señal


        const fetchSolicitudAsig = async () => {
          const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", token);

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }
            
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLINOREALIZADA}/api/solino/solicitudNoReTec/${id}`, { signal,
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
                console.log('Código que se pasa al modal:', data.codigo_solicitud);
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
        if (!solicitudNoRealizada || !solicitudNoRealizada.codigo_solicitud) {
            console.error('La solicitud no está definida o no tiene codigo_solicitud');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL_SOLINOREALIZADA}/api/solino/historial/${solicitudNoRealizada.codigo_solicitud}`);
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

    // 🔄 nuevo efecto: depende de solicitudComplTec.id_soli_completada
    useEffect(() => {
      const idEval = solicitudNoRealizada.id_soli_norealizada;
      if (!idEval) return;           // aún no llegó la primera petición
    
      const controller = new AbortController();
      const url = `${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/comentarios-evaluacion-lista/norealizada/${idEval}`;
    
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
    }, [solicitudNoRealizada.id_soli_norealizada]);
    

    const idsNoReEvaluados = evaluaciones
  .filter(e => e.id_soli_norealizada !== null)
  .map(e => e.id_soli_norealizada);

const idsCerradosEvaluados = evaluaciones
  .filter(e => e.id_soli_cerrada !== null)
  .map(e => e.id_soli_cerrada);


    // FUNCION BOTON DE DESCARGA DE REPORTE DE SERVICIO
    const handleDownloadClick = () => {
        navigate('/descargarreportestec', { state: {solicitud: solicitudNoRealizada} });
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar la solicitud: {error}</div>;
    }

    if (!solicitudNoRealizada) {
        return <div>No se encontró la solicitud No Realizada.</div>;
    }

    
    return (
  <main className="detalle-solicitudEstado-container">
    {/* Botón volver */}
    <button
      className="detalle-solicitudEstado-boton-volver"
      onClick={() => navigate(-1)}
    >
      Volver
    </button>

    {/* Contenido principal */}
    <div className="detalle-solicitudEstado-contenido">
      <h2 className="detalle-solicitudEstado-titulo">Registro de la Solicitud</h2>

      {/* ---------- CARD 1: Datos Solicitud ---------- */}
      <div className="detalle-solicitudEstado-card">
        <div className="detalle-solicitudEstado-header">
          <p>
            <span className="negrita">ID:</span>{" "}
            {solicitudNoRealizada.codigo_ticket}
          </p>
          <p>
            <span className="negrita">Fecha C.:</span>{" "}
            {formatearFecha(solicitudNoRealizada.fecha_solicitud)}
          </p>
        </div>

        <h3 className="detalle-solicitudEstado-subtitulo">Datos Solicitud</h3>

        <div className="detalle-solicitudEstado-info">
          <p>
            <span className="negrita">Técnico encargado:</span>{" "}
            {solicitudNoRealizada.nombre_tecnico} {solicitudNoRealizada.apellido_tecnico}
          </p>
          <p>
            <span className="negrita">Cliente:</span>{" "}
            <Link to={`/cliver/vercliente/${solicitudNoRealizada.id_cliente}`}>
              {solicitudNoRealizada.nombre_cliente} {solicitudNoRealizada.apellido_cliente}
            </Link>
          </p>

          <p>
            <span className="negrita">Descripción del Servicio:</span>
          </p>
          <p className="detalle-solicitudEstado-descripcion">
            {solicitudNoRealizada.descripcion_servicio}
          </p>
          <p>
            <span className="negrita">Estado:</span>{" "}
            {solicitudNoRealizada.estado_solicitud}
          </p>
          <p>
            <span className="negrita">Prioridad:</span>{" "}
            {solicitudNoRealizada.prioridad_solicitud}
          </p>
        </div>
      </div>

      {/* ---------- CARD 2: Datos de Visita ---------- */}
      <div className="detalle-solicitudEstado-card">
        <h3 className="detalle-solicitudEstado-subtitulo">Datos de Visita</h3>
        <div className="detalle-solicitudEstado-info">
          <p>No hay información de registro</p>
        </div>
      </div>

      {/* ---------- CARD 3: Comentarios Técnico ---------- */}
      <div className="detalle-solicitudEstado-card">
        <h3 className="detalle-solicitudEstado-subtitulo">Comentarios Técnico</h3>
        <div className="detalle-solicitudEstado-info">
          <p>
            <span className="negrita">Estado:</span>{" "}
            {solicitudNoRealizada.estado_solicitud}
          </p>
          <p>
            <span className="negrita">Motivo de No Realización:</span>{" "}
            {solicitudNoRealizada.motivo_norealizacion}
          </p>
          <p>
            <span className="negrita">Comentarios:</span>{" "}
            {solicitudNoRealizada.comentario_trabajo_norealizado}
          </p>
          <p>
            <span className="negrita">Fecha de cierre:</span>{" "}
            {formatearFecha(solicitudNoRealizada.fecha_cierre_norealizado)}
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
            <div key={evaluacion.id_comentario_evaluacion} className="detalle-solicitudEstado-info">
              <p>
                <strong>Comentario:</strong>{" "}
                {evaluacion.comentario}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {evaluacion.codigo_trabajador}
              </p>
            </div>
          ))
        )}
      </div>


      {/* ---------- CARD 4: Historial ---------- */}
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
                      <strong>ID:</strong> {selectedRegistro.codigo_ticket}
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

      {/* ---------- BOTÓN DESCARGA ---------- */}
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

export default DetaleSoliNoRealizasaTec;