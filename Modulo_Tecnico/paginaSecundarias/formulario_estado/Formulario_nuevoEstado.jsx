import React, { useState, useEffect } from 'react';
import './FormularioActualizarSolicitudes.css';

const FormularioActualizarSolicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/solicitudAsigTec`);
                const data = await response.json();
                console.log('Solicitudes:', data); // Verifica los datos recibidos
                setSolicitudes(data);
            } catch (error) {
                console.error('Error cargando solicitudes:', error);
            }
        };

        fetchSolicitudes();
    }, []);

    const handleChange = (id, estado_solicitud) => {
        setSolicitudes(solicitudes.map(solicitud => 
            solicitud.codigo_solicitud === id ? { ...solicitud, estado_solicitud } : solicitud
        ));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/actualizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(solicitudes),
            });
            if (!response.ok) {
                throw new Error('Error al actualizar las solicitudes');
            }
            const result = await response.json();
            console.log('Resultado:', result);
            setSuccessMessage('Solicitudes actualizadas correctamente.');
            setErrors({});
        } catch (error) {
            console.error('Error actualizando solicitudes:', error);
            setErrors({ submit: 'Error actualizando solicitudes' });
        }
    };

    return (
        <div className="div-contenedor-formularioactualizarsolicitudes">
            <form className="form-actualizarsolicitudes" onSubmit={handleSubmit}>
                {solicitudes.map(solicitud => (
                    <div key={solicitud.codigo_solicitud} className="solicitud-item">
                        <div>
                            <label htmlFor={`estado_solicitud-${solicitud.codigo_solicitud}`} className='form-titulos-AS'>
                                Solicitud ID: {solicitud.codigo_solicitud}
                            </label>
                        </div>
                        <div>
                            <select
                                id={`estado_solicitud-${solicitud.codigo_solicitud}`}
                                name={`estado_solicitud-${solicitud.codigo_solicitud}`}
                                className='form-box-AS'
                                value={solicitud.estado_solicitud}
                                onChange={(e) => handleChange(solicitud.codigo_solicitud, e.target.value)}
                                required
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="completo">Completo</option>
                            </select>
                        </div>
                    </div>
                ))}
                <div className='form-contenedor-button-AS'>
                    <button type="submit" className='form-button-AS'>Actualizar Solicitudes</button>
                </div>
                {errors.submit && <p className='form-alertaerror-AS'>{errors.submit}</p>}
                {successMessage && <p className='form-success-AS'>{successMessage}</p>}
            </form>
        </div>
    );
};

export default FormularioActualizarSolicitudes;