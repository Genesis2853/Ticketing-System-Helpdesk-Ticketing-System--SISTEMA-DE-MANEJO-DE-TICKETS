import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import ReporteTicketsSS from '../Reportecliente/ReporteTSinAsignar';
import "./visualizacion.css";


const VerdatosTickets = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const showBackButton = location.state?.showBackButton;
    
const irListado = () =>
    navigate("/verhistorialticket", { state: { showBackButton: true } });

    const handleBack = () => {
        navigate(-1);
    };

    const [verTickets, setTickets] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda
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
                const response = await fetch(`${process.env.REACT_APP_API_URL_VERTICKETS}/api/verti/vertickets`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setTickets(data);
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

  // Validar según el campo
  if (name === "codigo") {
    const regexCodigo = /^[a-zA-Z0-9-]*$/;
    if (!regexCodigo.test(value)) return;
  }

  if (name === "nombreApellido") {
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
    if (!regexNombre.test(value)) return;
  }

  if (name === "contrato") {
    const regexContrato = /^[0-9]*$/;
    if (!regexContrato.test(value)) return;
  }

  // Siempre se mantiene esta línea intacta
  setFiltrosAvanzados(prev => ({ ...prev, [name]: value }));
};


const fechaDesde = filtrosAvanzados.fechaDesde;
const fechaHasta = filtrosAvanzados.fechaHasta;


   const filteredTickets = verTickets.filter(ticket => {
    const codigo = ticket.codigo_ticket?.toLowerCase() ?? '';
    const idCliente = ticket.id_cliente?.toLowerCase() ?? '';
    const nombreCompleto = `${ticket.nombre_cliente ?? ""} ${ticket.apellido_cliente ?? ""}`.toLowerCase();
  const nombreInvertido = `${ticket.apellido_cliente ?? ""} ${ticket.nombre_cliente ?? ""}`.toLowerCase();
    const nombre = ticket.nombre_cliente?.toLowerCase() ?? '';
    const contrato = ticket.nro_contrato?.toLowerCase() ?? '';
    const apellido = ticket.apellido_cliente?.toLowerCase() ?? '';
    const motivo = ticket.motivo_visita?.toLowerCase() ?? '';
    const prioridad = ticket.prioridad_solicitud?.toLowerCase() ?? '';

    const search = searchTerm.toLowerCase();

    const coincideBusquedaGeneral =
        codigo.includes(search) ||
        idCliente.includes(search) ||
        nombre.includes(search) ||
        contrato.includes(search) ||
        apellido.includes(search) ||
        `${nombre} ${apellido}`.includes(search) ||
        `${apellido} ${nombre}`.includes(search) ||
        motivo.includes(search) ||
        prioridad.includes(search);

    const coincideFiltrosAvanzados =
    codigo.includes((filtrosAvanzados.codigo || "").toLowerCase()) &&
    (
      nombreCompleto.includes((filtrosAvanzados.nombreApellido || "").toLowerCase()) ||
      nombreInvertido.includes((filtrosAvanzados.nombreApellido || "").toLowerCase())
    ) &&
    motivo.includes((filtrosAvanzados.motivo || "").toLowerCase()) &&
    contrato.includes((filtrosAvanzados.contrato || "").toLowerCase()) &&
    prioridad.includes((filtrosAvanzados.prioridad || "").toLowerCase());
    const fechaTicket = ticket.fecha_creacion?.slice(0, 10); // Asegúrate que sea tipo YYYY-MM-DD
    const cumpleFecha =
        (!fechaDesde || fechaTicket >= fechaDesde) &&
        (!fechaHasta || fechaTicket <= fechaHasta);


    return coincideBusquedaGeneral && coincideFiltrosAvanzados &&
        cumpleFecha;
});


    useEffect(() => {
    sessionStorage.setItem("filtrosAvanzadosTickets", JSON.stringify(filtrosAvanzados));
}, [filtrosAvanzados]);



const abrirVistaPreviaEnNuevaVentana = async () => {
    const blob = await pdf(<ReporteTicketsSS tickets={filteredTickets} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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
                <h2 className="titulo-principal-ticket">Tickets Disponibles</h2>

                <section>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input search-input-ticket"
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
                        value={filtrosAvanzados.codigo}
                        onChange={handleFiltroAvanzadoChange}
                        placeholder="Filtrar por código"
                        className="input-filtro"
                    />
                    
                    <input
                        type="text"
                        name="nombreApellido"
                        placeholder="Cliente"
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
          <div  className="botones-reportes-t" >
            <div className='contenedor-botn-historialt'><button onClick={irListado} className="boton-historialtickets">Ver Historial Tickets</button></div>
           
           
           <div className="btn-pdf-contenedor pd">
            {filteredTickets.length > 0 && (
              <>
              <div className="btn-pdf">
                <PDFDownloadLink
                  document={<ReporteTicketsSS tickets={filteredTickets} />}
                  fileName="reporte_tickets.pdf"
                  style={{
                    color: 'white',
                    borderRadius: 4,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {({ loading }) => (loading ? 'Generando PDF…' : 'Descargar reporte')}
                </PDFDownloadLink>
                </div>

                  <div>
                <button
                  onClick={abrirVistaPreviaEnNuevaVentana}
                  className="btn-vista-previa at"
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
                </div>
              </>
            )}
            </div>
          </div>
        </div>




                <div className="ver-datosC-grid">
                    {filteredTickets.length === 0 ? (
                        <p>No hay Solicitudes Nuevas disponibles.</p>
                    ):(
                        filteredTickets.map(verTike => (
                        <div key={verTike.codigo_ticket} className="ver-datosC-card">
                            <h3>ID Ticket: <Link to={`/verti/vertickets/${verTike.codigo_ticket}`}>{verTike.codigo_ticket}</Link></h3>
                            <p>Cliente: {verTike.id_cliente}</p>
                            <p>Motivo: {verTike.motivo_visita}</p>
                            <p>Prioridad: {verTike.prioridad_solicitud}</p>
                        </div>
                    ))
                    )}
                    
                </div>
            </div>
        </main>
    );
};

export default VerdatosTickets;