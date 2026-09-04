import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';

const permisosDisponibles = [
  // Clientes
  { id: 'ver_clientes', label: 'Ver Clientes' },
  { id: 'crear_clientes', label: 'Crear Clientes' },

  // Tickets
  { id: 'ver_tickets', label: 'Ver Tickets' },
  { id: 'crear_tickets', label: 'Crear Tickets' },

  // Técnicos
  { id: 'ver_tecnicos', label: 'Ver Técnicos' },
  { id: 'crear_tecnicos', label: 'Crear Técnicos' },
  { id: 'ver_mapa', label: 'Ver Mapa de Técnicos' },
  { id: 'reporte_servicio', label: 'Reporte de Servicio Técnico' },

  // Solicitudes
  { id: 'asignar_solicitudes', label: 'Asignar Solicitudes' },
  { id: 'ver_estado_solicitudes', label: 'Ver Estado de Solicitudes' },
  { id: 'ver_soli_completa', label: 'Ver Solicitudes Completadas' },
  { id: 'ver_soli_cerrada', label: 'Ver Solicitudes Cerradas' },
  { id: 'ver_solino', label: 'Ver Solicitudes No Realizadas' },

  // Reportes / Datos
  { id: 'ver_reportesdesempeño', label: 'Ver Reportes de Desempeño' },
  { id: 'datos_estadisticos', label: 'Datos Estadísticos' },
  { id: 'crear_evaluacion', label: 'Evaluar Reportes' },
  { id: 'comentario_evaluacion', label: 'Ver Reportes Desem Cerrado y NoReali' },
  { id: 'crear_evaluacion_cerrada', label: 'Evaluar Reportes Desem Cerrado y NoReali' },
];


function RegistroUsuario() {
  const [form, setForm] = useState({ usuario: '', contrasena_hash: '', tipo_usuario: '', codigo_trabajador: '' || null, permisos_usuarios: [], });
  const [message, setMessage] = useState('');
  const [tecnicos, setTecnicos] = useState([]);
const { enqueueSnackbar } = useSnackbar();
  const handleChange = (e) => {
  const { name, value } = e.target;

  // Validar solo para el campo "usuario"
  if (name === 'usuario') {
    // Permitir solo letras y números
    const regex = /^[a-zA-Z0-9]*$/;
    if (!regex.test(value)) {
      // Si el valor contiene caracteres inválidos, no actualizar el estado
      return;
    }
  }

  setForm((prevForm) => {
    // Si cambió tipo_usuario y no es "Tecnico", limpiar codigo_trabajador
    if (name === 'tipo_usuario' && value !== 'Tecnico') {
      return { ...prevForm, tipo_usuario: value, codigo_trabajador: '' };
    }
    return { ...prevForm, [name]: value };
  });
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Sending payload:', form);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

    if (res.ok) {
    enqueueSnackbar('✅ ¡Usuario registrado exitosamente!', { variant: 'success' });
    } else {
      
      const errorMsg = 'Error: ' + (data.message || 'Ocurrió un error. No se pudo registrar');
      enqueueSnackbar(errorMsg, { variant: 'error' });
    console.error('Server error response:', data);
      }
    } catch (error) {
      setMessage('Error: No se pudo conectar con el servidor.');
      console.error('Network error:', error);
    }
  };

  useEffect(() => {
          let isMounted = true; // Flag para verificar si el componente está montado
  
          const fetchDatos = async () => {
              try {
                  const tecnicosResponse = await fetch(`${process.env.REACT_APP_API_URL_ASSIGN}/api/asignar/tecnicos`);
                  const tecnicosData = await tecnicosResponse.json();
                  console.log('Técnicos:', tecnicosData); // Verifica los datos recibidos
                  if (isMounted) {
                      setTecnicos(tecnicosData);
                  }
              } catch (error) {
                  console.error('Error cargando datos:', error);
              }
          };
  
          fetchDatos();
  
          // Función de limpieza
          return () => {
              isMounted = false; // Cambia el flag a false cuando el componente se desmonte
          };
    }, []);

    const handleCheckboxChange = (e) => {
      const { value } = e.target;
      setForm((prevForm) => {
        const permisos = prevForm.permisos_usuarios.includes(value)
          ? prevForm.permisos_usuarios.filter((permiso) => permiso !== value)
          : [...prevForm.permisos_usuarios, value];
        return { ...prevForm, permisos_usuarios: permisos };
      });
    };

    const toggleSeleccionarTodos = () => {
      if (form.permisos_usuarios.length === permisosDisponibles.length) {
        setForm((prevForm) => ({ ...prevForm, permisos_usuarios: [] }));
      } else {
        setForm((prevForm) => ({
          ...prevForm,
          permisos_usuarios: permisosDisponibles.map((permiso) => permiso.id),
        }));
      }
    };


   return (
    <main style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Registro de Usuario</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <label>
          <span className='form-titulos-CT'>Tipo de Usuario:</span>
          <select
            id="tipo_usuario"
            name="tipo_usuario"
            value={form.tipo_usuario}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un tipo</option>
            <option value="Admin">Admin</option>
            <option value="Moderador">Moderador</option>
            <option value="Tecnico">Técnico</option>
          </select>
        </label>

        {form.tipo_usuario === 'Tecnico' && (
          <label>
            <span className='form-titulos-CT'>Técnico:</span>
            <select
              id="codigo_trabajador"
              name="codigo_trabajador"
              value={form.codigo_trabajador}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un técnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.codigo_trabajador} value={tecnico.codigo_trabajador}>
                  {tecnico.codigo_trabajador} {tecnico.nombre_tecnico} {tecnico.apellido_tecnico}
                </option>
              ))}
            </select>
          </label>
        )}

        {form.tipo_usuario === 'Moderador' && (
          <div>
            <label className='form-titulos-CT'>Permisos:</label>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={form.permisos_usuarios.length === permisosDisponibles.length}
                  onChange={toggleSeleccionarTodos}
                />
                Seleccionar todos
              </label>
            </div>
            {permisosDisponibles.map(({ id, label }) => (
              <div key={id}>
                <label>
                  <input
                    type="checkbox"
                    value={id}
                    checked={form.permisos_usuarios.includes(id)}
                    onChange={handleCheckboxChange}
                  />
                  {label}
                </label>
              </div>
            ))}
          </div>
        )}

        <label>
          <span className='form-titulos-CT'>Usuario:</span>
          <input
            id="usuario"
            name="usuario"
            value={form.usuario}
            onChange={handleChange}
            placeholder="Solo letras y números"
            required
          />
        </label>

        <label>
          <span className='form-titulos-CT'>Contraseña:</span>
          <input
            id="contrasena_hash"
            name="contrasena_hash"
            type="password"
            value={form.contrasena_hash}
            onChange={handleChange}
            placeholder="Coloque una contraseña"
            required
          />
        </label>

        <button
          type="submit"
          style={{
            backgroundColor: '#0069d9',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#004a99')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0069d9')}
        >
          Registrar
        </button>

        {message && <p style={{ color: 'green' }}>{message}</p>}
      </form>
    </main>
  );
}

export default RegistroUsuario;