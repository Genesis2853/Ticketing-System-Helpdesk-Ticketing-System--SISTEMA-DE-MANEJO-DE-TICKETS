import React, { useState } from 'react';
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
    '/PerfilT',
    '/UbicacionT',
    '/RepServT',
    '/RepDesp',
    '/Confg',
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
];



const NavBar = ({ permisos, tipo_usuario }) => {
    const location = useLocation();
    const [isClientsSubMenuOpen, setIsClientsSubMenuOpen] = useState(false);
    const [isTicketsSubMenuOpen, setIsTicketsSubMenuOpen] = useState(false);
    const [isTechniciansSubMenuOpen, setIsTechniciansSubMenuOpen] = useState(false);

    if (!allowedRoutes.includes(location.pathname)) {
        return null;
    }

    const tienePermiso = (permiso) => permisos?.includes(permiso);


    return (
      <nav className="nav-adm-func">
          <ul className="nav-items">
              {/* Renderizar "Inicio" */}
              {(tipo_usuario === 'Admin' || tipo_usuario === 'Moderador') &&(
              <li key={1} className="nav-item a-nav-adm">
                  <Link to="/Inicio" className="nav-link" style={{ textDecoration: 'none', color: 'black' }}>
                      Inicio
                  </Link>
              </li>
              )}

              {/* Renderizar "Clientes" */}
              {(tipo_usuario === 'Admin' || tienePermiso('ver_clientes')) && (
                  <li className="nav-item" 
                      onMouseEnter={() => setIsClientsSubMenuOpen(true)} 
                      onMouseLeave={() => setIsClientsSubMenuOpen(false)}
                  >
                      <p 
                          className="p-nav-adm" 
                          aria-haspopup="true" 
                          aria-expanded={isClientsSubMenuOpen}
                          tabIndex={0}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  setIsClientsSubMenuOpen(!isClientsSubMenuOpen);
                              }
                          }}
                      >
                          Clientes
                      </p>
                      {isClientsSubMenuOpen && (
                          <ul className="submenu">
                              {(tipo_usuario === 'Admin' || tienePermiso('crear_clientes')) && (
                                  <li className="submenu-item">
                                      <Link to="/CrearClientes" className="nav-link-sub">Crear Cliente</Link>
                                  </li>
                              )}
                              {(tipo_usuario === 'Admin'|| tipo_usuario === 'Tecnico' || tienePermiso('ver_clientes')) && (
                                  <li className="submenu-item">
                                      <Link to="/VerdatosClientes" className="nav-link-sub">Ver Datos</Link>
                                  </li>
                              )}
                          </ul>
                      )}
                  </li>
              )}

              {/* Renderizar "Tickets" */}
              {(tipo_usuario === 'Admin' || tienePermiso('ver_tickets')) && (
                  <li className="nav-item" 
                      onMouseEnter={() => setIsTicketsSubMenuOpen(true)} 
                      onMouseLeave={() => setIsTicketsSubMenuOpen(false)}
                  >
                      <p 
                          className="p-nav-adm" 
                          aria-haspopup="true" 
                          aria-expanded={isTicketsSubMenuOpen}
                          tabIndex={0}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  setIsTicketsSubMenuOpen(!isTicketsSubMenuOpen);
                              }
                          }}
                      >
                          Tickets
                      </p>
                      {isTicketsSubMenuOpen && (
                          <ul className="submenu">
                              {(tipo_usuario === 'Admin' || tienePermiso('crear_tickets')) && (
                                  <li className="submenu-item">
                                      <Link to="/CrearTicket" className="nav-link-sub">Crear Ticket</Link>
                                  </li>
                              )}
                              {(tipo_usuario === 'Admin' || tienePermiso('ver_tickets')) && (
                                  <li className="submenu-item">
                                      <Link to="/VerdatosTickets" className="nav-link-sub">Ver Tickets</Link>
                                  </li>
                              )}
                          </ul>
                      )}
                  </li>
              )}

              {/* Renderizar "Asignación de Solicitud" */}
              {(tipo_usuario === 'Admin' || tienePermiso('asignar_solicitudes')) && (
                  <li key={4} className="nav-item a-nav-adm">
                      <Link to="/AsignaciondeSolicitud" className="nav-link" style={{ textDecoration: 'none', color: 'black' }}>
                          Asignación de Solicitud
                      </Link>
                  </li>
              )}

              {/* Renderizar "Estado de Solicitud" */}
              {(tipo_usuario === 'Admin' || tienePermiso('ver_estado_solicitudes')) && (
                  <li className="nav-item" 
                      onMouseEnter={() => setIsTechniciansSubMenuOpen(true)} 
                      onMouseLeave={() => setIsTechniciansSubMenuOpen(false)}
                  >
                      <p 
                          className="p-nav-adm" 
                          aria-haspopup="true" 
                          aria-expanded={isTechniciansSubMenuOpen}
                          tabIndex={0}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  setIsTechniciansSubMenuOpen(!isTechniciansSubMenuOpen);
                              }
                          }}
                      >
                          Estado de Solicitud
                      </p>
                      {isTechniciansSubMenuOpen && (
                          <ul className="submenu">
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_estado_solicitudes')) && (
                              <li className="submenu-item">
                                  <Link to="/EstadoSolicitud" className="nav-link-sub">Estado de Solicitudes Activas</Link>
                              </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_soli_completa')) && (
                              <li className="submenu-item">
                                  <Link to="/EstadoSoliCompletado" className="nav-link-sub">Solicitudes Completadas</Link>
                              </li>
                            )}
                            {(tipo_usuario === 'Admin' || tienePermiso('ver_solino')) && (
                              <li className="submenu-item">
                                  <Link to="/EstadoSoliNoRealizado" className="nav-link-sub">Solicitudes No Realizadas</Link>
                              </li>
                            )}
                          </ul>
                      )}
                  </li>
              )}

              {/* Renderizar "Técnicos" */}
              {(tipo_usuario === 'Admin' || tienePermiso('ver_tecnicos')) && (
                  <li className="nav-item" 
                      onMouseEnter={() => setIsTechniciansSubMenuOpen(true)} 
                      onMouseLeave={() => setIsTechniciansSubMenuOpen(false)}
                  >
                      <p 
                          className="p-nav-adm" 
                          aria-haspopup="true" 
                          aria-expanded={isTechniciansSubMenuOpen}
                          tabIndex={0}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  setIsTechniciansSubMenuOpen(!isTechniciansSubMenuOpen);
                              }
                          }}
                      >
                          Técnicos
                      </p>
                      {isTechniciansSubMenuOpen && (
                          <ul className="submenu">
                              {(tipo_usuario === 'Admin' || tienePermiso('crear_tecnicos')) && (
                                <li className="submenu-item">
                                    <Link to="/CrearTecnico" className="nav-link-sub">Crear Técnico</Link>
                                </li>
                              )}
                              {(tipo_usuario === 'Admin' || tienePermiso('ver_tecnicos')) && (
                                
                                  <li className="submenu-item">
                                      <Link to="/PerfilT" className="nav-link-sub">Perfil Técnico</Link>
                                  </li>
                              )}
                              {(tipo_usuario === 'Admin' || tienePermiso('ver_mapa')) && (
                                  <li className="submenu-item">
                                      <Link to="/UbicacionT" className="nav-link-sub">Ubicación Técnico</Link>
                                  </li>
                                
                              )}
                              {(tipo_usuario === 'Admin' || tienePermiso('reporte_servicio')) && (
                              <li className="submenu-item">
                                  <Link to="/RepServT" className="nav-link-sub">Reporte de Servicio</Link>
                              </li>
                              )}
                          </ul>
                      )}
                  </li>
              )}

              {/* Renderizar "Reporte de Desempeño" */}
              {(tipo_usuario === 'Admin' || tienePermiso('ver_reportesdesempeño')) && (
                <li key={7} className="nav-item a-nav-adm">
                    <Link to="/RepDesp" className="nav-link" style={{ textDecoration: 'none', color: 'black' }}>
                        Reporte de Desempeño
                    </Link>
                </li>
              )}
              {/* Renderizar "Datos Estadisticos" */}
              {(tipo_usuario === 'Admin' || tienePermiso('datos_estadisticos')) && (
                <li key={8} className="nav-item a-nav-adm">
                    <Link to="/datosestadisticos" className="nav-link" style={{ textDecoration: 'none', color: 'black' }}>
                        Datos Estadisticos
                    </Link>
                </li>
              )}

              {/* Renderizar "Configuración del Sistema" */}
              {(tipo_usuario === 'Admin' || tienePermiso('configurar_sistema')) && (
                <li key={9} className="nav-item a-nav-adm">
                    <Link to="/Confg" className="nav-link" style={{ textDecoration: 'none', color: 'black' }}>
                        Configuración del Sistema
                    </Link>
                </li>
              )}
          </ul>
      </nav>
    );
};

export default NavBar;
