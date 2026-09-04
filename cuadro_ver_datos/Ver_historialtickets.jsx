import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { PDFDownloadLink,  pdf } from '@react-pdf/renderer';
import ReporteTickets  from '../Reportecliente/ReporteTickets';
import "./visualizacion.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';


const VerHistorialTickets = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const showBackButton = location.state?.showBackButton;



    const handleBack = () => {
        navigate(-1);
    };


    const [verTicketstotal, setTicketstotal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    console.log("Usuario recibido en VerdatosTickets:", user);

    

    useEffect(() => {
        const fetchTickets = async () => {
            const token = localStorage.getItem("token");
            console.log("Token almacenado en localStorage:", localStorage.getItem("accessToken"));

            if (!token) {
                setError("No autorizado: token no encontrado.");
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_VERTICKETS}/api/verti/vertickets/total`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setTicketstotal(data);
            } catch (error) {
                console.error('Error fetching solicitudes:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
    const guardado = sessionStorage.getItem("filtrosAvanzadosTicketsHistorial");
    return guardado
        ? JSON.parse(guardado)
        : {
              codigo: "",
              nombreApellido: "",
              motivo: "",
              contrato: "",
              prioridad: "",
              fechaDesde: "",
              fechaHasta: "",
          };
});



    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFiltroAvanzadoChange = (e) => {
  const { name, value } = e.target;

  // Validación según el campo
  if (name === "codigo") {
    const regexCodigo = /^[a-zA-Z0-9-]*$/;
    if (!regexCodigo.test(value)) return;
  } else if (name === "nombreApellido") {
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (!regexNombre.test(value)) return;
  } else if (name === "contrato") {
    const regexContrato = /^[0-9]*$/;
    if (!regexContrato.test(value)) return;
  }

  // Si pasa validación, actualiza filtros y guarda en sessionStorage
  const nuevosFiltros = {
    ...filtrosAvanzados,
    [name]: value,
  };
  setFiltrosAvanzados(nuevosFiltros);
  sessionStorage.setItem("filtrosAvanzadosTicketsHistorial", JSON.stringify(nuevosFiltros));
};



    

    const normalize = useCallback(
      (v) =>
        String(v ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      []
    );
    
    
      const texto = normalize(searchTerm);

      const fechaDesde = filtrosAvanzados.fechaDesde;
const fechaHasta = filtrosAvanzados.fechaHasta;

const filteredTickets = verTicketstotal.filter((t) => {
    const coincideBusqueda = [
        t.codigo_ticket,
        t.id_cliente,
        t.motivo_visita,
        t.nro_contrato,
        t.nombre_cliente,
        t.apellido_cliente,
        `${t.nombre_cliente} ${t.apellido_cliente}`,
        t.prioridad_solicitud,
    ].map(normalize).some(campo => campo.includes(texto));

    const coincideCodigo = normalize(t.codigo_ticket).includes(normalize(filtrosAvanzados.codigo));
    const coincideContrato = normalize(t.nro_contrato).includes(normalize(filtrosAvanzados.contrato));
    const coincideMotivo = normalize(t.motivo_visita).includes(normalize(filtrosAvanzados.motivo));
    const coincidePrioridad = normalize(t.prioridad_solicitud).includes(normalize(filtrosAvanzados.prioridad));
    const coincideNombreApellido = (
        normalize(`${t.nombre_cliente} ${t.apellido_cliente}`).includes(normalize(filtrosAvanzados.nombreApellido))
    );

    const fechaTicket = t.fecha_creacion?.slice(0, 10); // Asegúrate que sea tipo YYYY-MM-DD
    const cumpleFecha =
        (!fechaDesde || fechaTicket >= fechaDesde) &&
        (!fechaHasta || fechaTicket <= fechaHasta);

    return coincideBusqueda && coincideCodigo && coincideMotivo && coincideContrato && coincidePrioridad && coincideNombreApellido&&
        cumpleFecha;
});


    /* ─── Abrir vista previa PDF en ventana nueva ─── */
      const abrirVistaPreviaEnNuevaVentana = async () => {
      if (filteredTickets.length === 0) {
        alert("No hay datos válidos para vista previa");
        return;
      }
    
      try {
        const asPdf = pdf(<ReporteTickets tickets={filteredTickets} />);
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        // No es necesario revocar inmediatamente — puede cerrarse antes
      } catch (error) {
        alert("Error al generar vista previa: " + error.message);
        console.error(error); // Importante para ver errores detallados
      }
    };

    if (loading) {
        return <div>Cargando tickets...</div>;
    }

    if (error) {
        return <div>Error al cargar los tickets: {error}</div>;
    }

    return (
        <main className="main-adm">
            <div className="ver-datosT-container">
                {showBackButton && (
                    <button onClick={handleBack} className="btn-link ver-boton-volver">
                        <FontAwesomeIcon icon={faArrowLeft} className="boton-fotnawesome"/>
                                    Volver
                    </button>
                )}
                

                <div className="encabezado-titulo encabezado-titulo-ticket">
                <h2>Historial de Tickets Creados</h2>


                <section>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />
                
                <div className="contenedor-filtros-avanzados">
                <button className="btn-toggle-filtros" onClick={() => setMostrarFiltros((m) => !m)}>
            {mostrarFiltros ? 'Ocultar filtros avanzados ▲' : 'Mostrar filtros avanzados ▼'}
          </button>

{mostrarFiltros && (
                <div className="filtros-avanzados-container">
                    <input
                        type="text"
                        name="codigo"
                        placeholder="Filtrar por código"
                        value={filtrosAvanzados.codigo}
                        onChange={handleFiltroAvanzadoChange}
                        className="input-filtro"
                    />
                    <input
                        type="text"
                        name="nombreApellido"
                        placeholder="Filtrar por nombre/apellido"
                        value={filtrosAvanzados.nombreApellido}
                        onChange={handleFiltroAvanzadoChange}
                        className="input-filtro"
                    />

                    <input
                    type="text"
                    name="contrato"
                    placeholder="N.º de contrato"
                    value={filtrosAvanzados.contrato}
                    onChange={handleFiltroAvanzadoChange}
                    className="input-filtro"
                    />

                    <select
                    name="motivo"
                    value={filtrosAvanzados.motivo}
                    onChange={handleFiltroAvanzadoChange}
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
                    onChange={handleFiltroAvanzadoChange}
                    className="input-filtro"
                    >
                    <option value="">Filtrar por prioridad</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                    </select>

                    <div className="filtro-fechas">
    <label className="label-fecha">Desde:</label>
    <input
        type="date"
        name="fechaDesde"
        value={filtrosAvanzados.fechaDesde}
        onChange={(e) =>
            setFiltrosAvanzados((prev) => {
                const actualizados = { ...prev, fechaDesde: e.target.value };
                sessionStorage.setItem("filtrosAvanzadosTicketsHistorial", JSON.stringify(actualizados));
                return actualizados;
            })
        }
        className="input-filtro"
    />

    <label className="label-fecha">Hasta:</label>
    <input
        type="date"
        name="fechaHasta"
        value={filtrosAvanzados.fechaHasta}
        onChange={(e) =>
            setFiltrosAvanzados((prev) => {
                const actualizados = { ...prev, fechaHasta: e.target.value };
                sessionStorage.setItem("filtrosAvanzadosTicketsHistorial", JSON.stringify(actualizados));
                return actualizados;
            })
        }
        className="input-filtro"
    />
</div>


                    <button
                    onClick={() => {
                        const filtrosVacios = {
                        codigo: "",
                        nombreApellido: "",
                        motivo: "",
                        contrato: "",
                        prioridad: "",
                        fechaDesde: "",
                        fechaHasta: "",
                        };
                        setFiltrosAvanzados(filtrosVacios);
                        sessionStorage.setItem("filtrosAvanzadosTickets", JSON.stringify(filtrosVacios));
                    }}
                    className="btn-limpiar-filtros"
                    >
                    Borrar filtros
                    </button>
                </div>
)}
</div>
                </section>




                </div>


                <div className="botones-reportes">
                    <div>
                {filteredTickets.length > 0 && (
                <>
                    <PDFDownloadLink
                    document={<ReporteTickets tickets={filteredTickets} />}
                    fileName="reporte_tickets.pdf"
                    style={{
                        padding: 10,
                        backgroundColor: '#c62828',
                        color: '#fff',
                        borderRadius: 4,
                        textDecoration: 'none',
                        marginRight: 16,
                    }}
                    onClick={() => {}}
                    >
                    {({ loading }) => (loading ? 'Generando PDF…' : '📄 Descargar reporte')}
                    </PDFDownloadLink>

                    <button onClick={abrirVistaPreviaEnNuevaVentana} className="btn-vista-previa"
            style={{
                        padding: 10,
                        backgroundColor: '#fff',
                        color: '#c62828',
                        border: '1px solid #c62828',
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
            >
              👁️ Ver vista previa
            </button>
                </>
                )}
                
                </div>
                </div>


                <div className="ver-datosC-grid">
                    
                        {filteredTickets.map(t => (
                        <div key={t.codigo_ticket} className="ver-datosC-card">
                            <h3>ID Ticket: <Link to={`/verti/vertickets/${t.codigo_ticket}`}>{t.codigo_ticket}</Link></h3>
                            <p>Cliente: {t.nombre_cliente} {t.apellido_cliente}</p>
                            <p>Motivo: {t.motivo_visita}</p>
                            <p>Prioridad: {t.prioridad_solicitud}</p>
                        </div>
                    ))
                    }

            {filteredTickets.length === 0 && (
                    <p style={{ marginTop: 16 }}>No se encontraron resultados…</p>
                )}
                    
                    
                </div>
            </div>
        </main>
    );
};

export default VerHistorialTickets;