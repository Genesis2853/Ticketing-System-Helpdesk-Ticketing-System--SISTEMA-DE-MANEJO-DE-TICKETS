import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import './Formularioasignacionsoli.css';
import DecisionReport from './InformeArbolDecision';
import emailjs from "@emailjs/browser"; // Importar EmailJS

const AsignacionForm = ({ user }) => {
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [codigoTicket, setCodigoTicket] = useState('');
  const [codigoTrabajador, setCodigoTrabajador] = useState('');
  const [autoAsignar, setAutoAsignar] = useState(false);
  const [rangoTickets, setRangoTickets] = useState(5);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [errors, setErrors] = useState({});
  const [messages, setMessages] = useState([]); // Estado para mensajes del informe
  const { enqueueSnackbar } = useSnackbar();
  console.log("Usuario recibido en asignaticke:", user);
  const [modoAsignacion, setModoAsignacion] = useState('manual'); // 'manual' o 'automatico'




  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const ticketsRes = await fetch(`${process.env.REACT_APP_API_URL_ASSIGN}/api/asignar/tickets`);
        const ticketsData = await ticketsRes.json();
        if (Array.isArray(ticketsData) && mounted) setTickets(ticketsData);

        const tecnicosRes = await fetch(`${process.env.REACT_APP_API_URL_ASSIGN}/api/asignar/tecnicos`);
        const tecnicosData = await tecnicosRes.json();
        if (mounted) setTecnicos(tecnicosData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, []);



  function validate() {
    const formErrors = {};
    if (!codigoTicket) formErrors.codigoTicket = '(¡El código de ticket es requerido!)';
    if (!codigoTrabajador) formErrors.codigoTrabajador = '(¡El código del trabajador es requerido!)';
    return formErrors;
  }


  async function handleSubmit(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setErrors({ submit: 'No autorizado: token no encontrado.' });
      return;
    }

    const formErrors = validate();
    if (Object.keys(formErrors).length) {
      setErrors(formErrors);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL_ASSIGN}/api/asignar/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo_ticket: codigoTicket, codigo_trabajador: codigoTrabajador }),
      });
      if (!response.ok) throw new Error('Error al asignar el ticket');
      const result = await response.json();
      enqueueSnackbar(`Ticket asignado correctamente. Código de solicitud: ${result.codigo_ticket}`, { variant: 'success' });

      // Enviar correo al técnico
const tecnico = tecnicos.find(t => t.codigo_trabajador === codigoTrabajador);
if (tecnico) {
  await enviarCorreoAlTecnico(tecnico, codigoTicket);
}
      setCodigoTicket('');
      setCodigoTrabajador('');
      setErrors({});
    } catch (err) {
      console.error('Error asignando ticket:', err);
      setErrors({ submit: 'Error asignando ticket' });
    }
  }


  function toggleTicketSelection(id) {
    setSelectedTickets(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  }



  async function handleAutoAsignar() {

const token = localStorage.getItem('token');
    if (!token) {
      setErrors({ submit: 'No autorizado: token no encontrado.' });
      return;
    }


  let mensajesTemporales = ['Comenzando asignación automática...'];
  setMessages(mensajesTemporales);
  sessionStorage.setItem('informeAsignacion', JSON.stringify(mensajesTemporales));

  if (!selectedTickets.length && rangoTickets < 1) {
    enqueueSnackbar('Debes seleccionar tickets para asignar.', { variant: 'warning' });
    return;
  }

  let ticketsToAssign = selectedTickets.length
    ? selectedTickets
    : tickets.slice(0, rangoTickets).map(t => t.codigo_ticket);

  for (const ticketId of ticketsToAssign) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL_ASSIGN}/api/asignar/automatico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ticketIds: [ticketId] }),
      });

      if (!response.ok) throw new Error(`Error asignando ticket ${ticketId}`);

      const { assignedResults, messages: resultMessages } = await response.json();

      if (!Array.isArray(assignedResults)) {
        const errorMsg = 'Error: los resultados de asignación no son un arreglo.';
        mensajesTemporales.push(errorMsg);
        setMessages([...mensajesTemporales]);
        sessionStorage.setItem('informeAsignacion', JSON.stringify(mensajesTemporales));
        return;
      }

      if (Array.isArray(resultMessages)) {
        resultMessages.forEach(msg => {
          if (!mensajesTemporales.includes(msg)) {
            mensajesTemporales.push(msg);
          }
        });
      } else {
        const errorMsg = 'Error: los mensajes no son un arreglo.';
        mensajesTemporales.push(errorMsg);
      }

      const assignedTicket = assignedResults.find(result => result.ticketId === ticketId);
      if (assignedTicket && assignedTicket.assignedTo) {
        enqueueSnackbar(`Ticket ${ticketId} asignado a técnico ${assignedTicket.assignedTo}`, { variant: 'success' });

        // Buscar técnico y enviar correo
  const tecnico = tecnicos.find(t => t.codigo_trabajador === assignedTicket.codigo_trabajador);

  if (tecnico) {
    await enviarCorreoAlTecnico(tecnico, ticketId);
  }

      } else {
        enqueueSnackbar(`Ticket ${ticketId} no pudo ser asignado`, { variant: 'error' });
      }

      

      // Actualizar mensajes en UI y sesión en cada iteración (opcional pero útil)
      setMessages([...mensajesTemporales]);
      sessionStorage.setItem('informeAsignacion', JSON.stringify(mensajesTemporales));
    } catch (error) {
      enqueueSnackbar(`Error asignando ticket ${ticketId}`, { variant: 'error' });
    }
  }

  mensajesTemporales.push('Asignación terminada.');
  setMessages([...mensajesTemporales]);
  sessionStorage.setItem('informeAsignacion', JSON.stringify(mensajesTemporales));
}

const enviarCorreoAlTecnico = async (tecnico, codigoTicket) => {
  const parametros = {
    email: tecnico.email_tecnico, // Puedes reemplazar esto por el campo correcto
    codigo_trabajador: tecnico.codigo_trabajador,
    nombre_tecnico: tecnico.nombre_tecnico,
    apellido_tecnico: tecnico.apellido_tecnico,
    codigo_ticket: codigoTicket.codigo_ticket,
    prioridad_solicitud: codigoTicket.prioridad_solicitud,
  };

  try {
    const response = await emailjs.send(
      "service_opy9xqi", // Reemplaza si usas otro
      "template_8p1wqxa", // Reemplaza si usas otro
      parametros,
      "hJb5SgCmx8Bbm8Mwl"
    );
    console.log("✅ Correo enviado al técnico:", response.status);
  } catch (error) {
    console.error("❌ Error al enviar el correo al técnico:", error);
  }
};






  return (
  <div className="asignacion-container">

    <button 
      type="button"
      className="boton-toggle"
      onClick={() => setModoAsignacion(modoAsignacion === 'manual' ? 'automatico' : 'manual')}
      style={{ 
        width: '200px',      // Ancho fijo para mejor apariencia
        marginBottom: '1rem' // Espacio debajo del botón
      }}
    >
      {modoAsignacion === 'manual' ? 'Cambiar a Automático' : 'Cambiar a Manual'}
    </button>

    <div style={{ display: 'flex', gap: '4rem' }}>
      {/* Formulario Manual (visible solo en modo manual) */}
      {modoAsignacion === 'manual' && (
        <form className="form-asignacionsoli" onSubmit={handleSubmit} style={{ flex: '1', minWidth: '320px' }}>
          <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: '1rem', color: '#111827' }}>Asignación Manual</h2>

          <label htmlFor="codigo_ticket" className="form-titulos-AS label-asig">Código de Ticket:</label>
          <select
            id="codigo_ticket"
            className="form-box-AS"
            value={codigoTicket}
            onChange={e => setCodigoTicket(e.target.value)}
            required
            disabled={autoAsignar}
          >
            <option value="">Seleccione un ticket</option>
            {tickets.map(t => <option key={t.codigo_ticket} value={t.codigo_ticket}>{t.codigo_ticket}</option>)}
          </select>
          {errors.codigoTicket && <p className="form-alertaerror-AS">{errors.codigoTicket}</p>}

          <label htmlFor="codigo_trabajador" className="form-titulos-AS label-asig" style={{ marginTop: '1rem' }}>Técnico:</label>
          <select
            id="codigo_trabajador"
            className="form-box-AS"
            value={codigoTrabajador}
            onChange={e => setCodigoTrabajador(e.target.value)}
            required
            disabled={autoAsignar}
          >
            <option value="">Seleccione un técnico</option>
            {tecnicos.map(t => (
              <option key={t.codigo_trabajador} value={t.codigo_trabajador}>
                {t.codigo_trabajador} {t.nombre_tecnico} {t.apellido_tecnico}
              </option>
            ))}
          </select>
          {errors.codigoTrabajador && <p className="form-alertaerror-AS">{errors.codigoTrabajador}</p>}

          <button type="submit" className="form-button-AS" style={{ marginTop: '1.5rem' }} disabled={autoAsignar}>Asignar Ticket</button>

          {errors.submit && <p className="form-alertaerror-AS">{errors.submit}</p>}
        </form>
      )}

      {/* Panel asignación automática (visible solo en modo automático) */}
      {modoAsignacion === 'automatico' && (
        <section className="auto-asignacion-section" style={{ flex: '1', minWidth: '320px' }}>
          <h2 className='h2-asig' style={{ fontWeight: 700, fontSize: '2rem', marginBottom: '1rem', color: '#111827' }}>Asignación Automática</h2>
<section className='sectionactivar-asigauto'>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',justifyContent: 'center', width:'150px' }} className=" label-asig">
            <input type="checkbox" checked={autoAsignar} onChange={e => setAutoAsignar(e.target.checked)} />
            Activar Asignación Automática
          </label>
          </section>

{autoAsignar && (
  <>
    {/* Contenedor input cantidad tickets con label alineado */}
    <div
      style={{
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        maxWidth: '320px',
      }}
    >
      <label htmlFor="rango_tickets" className="label-asig" style={{ flexShrink: 0, minWidth: '200px' }}>
        Cantidad de tickets a asignar:
      </label>
      <input
        id="rango_tickets"
        type="number"
        value={rangoTickets}
        onChange={e => setRangoTickets(Math.min(Math.max(1, Number(e.target.value)), tickets.length))}
        min={1}
        max={tickets.length}
        style={{
          width: '60px',
          padding: '5px 8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '0.95rem',
        }}
      />
    </div>

    {/* Lista de tickets con checkbox y texto juntos, contenedor compacto */}
    <div
      style={{
        maxHeight: '280px',
        overflowY: 'auto',
        marginTop: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '10px 15px',
        backgroundColor: '#fafafa',
        maxWidth: '320px',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1rem' }}>
        Selecciona tickets a asignar:
      </strong>
      {tickets.slice(0, rangoTickets).map(t => (
        <div key={t.codigo_ticket} style={{ marginBottom: '0.45rem' }}>
          <label
            className="label-asig"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.95rem',
            }}
          >
            <input
              type="checkbox"
              checked={selectedTickets.includes(t.codigo_ticket)}
              onChange={() => toggleTicketSelection(t.codigo_ticket)}
              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
            />
            {t.codigo_ticket} - {t.descripcion_servicio}
          </label>
        </div>
      ))}
    </div>

    {/* Botón centrado con ancho fijo y padding */}
    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      <button
        onClick={handleAutoAsignar}
        className="form-button-AS"
        style={{
          padding: '0.6rem 1.3rem',
          minWidth: '180px',
          fontSize: '1rem',
        }}
      >
        Asignar Automáticamente
      </button>
    </div>
  </>
)}




          <DecisionReport messages={messages} />
        </section>
      )}
    </div>
  </div>
);

};

export default AsignacionForm;

