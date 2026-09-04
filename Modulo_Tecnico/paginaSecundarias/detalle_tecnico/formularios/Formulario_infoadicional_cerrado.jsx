import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

/**
 * Modal para registrar el CIERRE SIN SOLUCIÓN de una solicitud.
 * Envía los datos al endpoint /api/guardarsolicitudcerrada
 */
const CierreCasoCerradoModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams(); // codigo_solicitud

  // Datos de la solicitud y visitas
  const [solicitudAsigTec, setSolicitudAsigTec] = useState({});
  const [datosVisitas, setDatosVisitas] = useState({});

  // Campos de formulario
  const [motivoCierre, setMotivoCierre] = useState('');
  const [comentariosTecnico, setComentariosTecnico] = useState('');
  const [intentosResolucion, setIntentosResolucion] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [error, setError] = useState(null);

  /** Obtiene datos básicos de la solicitud asignada al técnico */
  useEffect(() => {
    let mounted = true;

    const fetchSolicitud = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/solicitudAsigTec/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) setSolicitudAsigTec(data);
      } catch (e) {
        if (mounted) setError(e.message);
      }
    };

    fetchSolicitud();
    return () => (mounted = false);
  }, [id]);

  /** Obtiene datos de visitas cuando ya tenemos el codigo de solicitud */
  useEffect(() => {
    if (!solicitudAsigTec.codigo_solicitud) return;

    const fetchVisitas = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/datosdeVisitas/${solicitudAsigTec.codigo_solicitud}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDatosVisitas(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitas();
  }, [solicitudAsigTec.codigo_solicitud]);

  /** Obtiene el último cambio de historial para la solicitud */
  const obtenerUltimoCambioHistorial = async (codigo) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/historial/todos/${codigo}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  /** Maneja el envío del formulario */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargandoEnvio(true);

    if (!motivoCierre || !comentariosTecnico) {
      setError('Por favor complete motivo y comentarios.');
      setCargandoEnvio(false);
      return;
    }

    const ultimoCambio = await obtenerUltimoCambioHistorial(solicitudAsigTec.codigo_solicitud);
    const idHistorial = ultimoCambio?.id_historial_cambioestado ?? null;

    const payload = {
      codigo_solicitud: solicitudAsigTec.codigo_solicitud,
      motivo_cierre: motivoCierre,
      comentarios_tecnico: comentariosTecnico,
      intentos_resolucion: intentosResolucion,
      id_datosvisita: datosVisitas.id_datosvisita,
      id_historial_cambioestado: idHistorial,
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/guardarsolicitudcerrada`, {
        method: 'POST',
        headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,  // <-- Aquí va
    },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok) {

                await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/marcarFormularioEnviado`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ codigo_solicitud: solicitudAsigTec.codigo_solicitud }),
                });

        enqueueSnackbar('Solicitud cerrada sin solución registrada con éxito.', { variant: 'success' });
        onClose();
        navigate('/SolicitudAsig');
      } else {
        enqueueSnackbar(result.message || 'Error al cerrar la solicitud.', { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar('Error de red al enviar el cierre.', { variant: 'error' });
    } finally {
      setCargandoEnvio(false);
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (loading) return <div>Cargando...</div>;

  return (
    <div className="modal">
      {cargandoEnvio ? (
        <h2>Cerrando la Solicitud, por favor espere...</h2>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="div-contenedor-form-completado-parte-superior">
            <label><span className="subtitulo-form-completado">Solicitud: </span>{solicitudAsigTec.codigo_ticket}</label>
            <label><span className="subtitulo-form-completado">Estado: </span>{solicitudAsigTec.estado_solicitud}</label>
          </div>

          <div className="div-contenedor-form-completado-falla">
            <div>
              <label className="subtitulo-form-completado" htmlFor="motivoCierre">Motivo de Cierre:</label>
            </div>
            <div>
              <select
                id="motivoCierre"
                value={motivoCierre}
                onChange={(e) => setMotivoCierre(e.target.value)}
                className="input-form-completado"
                required
              >
                <option value="">Seleccione una opción</option>
                <option value="Fuera de Alcance">Fuera de Alcance</option>
                <option value="Falta de Recursos">Falta de Recursos</option>
                <option value="Cliente Inaccesible">Cliente Inaccesible</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="div-contenedor-form-completado">
            <div>
              <label className="subtitulo-form-completado" htmlFor="comentariosTecnico">Comentarios del Técnico:</label>
            </div>
            <div>
              <textarea
                id="comentariosTecnico"
                value={comentariosTecnico}
                onChange={(e) => setComentariosTecnico(e.target.value)}
                rows={4}
                className="input-form-completado-textaterea"
                required
              />
            </div>
          </div>

          <div className="div-contenedor-form-completado">
            <div>
              <label className="subtitulo-form-completado" htmlFor="intentosResolucion">Intentos de Resolución (opcional):</label>
            </div>
            <div>
              <textarea
                id="intentosResolucion"
                value={intentosResolucion}
                onChange={(e) => setIntentosResolucion(e.target.value)}
                rows={3}
                className="input-form-completado-textaterea"
              />
            </div>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div className="div-contenedor-form-completado-botones">
            <button
  type="submit"
  style={{
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    marginRight: '10px',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0056b3')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007bff')}
>
  Guardar Cierre
</button>

<button
  type="button"
  onClick={onClose}
  style={{
    backgroundColor: '#ccc',
    color: '#333',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#999')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ccc')}
>
  Cancelar
</button>

          </div>
        </form>
      )}
    </div>
  );
};

export default CierreCasoCerradoModal;