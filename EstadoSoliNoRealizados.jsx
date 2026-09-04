import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import ReporteNoRealizadasPDF from './ReportesGeneralesEstados/ReporteGNoRealzado';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';

const EstadoSoliNoRealizado = ({ user }) => {
    const [SoliNoRealizado, setSoliNoRealizado] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda
    console.log("Usuario recibido en estadosolicompleta:", user);

    const [showFiltros, setShowFiltros] = useState(false);

  // Filtros avanzados
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
    motivo: "",
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

    useEffect(() => {
        let isMounted = true; // Flag para verificar si el componente está montado

        const fetchSoliNoRealizado = async () => {
            const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", localStorage.getItem("accessToken"));

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/soliNoReTec`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

                // Solo actualiza el estado si el componente sigue montado
                if (isMounted) {
                    setSoliNoRealizado(data);
                }
            } catch (error) {
                console.error('Error fetching Solicitudes No Realizadas:', error);
                if (isMounted) {
                    setError(error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSoliNoRealizado();

        // Función de limpieza
        return () => {
            isMounted = false; // Cambia el flag a false cuando el componente se desmonte
        };

    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleChange = (e) => {
  const { name, value } = e.target;

  // Validaciones específicas
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

  // Si pasa validación, actualiza estado
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
  const filteredSoliNoRealizado = SoliNoRealizado.filter((solicitud) => {
    const libre = normalize(searchTerm);

    const nombreCliente = normalize(`${solicitud.nombre_cliente ?? ''} ${solicitud.apellido_cliente ?? ''}`);
    const nombreTecnico = normalize(`${solicitud.nombre_tecnico ?? ''} ${solicitud.apellido_tecnico ?? ''}`);
    const nombreTecInv = normalize(`${solicitud.apellido_tecnico ?? ''} ${solicitud.nombre_tecnico ?? ''}`);
    const nombreCliInv = normalize(`${solicitud.apellido_cliente ?? ''} ${solicitud.nombre_cliente ?? ''}`);
    const fecha = solicitud.fecha_cierre_norealizado?.slice(0, 10) ?? '';

    // Búsqueda libre: código_solicitud, código_trabajador, id_cliente, código_ticket, motivo_visita, motivo_norealizacion, prioridad_solicitud
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
      normalize(solicitud.motivo_norealizacion ?? '').includes(libre) ||
      normalize(solicitud.prioridad_solicitud ?? '').includes(libre);

    const f = filtrosAvanzados;

    // Validación filtros avanzados:
    const ok =
      (!f.codigoTicket || normalize(solicitud.codigo_ticket ?? '').includes(normalize(f.codigoTicket))) &&
      (!f.nroContrato || normalize(solicitud.codigo_solicitud ?? '').includes(normalize(f.nroContrato))) &&
      (!f.nombreApellidoCliente ||
        nombreCliente.includes(normalize(f.nombreApellidoCliente)) ||
        nombreCliInv.includes(normalize(f.nombreApellidoCliente))) &&
      (!f.nombreApellidoTecnico ||
        nombreTecnico.includes(normalize(f.nombreApellidoTecnico)) ||
        nombreTecInv.includes(normalize(f.nombreApellidoTecnico))) &&
      (!f.motivoNoRealizacion || normalize(solicitud.motivo_norealizacion ?? '').includes(normalize(f.motivoNoRealizacion))) &&
      (!f.motivo || normalize(solicitud.motivo_visita ?? "").includes(normalize(f.motivo))) &&
      (!f.prioridad || normalize(solicitud.prioridad_solicitud ?? '').includes(normalize(f.prioridad))) &&
      (!f.fechaDesde || fecha >= f.fechaDesde) &&
      (!f.fechaHasta || fecha <= f.fechaHasta);

    return hitLibre && ok;
  });

    if (loading) {
        return <div>Cargando Solicitudes No Realizadas...</div>;
    }

    if (error) {
        return <div>Error al cargar las Solicitudes No Realizadas: {error}</div>;
    }

    return (
        <main className="main-adm">
            <div className="estado-solicitudes-container">

                <div className="encabezado-titulo encabezado-titulo-ticket">
                <h2>Solicitudes No Realizadas</h2>

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
            type="button"
            onClick={() => setShowFiltros(!showFiltros)}
            className="btn-toggle-filtros"
            style={{ marginLeft: '10px' }}
          >
            {showFiltros ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
          </button>


           {showFiltros && (
          <div className="filtros-avanzados-container" style={{ marginTop: '10px', marginBottom: '20px' }}>
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

            <label htmlFor="nombreApellidoTecnico">Nombre / Apellido Técnico:</label>
            <input
              type="text"
              id="nombreApellidoTecnico"
              name="nombreApellidoTecnico"
              placeholder="Ej: Carlos Gómez"
              value={filtrosAvanzados.nombreApellidoTecnico}
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
                  motivo: "",
                  prioridad: '',
                  fechaDesde: '',
                  fechaHasta: '',
                });
                setSearchTerm('');
              }}
              className="btn-limpiar-filtros"
              style={{ marginTop: '10px' }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
        </div>  
          </section>
        </div>

       

<div>
                  {filteredSoliNoRealizado.length > 0 && (
  <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
    
    {/* Previsualización */}
    <button
      className="btn-previsualizar-pdf"
      onClick={async () => {
        const blob = await pdf(<ReporteNoRealizadasPDF solicitudes={filteredSoliNoRealizado} />).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }}
    >
      👁️ Ver vista previa
    </button>

    {/* Descarga */}
    <PDFDownloadLink
      document={<ReporteNoRealizadasPDF solicitudes={filteredSoliNoRealizado} />}
      fileName={`Solicitudes-Filtradas.pdf`}
      className="btn-descargar-pdf"
    >
      {({ loading }) => (loading ? 'Generando...' : 'Descargar PDF')}
    </PDFDownloadLink>
  </div>
)}

                </div>



                <div className="estado-solicitudes-grid">
                    {filteredSoliNoRealizado.map(solicitud => (
                        <div key={solicitud.id_soli_norealizada} className="estado-solicitudes-card">
                            <h3>Servicio ID: <Link to={`/estado/soliNoReTec/${solicitud.codigo_solicitud}`}>{solicitud.codigo_ticket}</Link></h3>
                            <p>Técnico encargado: {solicitud.nombre_tecnico} {solicitud.apellido_tecnico}</p>
                            <p>Cliente: {solicitud.nombre_cliente} {solicitud.apellido_cliente}</p>
                            <p>Motivo de visita: {solicitud.motivo_visita}</p>
                            <p>Estado: {solicitud.estado_solicitud}</p>
                            <p>Prioridad: {solicitud.prioridad_solicitud}</p>
                        </div>
                    ))}

                    {filteredSoliNoRealizado.length === 0 &&  (
        <p style={{ marginTop: 16 }}>No se encontraron resultados…</p>
      )}
                </div>
            </div>
        </main>
    );
};

export default EstadoSoliNoRealizado;