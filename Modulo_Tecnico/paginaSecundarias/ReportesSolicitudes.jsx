import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SeccionReportesSolicitudes = () => {
    const [solicitudComplTec, setReportesSolicitud] = useState([]);
    const [solicitudNoRealizada, setReportesSolicitudNoRealizada] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');



    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchReportesSolicitud = async () => {
            const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", localStorage.getItem("accessToken"));

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLICOMPLETADA}/api/solicomcerr/solicitudComplTec`, { 
                    signal, 
                    headers: {
                        'Authorization': `Bearer ${token}`, 
                    },
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                setReportesSolicitud(data);
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Solicitud abortada');
                } else {
                    console.error('Error fetching solicitudes:', error);
                    setError(error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReportesSolicitud();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchReporteSoliNoRealizado = async () => {
            const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", localStorage.getItem("accessToken"));

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLINOREALIZADA}/api/solino/solicitudNoReTec`, { 
                    signal,
                    headers: {
                        'Authorization': `Bearer ${token}`, 
                    }, 
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                setReportesSolicitudNoRealizada(data);
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Solicitud abortada');
                } else {
                    console.error('Error fetching solicitudes no realizadas:', error);
                    setError(error.message);
                }
            }
        };

        fetchReporteSoliNoRealizado();

        return () => {
            controller.abort();
        };
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredCompletadas = solicitudComplTec.filter(solicitud =>
        (solicitud.tipo_solucion_falla?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.herramientas_utilizadas?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.tiempo_invertido?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.fecha_caso_cerrado?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.id_soli_completada?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.codigo_solicitud?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.codigo_trabajador?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.id_cliente?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.prioridad_solicitud?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.estado_solicitud?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.nro_contrato?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.nombre_cliente?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.apellido_cliente?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.n_tlf_cliente?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.email_cliente?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.codigo_ticket?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitud.motivo_visita?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) 
    );

    const filteredNoRealizadas = solicitudNoRealizada.filter(solicitudno =>
        (solicitudno.id_soli_norealizada?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitudno.motivo_norealizacion?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitudno.comentario_trabajo_norealizado?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitudno.fecha_cierre_norealizado?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (solicitudno.estado_solicitud?.toString().toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div>Cargando solicitudes...</div>;
    }

    if (error) {
        return <div>Error al cargar las solicitudes: {error}</div>;
    }


    return (
        <main className="main-Tec">
            <div className="estado-reporteSolicitudTec-container">
                <div className='div-contenedor-tituloybuscar'>
                    <h2>Reportes de Servicio</h2>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </div>
    
                <div className="estado-reporteSolicitudTec-grid">
                    {filteredCompletadas.length === 0 && filteredNoRealizadas.length === 0 ? (
                        <p>No hay solicitudes que coincidan con la búsqueda.</p>
                    ) : (
                        <>
                            {filteredCompletadas.map(solicitud => (
                                 <Link 
                                 key={solicitud.id_soli_completada} 
                                 to={`/descargarreportes/${solicitud.id_soli_completada}`} 
                                 state={{ solicitud }} // Pasar la solicitud completa
                                 className="estado-reporteSolicitudTec-card"
                             >
                                 <div>
                                     <h3>Código: {solicitud.codigo_solicitud}</h3>
                                     <p>Tipo solución/falla: {solicitud.tipo_solucion_falla}</p>
                                     <p>Cliente: <span className='reporte-atributo-cliente'>{solicitud.nombre_cliente}</span> {solicitud.apellido_cliente}</p>
                                     <p>Estado: {solicitud.estado_solicitud}</p>
                                 </div>
                             </Link>
                            ))}
    
                            {filteredNoRealizadas.map(solicitud => (
                                 <Link 
                                 key={solicitud.id_soli_norealizada} 
                                 to={`/descargarreportes/${solicitud.id_soli_norealizada}`} 
                                 state={{ solicitud }}
                                 className="estado-reporteSolicitudTec-card"
                             >
                                 <div>
                                     <h3>Código: {solicitud.codigo_solicitud}</h3>
                                     <p>Motivo de No Realización: {solicitud.motivo_norealizacion}</p>
                                     <p>Cliente: <span className='reporte-atributo-cliente'>{solicitud.nombre_cliente}</span> {solicitud.apellido_cliente}</p>
                                     <p>Estado: {solicitud.estado_solicitud}</p>
                                 </div>
                             </Link>
                            ))}
                        </>
                    )}
                </div>
            </div>

        </main>
    );
    
};

export default SeccionReportesSolicitudes;