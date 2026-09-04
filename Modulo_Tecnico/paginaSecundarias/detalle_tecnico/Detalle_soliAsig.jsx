import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button, DialogContent, DialogTitle, Modal, Dialog } from '@mui/material';
import ChangeStatusModal from './Cambio_estado_Tec';
import DatosVisitaCliente from './Datos_Visita';
import CierreCasoCompletadoModal from './formularios/Formulario_infoadicional_completado';
import CierreSoliNoRealizadoModal from './formularios/Formulario_infoadicional_norealizado';
import CierreCasoCerradoModal from './formularios/Formulario_infoadicional_cerrado';
import './Datos_Visita.css';
import { useSnackbar } from 'notistack';


const DetalleSolicitudAsigTec = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [solicitudAsigTec, setSolicitudAsig] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [historial, setHistorial] = useState([]);
    const [open, setOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRegistro, setSelectedRegistro] = useState(null);
    const [isContactarModalOpen, setIsContactarModalOpen] = useState(false);
    const [visitas, setDatosVisita] = useState([]);
    const [loading2, setLoading2] = useState(true);
    const [error2, setError2] = useState(null);
    const [mostrarFormularioCompleto, setMostrarFormularioCompleto] = useState(false);
    const [mostrarFormularioCerrado, setMostrarFormularioCerrado] = useState(false);
    const [mostrarFormularioNoRealizado, setMostrarFormularioNoRealizado] = useState(false);

    // ⏱️ Cronómetro -----------------------------------------------------------
    const [elapsedTime, setElapsedTime] = useState('0h 0m');
    const [startTime, setStartTime] = useState(null);          // Marca cuando se inicia / reanuda
    const [accumulated, setAccumulated] = useState(0);         // Tiempo ya transcurrido (ms) cuando el cronómetro está pausado
    const [timerRunning, setTimerRunning] = useState(false);   // Bandera ON/OFF
const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const controller = new AbortController(); // Crear un AbortController
        const signal = controller.signal; // Obtener la señal

        const fetchSolicitudAsig = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/solicitudAsigTec/${id}`, { signal });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setSolicitudAsig(data);
                console.log("email obtenido:",solicitudAsigTec.email_cliente);
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
        if (solicitudAsigTec.estado_solicitud === 'Completado') {
            setMostrarFormularioCompleto(true);
        }
    }, [solicitudAsigTec.estado_solicitud]);

    useEffect(() => {
        if (solicitudAsigTec.estado_solicitud === 'Cerrado') {
            setMostrarFormularioCerrado(true);
        }
    }, [solicitudAsigTec.estado_solicitud]);



    useEffect(() => {
        if (solicitudAsigTec.estado_solicitud === 'No Realizado') {
            setMostrarFormularioNoRealizado(true);
        }
    }, [solicitudAsigTec.estado_solicitud]);

    useEffect(() => {
        const controller = new AbortController(); // Crear un AbortController
        const signal = controller.signal; // Obtener la señal

        const obtenerEventos = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/visitas`, { signal });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
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

    const formatearFecha = (fecha) => {
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const año = date.getFullYear();
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    };


        

    const handleEstadoChange = async (nuevoEstado) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/actualizarEstado`, {
                method: 'POST',
                headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,  // <-- Aquí va
    },
                body: JSON.stringify({
                    codigo_solicitud: solicitudAsigTec.codigo_solicitud,
                    estado_solicitud: nuevoEstado,
                    razon_cambioestado: nuevoEstado === 'En Proceso' ? 'Solicitud empezada' : 'Solicitud No Realizada',
                }),
            });

            if (!response.ok) throw new Error('Error al actualizar el estado de la solicitud');

            setSolicitudAsig(prev => ({ ...prev, estado_solicitud: nuevoEstado }));
            enqueueSnackbar(`Solicitud actualizada a ${nuevoEstado}`, { variant: 'success' });

            /* ⏲️ Lógica de pausa / reanudación ----------------------------- */
            if (nuevoEstado === 'En Proceso') {
                // ▶️ Reanuda (o inicia) el cronómetro
                if (!timerRunning) {
                    setStartTime(Date.now());                 // Arranque base temporal
                    setTimerRunning(true);
                }
                // Si veníamos de "Pendiente" retomamos donde quedó
                if (!timerRunning && startTime === null && accumulated > 0) {
                    setStartTime(Date.now());
                    setTimerRunning(true);
                }
            } else if (nuevoEstado === 'Pendiente') {
                // ⏸️ Pausa *sin* perder lo ya contado
                if (timerRunning) {
                    const session = Date.now() - startTime;   // ms de la sesión actual
                    setAccumulated(prev => prev + session);   // sumamos al acumulado
                    setTimerRunning(false);
                    setStartTime(null);
                }
            } else if (nuevoEstado === 'Completado' || nuevoEstado === 'Cerrado') {
                // ⏹️ Detiene definitivamente y fija el tiempo total
                let total = accumulated;
                if (timerRunning) total += Date.now() - startTime;
                const h = Math.floor(total / 3_600_000);
                const m = Math.floor((total % 3_600_000) / 60_000);
                setElapsedTime(`${h}h ${m}m`);
                setTimerRunning(false);
                setStartTime(null);
                setAccumulated(total); // queda por si se necesita guardar
            }
        } catch (error) {
            console.error('Error actualizando el estado de la solicitud:', error);
            enqueueSnackbar('Error al actualizar el estado de la solicitud', { variant: 'error' }); // ❌
        }
    };

    const handleAutoConfirmado = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/actualizarEstado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_solicitud: solicitudAsigTec.codigo_solicitud,
        estado_solicitud: 'Confirmado',
        razon_cambioestado: 'Visita registrada automáticamente'
      }),
    });
    if (!response.ok) throw new Error('Error en la API');
    
    // Actualización local del estado (sin recargar)
    setSolicitudAsig(prev => ({ ...prev, estado_solicitud: 'Confirmado' }));
            enqueueSnackbar('Solicitud confirmada automáticamente', { variant: 'info' }); // ℹ️
        console.log("Estado actualizado a Confirmado automáticamente");
    } catch (error) {
        console.error("Error en handleAutoConfirmado:", error);
        
        // Puedes agregar notificaciones al usuario aquí
    }
    };



    const updateLocalState = (nuevoEstado) => {
        setSolicitudAsig({ ...solicitudAsigTec, estado_solicitud: nuevoEstado });
    };

    const obtenerHistorial = async () => {// parte para obtener historial
        if (!solicitudAsigTec || !solicitudAsigTec.codigo_solicitud) {
            console.error('La solicitud no está definida o no tiene codigo_solicitud');
            return; // Salir si solicitudAsigTec no está definido
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/historial/${solicitudAsigTec.codigo_solicitud}`);
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

    const obtenerVisitas = async () => {
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
            setDatosVisita([]); // Asegúrate de que visitas sea un array vacío en caso de error
        }
    };

    const handleDatosVisitaSubmit = async (nuevaVisita) => {
    try {
        // 1. Verificar si ya existe un dato de visita para esta solicitud
        const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/datosdeVisitas/${solicitudAsigTec.codigo_solicitud}`);
        const visitaExistente = await response.json();

        let res;

        if (visitaExistente && visitaExistente.codigo_solicitud === solicitudAsigTec.codigo_solicitud) {
            // Ya existe → actualiza con PUT
            res = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/datosvisita/${solicitudAsigTec.codigo_solicitud}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaVisita)
            });
        } else {
            // No existe → crea con POST
            res = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/datosvisita`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaVisita)
            });
        }

        if (!res.ok) throw new Error('Error al guardar los datos de visita');

        // Refrescar estado local
        await obtenerVisitas();
        setIsContactarModalOpen(false);
        enqueueSnackbar('Datos de visita guardados correctamente', { variant: 'success' });

        if (solicitudAsigTec?.estado_solicitud === 'asignado') {
            await handleAutoConfirmado();
        }

    } catch (error) {
        console.error('Error al registrar o actualizar datos de visita:', error);
        enqueueSnackbar('Error al guardar los datos de visita', { variant: 'error' });
    }
};









    console.log("email obtenido:",solicitudAsigTec.email_cliente);

    console.log('Tipo de visitas:', Array.isArray(visitas), visitas); // Verifica si es un array



    const visitasFiltradas = Array.isArray(visitas)
  ? visitas.filter(v => String(v.codigo_solicitud) === String(solicitudAsigTec.codigo_solicitud))
   : [];
 const visitaExistente = visitasFiltradas[0] || null;


    useEffect(() => {
        if (!timerRunning || !startTime) return;

        const interval = setInterval(() => {
            const diff = Date.now() - startTime;               // ms desde el último arranque / reanudación
            const total = accumulated + diff;                  // ms totales (incluye lo acumulado antes de esta sesión)
            const h = Math.floor(total / 3_600_000);
            const m = Math.floor((total % 3_600_000) / 60_000);
            setElapsedTime(`${h}h ${m}m`);
        }, 60_000); // ↻ cada minuto

        return () => clearInterval(interval);
    }, [timerRunning, startTime, accumulated]);

    

    
    if (solicitudAsigTec === null) {
        return <div>Cargando solicitud...</div>; // Mensaje de carga
    }
    
    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar la solicitud: {error}</div>;
    }

    if (!solicitudAsigTec) {
        return <div>No se encontró la solicitudAsigTec.</div>;
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
    <main className="main-Tec">
        <div className="container">
            <div className='div-contenedor-botonvolver-solicitudAsigTec'>
                
            </div>

            <div className="detalle-solicitudAsigTec-conteiner">
                <button className='Boton-volver' onClick={() => navigate(-1)}>Volver</button>
                <h2 className="detalle-solicitudAsigTec-titulo">Detalle de la Solicitud</h2>
                <div className="detalle-solicitudAsigTec-card">
                    <div className="detalle-solicitudAsigTec-parte-sup">
                        <p><span className="negrita">ID:</span> {solicitudAsigTec.codigo_ticket}</p>
                        <p><span className="negrita">Fecha C.:</span> {formatearFecha(solicitudAsigTec.fecha_solicitud)}</p>
                    </div>
                    <p className="detalle-solicitudAsigTec-parte-centro">Datos Solicitud</p>
                    <div className="detalle-solicitudAsigTec-parte-baja">
                        <p><span className="negrita">Técnico encargado:</span> {solicitudAsigTec.nombre_tecnico} {solicitudAsigTec.apellido_tecnico}</p>
                        <p><span className="negrita">Cliente:</span> <Link to={`/cliver/vercliente/${solicitudAsigTec.id_cliente}`}>{solicitudAsigTec.nombre_cliente} {solicitudAsigTec.apellido_cliente}</Link></p>
                        <p><span className="negrita">Motivo de Visita:</span> {solicitudAsigTec.motivo_visita}</p>
                        <p><span className="negrita">Descripción del Servicio:</span></p>
                        <p className="detalle-solicitudAsigTec-descripcion">{solicitudAsigTec.descripcion_servicio}</p>
                        <p><span className="negrita">Estado:</span> {solicitudAsigTec.estado_solicitud}</p>
                        <p><span className="negrita">Prioridad:</span> {solicitudAsigTec.prioridad_solicitud}</p>
                        <div >
                
            </div>
                    </div>

                    <div className='conteiner-Boton-cambioestado'>
                        {(solicitudAsigTec.estado_solicitud === 'asignado' || solicitudAsigTec.estado_solicitud === 'Confirmado') && (
                            <div className='conteiner-Boton-cambioestado-i'>
                                <button className='Boton-cambioestado' onClick={() => handleEstadoChange('En Proceso')} disabled={visitasFiltradas.length === 0}
                                    title={visitasFiltradas.length === 0 ? "Debe registrar datos de visita para empezar" : ""}>Empezar</button>
                                <button className='Boton-cambioestado' onClick={() => handleEstadoChange('No Realizado')} disabled={visitasFiltradas.length > 0}
                                    title={visitasFiltradas.length > 0 ? "No puede seleccionar No Realizado cuando hay datos de visita" : ""}>No realizado</button>
                            </div>
                        )}
                        {(solicitudAsigTec.estado_solicitud !== 'asignado' && solicitudAsigTec.estado_solicitud !== 'Confirmado') && (
                            <button className='Boton-cambioestado' onClick={() => setIsModalOpen(true)}>Cambiar Estado</button>
                        )}
                    </div>

                    <Dialog open={isModalOpen}>
                        <DialogTitle className='form-cambioestado-titulo'>Cambiar Estado de Solicitud</DialogTitle>
                        <DialogContent>
                            <ChangeStatusModal 
                                codigo_solicitud={solicitudAsigTec.codigo_solicitud} 
                                onClose={() => setIsModalOpen(false)} 
                                onEstadoChange={updateLocalState} 
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={mostrarFormularioCompleto}>
                        <DialogTitle className='form-completado-titulo'>Cierre de Solicitud Completada</DialogTitle>
                        <DialogContent>
                            <CierreCasoCompletadoModal 
                                id_historial_cambioestado={solicitudAsigTec.id_historial_cambioestado} 
                                id_datosvisita={solicitudAsigTec.id_datosvisita} 
                                estado_solicitud={solicitudAsigTec.estado_solicitud} 
                                codigo_solicitud={solicitudAsigTec.codigo_solicitud} 
                                onClose={() => setMostrarFormularioCompleto(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={mostrarFormularioCerrado}>
                        <DialogTitle className='form-completado-titulo'>Solicitud Cerrada</DialogTitle>
                        <DialogContent>
                            <CierreCasoCerradoModal 
                                id_historial_cambioestado={solicitudAsigTec.id_historial_cambioestado} 
                                id_datosvisita={solicitudAsigTec.id_datosvisita} 
                                estado_solicitud={solicitudAsigTec.estado_solicitud} 
                                codigo_solicitud={solicitudAsigTec.codigo_solicitud} 
                                onClose={() => setMostrarFormularioCerrado(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={mostrarFormularioNoRealizado}>
                        <DialogTitle className='form-completado-titulo'>Cierre de Solicitud No Realizada</DialogTitle>
                        <DialogContent>
                            <CierreSoliNoRealizadoModal 
                                id_historial_cambioestado={solicitudAsigTec.id_historial_cambioestado} 
                                estado_solicitud={solicitudAsigTec.estado_solicitud} 
                                codigo_solicitud={solicitudAsigTec.codigo_solicitud} 
                                onClose={() => setMostrarFormularioNoRealizado(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    {successMessage && <p className='form-success-AS'>{successMessage}</p>}
                </div>

                <section className='Datosvisita-conteiner'>
                    <div className='Datosvisita-card'>
                        <h2 className='Datosvisita-titulo'>Datos de Visita</h2>
                        <div>
                            {visitasFiltradas.length > 0 ? (
                                visitasFiltradas.map(evento => (
                                    <section key={evento.id_datosvisita}>
                                        <div><span className="negrita">Días disponibles:</span> {evento.dias_disponibles}</div>
                                        <div><span className="negrita">Dirección:</span> {solicitudAsigTec.direccion_cliente}</div>
                                        <div><span className="negrita">Comentario:</span> {evento.comentario_datosvisita}</div>
                                    </section>
                                ))
                            ) : (
                                <p>No hay información de registro aún</p>
                            )}
                        </div>
                        <div className='Datosvisita-boton-conteiner'>
                           
                            <button onClick={() => setIsContactarModalOpen(true)} className='Datosvisita-boton'>
    {visitaExistente ? 'Editar datos del Cliente' : 'Registrar datos del Cliente'}
</button>
                        </div>
                    </div>
                </section>

                <DatosVisitaCliente 
                    isOpen={isContactarModalOpen} 
                    onClose={() => setIsContactarModalOpen(false)} 
                    onSubmit={handleDatosVisitaSubmit} 
                    solicitudAsigTec={solicitudAsigTec}
                    visitaExistente={visitaExistente} 
                />

                <div className="container">
                    <Button onClick={toggleSidebar} className='boton-historialsoli-tec'>Ver Historial</Button>
                

                <Modal  className='barra-historialsoli-tec' open={open} onClose={toggleSidebar}>
                <div className='div-historialsoli-tec'>
                    <h2 className='h2-historialsoli-tec'>Historial de Solicitudes</h2>
                    <div className="historial-container">
                        <ul className='ul-historialsoli-tec'>
                            {historial.length > 0 ? (
                                historial.map((registro) => (
                                    <li className='li-historialsoli-tec' key={registro.codigo_solicitud} onClick={() => handleRegistroClick(registro)}>
                                        <div><span className='cs-historialsoli-tec'>ID:</span>{registro.codigo_ticket}</div>
                                        <div><span className='ce-historialsoli-tec'>Cambio de estado:</span> {registro.estado_solicitud}</div>
                                    </li>
                                ))
                            ) : (
                                <p>No hay historial disponible.</p>
                            )}
                        </ul>
                        <div className="details-container">
                            {selectedRegistro ? (
                                <>
                                    <h2 className='titulo-dr-tec'>Detalles del Reporte</h2>
                                    <div><strong>ID:</strong> {selectedRegistro.codigo_ticket}</div>
                                    <div><strong>Fecha:</strong> {new Date(selectedRegistro.fecha_historial_cambioestado).toLocaleString()}</div>
                                    <div><strong>Cambio de estado:</strong> {selectedRegistro.estado_solicitud}</div>
                                    <div><strong>Razón:</strong> {selectedRegistro.razon_cambioestado}</div>
                                    {/* Agrega más detalles si es necesario */}
                                </>
                            ) : (
                                <p>Selecciona un registro para ver los detalles.</p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>

                </div>
            </div>
        </main>
    );
};

export default DetalleSolicitudAsigTec;