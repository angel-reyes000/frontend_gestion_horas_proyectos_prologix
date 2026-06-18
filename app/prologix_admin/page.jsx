"use client"

import styles from '../../styles/prologix_usuarios/prologix_vista_usuarios.module.scss';
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BarChart from '../components/admin_barchart';
import LineChart from '../components/admin_linechart';
import { FaExclamationTriangle } from "react-icons/fa";
import { FaClock, FaArrowTrendUp, FaBorderAll } from "react-icons/fa6";
import Logo from '../../public/logo.png';

export default function PrologixAdmin () {
    const [data, setData] = useState([]);
    const refModalInvalidAccess = useRef(null);
    const [invalidAccess, setInvalidAccess] = useState(false);
    const router = useRouter();

    // Estados para los filtros
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // 1. NUEVO: Agregamos el estado para validar la autorización
    const [autorizado, setAutorizado] = useState(false);

    // 2. NUEVO: Agregamos este useEffect para verificar el rol ANTES de hacer nada
    useEffect(() => {
        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            // Si el rol en localStorage no es administrador, lo mandamos al login
            router.replace('/login');
        } else {
            // Si es administrador, le damos permiso para ver la pantalla
            setAutorizado(true);
        }
    }, [router]);

    useEffect(() => {
        async function getData () {
            // ... (tu código se mantiene exactamente igual)
            try {
                const token = localStorage.getItem('access');

                const grupo = 'consultor';
                const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users?grupo=${grupo}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (response.status !== 200) {
                    setInvalidAccess(true)
                    refModalInvalidAccess.current?.showModal();
                }

                const datos = await response.json()
                setData(datos);
                
            } catch (error) {
                console.log("Error: ", error.message)
            }
        }

        // Solo traemos los datos si ya comprobamos que es administrador
        if (autorizado) {
            getData();
        }

    }, [autorizado]) // Dependencia actualizada para que reaccione al permiso

    // 3. NUEVO: Si no está autorizado, devolvemos null para que la pantalla se quede en blanco (evita el parpadeo de la vista admin)
    if (!autorizado) {
        return null;
    }

    function modalInvalidAccess () {
        return invalidAccess ? (
            <>
                <dialog className={styles.modal} ref={refModalInvalidAccess}>
                        <FaExclamationTriangle size={100} style={{color: 'yellow'}}/>
                        <h1>Acceso invalido</h1>
                        <button onClick={() => router.push('/login')}>Ir a iniciar sesion</button>
                </dialog>
            </>
        ) : null
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
            {/* TU JSX SE MANTIENE EXACTAMENTE IGUAL */}
            {modalInvalidAccess()}
            <div className={styles.vista_consultor}>
                <div className={styles.vista_consultor_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Gestión de Proyectos</h1>
                        <p>Resumen y gestión de consultores</p>  
                    </div>
                    <div className={styles.encabezado_imagen}>
                        <div className={styles.encabezado_select}>
                            <Image src={currentLogo} width={50} height={50} alt='logo de la empresa' unoptimized />
                            <select 
                                value={selectedProject} 
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value=''>Todos los Proyectos</option>
                                {uniqueProjects.map(proj => (
                                    <option key={proj.id} value={proj.id}>{proj.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <Image src={Logo} width={200} height={200} alt='logo de la empresa' unoptimized />
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
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(255, 223, 147)'}}>
                            <FaArrowTrendUp size={30} style={{color: 'rgb(255, 128, 37)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Promedio diario</p>
                            <h2>{promedioDiario.toFixed(2)}</h2>
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
                        <BarChart />
                    </div>
                    <div className={styles.graficas_pastel}>
                        <LineChart />
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