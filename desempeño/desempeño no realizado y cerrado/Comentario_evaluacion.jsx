import React, { useState, useEffect } from "react";
import DetalleEvaluacionComentarioModal from "../versolicitudevaluada/DetalleEvaluacionComentarioModal";
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import ReporteComentarioPDF from "./ReporteComentarioPDF"; // ajusta ruta si es necesario
import './comentario.css';


const ComentarioEvaluacionForm = ({user}) => {
  const [noRealizados, setNoRealizados] = useState([]);
const [evaluaciones, setEvaluaciones] = useState([]);
  const [cerrados, setCerrados] = useState([]);
  const [ticketNoRealizado, setTicketNoRealizado] = useState(null);
  const [ticketCerrado, setTicketCerrado] = useState(null);
  const [comentario, setComentario] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
    const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const abrirModal = (evaluacion) => {
  setSelectedEvaluacion(evaluacion);
  setModalOpen(true);
};

  // Cargar tickets no realizados
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
                  const response = await fetch(`${process.env.REACT_APP_API_URL_ESTADO}/api/estado/soliCerradoTec`, {
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
                      setCerrados(uniqueData);
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

  // Cargar tickets cerrados
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
                      setNoRealizados(data);
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

  // Maneja selección ticket no realizado
  const handleSelectNoRealizado = (e) => {
    const id_soli_norealizada = e.target.value;
    setTicketNoRealizado(id_soli_norealizada ? noRealizados.find(t => String(t.id_soli_norealizada) === id_soli_norealizada) : null);
    setTicketCerrado(null);
    setComentario("");
    setError(null);
    setSuccessMsg("");
  };

  // Maneja selección ticket cerrado
  const handleSelectCerrado = (e) => {
    const id_soli_cerrada = e.target.value;
    setTicketCerrado(id_soli_cerrada ? cerrados.find(t => String(t.id_soli_cerrada) === id_soli_cerrada) : null);
    setTicketNoRealizado(null);
    setComentario("");
    setError(null);
    setSuccessMsg("");
  };


  useEffect(() => {
  const fetchEvaluaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/comentarios-evaluacion-lista`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener evaluaciones");
      const data = await res.json();
      setEvaluaciones(data); // ← estado nuevo
    } catch (err) {
      console.error("Error obteniendo evaluaciones:", err);
    }
  };

  fetchEvaluaciones();
}, []);




  const handleEnviar = () => {
    if (!ticketNoRealizado && !ticketCerrado) {
      setError("Debes seleccionar un ticket de alguna lista");
      return;
    }
    if (!comentario.trim()) {
      setError("El comentario no puede estar vacío");
      return;
    }
    setShowConfirm(true);
  };

  const confirmarEnviar = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError(null);
    setSuccessMsg("");
    try {
      const payload = {
  comentario,
};

// Si seleccionaste un ticket cerrado
if (ticketCerrado) {
  payload.id_soli_cerrada = ticketCerrado.id_soli_cerrada;
}
// Si seleccionaste un ticket no realizado
else if (ticketNoRealizado) {
  payload.id_soli_norealizada = ticketNoRealizado.id_soli_norealizada;
}
const token = localStorage.getItem("token");

const res = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/comentarios-evaluacion`, {
  method: "POST",
  headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
  body: JSON.stringify(payload),
});

      if (!res.ok) throw new Error("Error al enviar comentario");
      setSuccessMsg("Comentario enviado con éxito");
      setComentario("");
      setTicketNoRealizado(null);
      setTicketCerrado(null);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const ticketSeleccionado = ticketNoRealizado || ticketCerrado;

const idsNoReEvaluados = evaluaciones
  .filter(e => e.id_soli_norealizada !== null)
  .map(e => e.id_soli_norealizada);

const idsCerradosEvaluados = evaluaciones
  .filter(e => e.id_soli_cerrada !== null)
  .map(e => e.id_soli_cerrada);

const noRealizadosFiltrados = noRealizados.filter(t => !idsNoReEvaluados.includes(t.id_soli_norealizada));
const cerradosFiltrados = cerrados.filter(t => !idsCerradosEvaluados.includes(t.id_soli_cerrada));




const [modalOpen, setModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtros con persistencia
  const [filtrosEvaluaciones, setFiltrosEvaluaciones] = useState(() => {
    const guardado = sessionStorage.getItem("filtrosEvaluaciones");
    return guardado
      ? JSON.parse(guardado)
      : {
          searchGeneral: "",
          filtroCodigo: "",
          filtroTecnico: "",
          filtroCliente: "",
          filtroEstado:"",
          filtroPrioridad: "",
          fechaDesde: "",
          fechaHasta: "",
        };
  });

  // Guardar en sessionStorage al cambiar filtros
  useEffect(() => {
    sessionStorage.setItem("filtrosEvaluaciones", JSON.stringify(filtrosEvaluaciones));
  }, [filtrosEvaluaciones]);

  // Desestructurar filtros
  const {
    searchGeneral,
    filtroCodigo,
    filtroTecnico,
    filtroCliente,
    filtroEstado,
    filtroPrioridad,  
    fechaDesde,
    fechaHasta
  } = filtrosEvaluaciones;

const normalize = (str) =>
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

const tecnicosActivos = [...new Set(evaluaciones.map(ev => `${ev.nombre_tecnico} ${ev.apellido_tecnico}`))];

  const filteredEvaluaciones = evaluaciones.filter((evaluacion) => {
  const tecnicoNombre = `${evaluacion.nombre_tecnico ?? ""} ${evaluacion.apellido_tecnico ?? ""}`.trim();
  const clienteNombre = `${evaluacion.nombre_cliente ?? ""} ${evaluacion.apellido_cliente ?? ""}`.trim();
  const codigo = evaluacion.codigo_ticket ?? "";
  const prioridad = evaluacion.prioridad_solicitud ?? "";
  const estado = evaluacion.estado_solicitud ?? "";

  const matchCodigo = filtroCodigo === "" || normalize(codigo).includes(normalize(filtroCodigo));
  const matchTecnico = filtroTecnico === "" || tecnicoNombre === filtroTecnico;
  const matchCliente = filtroCliente === "" || normalize(clienteNombre).includes(normalize(filtroCliente));
  const matchPrioridad = filtroPrioridad === "" || normalize(prioridad).includes(normalize(filtroPrioridad));
  const matchEstado = filtroEstado === "" || normalize(estado).includes(normalize(filtroEstado));

  const fechaEvaluacion = evaluacion.fecha_evaluacion_tecnico?.slice(0, 10); // YYYY-MM-DD

  const matchFechaDesde = !fechaDesde || (fechaEvaluacion && fechaEvaluacion >= fechaDesde);
  const matchFechaHasta = !fechaHasta || (fechaEvaluacion && fechaEvaluacion <= fechaHasta);

  const matchSearchGeneral =
    searchGeneral === "" ||
    normalize(codigo).includes(normalize(searchGeneral)) ||
    normalize(tecnicoNombre).includes(normalize(searchGeneral)) ||
    normalize(clienteNombre).includes(normalize(searchGeneral)) ||
    normalize(prioridad).includes(normalize(searchGeneral));

  return (
    matchCodigo &&
    matchTecnico &&
    matchCliente &&
    matchPrioridad &&
    matchEstado &&
    matchFechaDesde &&
    matchFechaHasta &&
    matchSearchGeneral
  );
});

function tienePermiso(user, permisoRequerido) {
  return user?.permisos_usuarios?.includes(permisoRequerido);
}



  return (
    <div 
    className="contenedor-secciones-responsive"
    style={{
      
      margin: "20px auto",
      padding: 20,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",

    }}>
      
      
<section className="tarjeta-seccion">

        <h2 className="title">Solicitudes Evaluadas</h2>
  
        <section>
  
          <div className="search-bar">
    <input
      type="text"
      placeholder="Buscar por cualquier campo..."
      value={searchGeneral}
      onChange={(e) =>
        setFiltrosEvaluaciones((prev) => ({
          ...prev,
          searchGeneral: e.target.value,
        }))
      }
      className="search-input-eva input-filtro"
    />
  
    <div className="contenedor-filtros-avanzado">
        <div className="filtros-toggle-wrapper">
    <button className="btn-toggle-filtros" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
      {showAdvancedFilters ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
    </button>
  
  
  {showAdvancedFilters && (
    <div className=" filtros-avanzados-containe">
      <div>
        <label>Código de Ticket:</label>
        <input
          type="text"
          placeholder="Ej: TK1234"
          value={filtroCodigo}
          onChange={(e) => {
            const regex = /^[a-zA-Z0-9-]*$/;
            if (regex.test(e.target.value)) {
              setFiltrosEvaluaciones((prev) => ({
                ...prev,
                filtroCodigo: e.target.value,
              }));
            }
          }}
          className="input-filtro"
        />
      </div>
  
      <div>
        <label>Prioridad del ticket:</label>
        <select
          value={filtroPrioridad}
          onChange={(e) =>
            setFiltrosEvaluaciones((prev) => ({
              ...prev,
              filtroPrioridad: e.target.value,
            }))
          }
          className="input-filtro"
        >
          <option value="">Todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>
      </div>
  
      <div>
        <label>Técnico:</label>
        <select
          value={filtroTecnico}
          onChange={(e) =>
            setFiltrosEvaluaciones((prev) => ({
              ...prev,
              filtroTecnico: e.target.value,
            }))
          }
          className="input-filtro"
        >
          <option value="">Todos</option>
          {tecnicosActivos.map((tec, idx) => (
            <option key={idx} value={tec}>{tec}</option>
          ))}
        </select>
      </div>
  
      <div>
        <label>Cliente:</label>
        <input
          type="text"
          placeholder="Nombre o apellido del cliente"
          value={filtroCliente}
          onChange={(e) => {
            const valor = e.target.value;
            const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;

            if (soloLetras.test(valor)) {
                setFiltrosEvaluaciones((prev) => ({
                ...prev,
                filtroCliente: valor,
                }));
            }
            }}

          className="input-filtro"
        />
      </div>

      <div>
        <select
          name="estado"
          value={filtroEstado}
          onChange={(e) =>
            setFiltrosEvaluaciones((prev) => ({
              ...prev,
              filtroEstado: e.target.value,
            }))
          }
          className="input-filtro"
          >
          <option value="">Filtrar por Estado</option>
          <option value="Cerrado">Cerrado</option>
          <option value="No Realizado">No Realizado</option>
          </select>
        </div>
  
  <div>
    <label>Desde (fecha evaluación):</label>
    <input
      type="date"
      value={fechaDesde}
      onChange={(e) =>
        setFiltrosEvaluaciones((prev) => ({
          ...prev,
          fechaDesde: e.target.value
        }))
      }
      className="input-filtro"
    />
  </div>
  
  <div>
    <label>Hasta (fecha evaluación):</label>
    <input
      type="date"
      value={fechaHasta}
      onChange={(e) =>
        setFiltrosEvaluaciones((prev) => ({
          ...prev,
          fechaHasta: e.target.value
        }))
      }
      className="input-filtro"
    />
  </div>
  
      
  
  <button
    className="btn-limpiar-filtros"
    onClick={() =>
      setFiltrosEvaluaciones({
      searchGeneral: "",
      filtroCodigo: "",
      filtroTecnico: "",
      filtroPuntuacion: "",
      filtroCalificacion: "",
      filtroPrioridad: "",
      filtroCliente: "",
      filtroEstado: "",
      fechaDesde: "",   // <- corregido
      fechaHasta: ""    // <- corregido
    })
    }
  >
    Borrar filtros
  </button>
  
    </div>
  )}
  </div>
  </div>
        </div>
          
        </section>

      <div className="contenedor-botones-comen">
        {filteredEvaluaciones.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Previsualización */}
          <button
            className="btn-previsualizar-pdf"
            onClick={async () => {
              const blob = await pdf(<ReporteComentarioPDF tickets={filteredEvaluaciones} />
              ).toBlob();
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}
          >
            👁️ Ver vista previa
          </button>
      
          {/* Descarga */}
          <PDFDownloadLink
            document={<ReporteComentarioPDF tickets={filteredEvaluaciones} />
            }
            fileName={`Solicitudes-Filtradas.pdf`}
            className="btn-descargar-pdf"
          >
            {({ loading }) => (loading ? 'Generando...' : 'Descargar PDF')}
          </PDFDownloadLink>
        </div>
        )}
      
      </div>


      {filteredEvaluaciones.length === 0 ? (
  <p>No se encontraron solicitudes que coincidan con el filtro.</p>
) : (
  <div className="evaluated-requests">
  {filteredEvaluaciones.map((evaluacion) => (
    <div
      key={evaluacion.id_comentario_evaluacion}
      className="datos-evaluacion-card"
      onClick={() => abrirModal(evaluacion)}
      style={{ cursor: "pointer" }}
    >
      <p><strong>ID Comentario Evaluación:</strong> {evaluacion.id_comentario_evaluacion}</p>
      <p>
        <strong>Tipo Ticket:</strong>{" "}
        {evaluacion.id_soli_cerrada
          ? `Solicitud Cerrada (${evaluacion.codigo_ticket})`
          : evaluacion.id_soli_norealizada
          ? `Solicitud No Realizada (${evaluacion.codigo_ticket})`
          : "Desconocido"}
      </p>
      <p><strong>Comentario:</strong> {evaluacion.comentario}</p>
      <p><strong>Fecha Comentario:</strong> {new Date(evaluacion.fecha_comentario).toLocaleString()}</p>
    </div>
  ))}
</div>

)}

            {/* Modal para detalles de evaluación */}
            {selectedEvaluacion && (
              <DetalleEvaluacionComentarioModal 
                evaluacion={selectedEvaluacion} 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
              />
            )}

      </section>



      <section className="tarjeta-seccion">
      <h2 style={{textAlign: "center", marginBottom: 20}}>Agregar comentario evaluación</h2>

      {ticketSeleccionado && (
        <div style={{marginBottom: 20, padding: 12, backgroundColor: "#fff", borderRadius: 6, boxShadow: "0 1px 3px rgba(0,0,0,0.1)"}}>
          <p><strong>Código solicitud:</strong> {ticketSeleccionado.codigo_ticket}</p>
          <p><strong>Estado:</strong> {ticketSeleccionado.estado_solicitud}</p>
          <p><strong>Técnico:</strong> {ticketSeleccionado.nombre_tecnico} {ticketSeleccionado.apellido_tecnico}</p>
          <p><strong>Comentario trabajo realizado:</strong> {ticketSeleccionado.comentario_trabajo_norealizado}  {ticketSeleccionado.comentarios_tecnico}</p>
        </div>
      )}

      {error && <div style={{color:"red", marginBottom:10}}>{error}</div>}
      {successMsg && <div style={{color:"green", marginBottom:10}}>{successMsg}</div>}

      <label htmlFor="select-no-realizado" style={{display: "block", marginBottom: 8, fontWeight: "bold"}}>
        Tickets no realizados:
      </label>
      <select
        id="select-no-realizado"
        style={{width: "100%", padding: "8px", marginBottom: 20}}
        onChange={handleSelectNoRealizado}
        value={ticketNoRealizado ? ticketNoRealizado.id_soli_norealizada : ""}
        disabled={loading}
      >
        <option value="">-- Selecciona --</option>
        {noRealizadosFiltrados.length === 0 ? (
            <option value="">No hay tickets disponibles para evaluación</option>
        ) : (
            noRealizadosFiltrados.map(t => (
           <option key={t.id_soli_norealizada} value={t.id_soli_norealizada}>
                {t.codigo_ticket || `Ticket #${t.id_soli_norealizada}`}
            </option>
            ))
        )}
        </select>

      <label htmlFor="select-cerrado" style={{display: "block", marginBottom: 8, fontWeight: "bold"}}>
        Tickets cerrados:
      </label>
      <select
        id="select-cerrado"
        style={{width: "100%", padding: "8px", marginBottom: 20}}
        onChange={handleSelectCerrado}
        value={ticketCerrado ? ticketCerrado.id_soli_cerrada : ""}
        disabled={loading}
      >
        <option value="">-- Selecciona --</option>
        {cerradosFiltrados.length === 0 ? (
        <option disabled value="">No hay tickets disponibles para evaluación</option>
        ) : (
        cerradosFiltrados.map(t => (
            <option key={t.id_soli_cerrada} value={t.id_soli_cerrada}>
            {t.codigo_ticket || `Ticket #${t.id_soli_cerrada}`}
            </option>
        ))
        )}

      </select>

      

      <label htmlFor="comentario" style={{display: "block", marginBottom: 8, fontWeight: "bold"}}>
        Comentario interno:
      </label>
      <textarea
        id="comentario"
        style={{width: "100%", minHeight: 80, padding: 8, marginBottom: 20}}
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="Escribe aquí tu comentario..."
        disabled={loading || !ticketSeleccionado}
      />


 {(user?.tipo_usuario === 'Admin' || (user?.tipo_usuario === 'Moderador' && tienePermiso(user, "crear_evaluacion_cerrada"))) && (
      <button
        onClick={handleEnviar}
        disabled={loading || !ticketSeleccionado || !comentario.trim()}
        style={{
          backgroundColor: "#1976d2",
          color: "#fff",
          padding: "10px 20px",
          border: "none",
          borderRadius: 6,
          cursor: (ticketSeleccionado && comentario.trim() && !loading) ? "pointer" : "not-allowed",
          width: "100%",
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        {loading ? "Enviando..." : "Enviar Comentario"}
      </button>
      )}

      {/* Modal confirmación */}
      {showConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: 20,
            borderRadius: 8,
            maxWidth: 400,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
          }}>
            <p style={{marginBottom: 20}}>¿Estás seguro que deseas enviar este comentario?</p>
            <button
              onClick={confirmarEnviar}
              style={{
                backgroundColor: "#1976d2",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 6,
                marginRight: 10,
                cursor: "pointer"
              }}
            >
              Sí, enviar
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                backgroundColor: "#ccc",
                border: "none",
                padding: "10px 20px",
                borderRadius: 6,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
</section>


    </div>
  );
};

export default ComentarioEvaluacionForm;
