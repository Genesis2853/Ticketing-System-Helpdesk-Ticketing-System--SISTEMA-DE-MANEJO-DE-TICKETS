import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const VerDatosVisit = () => {
    const navigate = useNavigate();
    const { codigo_solicitud } = useParams();
    const [visitas, setVisitas] = useState(null); // Estado para los datos de visita
    const [loading, setLoading] = useState(true); // Estado de carga
    const [error, setError] = useState(null); // Estado de error

    useEffect(() => {
        const obtenerEventos = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/visitas/${codigo_solicitud}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setVisitas(data);
            } catch (error) {
                console.error('Error al obtener los datos de visita:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        obtenerEventos();
    }, [codigo_solicitud]);

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar los datos de visita: {error}</div>;
    }

    if (!visitas) {
        return <div>No se encontraron datos de visita.</div>;
    }

    return (
        <main className="main-Tec">
            <div>
                <button onClick={() => navigate(-1)}>Volver</button>
                <h2>Detalle de la Solicitud</h2>
                <div className="detalle-solicitudAsigTec-conteiner">
                    <section className='Datosvisita-conteiner'>
                        <div className='Datosvisita-card'>
                            <h2 className='Datosvisita-titulo'>Datos de Visita</h2>
                            <div>
                                <h1>Eventos</h1>
                                <ul>
                                    <li key={visitas.id_datosvisita}>
                                        {visitas.hora_inicio} - {visitas.hora_fin}
                                    </li>
                                </ul>
                            </div>
                        </div>   
                    </section>
                </div>
            </div>
        </main>
    );
};

export default VerDatosVisit;