import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams} from 'react-router-dom';

const Solicitud = () => {
    const { codigo_solicitud } = useParams();
    const [datosVisita, setDatosVisita] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const obtenerDatosVisita = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/visitas/${codigo_solicitud}`);
                console.log(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/visitas/${codigo_solicitud}`);
                setDatosVisita(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        obtenerDatosVisita();
    }, [codigo_solicitud]);

    if (loading) return <p>Cargando...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Detalles de la Visita</h1>
            {datosVisita ? (
                <div>
                    <p>Código de Solicitud: {datosVisita.codigo_solicitud}</p>
                    <p>Detalles: {datosVisita.detalles}</p>
                    {/* Muestra otros datos relevantes */}
                </div>
            ) : (
                <p>No se encontraron datos para esta solicitud.</p>
            )}
        </div>
    );
};

export default Solicitud;