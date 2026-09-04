import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack'; // Importar useSnackbar
import emailjs from "@emailjs/browser"; // Importar EmailJS
import axios from 'axios';

const CierreCasoCompletadoModal = ({ onClose }) => {
    const navigate = useNavigate(); //hook para redirigir
    const { enqueueSnackbar } = useSnackbar(); // Hook para mostrar notificaciones

    // Estado para los campos del formulario
    const [comentarioTrabajo, setComentarioTrabajo] = useState('');
    const [tipoSolucionFalla, setTipoSolucionFalla] = useState('');
    const [herramientasUtilizadas, setHerramientasUtilizadas] = useState('');
    const [datosVisitas, setDatosVisitas] = useState({});
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

    useEffect(() => {
        if (!solicitudAsigTec.codigo_solicitud) {
            console.error('La solicitud no está definida o no tiene codigo_solicitud en visitas');
            return;
        }

        const obtenerEventos = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/datosdeVisitas/${solicitudAsigTec.codigo_solicitud}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Datos de la API:', data);
                console.log("email obtenido:",solicitudAsigTec.email_cliente);
                setDatosVisitas(data);
            } catch (error) {
                console.error('Error al obtener los datos de visita:', error);
                setError(error.message);
                setDatosVisitas([]); // Asegúrate de que visitas sea un array vacío en caso de error
            } finally {
                setLoading(false);
            }
        };
        obtenerEventos();
    }, [solicitudAsigTec.codigo_solicitud]);

    const enviarCorreoFeedback = async (id_soli_completada) => {
        const parametros = {
            email: solicitudAsigTec.email_cliente,
            id_soli_completada: id_soli_completada, // Usar la id_soli_completada correcta
            codigo_trabajador: solicitudAsigTec.codigo_trabajador,
            id_cliente: solicitudAsigTec.id_cliente,
            nombre_cliente: solicitudAsigTec.nombre_cliente,
            apellido_cliente: solicitudAsigTec.apellido_cliente,
            nombre_tecnico: solicitudAsigTec.nombre_tecnico,
            apellido_tecnico: solicitudAsigTec.apellido_tecnico
        };
        try {
            // Enviar el correo
            const responseEmail = await emailjs.send("service_opy9xqi", "template_3h2728c", parametros, "hJb5SgCmx8Bbm8Mwl");
            console.log("✅ Correo enviado:", responseEmail);
            alert("✅ Correo enviado correctamente.");
            // Llamar a la API para guardar la solicitud
            const responseApi = await axios.post(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/guardarSolicitudEsperada`, {
                id_soli_completada: id_soli_completada,
                codigo_trabajador: parametros.codigo_trabajador,
                id_cliente: parametros.id_cliente,
                email: parametros.email,
                nombre_cliente: parametros.nombre_cliente,
                apellido_cliente: parametros.apellido_cliente
            });
            console.log("✅ Solicitud guardada en Google Sheets:", responseApi.data);
        } catch (error) {
            console.error("❌ Error al enviar el correo:", error);
            if (error.response) {
                console.error("Detalles del error de la API:", error.response.data);
            }
            
        }
    };

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
        setCargaDatos(true); // para que muestre el mensaje de envío de formulario

        // Validación de datos
        if (!comentarioTrabajo || !tipoSolucionFalla) {
            setError('Por favor, completa todos los campos requeridos.');
            setCargaDatos(false); // Detener el mensaje de carga
            return; // No envía si hay errores
        }

        const ultimoCambio = await ObtenerUltimoCambioHistorial(solicitudAsigTec.codigo_solicitud);
        const idHistorial = ultimoCambio ? ultimoCambio.id_historial_cambioestado : null;

        const datos = {
            comentario_trabajo_realizado: comentarioTrabajo,
            tipo_solucion_falla: tipoSolucionFalla,
            herramientas_utilizadas: herramientasUtilizadas,
            tiempo_invertido: solicitudAsigTec.tiempo_total,
            // Datos de solicitud
            codigo_solicitud: solicitudAsigTec.codigo_solicitud,
            estado_solicitud: solicitudAsigTec.estado_solicitud,
            // Datos de visita
            id_datosvisita: datosVisitas.id_datosvisita,
            // Historial
            id_historial_cambioestado: idHistorial,
        };

        console.log('datos enviados:', datos);

                try {
                    const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/guardarsolicitudcompleta`, {
                method: 'POST',
                headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,  // <-- Aquí va
    },
                body: JSON.stringify(datos),
            });

            const result = await response.json(); // Leer la respuesta una vez

            if (response.ok) {
                const id_soli_completada = result.solicitud_cerrada_completada.id_soli_completada; // Accede a la id_soli_completada
                // Llamar a enviar correo pasando la id que se generó al guardar la solicitud
                await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/marcarFormularioEnviado`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ codigo_solicitud: solicitudAsigTec.codigo_solicitud }),
                });
                
                await enviarCorreoFeedback(id_soli_completada);

                // Mostrar notificación de éxito
                enqueueSnackbar('Solicitud completada y cerrada exitosamente. Ya puede visualizarla en el apartado de Solicitudes Completadas/Cerradas.', { variant: 'success' });
                
                onClose(); // Cerrar el modal
                navigate('/SolicitudAsig'); // Redirigir a la página de solicitudes
            } else {
                // Mostrar notificación de error
                enqueueSnackbar('Error al cerrar el caso. Intente nuevamente.', { variant: 'error' });
            }

            console.log('Resultado:', result); // Mover esta línea aquí
            setError(null); // Limpiar el mensaje de error
        } catch (error) {
            console.error('Error:', error);
            enqueueSnackbar('Error enviando el formulario de cierre. Verifique su conexión.', { variant: 'error' });
        } finally {
            setCargaDatos(false); // Detener el mensaje de carga
        }

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
                            <label className='subtitulo-form-completado' htmlFor="tipoSolucionFalla">Solución/Falla:</label>
                        </div>

                        <div>
                            <select
                                id="tipoSolucionFalla"
                                value={tipoSolucionFalla}
                                onChange={(e) => setTipoSolucionFalla(e.target.value)}
                                className='input-form-completado'
                                required
                            >
                                <option value="">Seleccione una opción</option>
                                <option value="Config. Equipos">Config. Equipos</option>
                                <option value="Certificación">Certificación</option>
                                <option value="Cambio ONU">Cambio ONU</option>
                                <option value="Cambio Patch Card">Cambio Patch Card</option>
                                <option value="Cambio Conectores">Cambio Conectores</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className='div-contenedor-form-completado'>
                        <div><label className='subtitulo-form-completado' htmlFor="comentarioTrabajo">Comentario del Trabajo realizado:</label></div>

                        <div>
                            <textarea
                                id="comentarioTrabajo"
                                value={comentarioTrabajo}
                                onChange={(e) => setComentarioTrabajo(e.target.value)}
                                rows={4}
                                className='input-form-completado-textaterea'
                                required
                            />
                        </div>
                    </div>

                    <div className='div-contenedor-form-completado-falla'>
                        <div>
                        <label className='subtitulo-form-completado'> Herramientas Utilizadas: </label>
                        </div>

                        <div>
                        <input
                            type="text"
                            value={herramientasUtilizadas}
                            onChange={(e) => setHerramientasUtilizadas(e.target.value)}
                        />
                        </div>
                     </div>
                    

                    <div className='div-contenedor-form-completado-falla'>
                        <div>
                        <label className='subtitulo-form-completado'> Tiempo Invertido (horas): </label>
                        </div>

                        <div>
                        {formatTiempoInvertido(solicitudAsigTec.tiempo_total)}
                        </div>
                    </div>
                    

                    {error && <p style={{ color: 'red' }}>{error}</p>} {/* Mostrar mensaje de error */}

                    <div className='div-contenedor-form-completado-botones'>
                        <button
  type="submit"
  style={{
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    marginRight: '12px',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0056b3')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007bff')}
>
  Guardar Cambios
</button>

<button
  type="button"
  onClick={onClose}
  style={{
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#bdbdbd')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
>
  Cancelar
</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CierreCasoCompletadoModal;