import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack'; // Importar useSnackbar

const CierreSoliNoRealizadoModal = ({ onClose }) => {
    const navigate = useNavigate(); // Hook para redirigir
    const { enqueueSnackbar } = useSnackbar(); // Hook para mostrar notificaciones

    // Estado para los campos del formulario
    const [comentarioNoRealizado, setComentarioNoRealizado] = useState('');
    const [motivoNoRealizado, setMotivoNoRealizado] = useState('');
    const [solicitudAsigTec, setSolicitudAsigTec] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cargaDatos, setCargaDatos] = useState(false);

    const { id } = useParams(); // Asegúrate de que id esté definido en la URL

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const fetchSolicitudAsig = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/solicitudAsigTec/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                
                if (isMounted) {
                    setSolicitudAsigTec(data);
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

    const ObtenerUltimoCambioHistorial = async (codigo_solicitud) => {
        try {
            const historialresponse = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/historial/todos/${codigo_solicitud}`);
            if (!historialresponse.ok) {
                throw new Error(`Error: ${historialresponse.status} ${historialresponse.statusText}`);
            }
            const historialData = await historialresponse.json();
            console.log('Historial:', historialData);
            return historialData[0];
        } catch (error) {
            console.error('Error al obtener los últimos cambios:', error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setCargaDatos(true); // Para que muestre el mensaje de envío de formulario

        // Validación de datos
        if (!comentarioNoRealizado || !motivoNoRealizado) {
            setError('Por favor, completa todos los campos requeridos.');
            setCargaDatos(false); // Detener el mensaje de carga
            return; // No envía si hay errores
        }

        const ultimoCambio = await ObtenerUltimoCambioHistorial(solicitudAsigTec.codigo_solicitud);
        const idHistorial = ultimoCambio ? ultimoCambio.id_historial_cambioestado : null;

        const datos = {
            comentario_trabajo_norealizado: comentarioNoRealizado,
            motivo_norealizacion: motivoNoRealizado,
            // Datos de solicitud
            codigo_solicitud: solicitudAsigTec.codigo_solicitud,
            estado_solicitud: solicitudAsigTec.estado_solicitud,
            // Historial
            id_historial_cambioestado: idHistorial,
        };

        console.log('datos enviados:', datos);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/guardarsolicitudnorealizada`, {
                method: 'POST',
                headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,  // <-- Aquí va
    },
                body: JSON.stringify(datos),
            });

            if (response.ok) {
                // Mostrar notificación de éxito

                await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/marcarFormularioEnviado`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ codigo_solicitud: solicitudAsigTec.codigo_solicitud }),
                });
                
                enqueueSnackbar('Solicitud cerrada exitosamente. Ya puede visualizarla en el apartado de Solicitudes No Realizadas.', { variant: 'success' });
                
                onClose(); // Cerrar el modal
                navigate('/SolicitudAsig'); // Redirigir a la página de solicitudes
            } else {
                // Mostrar notificación de error
                enqueueSnackbar('Error al cerrar el caso. Intente nuevamente.', { variant: 'error' });
            }
            const result = await response.json();
            console.log('Resultado:', result);
            setError(null); // Limpiar el mensaje de error
        } catch (error) {
            console.error('Error:', error);
            enqueueSnackbar('Error enviando el formulario de cierre. Verifique su conexión.', { variant: 'error' });
        } finally {
            setCargaDatos(false); // Detener el mensaje de carga
        }
    };

    if (error) {
        return (
            <div>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={onClose}>Cerrar</button> {/* Botón de cerrar cuando hay un error */}
            </div>
        );
    }

    if (error) {
        return <div>Error al cargar la solicitud: {error}</div>;
    }

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="modal">
            {cargaDatos ? (
                <h2>Cerrando la Solicitud, por favor espere...</h2>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className='div-contenedor-form-completado-parte-superior'>
                        <label><span className='subtitulo-form-completado'>Solicitud: </span>{solicitudAsigTec.codigo_ticket || 'Sin codigo'}</label>
                        <label><span className='subtitulo-form-completado'>Estado: </span>{solicitudAsigTec.estado_solicitud}</label>
                    </div>

                    <div className='form-completado-parte-centro'></div>
                    
                    <div className='div-contenedor-form-completado-falla'>
                        <div>
                            <label className='subtitulo-form-completado' htmlFor="motivoNoRealizado">Motivo de No Realización:</label>
                        </div>

                        <div>
                            <select
                                id="motivoNoRealizado"
                                value={motivoNoRealizado}
                                onChange={(e) => setMotivoNoRealizado(e.target.value)}
                                className='input-form-completado'
                                required
                            >
                                <option value="">Seleccione una opción</option>
                                <option value="Con Servicio">Con Servicio</option>
                                <option value="No Atiende">No Atiende</option>
                                <option value="Reprogramado">Reprogramado</option>
                                <option value="Quedo en avisar">Quedo en avisar</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className='div-contenedor-form-completado'>
                        <div><label className='subtitulo-form-completado' htmlFor="comentarioNoRealizado">Comentario del Trabajo No Realizado:</label></div>

                        <div>
                            <textarea
                                id="comentarioNoRealizado"
                                value={comentarioNoRealizado}
                                onChange={(e) => setComentarioNoRealizado(e.target.value)}
                                rows={4}
                                className='input-form-completado-textaterea'
                                required
                            />
                        </div>
                    </div>

                    {error && <p style={{ color: 'red' }}>{error}</p>} {/* Mostrar mensaje de error */}

                    <div className='div-contenedor-form-completado-botones'>
    <button
        type="submit"
        style={{
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '1rem'
        }}
    >
        Guardar Cambios
    </button>
    <button
        type="button"
        onClick={onClose}
        style={{
            backgroundColor: '#ccc',
            color: '#333',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            cursor: 'pointer'
        }}
    >
        Cancelar
    </button>
</div>

                </form>
            )}
        </div>
    );
};

export default CierreSoliNoRealizadoModal;