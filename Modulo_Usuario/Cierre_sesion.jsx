import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

const CierreSesionUsuario = ({ onLogout, gestionusuarioSidebar, user }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const manejoCierresesion = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    manejoCierresesion();
    setIsOpen(false); // Cierra el menú después de hacer clic
  };

  const handleGestionUsuarios = () => {
    gestionusuarioSidebar(); // Llama a la función para abrir el sidebar
    setIsOpen(false); // Cierra el menú después de hacer clic
  };

  return (
    <div className="dropdown">
      <button onClick={handleMenuToggle} className="dropdown-button">
        <FontAwesomeIcon icon={faCog} className="engranaje-icon" />
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          {user?.tipo_usuario === 'Admin' && (
            <li onClick={handleGestionUsuarios} className="dropdown-item">
              Gestionar Usuarios
            </li>
          )}
          <li onClick={handleLogout} className="dropdown-item">
            Cerrar Sesión
          </li>
        </ul>
      )}
    </div>
  );
};

export default CierreSesionUsuario;

