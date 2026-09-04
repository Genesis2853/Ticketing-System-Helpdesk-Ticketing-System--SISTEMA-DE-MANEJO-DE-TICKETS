import React, { useEffect, useState } from 'react';
import { Modal, Box, Button, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './manejousuario.css';
import { useSnackbar } from 'notistack';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  maxHeight: '90vh',
  minHeight: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 0, // removemos padding de aquí, lo aplicamos adentro
  display: 'flex',
  flexDirection: 'column',
};

const permisosDisponibles = [
  // Clientes
  { id: 'ver_clientes',            label: 'Ver Clientes' },
  { id: 'crear_clientes',          label: 'Crear Clientes' },

  // Tickets
  { id: 'ver_tickets',             label: 'Ver Tickets' },
  { id: 'crear_tickets',           label: 'Crear Tickets' },

  // Técnicos
  { id: 'ver_tecnicos',            label: 'Ver Técnicos' },
  { id: 'crear_tecnicos',          label: 'Crear Técnicos' },
  { id: 'ver_mapa',                label: 'Ver Mapa de Técnicos' },
  { id: 'reporte_servicio',        label: 'Reporte de Servicio Técnico' },

  // Solicitudes
  { id: 'asignar_solicitudes',     label: 'Asignar Solicitudes' },
  { id: 'ver_estado_solicitudes',  label: 'Ver Estado de Solicitudes' },
  { id: 'ver_soli_completa',       label: 'Ver Solicitudes Completadas' },
  { id: 'ver_soli_cerrada',        label: 'Ver Solicitudes Cerradas' },
  { id: 'ver_solino',              label: 'Ver Solicitudes No Realizadas' },

  // Reportes / Datos
  { id: 'ver_reportesdesempeño',   label: 'Ver Reportes de Desempeño' },
  { id: 'crear_evaluacion',   label: 'Evaluar Reportes' },

  { id: 'datos_estadisticos',      label: 'Datos Estadísticos' },
  
    { id: 'comentario_evaluacion', label: 'Ver Reportes Desem Cerrado y NoReali' },
  { id: 'crear_evaluacion_cerrada', label: 'Evaluar Reportes Desem Cerrado y NoReali' },
];

function UsuariosAdminModificacion() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [form, setForm] = useState({
    usuario: '',
    tipo_usuario: 'Tecnico',
    permisos_usuarios: [],
    contrasena_hash: ''
  });
  const [message, setMessage] = useState('');
const { enqueueSnackbar } = useSnackbar();
  /* ─────────────────────────  CARGA DE USUARIOS  ───────────────────────── */
  useEffect(() => { fetchUsuarios(); }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) { setError('No autorizado: token no encontrado'); setLoading(false); return; }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/usuariosobtener`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error al obtener usuarios');
      setUsuarios(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ─────────────────────────  EDICIÓN  ───────────────────────── */
  const handleEditClick = (usuario) => {
    let permisosArray = [];
    if (typeof usuario.permisos_usuarios === 'string') {
      try { permisosArray = JSON.parse(usuario.permisos_usuarios); } catch { permisosArray = []; }
    } else if (Array.isArray(usuario.permisos_usuarios)) permisosArray = usuario.permisos_usuarios;
    permisosArray = permisosArray.map(p => String(p));

    setForm({
      usuario: usuario.usuario,
      tipo_usuario: usuario.tipo_usuario,
      permisos_usuarios: permisosArray,
      contrasena_hash: ''
    });
    setUsuarioEditando(usuario);
    setMessage('');
  };

  const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === 'usuario') {
    // Solo permitir letras (mayúsculas y minúsculas) y números
    const regex = /^[a-zA-Z0-9]*$/;
    if (!regex.test(value)) {
      // Si el valor no cumple, no actualiza el estado ni muestra el cambio
      return;
    }
  }

  setForm({ ...form, [name]: value });
};


  const handleCheckboxChange = (e) => {
    const { value } = e.target;
    setForm(prev => ({
      ...prev,
      permisos_usuarios: prev.permisos_usuarios.includes(value)
        ? prev.permisos_usuarios.filter(p => p !== value)
        : [...prev.permisos_usuarios, value]
    }));
  };

  const handleCancelEdit = () => { setUsuarioEditando(null); setMessage(''); };

  const handleUpdate = async () => {
    if (!usuarioEditando) return;
    const token = localStorage.getItem('token');
    if (!token) { setMessage('No autorizado'); return; }
    const body = {
      usuario: form.usuario,
      tipo_usuario: form.tipo_usuario,
      permisos_usuarios: form.permisos_usuarios,
    };
    if (form.contrasena_hash.trim()) body.contrasena_hash = form.contrasena_hash;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/usuariosobtener/${usuarioEditando.id_modulo_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error al actualizar usuario');
      
  enqueueSnackbar('✅ Usuario actualizado correctamente', { variant: 'success' });
      setUsuarioEditando(null);
      fetchUsuarios();
    } catch (err) { setMessage(err.message); }
  };

  /* ─────────────────────────  ELIMINACIÓN  ───────────────────────── */
  const handleDelete = async (id_modulo_usuario, tipo_usuario) => {
  if (tipo_usuario === 'Admin') {
    enqueueSnackbar('⚠️ No se puede eliminar un usuario de tipo Admin', { variant: 'warning' });
    return;
  }

  const confirmar = window.confirm('¿Estás seguro que deseas eliminar este usuario?');
  if (!confirmar) return;

  const token = localStorage.getItem('token');
  if (!token) {
    setMessage('No autorizado: token no encontrado');
    return;
  }

  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/usuariosobtener/${id_modulo_usuario}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Error al eliminar usuario');
    }
    enqueueSnackbar('✅ Usuario eliminado correctamente', { variant: 'success' });
    fetchUsuarios(); // refresca la lista
  } catch (err) {
    setMessage(err.message);
  }
};

  /* ─────────────────────────  RENDER  ───────────────────────── */
  if (loading)  return <p>Cargando usuarios...</p>;
  if (error)    return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <main>
      <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <h2>Administrar Usuarios</h2>
        {message && <p style={{ color: 'blue' }}>{message}</p>}

        <Modal open={!!usuarioEditando} onClose={handleCancelEdit}>
  <Box sx={modalStyle} className="modal-editarUsuario">
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} className="modal-editarUsuario-header">
      <Typography variant="h6">Editar Usuario: {usuarioEditando?.usuario}</Typography>
      <IconButton onClick={handleCancelEdit}>
        <CloseIcon style={{ color: '#fff' }} />
      </IconButton>
    </Box>


<Box
      sx={{
        px: 3,
        py: 2,
        overflowY: 'auto',
        height: '100%',
        maxHeight: 'calc(90vh - 160px)', // 👈 espacio real de scroll
      }}
      className="modal-editarUsuario-body"
    >
      {/* Nombre */}
      <label>
        Nombre de usuario:
        <input
          name="usuario"
          type="text"
          value={form.usuario}
          onChange={handleChange}
          style={{ marginLeft: 10, width: '100%', padding: 6, marginTop: 4 }}
        />
      </label>
      <br /><br />

      {/* Tipo */}
      <label>
        Tipo de usuario:
        <select
          name="tipo_usuario"
          value={form.tipo_usuario}
          onChange={handleChange}
          style={{ marginLeft: 10, width: '100%', padding: 6, marginTop: 4 }}
        >
          <option value="Admin">Admin</option>
          <option value="Moderador">Moderador</option>
          <option value="Tecnico">Tecnico</option>
        </select>
      </label>
      <br /><br />

      {/* Contraseña */}
      <label>
        Nueva contraseña (opcional):
        <input
          name="contrasena_hash"
          type="password"
          value={form.contrasena_hash}
          onChange={handleChange}
          placeholder="Dejar vacío para no cambiar"
          style={{ marginLeft: 10, width: '100%', padding: 6, marginTop: 4 }}
        />
      </label>
      <br /><br />

      {/* Permisos */}
      {form.tipo_usuario === 'Moderador' && (
        <>
          <label>Permisos:</label>
          <div className="modal-editarUsuario-permisos">
            {permisosDisponibles.map(({ id, label }) => (
              <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  value={id}
                  checked={form.permisos_usuarios.includes(id)}
                  onChange={handleCheckboxChange}
                />
                {label}
              </label>
            ))}
          </div>
        </>
      )}
    </Box>

    <Divider />

    {/* Botones */}
    <Box className="modal-editarUsuario-footer">
      <Button variant="contained" onClick={handleUpdate}>Guardar</Button>
      <Button variant="outlined" onClick={handleCancelEdit}>Cancelar</Button>
    </Box>
  </Box>
</Modal>

        {/* LISTA DE USUARIOS */}
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {usuarios.map((usuario) => (
            <li
              key={usuario.id_modulo_usuario}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid #ccc',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>{usuario.usuario}</strong> | Tipo: {usuario.tipo_usuario}
              </div>
              <div>
                <button
  onClick={() => handleEditClick(usuario)}
  style={{
    marginRight: 10,
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0056b3')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007bff')}
>
  Editar
</button>

                {usuario.tipo_usuario !== 'Admin' && (
                  <button
  onClick={() => handleDelete(usuario.id_modulo_usuario, usuario.tipo_usuario)}
  style={{
    color: 'red',
    backgroundColor: '#ffe6e6',
    border: '1px solid red',
    padding: '6px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ffcccc')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffe6e6')}
>
  Eliminar
</button>

                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default UsuariosAdminModificacion;
