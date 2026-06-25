"use client"

import styles from '../../styles/prologix_usuarios/prologix_vista_usuarios.module.scss';
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BarChart from '../components/admin_barchart';
import LineChart from '../components/admin_linechart';
import { FaExclamationTriangle, FaTimesCircle, FaWifi, FaInfoCircle } from "react-icons/fa";
import { FaClock, FaArrowTrendUp, FaBorderAll } from "react-icons/fa6";
import Logo from '../../public/logo.png';

// Importaciones para las validaciones y animaciones
import AOS from "aos";
import "aos/dist/aos.css";

/* =================================================================
   VALIDACIONES FRONTEND BASADAS EN MODELOS DJANGO
   (Para uso en formularios de creación/edición en esta vista o hijas)
================================================================= */
export const validacionesDjango = {
    empresas: {
        nombre: { required: true, maxLength: 50 },
        logo: { required: false }
    },
    proyectos: {
        empresas: { required: true },
        nombre: { required: true, maxLength: 50 },
        descripcion: { required: true }
    },
    registros: {
        fecha_actual: { required: true },
        numero_factura: { required: false, maxLength: 20 },
        facturado: { required: false, maxLength: 2, choices: ['si', 'no'] },
        usuario: { required: true },
        proyecto: { required: true },
        horas: { 
            required: true, 
            pattern: /^\d{1,2}(\.\d{1,2})?$/, // max_digits=4, decimal_places=2 (ej. 99.99)
            errorMessage: "Debe tener máximo 4 dígitos en total y 2 decimales"
        },
        descripcion: { required: true }
    }
};

export default function PrologixAdmin () {
    const [data, setData] = useState([]);
    const router = useRouter();

    // Estados para los filtros
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [autorizado, setAutorizado] = useState(false);

    // Estado unificado para manejar todos los tipos de errores
    const refModalAlerta = useRef(null);
    const [alerta, setAlerta] = useState({
        show: false,
        type: '', // 'session', 'network', 'request', 'missing_fields', 'invalid_fields', 'general', 'invalid_access'
        title: '',
        message: ''
    });

    useEffect(() => {
        // Inicializar animaciones AOS
        AOS.init({ duration: 400, once: true });

        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            mostrarAlerta('invalid_access', 'Acceso Inválido', 'No tienes los permisos necesarios para ver esta sección.');
        } else {
            setAutorizado(true);
        }
    }, []);

    // Efecto para abrir o cerrar el <dialog> nativamente
    useEffect(() => {
        if (alerta.show && refModalAlerta.current) {
            refModalAlerta.current.showModal();
        } else if (!alerta.show && refModalAlerta.current) {
            refModalAlerta.current.close();
        }
    }, [alerta.show]);

    const mostrarAlerta = (type, title, message) => {
        setAlerta({ show: true, type, title, message });
    };

    const cerrarAlerta = () => {
        const tipoActual = alerta.type;
        setAlerta({ ...alerta, show: false });
        
        // Redirección obligatoria si la sesión caducó o el acceso es inválido
        if (tipoActual === 'session' || tipoActual === 'invalid_access') {
            router.replace('/login');
        }
    };

    useEffect(() => {
        async function getData () {
            try {
                const token = localStorage.getItem('access');
                if (!token) {
                    mostrarAlerta('session', 'Sesión Caducada', 'No se encontró una sesión activa. Por favor, inicia sesión.');
                    return;
                }

                const grupo = 'consultor';
                const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users?grupo=${grupo}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Manejo de errores basado en códigos de estado
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        mostrarAlerta('session', 'Sesión Caducada o Acceso Denegado', 'Tu sesión ha expirado o tu acceso es inválido.');
                        return;
                    }
                    if (response.status === 400) {
                        const errorData = await response.json().catch(() => ({}));
                        // Identificar si es por campos faltantes o inválidos
                        if (errorData.missing_fields) {
                            mostrarAlerta('missing_fields', 'Campos Faltantes', 'Faltan campos requeridos en la petición de datos.');
                        } else {
                            mostrarAlerta('invalid_fields', 'Campos Inválidos', 'Los datos proporcionados o solicitados son inválidos según el modelo.');
                        }
                        return;
                    }
                    if (response.status >= 500) {
                        mostrarAlerta('general', 'Error en el servidor', 'Ha ocurrido un problema inesperado en el servidor.');
                        return;
                    }
                    
                    mostrarAlerta('request', 'Error en la petición', 'No se pudo procesar la solicitud correctamente.');
                    return;
                }

                const datos = await response.json();
                
                // Validación extra: asegurarse de que vienen datos íntegros
                if (!Array.isArray(datos)) {
                    mostrarAlerta('invalid_fields', 'Error de Integridad', 'La estructura de los datos recibidos es inválida.');
                    return;
                }

                setData(datos);
                
            } catch (error) {
                console.log("Error: ", error.message);
                mostrarAlerta('network', 'Error de Red', 'No se pudo conectar con el servidor. Revisa tu conexión a internet.');
            }
        }

        if (autorizado) {
            getData();
        }

    }, [autorizado]);

    if (!autorizado && !alerta.show) {
        return null;
    }

    // Determinar el ícono y color basado en el tipo de alerta
    const getAlertaIcon = () => {
        switch (alerta.type) {
            case 'session':
            case 'invalid_access':
                return <FaExclamationTriangle size={60} color="#eab308" className={styles.alerta_icono} />;
            case 'network':
                return <FaWifi size={60} color="#ef4444" className={styles.alerta_icono} />;
            case 'missing_fields':
            case 'invalid_fields':
                return <FaTimesCircle size={60} color="#f97316" className={styles.alerta_icono} />;
            default:
                return <FaInfoCircle size={60} color="#3b82f6" className={styles.alerta_icono} />;
        }
    };

    function modalAlertaGlobal () {
        return (
            <dialog className={styles.dialog_alerta} ref={refModalAlerta}>
                <div className={styles.alerta_contenido} data-aos="zoom-in">
                    {getAlertaIcon()}
                    <div className={styles.alerta_textos}>
                        <h2>{alerta.title}</h2>
                        <p>{alerta.message}</p>
                    </div>
                    <button className={styles.alerta_boton} onClick={cerrarAlerta}>
                        {(alerta.type === 'session' || alerta.type === 'invalid_access') ? 'Ir a iniciar sesión' : 'Entendido'}
                    </button>
                </div>
            </dialog>
        );
    }

    // 1. Aplanar los datos: Convertir la estructura anidada de usuarios a una lista plana de registros
    const allRecords = data.flatMap(user => 
        (user.registros || []).map(registro => ({
            ...registro,
            username: user.username || user.email // Extraemos el usuario que hizo el registro
        }))
    );

    // 2. Extraer valores únicos para los selects (Proyectos y Semanas)
    const uniqueProjectsMap = new Map();
    allRecords.forEach(rec => {
        if (rec.proyecto && !uniqueProjectsMap.has(rec.proyecto.id)) {
            uniqueProjectsMap.set(rec.proyecto.id, rec.proyecto);
        }
    });
    const uniqueProjects = Array.from(uniqueProjectsMap.values());
    const uniqueWeeks = [...new Set(allRecords.map(rec => rec.semana).filter(Boolean))].sort((a,b) => a - b);

    // 3. Aplicar Filtros (Proyecto, Semana y Buscador Global)
    const filteredRecords = allRecords.filter(rec => {
        const matchProject = selectedProject === '' || rec.proyecto?.id.toString() === selectedProject;
        const matchWeek = selectedWeek === '' || rec.semana?.toString() === selectedWeek;
        
        const searchLower = searchQuery.toLowerCase();
        const matchSearch = searchLower === '' || 
            (rec.numero_factura || '').toString().toLowerCase().includes(searchLower) ||
            (rec.semana || '').toString().toLowerCase().includes(searchLower) ||
            (rec.fecha_actual || '').toString().toLowerCase().includes(searchLower) ||
            (rec.username || '').toString().toLowerCase().includes(searchLower) ||
            (rec.proyecto?.nombre || '').toString().toLowerCase().includes(searchLower) ||
            (rec.horas || '').toString().toLowerCase().includes(searchLower) ||
            (rec.facturado || '').toString().toLowerCase().includes(searchLower) ||
            (rec.descripcion || '').toString().toLowerCase().includes(searchLower);

        return matchProject && matchWeek && matchSearch;
    });

    // 4. Calcular métricas basadas en los datos FILTRADOS
    const totalHoras = filteredRecords.reduce((acc, rec) => acc + parseFloat(rec.horas || 0), 0);
    const uniqueDates = new Set(filteredRecords.map(rec => rec.fecha_actual)).size;
    const promedioDiario = uniqueDates > 0 ? (totalHoras / uniqueDates) : 0;
    const totalProyectosFiltrados = new Set(filteredRecords.map(rec => rec.proyecto?.id)).size;

    // 5. Determinar la imagen del logo
    let currentLogo = Logo;
    if (selectedProject !== '') {
        const proj = uniqueProjectsMap.get(parseInt(selectedProject));
        if (proj && proj.empresas && proj.empresas.logo) {
            currentLogo = `${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}${proj.empresas.logo}`;
        }
    }

    return (
        <>  
            {modalAlertaGlobal()}
            
            <div className={styles.vista_consultor}>
                <div className={styles.vista_consultor_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Gestión de Proyectos</h1>
                        <p>Resumen y gestión de consultores</p>  
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
                                    {uniqueProjects.map(proj => (
                                        <option key={proj.id} value={proj.id}>{proj.nombre}</option>
                                    ))}
                                </select>
                            </label>                        
                        </div>
                        <div className={styles.encabezado_logos}>
                            <img src={currentLogo} width={200} height={200} alt='logo de la empresa' />
                            <Image src={Logo} width={50} height={50} alt='logo de la empresa' unoptimized style={{maxHeight: '30px'}} />
                        </div>
                    </div>
                </div>

                <div className={styles.vista_consultor_recuadros}>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(219, 199, 255)'}}>
                            <FaClock size={30} style={{color: 'rgb(166, 118, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Horas Totales</p>
                            <h2>{totalHoras.toFixed(2)}</h2>
                        </div>
                    </div>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(186, 191, 255)'}}>
                            <FaBorderAll size={30} style={{color: 'rgb(37, 52, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Total de proyectos</p>
                            <h2>{totalProyectosFiltrados}</h2>
                        </div>
                    </div>
                </div>

                <div className={styles.vista_consultor_graficas}>
                    <div className={styles.graficas_lineas}>
                        <BarChart records={filteredRecords} />
                    </div>
                    <div className={styles.graficas_pastel}>
                        <LineChart records={filteredRecords} /> 
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
                                    <th>Descripcion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((registro, idx) => (
                                    <tr key={registro.id || idx} style={{cursor: 'pointer', transition: 'background-color 0.2s'}}>
                                        <td>{registro.numero_factura || 'N/A'}</td>
                                        <td>{registro.semana}</td>
                                        <td>{registro.fecha_actual}</td>
                                        <td>{registro.username}</td> 
                                        <td style={{fontWeight: '600'}}>{registro.proyecto?.nombre}</td>
                                        <td style={{fontWeight: '600'}}>{registro.horas}</td>
                                        <td>{registro.facturado}</td>
                                        <td>{registro.descripcion}</td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>
                                            No se encontraron registros
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