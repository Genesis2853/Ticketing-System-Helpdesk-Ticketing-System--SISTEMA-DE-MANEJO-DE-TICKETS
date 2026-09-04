import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const SolicitudAsig = () => {
  const [solicitudAsig, setSolicitudAsig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para filtros avanzados persistentes en sessionStorage
  const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
    const guardado = sessionStorage.getItem('filtrosAvanzadosSolicitudAsig');
    return guardado
      ? JSON.parse(guardado)
      : {
          codigoTicket: '',
          nroContrato: '',
          nombreApellidoCliente: '',
          motivo: '',
          prioridad: '',
          estado: '',
          fechaDesde: '',
          fechaHasta: '',
        };
  });

  // Mostrar/ocultar panel de filtros avanzados
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mensaje = queryParams.get('mensaje');

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchSolicitudAsig = async () => {
      if (!token) {
        setError('No autorizado: token no encontrado.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/solicitudAsigTec`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        setSolicitudAsig(data);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Solicitud abortada');
        } else {
          setError(error.message);
          enqueueSnackbar(`Error al cargar las solicitudes: ${error.message}`, { variant: 'error' });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudAsig();

    return () => {
      controller.abort();
    };
  }, [enqueueSnackbar]);

  // Guardar filtros avanzados en sessionStorage cada vez que cambian
  useEffect(() => {
    sessionStorage.setItem('filtrosAvanzadosSolicitudAsig', JSON.stringify(filtrosAvanzados));
  }, [filtrosAvanzados]);

  // Mostrar mensaje si existe
  useEffect(() => {
    if (mensaje) {
      enqueueSnackbar(mensaje, { variant: 'success' });
    }
  }, [mensaje, enqueueSnackbar]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltroChange = (e) => {
  const { name, value } = e.target;

  let regexValido = true;

  if (name === "codigoTicket") {
    regexValido = /^[a-zA-Z0-9-]*$/.test(value); // Letras, números y guion
  } else if (name === "nroContrato") {
    regexValido = /^[0-9]*$/.test(value);
  } else if (name === "nombreApellidoCliente") {
    regexValido = /^[a-zA-ZÀ-ÿ\s]*$/.test(value); // Letras, espacios y tildes
  }

  if (regexValido) {
    setFiltrosAvanzados((prev) => ({ ...prev, [name]: value }));
  }
};


  const normalize = useCallback(
    (v) =>
      String(v ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase(),
    []
  );

  // Filtrado combinando búsqueda libre y filtros avanzados
  const filteredSolicitudes = solicitudAsig.filter((s) => {
    const libre = normalize(searchTerm);

    const nombreCliente = normalize(`${s.nombre_cliente ?? ''} ${s.apellido_cliente ?? ''}`);
    const nombreTecnico = normalize(`${s.nombre_tecnico ?? ''} ${s.apellido_tecnico ?? ''}`);
    const nombreTecInv = normalize(`${s.apellido_tecnico ?? ''} ${s.nombre_tecnico ?? ''}`);
    const nombreCliInv = normalize(`${s.apellido_cliente ?? ''} ${s.nombre_cliente ?? ''}`);
    const fecha = s.fecha_solicitud?.slice(0, 10) ?? '';

    // Búsqueda libre
    const hitLibre =
      normalize(s.codigo_solicitud ?? '').includes(libre) ||
      normalize(s.motivo_visita ?? '').includes(libre) ||
      normalize(s.codigo_trabajador ?? '').includes(libre) ||
      normalize(s.id_cliente ?? '').includes(libre) ||
      nombreCliente.includes(libre) ||
      nombreTecnico.includes(libre) ||
      nombreTecInv.includes(libre) ||
      nombreCliInv.includes(libre) ||
      normalize(s.codigo_ticket ?? '').includes(libre) ||
      normalize(s.estado_solicitud ?? '').includes(libre) ||
      normalize(s.prioridad_solicitud ?? '').includes(libre);

    // Filtros avanzados
    const f = filtrosAvanzados;
    const ok =
      (!f.codigoTicket || normalize(s.codigo_ticket ?? '').includes(normalize(f.codigoTicket))) &&
      (!f.nroContrato || normalize(s.codigo_solicitud ?? '').includes(normalize(f.nroContrato))) &&
      (!f.nombreApellidoCliente ||
        nombreCliente.includes(normalize(f.nombreApellidoCliente)) ||
        nombreCliInv.includes(normalize(f.nombreApellidoCliente))) &&
      (!f.motivo || normalize(s.motivo_visita ?? '').includes(normalize(f.motivo))) &&
      (!f.prioridad || normalize(s.prioridad_solicitud ?? '').includes(normalize(f.prioridad))) &&
      (!f.estado || normalize(s.estado_solicitud ?? '').includes(normalize(f.estado))) &&
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
      {mensaje && <div>{mensaje}</div>}

      <div className="estado-solicitudes-container">

        <div className="encabezado-titulo-tecnico encabezado-titulo-ticket">
        <h2 className="encabezado-titulo-tecnico-title">Solicitudes Asignadas</h2>

        <section>
          <div className="input-container">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input input-filtro"
            />
          </div>

        <div className="contenedor-filtros-avanzados">
          <button className="btn-toggle-filtros" onClick={() => setMostrarFiltros((m) => !m)}>
            {mostrarFiltros ? 'Ocultar filtros avanzados ▲' : 'Mostrar filtros avanzados ▼'}
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
                name="estado"
                value={filtrosAvanzados.estado}
                onChange={handleFiltroChange}
                className="input-filtro"
                >
                <option value="">Filtrar por Estado</option>
                <option value="asignado">asignado</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmado">Confirmado</option>
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
                  setFiltrosAvanzados({
                    codigoTicket: '',
                    nroContrato: '',
                    nombreApellidoCliente: '',
                    nombreApellidoTecnico: '',
                    motivo: '',
                    prioridad: '',
                    estado: '',
                    fechaDesde: '',
                    fechaHasta: '',
                  });
                  setSearchTerm('');
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

        {solicitudAsig.length === 0 ? (
                    <div className="estado-solicitudAsigTec-mensajevacio">
                        <p>No tiene Solicitudes asignadas.</p>
                    </div>
                ) : (
                    <div className="estado-solicitudes-grid">
                        {filteredSolicitudes.map(solicitud => (
                            <div key={solicitud.codigo_solicitud} className="estado-solicitudes-card">
                                <h3>Servicio ID: <Link to={`/solicitudAsigTec/${solicitud.codigo_solicitud}`}>{solicitud.codigo_ticket}</Link></h3>
                                <p>Técnico encargado: {solicitud.codigo_trabajador}</p>
                                <p>Cliente: {solicitud.id_cliente}</p>
                                <p>Estado: {solicitud.estado_solicitud}</p>
                                <p>Prioridad: {solicitud.prioridad_solicitud}</p>
                            </div>
                        ))}
                    </div>

)}
      </div>
    </main>
  );
};

export default SolicitudAsig;
