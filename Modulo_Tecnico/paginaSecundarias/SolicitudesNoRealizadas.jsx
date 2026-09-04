import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const SolicitudNoRealizadaApartado = () => {
    const [solicitudNoRealizada, setSoliNoRealizada] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFiltros, setShowFiltros] = useState(false);

    // Filtros avanzados con persistencia en sessionStorage
    const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
        const guardado = sessionStorage.getItem("filtrosAvanzadosSolicitudes");
        return guardado
            ? JSON.parse(guardado)
            : {
                codigoTicket: '',
                nroContrato: '',
                nombreApellidoCliente: '',
                nombreApellidoTecnico: '',
                motivoNoRealizacion: '',
                motivo: '',
                prioridad: '',
                fechaDesde: '',
                fechaHasta: '',
            };
    });

    useEffect(() => {
        sessionStorage.setItem("filtrosAvanzadosSolicitudes", JSON.stringify(filtrosAvanzados));
    }, [filtrosAvanzados]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchSolicitudNoRealizada = async () => {
            const token = localStorage.getItem("token");
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
                        'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                setSoliNoRealizada(data);
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Solicitud abortada');
                } else {
                    setError(error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSolicitudNoRealizada();

        return () => {
            controller.abort();
        };
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleChange = (e) => {
    const { name, value } = e.target;

    // Validaciones por campo
    if (name === "codigoTicket" && !/^[a-zA-Z0-9-]*$/.test(value)) return; // Solo letras, números y guiones
    if (name === "nroContrato" && !/^\d*$/.test(value)) return; // Solo números
    if (name === "nombreApellidoCliente" && !/^[a-zA-ZÀ-ÿ\s]*$/.test(value)) return; // Solo letras y espacios

    setFiltrosAvanzados(prev => ({
        ...prev,
        [name]: value,
    }));
};


    const normalize = useCallback(
        (v) =>
            String(v ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase(),
        []
    );

    // Filtrado combinado: búsqueda libre + filtros avanzados
    const filteredSolicitudes = solicitudNoRealizada.filter((solicitud) => {
        const libre = normalize(searchTerm);

        const nombreCliente = normalize(`${solicitud.nombre_cliente ?? ''} ${solicitud.apellido_cliente ?? ''}`);
        const nombreTecnico = normalize(`${solicitud.nombre_tecnico ?? ''} ${solicitud.apellido_tecnico ?? ''}`);
        const nombreTecInv = normalize(`${solicitud.apellido_tecnico ?? ''} ${solicitud.nombre_tecnico ?? ''}`);
        const nombreCliInv = normalize(`${solicitud.apellido_cliente ?? ''} ${solicitud.nombre_cliente ?? ''}`);
        const fecha = solicitud.fecha_cierre_norealizado?.slice(0, 10) ?? '';

        const hitLibre =
            normalize(solicitud.codigo_solicitud ?? '').includes(libre) ||
            normalize(solicitud.codigo_trabajador ?? '').includes(libre) ||
            normalize(solicitud.id_cliente ?? '').includes(libre) ||
            normalize(solicitud.codigo_ticket ?? '').includes(libre) ||
            nombreCliente.includes(libre) ||
            nombreTecnico.includes(libre) ||
            nombreTecInv.includes(libre) ||
            nombreCliInv.includes(libre) ||
            normalize(solicitud.motivo_visita ?? '').includes(libre) ||
            normalize(solicitud.motivo_visita ?? "").includes(libre) ||
            normalize(solicitud.motivo_norealizacion ?? '').includes(libre) ||
            normalize(solicitud.prioridad_solicitud ?? '').includes(libre);

        const f = filtrosAvanzados;

        const ok =
            (!f.codigoTicket || normalize(solicitud.codigo_ticket ?? '').includes(normalize(f.codigoTicket))) &&
            (!f.nroContrato || normalize(solicitud.codigo_solicitud ?? '').includes(normalize(f.nroContrato))) &&
            (!f.nombreApellidoCliente || nombreCliente.includes(normalize(f.nombreApellidoCliente)) || nombreCliInv.includes(normalize(f.nombreApellidoCliente))) &&
            (!f.nombreApellidoTecnico || nombreTecnico.includes(normalize(f.nombreApellidoTecnico)) || nombreTecInv.includes(normalize(f.nombreApellidoTecnico))) &&
            (!f.motivoNoRealizacion || normalize(solicitud.motivo_norealizacion ?? '').includes(normalize(f.motivoNoRealizacion))) &&
             (!f.motivo || normalize(solicitud.motivo_visita ?? "").includes(normalize(f.motivo))) &&
            (!f.prioridad || normalize(solicitud.prioridad_solicitud ?? '').includes(normalize(f.prioridad))) &&
            (!f.fechaDesde || fecha >= f.fechaDesde) &&
            (!f.fechaHasta || fecha <= f.fechaHasta);

        return hitLibre && ok;
    });

    if (loading) return <div>Cargando solicitudes...</div>;
    if (error) return <div>Error al cargar las solicitudes: {error}</div>;

    return (
        <main className="main-adm">
            <div className="estado-solicitudes-container">

                <div className="encabezado-titulo encabezado-titulo-ticket">
                <h2>Solicitudes No Realizadas</h2>

                <section style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                        style={{ marginRight: '10px' }}
                    />

                    <div className="contenedor-filtros-avanzados">
                    <button
                        type="button"
                        onClick={() => setShowFiltros(!showFiltros)}
                        className="btn-toggle-filtros"
                    >
                        {showFiltros ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
                    </button>


                     {showFiltros && (
                    <div className="filtros-avanzados-container" style={{ marginBottom: '20px' }}>
                        <label htmlFor="codigoTicket">Código Ticket:</label>
                        <input
                            type="text"
                            id="codigoTicket"
                            name="codigoTicket"
                            placeholder="Ej: TCK123"
                            value={filtrosAvanzados.codigoTicket}
                            onChange={handleChange}
                            className="input-filtro"
                        />

                        <label htmlFor="nroContrato">Número de Contrato:</label>
                        <input
                            type="text"
                            id="nroContrato"
                            name="nroContrato"
                            placeholder="Ej: CNT456"
                            value={filtrosAvanzados.nroContrato}
                            onChange={handleChange}
                            className="input-filtro"
                        />

                        <label htmlFor="nombreApellidoCliente">Nombre / Apellido Cliente:</label>
                        <input
                            type="text"
                            id="nombreApellidoCliente"
                            name="nombreApellidoCliente"
                            placeholder="Ej: Juan Pérez"
                            value={filtrosAvanzados.nombreApellidoCliente}
                            onChange={handleChange}
                            className="input-filtro"
                        />


                        <label htmlFor="motivoNoRealizacion">Motivo de No Realización:</label>
                            <select
                            name="motivoNoRealizacion"
                            value={filtrosAvanzados.motivoNoRealizacion}
                            onChange={handleChange}
                            className="input-filtro"
                            >
                            <option value="">Filtrar por Motivo No Realizacion</option>
                            <option value="Con Servicio">Con Servicio</option>
                            <option value="No Atiende">No Atiende</option>
                            <option value="Reprogramado">Reprogramado</option>
                            <option value="Quedo en avisar">Quedo en avisar</option>
                            </select>
                                                
                            <select
                        name="motivo"
                        value={filtrosAvanzados.motivo}
                        onChange={handleChange}
                        className="input-filtro"
                        >
                        <option value="">Seleccione un motivo</option>
                        <option value="Sin servicio">Sin servicio</option>
                        <option value="Intermitencia">Intermitencia</option>
                        <option value="Lentitud">Lentitud</option>
                        <option value="Certificación">Certificación</option>
                        <option value="Posible corte de fibra">Posible corte de fibra</option>
                        <option value="Plan condominio caído">Plan condominio caído</option>
                        <option value="LOSS">LOSS</option>
                        <option value="Revisión">Revisión</option>
                        </select>

                        <label htmlFor="prioridad">Prioridad:</label>
                            <select
                            name="prioridad"
                            value={filtrosAvanzados.prioridad}
                            onChange={handleChange}
                            className="input-filtro"
                            >
                            <option value="">Filtrar por prioridad</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                            </select>

                        <label htmlFor="fechaDesde">Fecha Desde:</label>
                        <input
                            type="date"
                            id="fechaDesde"
                            name="fechaDesde"
                            value={filtrosAvanzados.fechaDesde}
                            onChange={handleChange}
                            className="input-filtro"
                        />

                        <label htmlFor="fechaHasta">Fecha Hasta:</label>
                        <input
                            type="date"
                            id="fechaHasta"
                            name="fechaHasta"
                            value={filtrosAvanzados.fechaHasta}
                            onChange={handleChange}
                            className="input-filtro"
                        />

                        <button
                            type="button"
                            onClick={() => {
                                setFiltrosAvanzados({
                                    codigoTicket: '',
                                    nroContrato: '',
                                    nombreApellidoCliente: '',
                                    nombreApellidoTecnico: '',
                                    motivoNoRealizacion: '',
                                    prioridad: '',
                                    fechaDesde: '',
                                    fechaHasta: '',
                                });
                                setSearchTerm('');
                            }}
                            style={{ marginTop: '10px' }}
                            className="btn-limpiar-filtros"
                        >
                            Limpiar filtros y búsqueda
                        </button>
                    </div>
                )}
                </div>

                </section>
                </div>

               

                <div className="estado-solicitudes-grid">
                    {filteredSolicitudes.length === 0 ? (
                        <p>No hay solicitudes no realizadas que coincidan con la búsqueda.</p>
                    ) : (
                        filteredSolicitudes.map(solicitud => (
                            <div key={solicitud.id_soli_completada} className="estado-solicitudes-card">
                                <h3>Servicio ID: <Link to={`/solicitudNoReTec/${solicitud.codigo_solicitud}`}>{solicitud.codigo_ticket}</Link></h3>
                                <p>Técnico encargado: {solicitud.codigo_trabajador}</p>
                                <p>Cliente: {solicitud.id_cliente}</p>
                                <p>Estado: {solicitud.estado_solicitud}</p>
                                <p>Prioridad: {solicitud.prioridad_solicitud}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
};

export default SolicitudNoRealizadaApartado;
