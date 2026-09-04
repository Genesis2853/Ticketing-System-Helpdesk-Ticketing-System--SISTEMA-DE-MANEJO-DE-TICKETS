import React, { useState, useEffect } from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import axios from 'axios'; //parte d historial cambio de estado
import { Button, Modal} from '@mui/material';



const VerDatosVisita = ()  => {//parte d historial cambio de estado ({ solicitud } // eslint-disable-next-line
    
    const navigate = useNavigate();
    
   const { codigo } = useParams();
   const { id } = useParams();
const [solicitudAsigTec, setSolicitudAsig] = useState(null);
    const [visitas, setDatosVisita] = useState(null); // Inicializa como un array vacío // Estado para los datos de visita
    const [open2, setOpen2] = useState(false);
        const [selectedVisita, setSelectedVisita] = useState(null);
        const [loading2, setLoading2] = useState(true); // Estado de carga
            const [error2, setError2] = useState(null); // Estado de error

useEffect(() => {
        const fetchSolicitudAsig = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/solicitudAsigTec/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setSolicitudAsig(data);
                
            } catch (error) {
                console.error('Error fetching solicitud:', error);
                setError2(error.message);
            } finally {
                setLoading2(false);
            }
        };

        fetchSolicitudAsig();
    }, [id]);

    useEffect(() => {
            const obtenerEventos = async () => {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/visitas`);
                    
                    if (!response.ok) {
                        throw new Error(`Error: ${response.status} ${response.statusText}`);
                    }
    
                    const data = await response.json();
                    setDatosVisita(data);
                } catch (error) {
                    console.error('Error al obtener los datos de visita:', error);
                    setError2(error.message);
                } finally {
                    setLoading2(false);
                }
            };
    
            obtenerEventos();
        }, [codigo]);
    
        if (loading2) {
            return <div>Cargando...</div>;
        }
    
        if (error2) {
            return <div>Error al cargar los datos de visita: {error2}</div>;
        }
    
        if (!visitas) {
            return <div>No se encontraron datos de visita.</div>;
        }
    

    
    const obtenerVisitas = async () => {
        if (!codigo) {
            console.error('El código de solicitud no está definido');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/visitas?codigo=${codigo}`);
            setDatosVisita(response.data);
        } catch (error) {
            console.error('Error al obtener las visitas:', error);
        }
    };
    
    const toggleModal = () => {
        setOpen2(!open2);
        if (!open2) {
            obtenerVisitas(); // Cargar visitas al abrir el modal
        }
    };

    const handleVisitaClick = (visita) => {
        setSelectedVisita(visita);
    };

    
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
    {visitas
        .filter(evento => evento.codigo_solicitud === solicitudAsigTec.codigo_solicitud) // Filtra las visitas
        .map(evento => (
            <li key={evento.id_datosvisita}>
                {evento.codigo_solicitud}{evento.direccion_cliente}{evento.hora_inicio} - {evento.hora_fin}
            </li>
        ))}
</ul>
        </div>

        <div className="container">
            <Button onClick={toggleModal} className='boton-historialsoli-tec'>Ver Datos de Visitas</Button>
            <Modal className='barra-historialsoli-tec' open={open2} onClose={toggleModal}>
                <div className='div-historialsoli-tec'>
                    <h2 className='h2-historialsoli-tec'>Datos de Visitas</h2>
                    <div className="historial-container">
                        <ul className='ul-historialsoli-tec'>
                            {visitas.length > 0 ? (
                                visitas.map((visita) => (
                                    <li className='li-historialsoli-tec' key={visita.id_datosvisita} onClick={() => handleVisitaClick(visita)}>
                                        <div><span className='cs-historialsoli-tec'>ID:</span>{visita.id_datosvisita}</div>
                                        <div><span className='ce-historialsoli-tec'>Dirección:</span> {visita.direccion_cliente}</div>
                                    </li>
                                ))
                            ) : (
                                <p>No hay datos de visitas disponibles.</p>
                            )}
                        </ul>
                        <div className="details-container">
                            {selectedVisita ? (
                                <>
                                    <h2 className='titulo-dr-tec'>Detalles de la Visita</h2>
                                    <div><strong>ID:</strong> {selectedVisita.id_datosvisita}</div>
                                    <div><strong>Dirección:</strong> {selectedVisita.direccion_cliente}</div>
                                    <div><strong>Días Disponibles:</strong> {selectedVisita.dias_disponibles.join(', ')}</div>
                                    <div><strong>Hora de Inicio:</strong> {selectedVisita.hora_inicio}</div>
                                    <div><strong>Hora de Fin:</strong> {selectedVisita.hora_fin}</div>
                                    <div><strong>Campo Cualquier Hora:</strong> {selectedVisita.campo_cualquierhora}</div>
                                    {/* Agrega más detalles si es necesario */}
                                </>
                            ) : (
                                <p>Selecciona una visita para ver los detalles.</p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
                    
                    </div>   
                    </section>


                </div>
            </div>
        </main>
    );
};

export default VerDatosVisita;