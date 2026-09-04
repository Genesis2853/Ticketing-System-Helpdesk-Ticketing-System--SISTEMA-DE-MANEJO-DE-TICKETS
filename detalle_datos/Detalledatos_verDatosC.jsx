import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './detalle.css';

const DetalleVerDatosC = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [verClientes, setDClientes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lógica de permisos
    const tipo_usuario = user?.tipo_usuario;
    const permisos = user?.permisos || [];
    const esAdmin = tipo_usuario === 'Admin';
    
    const puedeEditar = esAdmin || permisos.includes('editar_cliente');

    useEffect(() => {
        let isMounted = true;

        const fetchDClientes = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL_VERCLIENTE}/api/cliver/vercliente/${id}`);
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (isMounted) {
                    setDClientes(data);
                }
            } catch (error) {
                console.error('Error fetching cliente:', error);
                if (isMounted) {
                    setError(error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDClientes();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const formatearFecha = (fecha) => {
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const año = date.getFullYear();
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div>Error al cargar el cliente: {error}</div>;
    }

    if (!verClientes) {
        return <div>No se encontró el cliente.</div>;
    }

    return (
<main className="detalle-cliente-main">
  <div className="detalle-cliente-container">
    <button onClick={() => navigate(-1)} className="btn-volver">
      Volver
    </button>

    <h2 className="detalle-cliente-titulo">Detalle del Cliente</h2>

    <div className="detalle-cliente-card">
      <div className="detalle-cliente-header">
        <p><strong>ID:</strong> {verClientes.id_cliente}</p>
        <p><strong>Fecha de creación:</strong> {formatearFecha(verClientes.fecha_creacion)}</p>
      </div>

      <h3 className="detalle-cliente-subtitulo">Datos del Cliente</h3>

      <div className="detalle-cliente-info">
        <p><strong>Nombre:</strong> {verClientes.nombre_cliente}</p>
        <p><strong>Apellido:</strong> {verClientes.apellido_cliente}</p>
        <p><strong>Número de contrato:</strong> {verClientes.nro_contrato}</p>
        <p><strong>Teléfono:</strong> {verClientes.n_tlf_cliente}</p>
        <p><strong>Correo:</strong> {verClientes.email_cliente}</p>
        <p><strong>Dirección:</strong> {verClientes.direccion_cliente}</p>
        <p><strong>Tipo de servicio:</strong> {verClientes.tipo_servicio}</p>
      </div>
    </div>

    {puedeEditar && (
      <div className="detalle-cliente-editar-wrapper">
        <button
          onClick={() => navigate(`/editarcliente/${verClientes.id_cliente}`)}
          className="btn-editar"
        >
          ✏️ Editar Cliente
        </button>
      </div>
    )}
  </div>
</main>

    );
};

export default DetalleVerDatosC;
