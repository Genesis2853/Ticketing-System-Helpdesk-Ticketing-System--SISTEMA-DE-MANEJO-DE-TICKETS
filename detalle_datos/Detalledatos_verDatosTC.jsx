import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './detalle.css';

const DetalleVerDatosTC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tecnico, setTecnico] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchTecnico = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL_VERTECNICO}/api/tecver/tecnicos/${id}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setTecnico(data);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error fetching técnico:', error);
                    setError(error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTecnico();
        return () => controller.abort();
    }, [id]);

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Fecha no disponible';
        const date = new Date(fecha);
        return date.toLocaleString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error al cargar el técnico: {error}</div>;
    if (!tecnico) return <div>No se encontró el técnico.</div>;

    return (
        <main className="detalle-tecnico-main">
  <div className="detalle-tecnico-container">
    <button onClick={() => navigate(-1)} className="btn-volver">
      Volver
    </button>

    <h2 className="detalle-tecnico-titulo">Detalle del Técnico</h2>

    <div className="detalle-tecnico-card">
      <div className="detalle-tecnico-header">
        <p><strong>ID:</strong> {tecnico.codigo_trabajador}</p>
        <p><strong>Fecha de creación:</strong> {formatearFecha(tecnico.fecha_creacion_tecnico)}</p>
      </div>

      <h3 className="detalle-tecnico-subtitulo">Datos Técnico</h3>

      <div className="detalle-tecnico-info">
        <p><strong>Nombre:</strong> {tecnico.nombre_tecnico}</p>
        <p><strong>Apellido:</strong> {tecnico.apellido_tecnico}</p>
        <p><strong>Cédula:</strong> {tecnico.ci_tecnico}</p>
        <p><strong>Teléfono:</strong> {tecnico.n_tlf_tecnico}</p>
        <p><strong>Correo:</strong> {tecnico.email_tecnico}</p>
        <p><strong>Cuadrilla:</strong> {tecnico.cuadrilla}</p>
      </div>
    </div>

    <div className="btn-modificar-wrapper">
      <button onClick={() => navigate(`/tecver/tecnicos/editar/${id}`)} className="btn-modificar">
        Modificar
      </button>
    </div>
  </div>
</main>

    );
};

export default DetalleVerDatosTC;
