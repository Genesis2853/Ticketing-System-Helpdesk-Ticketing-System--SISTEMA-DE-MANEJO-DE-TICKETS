import React, { useState } from 'react';
import './cambioestado.css'

const ChangeStatusModal = ({ codigo_solicitud, onClose, onEstadoChange }) => {
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [razon, setRazon] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        const datos = {
            codigo_solicitud,
            estado_solicitud: nuevoEstado,
            razon_cambioestado: razon,
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/actualizarEstado`, {
                method: 'POST',
                headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,  // <-- Aquí va
    },
                body: JSON.stringify(datos),
            });

            if (response.ok) {
                await onEstadoChange(nuevoEstado); // Actualiza el estado local
                alert('Estado cambiado exitosamente');
                onClose(); // Cerrar el modal
            } else {
                const errorData = await response.json();
                alert(`Error al cambiar el estado: ${errorData.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cambiar el estado. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <div className="modal">
            <form onSubmit={handleSubmit}>
                <div className='div-contenedor-cambioestado'>
                    <label className='subtitulo-form-cambioestado' htmlFor="nuevoEstado">Nuevo Estado:</label>
                    <select
                        id="nuevoEstado"
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                        className='input-form-cambioestado'
                        required
                    >
                        <option value="">Seleccione un estado</option>
                        <option value="Completado">Completado</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Proceso">En Proceso</option>

                        <option value="Cerrado">Cerrado</option>
                        {/* Agrega más opciones según sea necesario */}
                    </select>
                </div>
                
                <div className='div-contenedor-cambioestado'>
                    <label className='subtitulo-form-cambioestado' htmlFor="razon">Razón del Cambio:</label>
                    <textarea
                        id="razon"
                        value={razon}
                        onChange={(e) => setRazon(e.target.value)}
                        cols="10" rows="3"
                        className='input-form-cambioestado-textarea'
                        required
                    />
                </div>

                <div className='contenedor-boton-guardar-cambioestado'>
                    <button type="submit">Guardar Cambios</button>
                    <button type="button" onClick={onClose}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default ChangeStatusModal;