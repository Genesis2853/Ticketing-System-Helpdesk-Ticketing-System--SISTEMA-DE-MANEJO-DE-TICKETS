// src/Componentes/Formulariotecnico.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Formulariotecnico.css';
import { useSnackbar } from 'notistack';

const FormularioCrearTecnico = () => {
  /* ─────────── estado y navegación ─────────── */
  const { id }          = useParams();          // existe ⇒ edición
  const esEdicion       = Boolean(id);
  const navigate        = useNavigate();
  const irListado       = () =>
    navigate('/VerdatosTecnico', { state: { showBackButton: true } });
    const { enqueueSnackbar } = useSnackbar(); // ← Notistack

  /* ─────────── estado del formulario ─────────── */
  const [formData, setFormData] = useState({
    nombre_tecnico  : '',
    apellido_tecnico: '',
    ci_tecnico      : '',
    n_tlf_tecnico   : '',
    email_tecnico   : '',
    cuadrilla       : '',
  });

  const [errors,   setErrors]   = useState({});
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  /* ─────────── URLs helpers ───────────
     - CREAR   → servidor “crear técnico”
     - EDITAR  → servidor “ver técnico”  */
  const apiCrear = process.env.REACT_APP_API_URL_CTECNICO;   // 3037
  const apiVer   = process.env.REACT_APP_API_URL_VERTECNICO; // 3038

  /* ─────────── cargar técnico (edición) ─────────── */
  useEffect(() => {
    if (!esEdicion) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiVer}/api/tecver/tecnicos/${id}`);
        if (!res.ok) throw new Error('Error al cargar el técnico');
        const t = await res.json();
        setFormData({
          nombre_tecnico  : t.nombre_tecnico   ?? '',
          apellido_tecnico: t.apellido_tecnico ?? '',
          ci_tecnico      : t.ci_tecnico       ?? '',
          n_tlf_tecnico   : t.n_tlf_tecnico    ?? '',
          email_tecnico   : t.email_tecnico    ?? '',
          cuadrilla       : t.cuadrilla        ?? '',
        });
      } catch (e) {
        enqueueSnackbar(`Error cargando técnico: ${e.message}`, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [esEdicion, id, apiVer, enqueueSnackbar]);

  /* ─────────── manejadores ─────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;

    /* reglas de entrada */
    if (name === 'ci_tecnico'     && !/^\d{0,8}$/.test(value))  return;
    if (name === 'n_tlf_tecnico'  && !/^\d{0,11}$/.test(value)) return;
    if ((name === 'nombre_tecnico' || name === 'apellido_tecnico')
        && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value))            return;

    setFormData(f => ({ ...f, [name]: value }));
  };

  /* ─────────── validación ─────────── */
  const validate = () => {
    const f = formData, e = {};

    if (!f.ci_tecnico)               e.ci_tecnico       = '(¡La cédula es requerida!)';
    else if (!/^\d{8}$/.test(f.ci_tecnico))
                                    e.ci_tecnico       = '(¡Debe tener 8 dígitos!)';

    if (!f.n_tlf_tecnico)            e.n_tlf_tecnico    = '(¡El teléfono es requerido!)';
    else if (!/^\d{11}$/.test(f.n_tlf_tecnico))
                                    e.n_tlf_tecnico    = '(¡Debe tener 11 dígitos!)';

    if (!f.nombre_tecnico)           e.nombre_tecnico   = '(¡El nombre es requerido!)';
    if (!f.apellido_tecnico)         e.apellido_tecnico = '(¡El apellido es requerido!)';

    if (!f.email_tecnico)            e.email_tecnico    = '(¡El correo es requerido!)';
    else if (!/\S+@\S+\.\S+/.test(f.email_tecnico))
                                    e.email_tecnico    = '(¡Correo inválido!)';

    if (!f.cuadrilla)                e.cuadrilla        = '(¡La cuadrilla es requerida!)';

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      enqueueSnackbar('Sesión expirada. Inicia sesión nuevamente.', { variant: 'error' });
      return;
    }

    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      const url = esEdicion
        ? `${apiVer}/api/tecver/tecnicos/editar/${id}`
        : `${apiCrear}/api/ctecnico/creartecnicos`;
      const method = esEdicion ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Error en la operación');

      enqueueSnackbar(esEdicion
        ? 'Técnico actualizado correctamente.'
        : `Técnico creado. Código: ${data.codigo_trabajador}`, { variant: 'success' });

      if (!esEdicion) {
        setFormData({
          nombre_tecnico:'', apellido_tecnico:'', ci_tecnico:'',
          n_tlf_tecnico:'', email_tecnico:'', cuadrilla:''
        });
      }
    } catch (err) {
      enqueueSnackbar(`Error: ${err.message}`, { variant: 'error' });
    }
  };

  /* ─────────── render ─────────── */
  if (loading) return <p>Cargando…</p>;

  return (
    <div className="div-contenedor-formulariocrearticket">
      <h2>{esEdicion ? 'Editar Técnico' : 'Crear Técnico'}</h2>
      <form className="form-creartecnico" onSubmit={handleSubmit}>
        

        {/* Cédula (no editable en modo edición) */}
        <div>
  <label className="form-titulos-CTC inline">Cédula:</label>
  <input
    type="text" name="ci_tecnico" maxLength="8"
    className="form-box-CTC"
    value={formData.ci_tecnico}
    onChange={handleChange}
    // disabled={esEdicion}  <-- QUITAR ESTO
  />
  {errors.ci_tecnico && <p className="form-alertaerror-CTC">{errors.ci_tecnico}</p>}
</div>

        {/* Nombre */}
        <div>
          <label className="form-titulos-CTC inline">Nombre:</label>
          <input
            type="text" name="nombre_tecnico" className="form-box-CTC"
            value={formData.nombre_tecnico}
            onChange={handleChange}
          />
          {errors.nombre_tecnico && <p className="form-alertaerror-CTC">{errors.nombre_tecnico}</p>}
        </div>

        {/* Apellido */}
        <div>
          <label className="form-titulos-CTC inline">Apellido:</label>
          <input
            type="text" name="apellido_tecnico" className="form-box-CTC"
            value={formData.apellido_tecnico}
            onChange={handleChange}
          />
          {errors.apellido_tecnico && <p className="form-alertaerror-CTC">{errors.apellido_tecnico}</p>}
        </div>

        {/* Teléfono (no editable en modo edición) */}
        <div>
  <label className="form-titulos-CTC inline">Teléfono:</label>
  <input
    type="text" name="n_tlf_tecnico" maxLength="11"
    className="form-box-CTC"
    value={formData.n_tlf_tecnico}
    onChange={handleChange}
    // disabled={esEdicion}  <-- QUITAR ESTO
  />
  {errors.n_tlf_tecnico && <p className="form-alertaerror-CTC">{errors.n_tlf_tecnico}</p>}
</div>

        {/* Correo */}
        <div>
          <label className="form-titulos-CTC inline">Correo:</label>
          <input
            type="email" name="email_tecnico" className="form-box-CTC"
            value={formData.email_tecnico}
            onChange={handleChange}
          />
          {errors.email_tecnico && <p className="form-alertaerror-CTC">{errors.email_tecnico}</p>}
        </div>

        {/* Cuadrilla */}
        <div>
          <label className="form-titulos-CTC inline">Cuadrilla:</label>
          <select
            name="cuadrilla" className="form-box-CTC"
            value={formData.cuadrilla}
            onChange={handleChange}
          >
            <option value="">Seleccione un tipo</option>
            <option value="Cuadrilla 1">Cuadrilla 1</option>
            <option value="Cuadrilla 2">Cuadrilla 2</option>
          </select>
          {errors.cuadrilla && <p className="form-alertaerror-CTC">{errors.cuadrilla}</p>}
        </div>

        {/* Botón enviar */}
        <div className="form-contenedor-button-CTC">
          <button type="submit" className="form-button-CTC">
            {esEdicion ? 'Actualizar' : 'Crear'}
          </button>
        </div>

        {success && <p className="form-success-CTC">{success}</p>}
        {errors.submit && <p className="form-alertaerror-CTC">{errors.submit}</p>}
      </form>

      {/* Botón Ver Técnicos (siempre visible) */}
      <div className="div-boton-redireccion-VTC">
        <button onClick={irListado} className="boton-redireccion-VTC">
          Ver Técnicos
        </button>
      </div>
    </div>
  );
};

export default FormularioCrearTecnico;
