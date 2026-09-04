import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import ReporteClientes from "../Reportecliente/ReporteClientes";
import "./visualizacion.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

//const camposBusqueda = [
  //{ label: "ID Cliente", value: "id_cliente" },
 // { label: "Número de Contrato", value: "nro_contrato" },
 // { label: "Tipo de Servicio", value: "tipo_servicio" },
  //{ label: "Nombre", value: "nombre_cliente" },
  //{ label: "Apellido", value: "apellido_cliente" },
  //{ label: "Teléfono", value: "n_tlf_cliente" },
  //{ label: "Email", value: "email_cliente" },
//];

const VerdatosClientes = ({ user }) => {
  /* ─── permisos ─── */
  const tipo_usuario = user?.tipo_usuario;
  const permisos = user?.permisos || [];

  const tienePermiso = (p) => permisos.includes?.(p);
  const esAdmin = tipo_usuario === "Admin";

  const puedeVerPapelera = esAdmin || tienePermiso("ver_papelera");
  const puedeEliminar = esAdmin || tienePermiso("eliminar_cliente");
  const puedeRestaurar = esAdmin || tienePermiso("eliminar_cliente");
  //const [campoSeleccionado, setCampoSeleccionado] = useState("id_cliente");

  /* ─── navegación ─── */
  const { state } = useLocation();
  const navigate = useNavigate();
  const showBackButton = state?.showBackButton;

  /* ─── estado ─── */
  const [showTrash, setShowTrash] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
    const [mostrarFiltros, setMostrarFiltros] = useState(false);


const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
  const guardado = sessionStorage.getItem("filtrosClientes");
  return guardado ? JSON.parse(guardado) : {
    nombreApellido: "",
    contrato: "",
    tipoServicio: "",
    fechaDesde: "",
  fechaHasta: "",
  };
});


  const baseURL = process.env.REACT_APP_API_URL_VERCLIENTE;

  /* ─── Función para cargar clientes ─── */
  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autorizado: token no encontrado");

      const url = `${baseURL}/api/cliver/vercliente${showTrash ? "?inactivos=true" : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Formato de datos inesperado");
      setClientes(data);
    } catch (e) {
      setError(e.message);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  /* ─── cargar clientes al montar y cuando cambia showTrash ─── */
  //useEffect(() => {
    //fetchClientes();
  //}, [showTrash, baseURL]);

  useEffect(() => {
  fetchClientes();
}, [showTrash]);   // baseURL es constante; no hace falta incluirlo


  /* ─── eliminar (soft‑delete) ─── */
  const eliminar = async (id) => {
    if (!window.confirm("¿Enviar el cliente a la papelera?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseURL}/api/cliver/vercliente/eliminar/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchClientes();  // Recargar lista tras eliminar
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    }
  };

  /* ─── restaurar ─── */
  const restaurar = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseURL}/api/cliver/vercliente/restaurar/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchClientes();  // Recargar lista tras restaurar
    } catch (e) {
      alert("Error al restaurar: " + e.message);
    }
  };

  /* ─── búsqueda local ─── */
  const normalize = useCallback(
  (v) =>
    String(v ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
  []
);


  
/* ─── valores ya escritos por el usuario ─── */
const texto = normalize(searchTerm);                       // barra de búsqueda
const filtroNombreApellido = normalize(filtrosAvanzados.nombreApellido);
const filtroContrato       = normalize(filtrosAvanzados.contrato);
const filtroTipoServicio = normalize(filtrosAvanzados.tipo_servicio);

const fechaDesde = filtrosAvanzados.fechaDesde; // "YYYY-MM-DD" o ""
const fechaHasta = filtrosAvanzados.fechaHasta; // "YYYY-MM-DD" o ""

/* ─── filtrado combinado ─── */
const filtered = clientes.filter((c) => {
  // Campos que inspecciona la barra de búsqueda
  const hitsBusqueda = [
    c.id_cliente,
    c.nro_contrato,
    c.tipo_servicio,
    c.nombre_cliente,
    c.apellido_cliente,
    `${c.nombre_cliente} ${c.apellido_cliente}`,
    c.n_tlf_cliente,
    c.email_cliente,
  ]
    .map(normalize)
    .some((campo) => campo.includes(texto));

  /* --- 2. Coincidencia con filtros avanzados --- */
  const nombreCompleto = `${c.nombre_cliente ?? ""} ${c.apellido_cliente ?? ""}`;
  const fechaCliente   = c.fecha_creacion?.slice(0, 10) || ""; // "YYYY-MM-DD"

  const cumpleNombre   = !filtroNombreApellido || normalize(nombreCompleto).includes(filtroNombreApellido);
  const cumpleContrato = !filtroContrato       || normalize(c.nro_contrato).includes(filtroContrato);
  const cumpleTipoServicio =
  !filtroTipoServicio || normalize(c.tipo_servicio).includes(filtroTipoServicio);

  // Rango de fechas:
  const cumpleFecha =
    (!fechaDesde || fechaCliente >= fechaDesde) &&
    (!fechaHasta || fechaCliente <= fechaHasta);

  /* --- 3. Resultado final --- */
  return hitsBusqueda && cumpleNombre && cumpleContrato && cumpleFecha && cumpleTipoServicio;
});
  //const filteredClientes = clientes.filter((c) => {
    //const valorCampo = normalize(c[campoSeleccionado]);
    //const texto = normalize(searchTerm);
    //return valorCampo.includes(texto);
  //});

  /* ─── Abrir vista previa PDF en ventana nueva ─── */
  const abrirVistaPreviaEnNuevaVentana = async () => {
  if (filtered.length === 0) {
    alert("No hay datos válidos para vista previa");
    return;
  }

  try {
    const asPdf = pdf(<ReporteClientes clientes={filtered} />);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // No es necesario revocar inmediatamente — puede cerrarse antes
  } catch (error) {
    alert("Error al generar vista previa: " + error.message);
    console.error(error); // Importante para ver errores detallados
  }
};



useEffect(() => {
  sessionStorage.setItem("filtrosClientes", JSON.stringify(filtrosAvanzados));
}, [filtrosAvanzados]);




  /* ─── render ─── */
  if (loading) return <div>Cargando clientes…</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <main className="main-adm">
      <div className="verdatos-clientes-container">
        {showBackButton && (
          <button onClick={() => navigate(-1)} className="btn-link ver-boton-volver">
            <FontAwesomeIcon icon={faArrowLeft} className="boton-fotnawesome"/>
            Volver
          </button>
        )}

        

        

        <div className="encabezado-titulo">

        <h2 className="titulo-principal-ticket">{showTrash ? "Clientes en la papelera" : "Datos de Clientes"}</h2>

        
      {/*
      <select
        value={campoSeleccionado}
        onChange={(e) => setCampoSeleccionado(e.target.value)}
        style={{ marginRight: 10 }}
      >
        {camposBusqueda.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder={`Buscar por ${camposBusqueda.find(c => c.value === campoSeleccionado).label}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      */}

<section>
<input
  type="text"
  placeholder="Buscar cliente…"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
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
    name="nombreApellido"
    placeholder="Nombre y apellido"
    value={filtrosAvanzados.nombreApellido}
    onChange={(e) => {
    const valor = e.target.value;
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;

    if (soloLetras.test(valor)) {
      setFiltrosAvanzados((prev) => ({
        ...prev,
        nombreApellido: valor,
      }));
    }
  }}
    className="input-filtro"
  />

<input
  type="text"
  name="contrato"
  placeholder="N.º de contrato"
  value={filtrosAvanzados.contrato}
  onChange={(e) => {
    const valor = e.target.value;
    const soloNumeros = /^[0-9]*$/;

    if (soloNumeros.test(valor)) {
      setFiltrosAvanzados((prev) => ({
        ...prev,
        contrato: valor,
      }));
    }
  }}
  className="input-filtro"
/>


  <select
  name="tipo_servicio"
  value={filtrosAvanzados.tipo_servicio}
  onChange={(e) =>
    setFiltrosAvanzados((prev) => ({
      ...prev,
      tipo_servicio: e.target.value,
    }))
  }
  className="input-filtro"
>
  <option value="">Tipo de servicio</option>
  <option value="Postpago">Postpago</option>
  <option value="Prepago">Prepago</option>
</select>

  <div className="filtro-fechas">
    <label className="label-fecha">Desde:</label>
    <input
      type="date"
      name="fechaDesde"
      value={filtrosAvanzados.fechaDesde}
      onChange={(e) =>
        setFiltrosAvanzados((prev) => ({
          ...prev,
          fechaDesde: e.target.value,
        }))
      }
      className="input-filtro"
    />

    <label className="label-fecha">Hasta:</label>
    <input
      type="date"
      name="fechaHasta"
      value={filtrosAvanzados.fechaHasta}
      onChange={(e) =>
        setFiltrosAvanzados((prev) => ({
          ...prev,
          fechaHasta: e.target.value,
        }))
      }
      className="input-filtro"
    />
  </div>
<button
  onClick={() => setFiltrosAvanzados({ nombreApellido: "", contrato: "", tipoServicio: "", fecha: "" })}
  className="btn-limpiar-filtros"
>
  Limpiar filtros
</button>
</div>

)}
</div>
</section>



    </div>

<div className="conteiner-botones-encabezado">
  <div>
        {puedeVerPapelera && (
          <button
            onClick={() => setShowTrash((t) => !t)}
            className="toggle-trash-btn"
          >
            {showTrash ? "👥 Ver activos" : "🗑️ Ver papelera"}
          </button>
        )}
  </div>

<div className="botones-reportes">
  
                    <div className="btn-pdf-contenedor">
    {filtered.length > 0 && !showTrash && (
          <>
          <div className="btn-pdf">
            <PDFDownloadLink
              document={<ReporteClientes clientes={filtered} />}
              fileName="reporte_clientes.pdf"
              
              style={{

                        color: '#fff',
                        borderRadius: 4,
                        textDecoration: 'none',
                    }}
                    
              onClick={() => {}}
            >
              {({ loading }) => (loading ? "Generando…" : "📄 Descargar reporte")}
            </PDFDownloadLink>
            </div>

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

        </div>

        <div className="ver-datosC-grid">
          {filtered.map((c, index) => (
            <div key={c.id_cliente ?? index} className="ver-datosC-card">
              <h3>
                ID: <Link to={`/cliver/vercliente/${c.id_cliente}`}>{c.id_cliente ?? "Sin nombre"}</Link>
              </h3>
              <p>{`${c.nombre_cliente || ""} ${c.apellido_cliente || ""}`}</p>

              {showTrash ? (
                puedeRestaurar && (
                  <button
                    onClick={() => restaurar(c.id_cliente)}
                    className="btn-restore"
                  >
                    ↩️ Restaurar
                  </button>
                )
              ) : (
                puedeEliminar && (
                  <button
                    onClick={() => eliminar(c.id_cliente)}
                    className="btn-delete"
                  >
                    🗑️ Eliminar
                  </button>
                )
              )}
            </div>
          ))}

          {filtered.length === 0 && (
        <p style={{ marginTop: 16 }}>No se encontraron resultados…</p>
      )}
        </div>
      </div>
    </main>
  );
};

export default VerdatosClientes;
