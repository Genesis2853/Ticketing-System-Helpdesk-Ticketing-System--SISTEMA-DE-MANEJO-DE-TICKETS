import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import ReporteGcomplatado from './ReportesGeneralesEstados/ReporteGCompletado';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';

const EstadoSoliCompletado = ({ user }) => {
    const [SoliCompletas, setSoliCompletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de 
    console.log("Usuario recibido en estadosolicompleta:", user);

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const fetchSoliCompletas = async () => {
            const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", localStorage.getItem("accessToken"));

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/soliComplTec`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                // Filtrar datos duplicados basados en codigo_solicitud
               const uniqueData = Array.from(new Set(data.map(item => item.codigo_solicitud)))
       .map(codigo => data.find(item => item.codigo_solicitud === codigo));
            // Ordenar, si quieres, luego
            uniqueData.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));


                // Solo actualiza el estado si el componente sigue montado
                if (isMounted) {
                    setSoliCompletas(data);
                }
            } catch (error) {
                console.error('Error fetching SoliCompletas:', error);
                if (isMounted) {
                    setError(error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSoliCompletas();

        // Función de limpieza
        return () => {
            isMounted = false; // Cambia el flag a false cuando el componente se desmonte
        };

    }, []);

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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

        const handleFiltroChange = (e) => {
  const { name, value } = e.target;

  // Validaciones según el campo
  if (name === "codigoTicket") {
    const regex = /^[a-zA-Z0-9-]*$/;
    if (!regex.test(value)) return;
  }

  if (name === "nroContrato") {
    const regex = /^[0-9]*$/;
    if (!regex.test(value)) return;
  }

  if (name === "nombreApellidoCliente" || name === "nombreApellidoTecnico") {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (!regex.test(value)) return;
  }

  // Si pasó validación, actualiza el estado
  setFiltrosAvanzados((prev) => ({
    ...prev,
    [name]: value,
  }));
};


    const normalize = useCallback(
  (v) =>
    String(v ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
  []
);

const filteredSoliCompletas = SoliCompletas.filter((s) => {
  const libre = normalize(searchTerm);

  // combinaciones normalizadas
  const nombreCliente = normalize(`${s.nombre_cliente ?? ""} ${s.apellido_cliente ?? ""}`);
  const nombreTecnico = normalize(`${s.nombre_tecnico ?? ""} ${s.apellido_tecnico ?? ""}`);
  const nombreTecInv  = normalize(`${s.apellido_tecnico ?? ""} ${s.nombre_tecnico ?? ""}`);
  const nombreCliInv  = normalize(`${s.apellido_cliente ?? ""} ${s.nombre_cliente ?? ""}`);
  const fecha         = s.fecha_caso_cerrado?.slice(0, 10) ?? "";

  /* --- búsqueda libre --- */
  const hitLibre =
    normalize(s.codigo_solicitud).includes(libre) ||
    normalize(s.codigo_ticket).includes(libre)   ||
    normalize(s.codigo_trabajador).includes(libre) ||
    normalize(s.id_cliente).includes(libre)      ||
    nombreCliente.includes(libre) ||
    nombreTecnico.includes(libre) ||
    nombreTecInv.includes(libre)  ||
    nombreCliInv.includes(libre)  ||
    normalize(s.motivo_visita).includes(libre)   ||
    normalize(s.tipo_solucion_falla).includes(libre) ||
    normalize(s.prioridad_solicitud).includes(libre);

  /* --- filtros avanzados --- */
  const f = filtrosAvanzados;
  const ok =
    (!f.codigoTicket || normalize(s.codigo_ticket).includes(normalize(f.codigoTicket))) &&
    (!f.nroContrato  || normalize(s.codigo_solicitud).includes(normalize(f.nroContrato))) &&
    (!f.nombreApellidoCliente ||
      nombreCliente.includes(normalize(f.nombreApellidoCliente)) ||
      nombreCliInv.includes(normalize(f.nombreApellidoCliente))) &&
    (!f.nombreApellidoTecnico ||
      nombreTecnico.includes(normalize(f.nombreApellidoTecnico)) ||
      nombreTecInv.includes(normalize(f.nombreApellidoTecnico))) &&
    (!f.motivo   || normalize(s.motivo_visita).includes(normalize(f.motivo))) &&
    (!f.tipoFalla|| normalize(s.tipo_solucion_falla).includes(normalize(f.tipoFalla))) &&
    (!f.prioridad|| normalize(s.prioridad_solicitud).includes(normalize(f.prioridad))) &&
    (!f.fechaDesde || fecha >= f.fechaDesde) &&
    (!f.fechaHasta || fecha <= f.fechaHasta);

  return hitLibre && ok;
});

    if (loading) {
        return <div>Cargando Solicitudes Completadas...</div>;
    }

    if (error) {
        return <div>Error al cargar las Solicitudes Completadas: {error}</div>;
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
                                <input name="codigoTicket" placeholder="Código ticket"
                                    value={filtrosAvanzados.codigoTicket}
                                    onChange={handleFiltroChange} 
                                    className="input-filtro"
                                    />

                                <input name="nroContrato" placeholder="N.º contrato"
                                    value={filtrosAvanzados.nroContrato}
                                    onChange={handleFiltroChange} 
                                    className="input-filtro"
                                    />

                                <input name="nombreApellidoCliente" placeholder="Cliente (nombre o apellido)"
                                    value={filtrosAvanzados.nombreApellidoCliente}
                                    onChange={handleFiltroChange} 
                                    className="input-filtro"
                                    />

                                <input name="nombreApellidoTecnico" placeholder="Técnico (nombre o apellido)"
                                    value={filtrosAvanzados.nombreApellidoTecnico}
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

                                <label>Desde:
                                    <input type="date" name="fechaDesde"
                                        value={filtrosAvanzados.fechaDesde}
                                        onChange={handleFiltroChange} 
                                        className="input-filtro"
                                        />
                                </label>

                                <label>Hasta:
                                    <input type="date" name="fechaHasta"
                                        value={filtrosAvanzados.fechaHasta}
                                        onChange={handleFiltroChange} 
                                        className="input-filtro"
                                        />
                                </label>

                                <button onClick={() => {
                                    const vacíos = {
                                        codigoTicket: "", nroContrato: "", nombreApellidoCliente: "",
                                        nombreApellidoTecnico: "", motivo: "", tipoFalla: "", prioridad: "",
                                        fechaDesde: "", fechaHasta: ""
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

                
                <div>
                  {filteredSoliCompletas.length > 0 && (
  <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
    
    {/* Previsualización */}
    <button
      className="btn-previsualizar-pdf"
      onClick={async () => {
        const blob = await pdf(<ReporteGcomplatado solicitudes={filteredSoliCompletas} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }}
    >
      👁️ Ver vista previa
    </button>

    {/* Descarga */}
    <PDFDownloadLink
      document={<ReporteGcomplatado solicitudes={filteredSoliCompletas} />}
      fileName={`Solicitudes-Filtradas.pdf`}
      className="btn-descargar-pdf"
    >
      {({ loading }) => (loading ? 'Generando...' : 'Descargar PDF')}
    </PDFDownloadLink>
  </div>
)}

                </div>


                <div className="estado-solicitudes-grid">
                       {filteredSoliCompletas.map(solicitud => (
                            <div key={`${solicitud.codigo_solicitud}-${solicitud.id_cliente}-${solicitud.codigo_ticket}-${solicitud.fecha_creacion}-${solicitud.id_soli_completada}`} className="estado-solicitudes-card">
                                <h3>Servicio ID: <Link to={`/estado/soliComplTec/${solicitud.codigo_solicitud}`}>{solicitud.codigo_ticket}</Link></h3>
                                <p>Técnico encargado: {solicitud.nombre_tecnico} {solicitud.apellido_tecnico}</p>
                                <p>Cliente: {solicitud.nombre_cliente} {solicitud.apellido_cliente}</p>
                                <p>Motivo de visita: {solicitud.motivo_visita}</p>
                                <p>Estado: {solicitud.estado_solicitud}</p>
                                <p>Prioridad: {solicitud.prioridad_solicitud}</p>
                            </div>
                        ))}
   
   {filteredSoliCompletas.length === 0 &&  (
        <p style={{ marginTop: 16 }}>No se encontraron resultados…</p>
      )}
                </div>
            </div>
        </main>
    );
};

export default EstadoSoliCompletado;