import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './detalle.css';

const DetalleSolicitud = () => {
    const { id } = useParams();
    console.log('ID:', id);
    const navigate = useNavigate(); // Importar y usar useNavigate
    const [solicitud, setSolicitud] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const fetchSolicitud = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/solicitudes/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                // Solo actualiza el estado si el componente sigue montado
                if (isMounted) {
                    setSolicitud(data);
                }
            } catch (error) {
                console.error('Error fetching solicitud:', error);
                if (isMounted) {
                    setError(error.message);
                }
                // Mensaje adicional en la consola
                console.error(`Error al obtener la solicitud con ID ${id}: ${error.message}`);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSolicitud();

        // Función de limpieza
        return () => {
            isMounted = false; // Cambia el flag a false cuando el componente se desmonte
        };

    }, [id]);

    const formatearFecha = (fecha) => {
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son 0-indexados
        const año = date.getFullYear();
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar la solicitud: {error}</div>;
    }

    // Asegúrate de que 'solicitud' no sea null antes de intentar acceder a sus propiedades
    if (!solicitud) {
        return <div>No se encontró la solicitud.</div>;
    }

    return (
    <main className="detalle-solicitudEstado-container">
  <div className="detalle-solicitudEstado-header-form">
    <button className="detalle-solicitudEstado-boton-volver" onClick={() => navigate(-1)}>
      Volver
    </button>
    <h2 className="detalle-solicitudEstado-titulo">Registro de la Solicitud</h2>

    <div className="detalle-solicitudEstado-container">
      <div className="detalle-solicitudEstado-card">
        <div className="detalle-solicitudEstado-header">
          <p><span className="negrita">ID:</span> {solicitud.codigo_ticket}</p>
          <p><span className="negrita">Fecha C.:</span> {formatearFecha(solicitud.fecha_solicitud)}</p>
        </div>

        <p className="detalle-solicitudEstado-subtitulo">Datos Solicitud</p>

        <div className="detalle-solicitudEstado-info">
          <p><span className="negrita">Técnico encargado:</span> {solicitud.nombre_tecnico} {solicitud.apellido_tecnico}</p>
          <p><span className="negrita">Cliente:</span> <Link to={`/cliver/vercliente/${solicitud.id_cliente}`}>{solicitud.nombre_cliente} {solicitud.apellido_cliente}</Link></p>
          <p><span className="negrita">Descripción del Servicio:</span></p>
          <p className="detalle-solicitudEstado-descripcion">{solicitud.descripcion_servicio}</p>
          <p><span className="negrita">Motivo de visita:</span> {solicitud.motivo_visita}</p>
          <p><span className="negrita">Estado:</span> {solicitud.estado_solicitud}</p>
          <p><span className="negrita">Prioridad:</span> {solicitud.prioridad_solicitud}</p>
        </div>
      </div>
    </div>
  </div>
</main>

    );
};

export default DetalleSolicitud;