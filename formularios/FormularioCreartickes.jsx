import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FormularioCreartickets.css';
import { useSnackbar } from 'notistack'; // ✅ importado
import { useNotificaciones } from '../../Modulo_Usuario/NotificacionesContext';

const Formulario = ({ user }) => {
  const [formData, setFormData] = useState({
    id_cliente: '',
    motivo_visita: '',
    descripcion_servicio: '',
    prioridad_solicitud: '',
  });
  const [clientes, setClientes] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  console.log("Usuario recibido en creartciekts:", user);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar(); // ✅ hook de notistack
  
  const handleRedirect = () => {
    navigate('/VerdatosTickets', { state: { showBackButton: true } });
  };

  

  useEffect(() => {
    let isMounted = true;

    const fetchDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        const clientesResponse = await fetch(
          `${process.env.REACT_APP_API_URL_VERCLIENTE}/api/cliver/vercliente`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const clientesData = await clientesResponse.json();

        if (isMounted) {
          const activos = Array.isArray(clientesData)
            ? clientesData.filter(c => c.activo === true)
            : [];
          setClientes(activos);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        enqueueSnackbar("Error cargando datos de clientes", { variant: "error" }); // ✅ notificación
      }
    };

  fetchDatos();
  return () => {
    isMounted = false;
  };
}, [window.location.pathname]); // ⬅️ fuerza el fetch al volver a esta ruta



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validate = () => {
    let formErrors = {};
    if (!formData.id_cliente) formErrors.id_cliente = '(¡El código es requerido!)';
    if (!formData.motivo_visita) formErrors.motivo_visita = '(¡El motivo es requerido!)';
    if (!formData.descripcion_servicio) formErrors.descripcion_servicio = '(¡El mensaje es requerido!)';
    if (!formData.prioridad_solicitud) formErrors.prioridad_solicitud = '(¡Indica la prioridad del caso!)';
    return formErrors;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setErrors("No autorizado: token no encontrado.");
      enqueueSnackbar("No autorizado: token no encontrado.", { variant: "error" }); // ✅ notificación
      return;
    }

    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL_CREATE}/api/posgre/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          throw new Error('Error al asignar el ticket');
        }
        const result = await response.json();
        setSuccessMessage(`Ticket creado correctamente. Código: ${result.codigo_ticket}`);
        enqueueSnackbar(`✅ Ticket creado correctamente. Código: ${result.codigo_ticket}`, {
          variant: 'success'
        }); // ✅ notificación de éxito
        setFormData({
          id_cliente: '',
          motivo_visita: '',
          descripcion_servicio: '',
          prioridad_solicitud: '',
        });



        setErrors({});
      } catch (error) {
        console.error('Error creando tu ticket:', error);
        setErrors({ submit: 'Error creando tu ticket' });
        enqueueSnackbar("Error creando tu ticket", { variant: "error" }); // ✅ notificación
      }
    } else {
      setErrors(formErrors);
      enqueueSnackbar("Por favor completa todos los campos requeridos.", { variant: "warning" }); // ✅ advertencia
    }
  };

  // Función para obtener notificaciones actualizadas y actualizar el estado


  return (
    <div className="div-contenedor-formulariocrearticket">
      <h2>Crear Ticket</h2>
      <form className="form-crearticket" onSubmit={handleSubmit}>
        <div>
          <div><label htmlFor="id_cliente" className='form-titulos-CT inline'>Cliente:</label></div>
          <div className='form-flex-CT'>
            <select
              id="id_cliente"
              name="id_cliente"
              value={formData.id_cliente}
              onChange={handleChange}
              className='form-box-CT'
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id_cliente} value={cliente.id_cliente}>
                  {cliente.nro_contrato} - {cliente.nombre_cliente}  {cliente.apellido_cliente}
                </option>
              ))}
            </select>
            {errors.id_cliente && <p className='form-alertaerror-CT'>{errors.id_cliente}</p>}
          </div>
        </div>

        <div>
          <div><label htmlFor="motivo_visita" className='form-titulos-CT inline'>Motivo de visita:</label></div>
          <div className='form-contenedor-campo-CT'>
            <select 
              id="motivo_visita"
              name="motivo_visita"
              value={formData.motivo_visita}
              onChange={handleChange}
              className='form-box-CT'
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
          
          {errors.motivo_visita && <p className='form-alertaerror-CT'>{errors.motivo_visita}</p>}
          </div>
        </div>

        <div>
          <div><label htmlFor="descripcion_servicio" className='form-titulos-CT inline'>Descripción del Servicio o Incidencia:</label></div>
          <div><textarea
            id="descripcion_servicio"
            name="descripcion_servicio"
            value={formData.descripcion_servicio}
            onChange={handleChange}
            cols="46" rows="10"
            className='form-box-CT tamano-textarea-CT'
          /></div>
          {errors.descripcion_servicio && <p className='form-alertaerror-CT'>{errors.descripcion_servicio}</p>}
        </div>
        
        <div>
          <div><label htmlFor="prioridad_solicitud" className='form-titulos-CT inline'>Prioridad:</label></div>
          <div className='form-contenedor-campo-CT'>
            <select 
              id="prioridad_solicitud"
              name="prioridad_solicitud"
              value={formData.prioridad_solicitud}
              onChange={handleChange}
              className='form-box-CT'
            >
              <option value="">Seleccione una prioridad</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          
          {errors.prioridad_solicitud && <p className='form-alertaerror-CT'>{errors.prioridad_solicitud}</p>}
          </div>
        </div>
        

        <div className='form-contenedor-button-CT'>
        <button type="submit" className='form-button-CT'>Crear</button></div>
        {errors.submit && <p className='form-alertaerror-AS'>{errors.submit}</p>}
        {successMessage && <p className='form-success-CT'>{successMessage}</p>}
      </form>

      <div className="div-boton-redireccio boton-redireccion-tk">
    <button onClick={handleRedirect} className='boton-redireccion-VT inline'>Ver Tickets</button>
    </div>

    </div>
  );
};

export default Formulario;