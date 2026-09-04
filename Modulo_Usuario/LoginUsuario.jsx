import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginUsuario.css';
import logo from './logo.png';

// Importa íconos de Material UI o usa cualquier otra librería que prefieras
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Login = ({ onLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false); // estado para mostrar u ocultar
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/login`, { 
        usuario, 
        contrasena 
      });
      
      const { token, tipo_usuario } = response.data;
      onLogin(token, tipo_usuario);
      localStorage.setItem('token', token);
      
      setMessage('Inicio de sesión exitoso');
      setMessageType('success');
      
      if (tipo_usuario === 'Admin' || tipo_usuario === 'Moderador') {
        navigate('/Inicio');
      } else if (tipo_usuario === 'Tecnico') {
        navigate('/InicioT');
      }
      
    } catch (error) {
      console.error('Error de inicio de sesión', error);
      setMessageType('error');
      
      if (error.response?.data) {
        setMessage(error.response.data.message || 'Error de inicio de sesión');
      } else {
        setMessage('Error de conexión');
      }
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Logo de Grupo Tecnolife" className="header-logo" />
      <div className="login-module">
        
        <div className="login-header">
          Iniciar Sesión
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usuario" className="form-label">Usuario:</label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="contrasena" className="form-label">Contraseña:</label>
            <input
              id="contrasena"
              type={mostrarContrasena ? 'text' : 'password'}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="form-input"
              required
              style={{ paddingRight: '35px' }} // para dejar espacio al icono
            />
           
          </div>
          
          <button type="submit" className="login-button">
            Ingresar
          </button>
          
          {message && (
            <div className={`message ${messageType}-message`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
