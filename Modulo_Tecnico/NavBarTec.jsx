import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faTimes,
  faHome,
  faClipboardCheck,
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import './NavBarT.css';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const allowedRoutes = [
  '/InicioT',
  '/SolicitudAsig',
  '/solicitudescompletas',
  '/tecnico/soliCerradoTec',
  '/solicitudNoReTec',
  '/manual',
];

const NavBarTec = () => {
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState({
    solicitudes: false,
  });

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsNavOpen(true);
      } else {
        setIsNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!allowedRoutes.includes(location.pathname)) {
    return null;
  }

  

  const toggleSubmenu = (menu) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleItemClick = (menu) => {
    if (isMobile) {
      toggleSubmenu(menu);
    }
  };

  const handleItemHover = (menu, isHovering) => {
    if (!isMobile) {
      setOpenSubmenus((prev) => ({
        ...prev,
        [menu]: isHovering,
      }));
    }
  };

  return (
    <nav className="navtec-func" style={{ zIndex: 1000 }}>
      {/* Botón hamburguesa */}
      <button
        className="navtec-navbar-toggle"
        onClick={() => setIsNavOpen(!isNavOpen)}
        aria-label="Toggle navigation"
      >
        <FontAwesomeIcon icon={isNavOpen ? faTimes : faBars} />
      </button>

      {/* Menú */}
      <ul className={`navtec-navbar-nav ${isNavOpen ? 'navtec-active' : ''}`}>
        {/* Inicio */}
        <li key="inicio" className="navtec-nav-item">
          <Link
            to="/InicioT"
            className="navtec-nav-link"
            onClick={() => isMobile && setIsNavOpen(false)}
          >
            <FontAwesomeIcon icon={faHome} />
            <span>Inicio</span>
          </Link>
        </li>

        {/* Solicitudes Asignadas */}
        <li key="sol-asig" className="navtec-nav-item">
          <Link
            to="/SolicitudAsig"
            className="navtec-nav-link"
            onClick={() => isMobile && setIsNavOpen(false)}
          >
            <FontAwesomeIcon icon={faClipboardCheck} />
            <span>Solicitudes Asignadas</span>
          </Link>
        </li>

        {/* Solicitudes Completadas */}
        <li key="sol-comp" className="navtec-nav-item">
          <Link
            to="/solicitudescompletas"
            className="navtec-nav-link"
            onClick={() => isMobile && setIsNavOpen(false)}
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Solicitudes Completadas</span>
          </Link>
        </li>

        {/* Solicitudes Cerradas */}
        <li key="sol-cerr" className="navtec-nav-item">
          <Link
            to="/tecnico/soliCerradoTec"
            className="navtec-nav-link"
            onClick={() => isMobile && setIsNavOpen(false)}
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Solicitudes Cerradas</span>
          </Link>
        </li>

        {/* Solicitudes No Realizadas */}
        <li key="sol-no-real" className="navtec-nav-item">
          <Link
            to="/solicitudNoReTec"
            className="navtec-nav-link"
            onClick={() => isMobile && setIsNavOpen(false)}
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            <span>Solicitudes No Realizadas</span>
          </Link>
        </li>

        {/* Solicitudes No Realizadas */}
        <li key="conf-manual" className="navtec-nav-item">
          <Link
            to="/manual"
            className="navtec-nav-link"
            onClick={() => isMobile && setIsNavOpen(false)}
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            <span>Manual de Usuario</span>
          </Link>
        </li>

        
      </ul>
    </nav>
  );
};

export default NavBarTec;
