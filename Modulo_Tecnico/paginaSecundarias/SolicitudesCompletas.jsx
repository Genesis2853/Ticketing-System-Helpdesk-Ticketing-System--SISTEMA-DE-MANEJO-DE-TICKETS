import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const ApartadoSolicitudCompletada = () => {
    const [solicitudCompletada, setSoliCompletada] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda

    const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
        const guardado = sessionStorage.getItem("filtrosAvanzadosSolicitudes");
        return guardado
            ? JSON.parse(guardado)
            : {
                codigoTicket: "",
                nroContrato: "",
                nombreApellidoCliente: "",
                nombreApellidoTecnico: "",
                motivo: "",
                tipoFalla: "",
                prioridad: "",
                fechaDesde: "",
                fechaHasta: "",
            };
    });

    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    useEffect(() => {
        sessionStorage.setItem(
            "filtrosAvanzadosSolicitudes",
            JSON.stringify(filtrosAvanzados)
        );
    }, [filtrosAvanzados]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchSolicitudCompletada = async () => {
            const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", token);

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
                        'Content-Type': 'application/json'
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log("Datos recibidos de la API:", data);

                data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                setSoliCompletada(data);
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

        fetchSolicitudCompletada();

        return () => {
            controller.abort();
        };
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFiltroChange = (e) => {
  const { name, value } = e.target;

  // Validar según el campo
  if (name === "codigoTicket" && !/^[a-zA-Z0-9-]*$/.test(value)) return; // letras, números y guiones
  if (name === "nroContrato" && !/^\d*$/.test(value)) return; // solo números
  if (name === "nombreApellidoCliente" && !/^[a-zA-ZÀ-ÿ\s]*$/.test(value)) return; // solo letras y espacios

  setFiltrosAvanzados((prev) => ({ ...prev, [name]: value }));
};


    const normalize = useCallback(
        (v) =>
            String(v ?? "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase(),
        []
    );

    const filteredSolicitudes = solicitudCompletada.filter((s) => {
        const libre = normalize(searchTerm);

        const nombreCliente = normalize(`${s.nombre_cliente ?? ""} ${s.apellido_cliente ?? ""}`);
        const nombreTecnico = normalize(`${s.nombre_tecnico ?? ""} ${s.apellido_tecnico ?? ""}`);
        const nombreTecInv = normalize(`${s.apellido_tecnico ?? ""} ${s.nombre_tecnico ?? ""}`);
        const nombreCliInv = normalize(`${s.apellido_cliente ?? ""} ${s.nombre_cliente ?? ""}`);
        const fecha = s.fecha_caso_cerrado?.slice(0, 10) ?? "";

        /* --- búsqueda libre --- */
        const hitLibre =
            normalize(s.codigo_solicitud).includes(libre) ||
            normalize(s.codigo_ticket).includes(libre) ||
            normalize(s.codigo_trabajador).includes(libre) ||
            normalize(s.id_cliente).includes(libre) ||
            nombreCliente.includes(libre) ||
            nombreTecnico.includes(libre) ||
            nombreTecInv.includes(libre) ||
            nombreCliInv.includes(libre) ||
            normalize(s.motivo_visita).includes(libre) ||
            normalize(s.tipo_solucion_falla).includes(libre) ||
            normalize(s.prioridad_solicitud).includes(libre);

        /* --- filtros avanzados --- */
        const f = filtrosAvanzados;
        const ok =
            (!f.codigoTicket || normalize(s.codigo_ticket).includes(normalize(f.codigoTicket))) &&
            (!f.nroContrato || normalize(s.codigo_solicitud).includes(normalize(f.nroContrato))) &&
            (!f.nombreApellidoCliente ||
                nombreCliente.includes(normalize(f.nombreApellidoCliente)) ||
                nombreCliInv.includes(normalize(f.nombreApellidoCliente))) &&
            (!f.nombreApellidoTecnico ||
                nombreTecnico.includes(normalize(f.nombreApellidoTecnico)) ||
                nombreTecInv.includes(normalize(f.nombreApellidoTecnico))) &&
            (!f.motivo || normalize(s.motivo_visita).includes(normalize(f.motivo))) &&
            (!f.tipoFalla || normalize(s.tipo_solucion_falla).includes(normalize(f.tipoFalla))) &&
            (!f.prioridad || normalize(s.prioridad_solicitud).includes(normalize(f.prioridad))) &&
            (!f.fechaDesde || fecha >= f.fechaDesde) &&
            (!f.fechaHasta || fecha <= f.fechaHasta);

        return hitLibre && ok;
    });

    if (loading) {
        return <div>Cargando solicitudes...</div>;
    }

    if (error) {
        return <div>Error al cargar las solicitudes: {error}</div>;
    }

    return (
        <main className="main-adm">
            <div className="estado-solicitudes-container">

                <div className="encabezado-titulo encabezado-titulo-ticket">
                <h2>Solicitudes Completadas</h2>

                <section>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />

                    <div className="contenedor-filtros-avanzados">
                    <button
                        className="btn-toggle-filtros"
                        onClick={() => setMostrarFiltros((m) => !m)}
                    >
                        {mostrarFiltros ? "Ocultar filtros avanzados ▲" : "Mostrar filtros avanzados ▼"}
                    </button>

                    {mostrarFiltros && (
                        <div className="filtros-avanzados-container">
                            <input
                                name="codigoTicket"
                                placeholder="Código ticket"
                                value={filtrosAvanzados.codigoTicket}
                                onChange={handleFiltroChange}
                                className="input-filtro"
                            />
                            <input
                                name="nroContrato"
                                placeholder="N.º contrato"
                                value={filtrosAvanzados.nroContrato}
                                onChange={handleFiltroChange}
                                className="input-filtro"
                            />
                            <input
                                name="nombreApellidoCliente"
                                placeholder="Cliente (nombre o apellido)"
                                value={filtrosAvanzados.nombreApellidoCliente}
                                onChange={handleFiltroChange}
                                className="input-filtro"
                            />

                             <select
                                name="motivo"
                                value={filtrosAvanzados.motivo}
                                onChange={handleFiltroChange}
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

                                <select
                                name="prioridad"
                                value={filtrosAvanzados.prioridad}
                                onChange={handleFiltroChange}
                                className="input-filtro"
                                >
                                <option value="">Filtrar por prioridad</option>
                                <option value="alta">Alta</option>
                                <option value="media">Media</option>
                                <option value="baja">Baja</option>
                                </select>

                                <select
                                name="tipoFalla"
                                value={filtrosAvanzados.tipoFalla}
                                onChange={handleFiltroChange}
                                className="input-filtro"
                                >
                                <option value="">Seleccione Tipo Falla</option>
                                    <option value="Config. Equipos">Config. Equipos</option>
                                    <option value="Certificación">Certificación</option>
                                    <option value="Cambio ONU">Cambio ONU</option>
                                    <option value="Cambio Patch Card">Cambio Patch Card</option>
                                    <option value="Cambio Conectores">Cambio Conectores</option>
                                </select>

                            <label>
                                Desde:
                                <input
                                    type="date"
                                    name="fechaDesde"
                                    value={filtrosAvanzados.fechaDesde}
                                    onChange={handleFiltroChange}
                                    className="input-filtro"
                                />
                            </label>
                            <label>
                                Hasta:
                                <input
                                    type="date"
                                    name="fechaHasta"
                                    value={filtrosAvanzados.fechaHasta}
                                    onChange={handleFiltroChange}
                                    className="input-filtro"
                                />
                            </label>
                            <button
                                onClick={() => {
                                    const vacíos = {
                                        codigoTicket: "",
                                        nroContrato: "",
                                        nombreApellidoCliente: "",
                                        nombreApellidoTecnico: "",
                                        motivo: "",
                                        tipoFalla: "",
                                        prioridad: "",
                                        fechaDesde: "",
                                        fechaHasta: "",
                                    };
                                    setFiltrosAvanzados(vacíos);
                                    sessionStorage.setItem("filtrosAvanzadosSolicitudes", JSON.stringify(vacíos));
                                }}
                                className="btn-limpiar-filtros"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                    </div>

                </section>
                </div>

                <div className="estado-solicitudes-grid">
                    {filteredSolicitudes.length === 0 ? (
                        <p>No hay solicitudes completadas que coincidan con la búsqueda.</p>
                    ) : (
                        filteredSolicitudes.map(solicitud => (
                            
                            <div key={solicitud.id_soli_completada} className="estado-solicitudes-card">
                                <h3>Servicio ID: <Link to={`/solicitudcompltecnico/${solicitud.codigo_solicitud}`}>{solicitud.codigo_ticket}</Link></h3>
                                <p>Técnico encargado: {solicitud.codigo_trabajador}</p>
                                <p>Cliente: {solicitud.id_cliente}</p>
                                <p>Motivo de la Visita: {solicitud.motivo_visita}</p>
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

export default ApartadoSolicitudCompletada;
