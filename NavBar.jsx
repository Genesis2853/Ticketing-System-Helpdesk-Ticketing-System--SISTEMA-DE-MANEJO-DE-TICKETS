import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faTimes,
  faHome,
  faUsers,
  faTicketAlt,
  faTasks,
  faClipboardCheck,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
  faPlusCircle,
  faEye,
  faChevronRight,
  faChevronDown,
  faUserCog,
  faChartBar,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import './NavBar.css';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const allowedRoutes = [
    '/Inicio',
    '/CrearTicket',
    '/CrearTecnico',
    '/AsignaciondeSolicitud',
    '/EstadoSolicitud',
    '/EstadoSoliCompletado',
    '/EstadoSoliNoRealizado',
    '/EstadoSoliCerrado',
    '/UbicacionT',
    '/RepServT',
    '/RepDesp',
    '/CrearClientes',
    '/VerdatosClientes',
    '/VerdatosTickets',
    '/VerdatosTecnico',
    '/solicitud/:id',
    '/vertickets/:id',
    '/vercliente/:id',
    '/vertecnico/:id',
    '/GestionarUsuarios',
    '/datosestadisticos',
    '/verhistorialticket',
    '/backup',
    '/ComentarioEvaluacion',
    '/promedios',
];

const NavBar = ({ permisos, tipo_usuario }) => {
    const location = useLocation();
    const [openSubmenus, setOpenSubmenus] = useState({
        clients: false,
        tickets: false,
        status: false,
        technicians: false,
        estadistico: false,
        reporte: false,
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
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSubmenu = (menu) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const handleItemClick = (menu) => {
        if (isMobile) {
            toggleSubmenu(menu);
        }
    };

    const handleItemHover = (menu, isHovering) => {
        if (!isMobile) {
            setOpenSubmenus(prev => ({
                ...prev,
                [menu]: isHovering
            }));
        }
    };

    if (!allowedRoutes.includes(location.pathname)) {
        return null;
    }

    const tienePermiso = (permiso) => permisos?.includes(permiso);

    return (
        <nav className="nav-adm-func" style={{ zIndex: 1000 }}>
            <button className="navbar-toggle" onClick={() => setIsNavOpen(!isNavOpen)}>
                <FontAwesomeIcon icon={isNavOpen ? faTimes : faBars} />
            </button>
            
            <ul className={`navbar-nav ${isNavOpen ? 'active' : ''}`}>
                {/* Inicio */}
                {(tipo_usuario === 'Admin' || tipo_usuario === 'Moderador') && (
                    <li key={1} className="nav-item">
                        <Link to="/Inicio" className="nav-link">
                            <FontAwesomeIcon icon={faHome} />
                            <span>Inicio</span>
                        </Link>
                    </li>
                )}

                {/* Clientes */}
                {(tipo_usuario === 'Admin' || tienePermiso('ver_clientes, crear_clientes')) && (
                    <li 
                        key={2} 
                        className="nav-item has-submenu"
                        onMouseEnter={() => handleItemHover('clients', true)}
                        onMouseLeave={() => handleItemHover('clients', false)}
                    >
                        <div 
                            className="nav-link"
                            onClick={() => handleItemClick('clients')}
                        >
                            <FontAwesomeIcon icon={faUsers} />
                            Clientes
                            <FontAwesomeIcon 
                                icon={openSubmenus.clients ? faChevronDown : faChevronRight}
                                className="arrow-icon" 
                            />
                        </div>
                        <ul className={`submenu ${openSubmenus.clients ? 'open' : ''}`}>
                            {(tipo_usuario === 'Admin' || tienePermiso('crear_clientes')) && (
                                <li key={2.1}>
                                    <Link to="/CrearClientes" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                        <span>Crear Cliente</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tipo_usuario === 'Tecnico' || tienePermiso('ver_clientes')) && (
                                <li key={2.2}>
                                    <Link to="/VerdatosClientes" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Ver Datos</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </li>
                )}

                {/* Tickets */}
                {(tipo_usuario === 'Admin' || tienePermiso('ver_tickets, crear_tickets')) && (
                    <li 
                        key={3} 
                        className="nav-item has-submenu"
                        onMouseEnter={() => handleItemHover('tickets', true)}
                        onMouseLeave={() => handleItemHover('tickets', false)}
                    >
                        <div 
                            className="nav-link"
                            onClick={() => handleItemClick('tickets')}
                        >
                            <FontAwesomeIcon icon={faTicketAlt} />
                            <span>Tickets</span>
                            <FontAwesomeIcon 
                                icon={openSubmenus.tickets ? faChevronDown : faChevronRight}
                                className="arrow-icon" 
                            />
                        </div>
                        <ul className={`submenu ${openSubmenus.tickets ? 'open' : ''}`}>
                            {(tipo_usuario === 'Admin' || tienePermiso('crear_tickets')) && (
                                <li key={3.1}>
                                    <Link to="/CrearTicket" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                        <span>Crear Ticket</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_tickets')) && (
                                <li key={3.2}>
                                    <Link to="/VerdatosTickets" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Ver Tickets</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </li>
                )}

                {/* Asignación de Solicitud */}
                {(tipo_usuario === 'Admin' || tienePermiso('asignar_solicitudes')) && (
                    <li key={4} className="nav-item">
                        <Link to="/AsignaciondeSolicitud" className="nav-link">
                            <FontAwesomeIcon icon={faTasks} />
                            <span>Asignación de Solicitud</span>
                        </Link>
                    </li>
                )}

                {/* Estado de Solicitud */}
                {(tipo_usuario === 'Admin' || tienePermiso('ver_estado_solicitudes')) && (
                    <li 
                        key={5} 
                        className="nav-item has-submenu"
                        onMouseEnter={() => handleItemHover('status', true)}
                        onMouseLeave={() => handleItemHover('status', false)}
                    >
                        <div 
                            className="nav-link"
                            onClick={() => handleItemClick('status')}
                        >
                            <FontAwesomeIcon icon={faClipboardCheck} />
                            <span>Estado de Solicitud</span>
                            <FontAwesomeIcon 
                                icon={openSubmenus.status ? faChevronDown : faChevronRight}
                                className="arrow-icon" 
                            />
                        </div>
                        <ul className={`submenu ${openSubmenus.status ? 'open' : ''}`}>
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_estado_solicitudes')) && (
                                <li key={5.1}>
                                    <Link to="/EstadoSolicitud" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faSpinner} />
                                        <span>Estado de Solicitudes Activas</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_soli_completa')) && (
                                <li key={5.2}>
                                    <Link to="/EstadoSoliCompletado" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        <span>Solicitudes Completadas</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_soli_cerrada')) && (
                                <li key={5.3}>
                                    <Link to="/EstadoSoliCerrado" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faLock} />
                                        <span>Solicitudes Cerradas</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_solino')) && (
                                <li key={5.4}>
                                    <Link to="/EstadoSoliNoRealizado" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                        <span>Solicitudes No Realizadas</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </li>
                )}

                {/* Técnicos */}
                {(tipo_usuario === 'Admin' || tienePermiso('ver_tecnicos, ver_mapa, crear_tecnicos')) && (
                    <li 
                        key={6} 
                        className="nav-item has-submenu"
                        onMouseEnter={() => handleItemHover('technicians', true)}
                        onMouseLeave={() => handleItemHover('technicians', false)}
                    >
                        <div 
                            className="nav-link"
                            onClick={() => handleItemClick('technicians')}
                        >
                            <FontAwesomeIcon icon={faUserCog} />
                            <span>Técnicos</span>
                            <FontAwesomeIcon 
                                icon={openSubmenus.technicians ? faChevronDown : faChevronRight}
                                className="arrow-icon" 
                            />
                        </div>
                        <ul className={`submenu ${openSubmenus.technicians ? 'open' : ''}`}>
                            {(tipo_usuario === 'Admin' || tienePermiso('crear_tecnicos')) && (
                                <li key={6.1}>
                                    <Link to="/CrearTecnico" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                        <span>Crear Técnico</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_tecnicos')) && (
                                <li key={6.2}>
                                    <Link to="/VerdatosTecnico" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Ver Técnicos</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_mapa')) && (
                                <li key={6.3}>
                                    <Link to="/UbicacionT" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Ubicación Técnico</span>
                                    </Link>
                                </li>
                            )}

                        </ul>
                    </li>
                )}

               

                {/* Datos Estadisticos */}
                {(tipo_usuario === 'Admin' || tienePermiso('ver_reportesdesempeño, comentario_evaluacion')) && (
                    <li 
                        key={7} 
                        className="nav-item has-submenu"
                        onMouseEnter={() => handleItemHover('reporte', true)}
                        onMouseLeave={() => handleItemHover('reporte', false)}
                    >
                        <div 
                            className="nav-link"
                            onClick={() => handleItemClick('reporte')}
                        >
                            <FontAwesomeIcon icon={faTicketAlt} />
                            <span>Reporte Desempeño</span>
                            <FontAwesomeIcon 
                                icon={openSubmenus.reporte ? faChevronDown : faChevronRight}
                                className="arrow-icon" 
                            />
                        </div>
                        <ul className={`submenu ${openSubmenus.reporte ? 'open' : ''}`}>
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_reportesdesempeño')) && (
                                <li key={7.1}>
                                    <Link to="/RepDesp" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                        <span>Evaluación Completada</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('comentario_evaluacion')) && (
                                <li key={7.2}>
                                    <Link to="/ComentarioEvaluacion" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Evaluación Cerrado/No Realizado</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </li>
                )}

                {/* Datos Estadisticos */}
                {(tipo_usuario === 'Admin' || tienePermiso('datos_estadisticos')) && (
                    <li 
                        key={8} 
                        className="nav-item has-submenu"
                        onMouseEnter={() => handleItemHover('estadistico', true)}
                        onMouseLeave={() => handleItemHover('estadistico', false)}
                    >
                        <div 
                            className="nav-link"
                            onClick={() => handleItemClick('estadistico')}
                        >
                            <FontAwesomeIcon icon={faTicketAlt} />
                            <span>Estadísticas</span>
                            <FontAwesomeIcon 
                                icon={openSubmenus.estadistico ? faChevronDown : faChevronRight}
                                className="arrow-icon" 
                            />
                        </div>
                        <ul className={`submenu ${openSubmenus.estadistico ? 'open' : ''}`}>
                            {(tipo_usuario === 'Admin' || tienePermiso('datos_estadisticos')) && (
                                <li key={8.1}>
                                    <Link to="/datosestadisticos" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faPlusCircle} />
                                        <span>Datos Estadisticos</span>
                                    </Link>
                                </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('datos_estadisticos')) && (
                                <li key={8.2}>
                                    <Link to="/promedios" className="nav-link-sub">
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Sistema Estructurado</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </li>
                )}

                {(tipo_usuario === 'Admin' || tienePermiso('backup')) && (
                    <li key={9} className="nav-item">
                        <Link to="/backup" className="nav-link">
                            <FontAwesomeIcon icon={faHome} />
                            <span>Configuracion</span>
                        </Link>
                    </li>
                )}

              

                
            </ul>
        </nav>
    );
};

export default NavBar;
