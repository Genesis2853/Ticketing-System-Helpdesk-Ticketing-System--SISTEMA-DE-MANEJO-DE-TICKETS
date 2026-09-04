import React, { useState } from 'react';


const Formulario23 = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validate = () => {
    let formErrors = {};
    if (!formData.nombre) formErrors.nombre = '(¡El nombre es requerido!)';
    if (!formData.telefono) formErrors.telefono = '(¡El número de teléfono es requerido!)';
    return formErrors;
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        const result = await response.text();
        setSuccessMessage(result);
        setFormData({
          nombre: '',
          telefono: '',
        });
        setErrors({});
      } catch (error) {
        console.error('Error enviando datos:', error);
      }
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <div className="div-contenedor-formulariocrearticket">
      <form className="form-crearticket" onSubmit={handleSubmit}>
        <div>
          <div><label htmlFor="nombre" className='form-titulos-CT inline'>Nombre:</label></div>
          <div className='form-flex-CT'>
            <div><input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className='form-box-CT'
            /></div>
            {errors.nombre && <p className='form-alertaerror-CT'>{errors.nombre}</p>}
          </div>
        </div>
        
        <div>
          <div><label htmlFor="telefono" className='form-titulos-CT inline'>N. Teléfono:</label></div>
          <div className='form-flex-CT'>
            <div><input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className='form-box-CT'
            /></div>
            {errors.telefono && <p className='form-alertaerror-CT'>{errors.telefono}</p>}
          </div>
        </div>
        
        <button type="submit">Enviar</button>
        {successMessage && <p className='form-success-CT'>{successMessage}</p>}
      </form>
    </div>
  );
};

export default Formulario23;