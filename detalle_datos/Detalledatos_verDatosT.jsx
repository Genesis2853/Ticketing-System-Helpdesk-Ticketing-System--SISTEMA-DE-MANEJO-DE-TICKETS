import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const DetalleVerDatosT = () => {
    const { id } = useParams();
    console.log('ID:', id);
    const navigate = useNavigate(); // Importar y usar useNavigate
    const [verTike, setDticket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const fetchDticket = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_VERTICKETS}/api/verti/vertickets/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (isMounted) {
                    setDticket(data);
                }
            } catch (error) {
                console.error('Error fetching ticket:', error);
                if (isMounted) {
                    setError(error.message);
                }
                // Mensaje adicional en la consola
                console.error(`Error al obtener el ticket con ID ${id}: ${error.message}`);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDticket();

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
        return <div>Error al cargar el ticket: {error}</div>;
    }

    // Asegúrate de que 'verTike' no sea null antes de intentar acceder a sus propiedades
    if (!verTike) {
        return <div>No se encontró el ticket.</div>;
    }

    return (
        <main className="detalle-cliente-main">
  <div className="detalle-cliente-container">
    <button onClick={() => navigate(-1)} className="btn-volver">
      Volver
    </button>

    <h2 className="detalle-cliente-titulo">Detalle del Ticket</h2>

    <div className="detalle-cliente-card">
      <div className="detalle-cliente-header">
        <p><strong>ID:</strong> {verTike.codigo_ticket}</p>
        <p><strong>Fecha de creación:</strong> {formatearFecha(verTike.fecha_creacion)}</p>
      </div>

      <h3 className="detalle-cliente-subtitulo">Datos del Ticket</h3>

      <div className="detalle-cliente-info">
        <p>
          <strong>Cliente:</strong>{" "}
          <Link to={`/cliver/vercliente/${verTike.id_cliente}`}>
            {verTike.nombre_cliente} {verTike.apellido_cliente}
          </Link>
        </p>
        <p><strong>Descripción:</strong></p>
        <p className="detalle-cliente-descripcion">{verTike.descripcion_servicio}</p>
        <p><strong>Motivo:</strong> {verTike.motivo_visita}</p>
        <p><strong>Prioridad:</strong> {verTike.prioridad_solicitud}</p>
      </div>
    </div>
  </div>
</main>


    );
};

export default DetalleVerDatosT;