import React, { useState, useEffect } from 'react';
import { Modal } from '@mui/material';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import './Datos_Visita.css';
import { es } from 'date-fns/locale';
import { useSnackbar } from 'notistack'; // ✅ notistack

const DatosVisitaCliente = ({ isOpen, onClose, onSubmit, visitaExistente }) => {
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [solicitudAsigTec, setSolicitudAsig] = useState({});
    const { id } = useParams();
      const { enqueueSnackbar } = useSnackbar(); // ✅ Hook de notistack

    const [datosvisita, setDatosVisitas] = useState({
   dias_disponibles: [],
   comentario_datosvisita: '',
 });

    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchSolicitudAsig = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/solicitudAsigTec/${id}`, { signal });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setSolicitudAsig(data);
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Solicitud abortada');
                } else {
                    console.error('Error fetching solicitud:', error);
                    enqueueSnackbar('Error al cargar la solicitud', { variant: 'error' });
                }
            }
        };

        fetchSolicitudAsig();

        return () => {
            controller.abort();
        };
    }, [id]);

    useEffect(() => {
  if (!isOpen) return;

  if (visitaExistente) {
    setDatosVisitas({
      dias_disponibles: visitaExistente.dias_disponibles || [],
      comentario_datosvisita: visitaExistente.comentario_datosvisita || '',
    });
  } else {
    setDatosVisitas({
      dias_disponibles: [],
      comentario_datosvisita: '',
    });
  }
}, [isOpen, visitaExistente]);


    const validate = () => {
  const e = {};
  if (!datosvisita.comentario_datosvisita) e.comentario_datosvisita = '(¡El comentario es requerido!)';
  if (datosvisita.dias_disponibles.length === 0) e.dias_disponibles = '(¡El día es requerido!)';
  return e;
};


    const handleContactarSubmit = async (e) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length === 0) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_SOLIASIGTEC}/api/soliasig/datosvisita`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        comentario_datosvisita: datosvisita.comentario_datosvisita,
                        dias_disponibles: datosvisita.dias_disponibles,
                        codigo_solicitud: solicitudAsigTec ? solicitudAsigTec.codigo_solicitud : '',
                    })
                });
                const result = await response.json();
                console.log('Respuesta del servidor:', result);

                setDatosVisitas((prev) => [{ ...prev[0], id_datosvisita: result.id_datosvisita }]);
                enqueueSnackbar('Datos de visita registrados correctamente', { variant: 'success' });
                setErrors({});
                onSubmit(datosvisita);
                onClose();
                
            } catch (error) {
                console.error('Error enviando datos:', error);
                enqueueSnackbar('Error al registrar los datos de visita', { variant: 'error' });
            }
        } else {
            setErrors(errors);
        }
    };

const toggleDia = (date) => {
  if (!date) return;
  setDatosVisitas(prev => {
    const exists = prev.dias_disponibles.includes(date);
    const nuevos = exists
      ? prev.dias_disponibles.filter(d => d !== date)
      : [...prev.dias_disponibles, date];
    return { ...prev, dias_disponibles: nuevos };
  });
};


    const getDayOfWeek = (dateString) => {
        if (!dateString) return '';
        const date = parseISO(dateString);
        return format(date, 'EEEE');
    };

    return (
        <div>
            <Modal className='Modal-Datosvisita' open={isOpen} onClose={onClose}>
                <div className='Modal-Datosvisita-div'>
                    <h2 className='Modal-Datosvisita-h2'>Contactar al Cliente</h2>
                    <p className='Modal-Datosvisita-text'><b>Cliente:</b> {solicitudAsigTec.nombre_cliente} {solicitudAsigTec.apellido_cliente}</p>
                    <p className='Modal-Datosvisita-text'><b>Dirección:</b> {solicitudAsigTec.direccion_cliente}</p>
                    <form onSubmit={handleContactarSubmit}>

                        <div className='Modal-Datosvisita-divinput-2'>
                            <label htmlFor="dias_disponibles">Seleccionar fecha:</label>
                            <input
                                type="date"
                                id="dias_disponibles"
                                name="dias_disponibles"
                                className='Modal-Datosvisita-fecha'
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                            <button 
                                type="button" 
                                className='add-date-btn'
                                onClick={() => toggleDia(selectedDate)}
                            >
                                Agregar fecha
                            </button>
                            {errors.dias_disponibles && <p className='form-alertaerror-CT'>{errors.dias_disponibles}</p>}
                            <div className='dias-container'>
                                {Array.isArray(datosvisita.dias_disponibles) && datosvisita.dias_disponibles.length > 0 && (

                                <>
                                    <h4>Días seleccionados:</h4>
                                    <div className={datosvisita.dias_disponibles.length > 2 ? 'dias-lista con-scroll' : 'dias-lista'}>
                                    {datosvisita.dias_disponibles.map((dia) => (
                                        <div key={dia} className="dia-item">
                                        <span>{format(parseISO(dia), 'EEEE', { locale: es })}</span>
                                        <span>{format(parseISO(dia), 'dd/MM/yyyy')}</span>
                                        <button onClick={() => toggleDia(dia)} className="remove-date">×</button>
                                        </div>
                                    ))}
                                    </div>
                                </>
                                )}

                            </div>
                        </div>

                        <div className='Modal-Datosvisita-divinput'>
                            <label htmlFor="comentario_datosvisita">Comentarios</label>
                            <input
                            type="text"
                            id="comentario_datosvisita"
                            name="comentario_datosvisita"
                            placeholder="Agregar Comentario"
                            value={datosvisita.comentario_datosvisita}
                            onChange={(e) => setDatosVisitas({ ...datosvisita, comentario_datosvisita: e.target.value })}
                            className='Modal-Datosvisita-dirc'
                            />

                            {errors.comentario_datosvisita && <p className='form-alertaerror-CT'>{errors.comentario_datosvisita}</p>}
                        </div>

                        <div className='button-group' style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="button" 
                                className='form-button secondary'
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className='form-button primary'
                            >
                                Aceptar
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default DatosVisitaCliente;
