"use client"

import styles from '../../styles/prologix_usuarios/prologix_vista_usuarios.module.scss';
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BarChart from '../components/cliente_barchart';
import { FaExclamationTriangle, FaWifi, FaTimesCircle, FaLock } from "react-icons/fa";
import { FaClock, FaArrowTrendUp, FaBorderAll } from "react-icons/fa6";
import Logo from '../../public/logo.png';

// Importaciones de AOS
import AOS from "aos";
import "aos/dist/aos.css";

export default function PrologixCliente () {
    const [data, setData] = useState([]);
    const router = useRouter();

    // Estados para los filtros
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Estado unificado para validaciones y alertas
    const refModalAlerta = useRef(null);
    const [alertaInfo, setAlertaInfo] = useState({
        mostrar: false,
        titulo: '',
        mensaje: '',
        tipo: '',
        icono: null
    });

    const mostrarAlerta = (titulo, mensaje, tipo, icono) => {
        setAlertaInfo({ mostrar: true, titulo, mensaje, tipo, icono });
        refModalAlerta.current?.showModal();
    };

    const cerrarAlerta = () => {
        refModalAlerta.current?.close();
        setAlertaInfo({ ...alertaInfo, mostrar: false });
        // Si la sesión caducó, enviamos al login
        if (alertaInfo.tipo === 'sesion_caducada' || alertaInfo.tipo === 'no_autenticado') {
            router.push('/login');
        }
    };

    // Función para procesar errores de validación de los modelos de Django desde el backend
    const procesarErroresDjango = (errorData) => {
        if (typeof errorData === 'string') return errorData;
        let mensajes = [];
        for (const campo in errorData) {
            if (errorData.hasOwnProperty(campo)) {
                const nombreCampo = campo === 'non_field_errors' ? 'Error general' : campo;
                const detalleError = Array.isArray(errorData[campo]) ? errorData[campo].join(', ') : errorData[campo];
                mensajes.push(`${nombreCampo}: ${detalleError}`);
            }
        }
        return mensajes.length > 0 ? mensajes.join(' | ') : 'Error de validación en los campos proporcionados.';
    };

    async function getData () {
        try {
            const token = localStorage.getItem('access');

            // Validación de sesión/token faltante antes de hacer la petición
            if (!token) {
                mostrarAlerta(
                    'Sesión no encontrada',
                    'No se encontró una sesión activa o faltan campos de autenticación.',
                    'no_autenticado',
                    <FaLock size={50} style={{ color: '#eab308' }} />
                );
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/cliente/registros/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Manejo de errores basado en el Status HTTP
            if (!response.ok) {
                let errorData = {};
                try { errorData = await response.json(); } catch (e) { /* No es JSON */ }

                switch (response.status) {
                    case 401: // Sesión caducada / Token inválido
                        mostrarAlerta(
                            'Sesión caducada',
                            'Tu sesión ha terminado. Por favor, inicia sesión nuevamente.',
                            'sesion_caducada',
                            <FaLock size={50} style={{ color: '#eab308' }} />
                        );
                        break;
                    case 403: // Acceso inválido
                        mostrarAlerta(
                            'Acceso inválido',
                            'No tienes permisos de cliente para ver esta información.',
                            'acceso_invalido',
                            <FaLock size={50} style={{ color: '#dc2626' }} />
                        );
                        break;
                    case 400: // Bad Request (Errores de campos faltantes o inválidos desde el modelo de Django)
                        const mensajeValidacion = procesarErroresDjango(errorData);
                        mostrarAlerta(
                            'Campos inválidos o faltantes',
                            mensajeValidacion,
                            'bad_request',
                            <FaExclamationTriangle size={50} style={{ color: '#ea580c' }} />
                        );
                        break;
                    default: // Error de petición / general
                        mostrarAlerta(
                            'Error en la petición',
                            `Ocurrió un problema al procesar la solicitud (Código ${response.status}).`,
                            'error_peticion',
                            <FaTimesCircle size={50} style={{ color: '#dc2626' }} />
                        );
                        break;
                }
                return;
            }

            const datos = await response.json();
            setData(datos);
            
        } catch (error) {
            // Manejo de error de red o error de servidor caído
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                mostrarAlerta(
                    'Error de red',
                    'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
                    'error_red',
                    <FaWifi size={50} style={{ color: '#dc2626' }} />
                );
            } else {
                mostrarAlerta(
                    'Error general',
                    `Ha ocurrido un error inesperado: ${error.message}`,
                    'error_general',
                    <FaExclamationTriangle size={50} style={{ color: '#dc2626' }} />
                );
            }
        }
    }

    useEffect(() => {
        // Inicializar AOS para las animaciones del modal
        AOS.init({ duration: 300, once: true });
        getData();
    }, []);

    // Render del Modal de Validaciones
    function renderModalAlerta() {
        return (
            <dialog className={styles.dialog_alerta} ref={refModalAlerta} onCancel={(e) => e.preventDefault()}>
                {alertaInfo.mostrar && (
                    <div className={styles.alerta_contenido} data-aos="zoom-in">
                        <div className={styles.alerta_icono}>
                            {alertaInfo.icono}
                        </div>
                        <div className={styles.alerta_textos}>
                            <h2>{alertaInfo.titulo}</h2>
                            <p>{alertaInfo.mensaje}</p>
                        </div>
                        <button className={styles.alerta_boton} onClick={cerrarAlerta}>
                            {(alertaInfo.tipo === 'sesion_caducada' || alertaInfo.tipo === 'no_autenticado') ? 'Ir a iniciar sesión' : 'Entendido'}
                        </button>
                    </div>
                )}
            </dialog>
        );
    }

    // Extraer valores únicos para los selects (Proyectos y Semanas)
    const uniqueProjectsMap = new Map();
    data.forEach(rec => {
        if (rec.proyecto && !uniqueProjectsMap.has(rec.proyecto.id)) {
            uniqueProjectsMap.set(rec.proyecto.id, rec.proyecto);
        }
    });
    const selectProyectos = Array.from(uniqueProjectsMap.values());
    const uniqueWeeks = [...new Set(data.map(rec => rec.semana).filter(Boolean))].sort((a,b) => a - b);

    // Aplicar Filtros
    const filteredRecords = data.filter(rec => {
        const matchProject = selectedProject === '' || rec.proyecto?.id.toString() === selectedProject;
        const matchWeek = selectedWeek === '' || rec.semana?.toString() === selectedWeek;
        
        const searchLower = searchQuery.toLowerCase();
        const usernameStr = rec.usuario?.username || rec.usuario?.email || '';
        
        const matchSearch = searchLower === '' || 
            (rec.numero_factura || '').toString().toLowerCase().includes(searchLower) ||
            (rec.semana || '').toString().toLowerCase().includes(searchLower) ||
            (rec.fecha_actual || '').toString().toLowerCase().includes(searchLower) ||
            usernameStr.toLowerCase().includes(searchLower) ||
            (rec.proyecto?.nombre || '').toString().toLowerCase().includes(searchLower) ||
            (rec.horas || '').toString().toLowerCase().includes(searchLower) ||
            (rec.facturado || '').toString().toLowerCase().includes(searchLower) ||
            (rec.descripcion || '').toString().toLowerCase().includes(searchLower);

        return matchProject && matchWeek && matchSearch;
    });

    // Calcular métricas (KPIs)
    const getWeekNumber = (d) => {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    const semanaActual = getWeekNumber(new Date());

    const totalHoras = filteredRecords.reduce((acc, rec) => acc + parseFloat(rec.horas || 0), 0);
    
    const totalHorasEstaSemana = filteredRecords
        .filter(rec => parseInt(rec.semana) === semanaActual)
        .reduce((acc, rec) => acc + parseFloat(rec.horas || 0), 0);

    const uniqueDates = new Set(filteredRecords.map(rec => rec.fecha_actual)).size;
    const promedioDiario = uniqueDates > 0 ? (totalHoras / uniqueDates) : 0;
    const totalProyectosFiltrados = new Set(filteredRecords.map(rec => rec.proyecto?.id)).size;

    // Determinar la imagen del logo
    let currentLogo = Logo;
    if (selectedProject !== '') {
        const proj = uniqueProjectsMap.get(parseInt(selectedProject));
        if (proj && proj.empresas && proj.empresas.logo) {
            currentLogo = `${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}${proj.empresas.logo}`;
        }
    }

    return (
        <>  
            {renderModalAlerta()}

            <div className={styles.vista_consultor}>
                <div className={styles.vista_consultor_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Resumen de Proyecto(s)</h1>
                        <p>Vista general del rendimiento de proyecto(s)</p>  
                    </div>
                    <div className={styles.encabezado_imagen}>
                        <div className={styles.encabezado_select}>
                            <label>
                                Mostrar por:
                                <select 
                                    value={selectedProject} 
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value=''>Todos los Proyectos</option>
                                    {selectProyectos.map(proj => (
                                        <option key={proj.id} value={proj.id}>{proj.nombre}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className={styles.encabezado_logos}>
                            <Image src={currentLogo} width={200} height={200} alt='logo de la empresa' unoptimized />
                            <Image src={Logo} width={50} height={50} alt='logo de la empresa' unoptimized style={{maxHeight: '30px'}}/>
                        </div>
                    </div>
                </div>

                <div className={styles.vista_consultor_recuadros}>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(219, 199, 255)'}}>
                            <FaClock size={30} style={{color: 'rgb(166, 118, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Total de horas esta semana</p>
                            <h2>{totalHorasEstaSemana.toFixed(2)}</h2>
                        </div>
                    </div>
                    <div className={styles.recuadros}  style={{width: '49.7%'}}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(186, 191, 255)'}}>
                            <FaBorderAll size={30} style={{color: 'rgb(37, 52, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Total de horas</p>
                            <h2>{totalHoras.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                <div className={styles.vista_consultor_graficas} style={{display: 'flex', width: '100%'}}>
                    <div className={styles.graficas_lineas} style={{width: '100%'}}>
                        <BarChart records={filteredRecords} />
                    </div>
                </div>

                <div className={styles.vista_consultor_tabla}>
                    <div className={styles.vista_consultor_tabla_encabezado}>
                        <div className={styles.vista_consultor_titulo}>
                            <h1>Registro de horas</h1>
                        </div>
                        <div className={styles.vista_consultor_acciones}>
                            <div className={styles.acciones_select}>
                                <label>
                                    Semana:
                                    <select 
                                        value={selectedWeek} 
                                        onChange={(e) => setSelectedWeek(e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {uniqueWeeks.map(week => (
                                            <option key={week} value={week}>Semana {week}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className={styles.acciones_input}>
                                <input 
                                    placeholder='Buscar...' 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.tabla}>
                        <table>
                            <thead>
                                <tr>
                                    <th>N°Factura</th>
                                    <th>Semana</th>
                                    <th>Fecha</th>
                                    <th>Consultor</th>
                                    <th>Proyecto</th>
                                    <th>Horas</th>
                                    <th>Facturado</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((registro, idx) => (
                                    <tr 
                                        key={registro.id || idx} 
                                        style={{cursor: 'default', transition: 'background-color 0.2s'}}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'} 
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td>{registro.numero_factura || 'N/A'}</td>
                                        <td>{registro.semana}</td>
                                        <td>{registro.fecha_actual}</td>
                                        <td>{registro.usuario?.username || registro.usuario?.email || 'N/A'}</td> 
                                        <td style={{fontWeight: '600'}}>{registro.proyecto?.nombre}</td>
                                        <td style={{fontWeight: '600'}}>{registro.horas}</td>
                                        <td>{registro.facturado}</td>
                                        <td>{registro.descripcion}</td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>
                                            No se encontraron registros para tus proyectos asignados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table> 
                    </div>
                </div>
            </div>
        </>
    )
}