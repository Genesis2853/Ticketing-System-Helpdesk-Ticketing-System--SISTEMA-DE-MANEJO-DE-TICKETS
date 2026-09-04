import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import ReporteTecnicos from '../Reportecliente/ReporteTecnicos';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const VerdatosTecnico = ({ user }) => {
  const tipo_usuario = user?.tipo_usuario;
  const permisos = user?.permisos || [];
  const esAdmin = tipo_usuario === 'Admin';
  const tienePermiso = (p) => permisos.includes?.(p);

  const puedeVerPapelera = esAdmin || tienePermiso('ver_papelera_tecnicos');
  const puedeEliminar = esAdmin || tienePermiso('eliminar_tecnicos');
  const puedeRestaurar = esAdmin || tienePermiso('eliminar_tecnicos');

  const [showTrash, setShowTrash] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = location.state?.showBackButton;

  const [verTecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
    const guardado = sessionStorage.getItem("filtrosTecnicos");
    return guardado ? JSON.parse(guardado) : {
      nombreApellido: "",
      cedula: "",
      fechaDesde: "",
    fechaHasta: "",
    };
  });

  // Función para traer técnicos (activos o papelera)
  const fetchTecnicos = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No autorizado: token no encontrado.");
      setLoading(false);
      return;
    }
    try {
      const url = `${process.env.REACT_APP_API_URL_VERTECNICO}/api/tecver/tecnicos${showTrash ? '?inactivos=true' : ''}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      setTecnicos(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTecnicos();
  }, [showTrash]);

  // Manejo eliminación: refresca la lista desde backend
  const handleDelete = async (id) => {
    if (!window.confirm('¿Enviar el técnico a la papelera?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL_VERTECNICO}/api/tecver/tecnicos/delete/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTecnicos(); // refrescar lista
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Manejo restaurar: refresca la lista desde backend
  const handleRestore = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL_VERTECNICO}/api/tecver/tecnicos/restore/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchTecnicos(); // refrescar lista
    } catch (err) {
      alert('Error al restaurar: ' + err.message);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  

  // Normaliza y limpia texto para búsqueda
  const str = (v) =>
    String(v ?? '')
      .normalize("NFD")                 // descompone letras con acento
      .replace(/[\u0300-\u036f]/g, "") // remueve marcas de acento
      .toLowerCase();

  const texto = str(searchTerm);

  const filtroNombreApellido = str(filtrosAvanzados.nombreApellido);
const filtrocedula       = str(filtrosAvanzados.cedula);

const fechaDesde = filtrosAvanzados.fechaDesde; // "YYYY-MM-DD" o ""
const fechaHasta = filtrosAvanzados.fechaHasta; // "YYYY-MM-DD" o ""

  // Filtrado separado
  const filteredTecnicos = verTecnicos
    .filter(t => (showTrash ? !t.activo : t.activo))
    .filter(t => {
      str(t.codigo_trabajador).includes(texto) ||
      str(t.ci_tecnico).includes(texto) ||
      str(t.nombre_tecnico).includes(texto) ||
      str(t.apellido_tecnico).includes(texto) ||
      str(`${t.nombre_tecnico} ${t.apellido_tecnico}`).includes(texto) ||
      str(`${t.apellido_tecnico} ${t.nombre_tecnico}`).includes(texto) ||
      str(t.n_tlf_tecnico).includes(texto) ||
      str(t.email_tecnico).includes(texto)


      /* --- 2. Coincidencia con filtros avanzados --- */
  const nombreCompleto = `${t.nombre_tecnico ?? ""} ${t.apellido_tecnico ?? ""}`;
  const fechaCliente   = t.fecha_creacion_tecnico?.slice(0, 10) || ""; // "YYYY-MM-DD"

  const cumpleNombre   = !filtroNombreApellido || str(nombreCompleto).includes(filtroNombreApellido);
  const cumplecedula = !filtrocedula       || str(t.ci_tecnico).includes(filtrocedula);

  // Rango de fechas:
  const cumpleFecha =
    (!fechaDesde || fechaCliente >= fechaDesde) &&
    (!fechaHasta || fechaCliente <= fechaHasta);

  /* --- 3. Resultado final --- */
  return cumpleNombre && cumplecedula && cumpleFecha;
    }
    );
    
useEffect(() => {
  sessionStorage.setItem("filtrosTecnicos", JSON.stringify(filtrosAvanzados));
}, [filtrosAvanzados]);
  // Técnicos válidos para reporte PDF
  

  // Función para abrir vista previa en ventana nueva
  const abrirVistaPreviaEnNuevaVentana = async () => {
    if (filteredTecnicos.length === 0) {
    alert("No hay datos válidos para vista previa");
    return;
  }

  try {
    const asPdf = pdf(<ReporteTecnicos tecnicos={filteredTecnicos} />);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // No es necesario revocar inmediatamente — puede cerrarse antes
  } catch (error) {
    alert("Error al generar vista previa: " + error.message);
    console.error(error); // Importante para ver errores detallados
  }
  };

  if (loading) return <div>Cargando técnicos...</div>;
  if (error) return <div>Error al cargar los técnicos: {error}</div>;

  return (
    <main className="main-adm">
      <div className="verdatos-tecnicos-container">
        {showBackButton && (
          <button onClick={() => navigate(-1)} className="btn-link ver-boton-volver">
            <FontAwesomeIcon icon={faArrowLeft} className="boton-fotnawesome"/>
            Volver
          </button>
        )}

        

        <div className="encabezado-titulo">
        <h2 className="titulo-principal-ticket">{showTrash ? 'Técnicos en la papelera' : 'Datos de Técnicos'}</h2>

        <section>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar técnico..."
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
          onChange={(e) =>
            setFiltrosAvanzados((prev) => ({
              ...prev,
              nombreApellido: e.target.value,
            }))
          }
          className="input-filtro"
        />

        <input
          type="text"
          name="cedula"
          placeholder="cedula"
          value={filtrosAvanzados.cedula}
          onChange={(e) =>
            setFiltrosAvanzados((prev) => ({
              ...prev,
              cedula: e.target.value,
            }))
          }
          className="input-filtro"
        />

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
        onClick={() => setFiltrosAvanzados({ nombreApellido: "", cedula: "", fecha: "" })}
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
          <button onClick={() => setShowTrash(t => !t)} className="toggle-trash-btn">
            {showTrash ? '👥 Ver activos' : '🗑️ Ver papelera'}
          </button>
        )}
        </div>
        

<div className="botones-reportes">
  
                    <div className="btn-pdf-contenedor">
        {!showTrash && filteredTecnicos.length > 0 && (
          <>
          <div className="btn-pdf">
            <PDFDownloadLink
              document={<ReporteTecnicos tecnicos={filteredTecnicos} />}
              fileName="reporte_tecnicos.pdf"
               style={{

                        color: '#fff',
                        borderRadius: 4,
                        textDecoration: 'none',
                    }}
            >
              {({ loading }) => (loading ? 'Generando PDF…' : '📄 Descargar reporte')}
            </PDFDownloadLink>
            </div>

            <button
              onClick={abrirVistaPreviaEnNuevaVentana}
              className="btn-vista-previa"
              style={{
                padding: 10,
                backgroundColor: '#fff',
                color: '#c62828',
                border: '1px solid #c62828',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
             👁️  Ver vista previa
            </button>
          </>
        )}
        </div>
        </div>

        </div>



        <div className="ver-datosC-grid">
          {filteredTecnicos.map(t => {
            if (!t || !t.codigo_trabajador) return null;
            return (
              <div key={t.codigo_trabajador} className="ver-datosC-card">
                <h3>ID Técnico: <Link to={`/tecver/tecnicos/${t.codigo_trabajador}`}>{t.codigo_trabajador}</Link></h3>
                <p>Nombre: {t.nombre_tecnico}</p>
                <p>Apellido: {t.apellido_tecnico}</p>

                {showTrash ? (
                  puedeRestaurar && (
                    <button onClick={() => handleRestore(t.codigo_trabajador)} className="btn-restore">
                      ↩️ Restaurar
                    </button>
                  )
                ) : (
                  puedeEliminar && (
                    <button onClick={() => handleDelete(t.codigo_trabajador)} className="btn-delete">
                      🗑️ Eliminar
                    </button>
                  )
                )}
              </div>
            );
          })}

{filteredTecnicos.length === 0 && (
        <p style={{ marginTop: 16 }}>No se encontraron resultados…</p>
      )}

        </div>
      </div>
    </main>
  );
};

export default VerdatosTecnico;
