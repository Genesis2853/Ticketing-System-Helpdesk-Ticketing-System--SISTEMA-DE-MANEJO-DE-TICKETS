import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const SoliCerradotec = ({ user }) => {
    const [SoliCerrado, setSoliCerrado] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFiltros, setShowFiltros] = useState(false);

    console.log("Usuario recibido en estadosolicerrado:", user);

    useEffect(() => {
        let isMounted = true;

        const fetchSoliCerrado = async () => {
            const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", localStorage.getItem("accessToken"));

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLICOMPLETADA}/api/solicomcerr/tecnico/soliCerradoTec`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                const uniqueData = Array.from(new Set(data.map(item => item.codigo_solicitud)))
                    .map(codigo => data.find(item => item.codigo_solicitud === codigo));

                uniqueData.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

                if (isMounted) {
                    setSoliCerrado(uniqueData);
                }
            } catch (error) {
                console.error('Error fetching SoliCerrado:', error);
                if (isMounted) {
                    setError(error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSoliCerrado();

        return () => {
            isMounted = false;
        };

    }, []);

    // Estado y persistencia filtros avanzados en sessionStorage
    const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
        const guardado = sessionStorage.getItem("filtrosAvanzadosSolicitudes");
        return guardado
            ? JSON.parse(guardado)
            : {
                codigoTicket: '',
                nroContrato: '',
                nombreApellidoCliente: '',
                nombreApellidoTecnico: '',
                motivoCierre: '',
                motivo: '',
                prioridad: '',
                fechaDesde: '',
                fechaHasta: '',
            };
    });

    useEffect(() => {
        sessionStorage.setItem(
            "filtrosAvanzadosSolicitudes",
            JSON.stringify(filtrosAvanzados)
        );
    }, [filtrosAvanzados]);

    // Manejadores inputs búsqueda y filtros
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleChange = (e) => {
  const { name, value } = e.target;

  // Validaciones por campo
  let valorValido = value;

  if (name === "codigoTicket") {
    // letras, números y guiones solamente
    if (!/^[a-zA-Z0-9-]*$/.test(value)) return; // si no cumple, no actualiza
  }

  if (name === "nroContrato") {
    // solo números
    if (!/^[0-9]*$/.test(value)) return;
  }

  if (name === "nombreApellidoCliente") {
    // solo letras, espacios y acentos
    if (!/^[a-zA-ZÀ-ÿ\s]*$/.test(value)) return;
  }

  setFiltrosAvanzados(prev => ({
    ...prev,
    [name]: valorValido,
  }));
};


    // Función para normalizar textos (quita tildes, a minúsculas)
    const normalize = useCallback(
        (v) =>
            String(v ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase(),
        []
    );

    // Filtrado combinado con normalización, búsqueda libre y filtros avanzados
    const filteredSoliCerrado = SoliCerrado.filter((s) => {
        const libre = normalize(searchTerm);

        const nombreCliente = normalize(`${s.nombre_cliente ?? ''} ${s.apellido_cliente ?? ''}`);
        const nombreTecnico = normalize(`${s.nombre_tecnico ?? ''} ${s.apellido_tecnico ?? ''}`);
        const nombreTecInv = normalize(`${s.apellido_tecnico ?? ''} ${s.nombre_tecnico ?? ''}`);
        const nombreCliInv = normalize(`${s.apellido_cliente ?? ''} ${s.nombre_cliente ?? ''}`);
        const fecha = s.fecha_cierre?.slice(0, 10) ?? '';

        const hitLibre =
            normalize(s.codigo_solicitud ?? '').includes(libre) ||
            normalize(s.codigo_ticket ?? '').includes(libre) ||
            normalize(s.codigo_trabajador ?? '').includes(libre) ||
            nombreCliente.includes(libre) ||
            nombreTecnico.includes(libre) ||
            nombreTecInv.includes(libre) ||
            nombreCliInv.includes(libre) ||
            normalize(s.motivo_visita ?? "").includes(libre) ||
            normalize(s.motivo_cierre ?? '').includes(libre) ||
            normalize(s.prioridad ?? '').includes(libre);

        const f = filtrosAvanzados;

        const ok =
            (!f.codigoTicket || normalize(s.codigo_ticket ?? '').includes(normalize(f.codigoTicket))) &&
            (!f.nroContrato || normalize(s.codigo_solicitud ?? '').includes(normalize(f.nroContrato))) &&
            (!f.nombreApellidoCliente ||
                nombreCliente.includes(normalize(f.nombreApellidoCliente)) ||
                nombreCliInv.includes(normalize(f.nombreApellidoCliente))) &&
            (!f.motivoCierre || normalize(s.motivo_cierre ?? '').includes(normalize(f.motivoCierre))) &&
            (!f.motivo || normalize(s.motivo_visita ?? "").includes(normalize(f.motivo))) &&
            (!f.prioridad || normalize(s.prioridad ?? '').includes(normalize(f.prioridad))) &&
            (!f.fechaDesde || fecha >= f.fechaDesde) &&
            (!f.fechaHasta || fecha <= f.fechaHasta);

        return hitLibre && ok;
    });

    if (loading) {
        return <div>Cargando Solicitudes Cerradas...</div>;
    }

    if (error) {
        return <div>Error al cargar las Solicitudes Cerradas: {error}</div>;
    }

    return (
        <main className="main-adm">
            <div className="estado-solicitudes-container">

                 <div className="encabezado-titulo encabezado-titulo-ticket">
                <h2>Solicitudes Cerradas</h2>

                <section>
                    <input
                        type="text"
                        placeholder="Buscar por código, motivo o técnico..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
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
                        <div className="filtros-avanzados-container">
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

                            <label htmlFor="motivoCierre">Motivo de Cierre:</label>
                  <select
                  name="motivoCierre"
                  value={filtrosAvanzados.motivoCierre}
                  onChange={handleChange}
                  className="input-filtro"
                  >
                  <option value="">Seleccione Motivo de Cierre</option>
                <option value="Fuera de Alcance">Fuera de Alcance</option>
                <option value="Falta de Recursos">Falta de Recursos</option>
                <option value="Cliente Inaccesible">Cliente Inaccesible</option>
                <option value="Otro">Otro</option>
                  </select>

                <label htmlFor="motivo">Motivo de Visita:</label>
                  <select
                  name="motivo"
                  value={filtrosAvanzados.motivo}
                  onChange={handleChange}
                  className="input-filtro"
                  >
                  <option value="">Seleccione Motivo de Visita</option>
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
                                onClick={() =>
                                    setFiltrosAvanzados({
                                        codigoTicket: '',
                                        nroContrato: '',
                                        nombreApellidoCliente: '',
                                        nombreApellidoTecnico: '',
                                        motivoCierre: '',
                                        motivo: '',
                                        prioridad: '',
                                        fechaDesde: '',
                                        fechaHasta: '',
                                    })
                                }
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
                    {filteredSoliCerrado.length > 0 ? (
                        filteredSoliCerrado.map(solicitud => (
                            <div key={`${solicitud.codigo_solicitud}-${solicitud.fecha_cierre}-${solicitud.codigo_trabajador}`} className="estado-solicitudes-card">
                                <h3>Solicitud: <Link to={`/tecnico/soliCerradoTec/${solicitud.codigo_solicitud}`}>{solicitud.codigo_ticket}</Link></h3>
                                <p>Técnico: {solicitud.codigo_trabajador}</p>
                                <p>Motivo de Cierre: {solicitud.motivo_cierre}</p>
                                <p>Comentarios: {solicitud.comentarios_tecnico}</p>
                                <p>Intentos de Resolución: {solicitud.intentos_resolucion}</p>
                                <p>Fecha de Cierre: {new Date(solicitud.fecha_cierre).toLocaleString()}</p>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">No hay solicitudes cerradas que coincidan con la búsqueda.</div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default SoliCerradotec;
