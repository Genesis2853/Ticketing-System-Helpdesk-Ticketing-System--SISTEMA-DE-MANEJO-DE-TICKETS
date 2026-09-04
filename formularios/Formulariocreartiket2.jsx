import React, { useState } from 'react';

function FormularioContacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    correo: '',
    descripcion: '',
    prioridad: 'A'
  });

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(formData); // Aquí puedes enviar los datos a un servidor o realizar otra acción
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Nombre:</label>
      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} />
      {/* Resto de los campos de la misma manera */}
      <label>
        Prioridad:
        <select name="prioridad" value={formData.prioridad} onChange={handleChange}>
          <option value="A">Alta</option>
          <option value="B">Media</option>
          <option value="C">Baja</option>
        </select>
      </label>
      <button type="submit">Enviar</button>
    </form>
  );
}

export default FormularioContacto;