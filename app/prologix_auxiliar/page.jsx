"use client"

import styles from '../../styles/prologix_usuarios/prologix_vista_usuarios.module.scss';
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BarChart from '../components/auxiliar_barchart';
import LineChart from '../components/auxiliar_linechart';
import { FaExclamationTriangle } from "react-icons/fa";
import { FaClock, FaArrowTrendUp, FaBorderAll } from "react-icons/fa6";
import Logo from '../../public/logo.png';

export default function AuxiliaresAdministrativos () {
    const [data, setData] = useState([]);
    const refModalInvalidAccess = useRef(null);
    const refModalAdd = useRef(null);
    const [invalidAccess, setInvalidAccess] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);
    const router = useRouter();

    // Estados para los filtros
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Estados para el formulario del modal
    const [registroEditando, setRegistroEditando] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [proyecto, setProyecto] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [horas, setHoras] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [numeroFactura, setNumeroFactura] = useState('');
    const [facturado, setFacturado] = useState('');

    async function getData () {
        try {
            const token = localStorage.getItem('access');
            const grupo = 'consultor';

            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/auxiliar/users?grupo=${grupo}`, {
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
            console.log(datos)
            setData(datos);
            
        } catch (error) {
            console.log("Error: ", error.message)
        }
    }

    useEffect(() => {
        getData()
    }, [])

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

    // Funciones de control del Formulario/Modal
    const resetearFormulario = () => {
        setRegistroEditando(null);
        setProyecto('');
        setEmpresa('');
        setHoras('');
        setDescripcion('');
        setNumeroFactura('');
        setFacturado('');
        setMensaje('');
    };

    const abrirModalEditar = (registro) => {
        setRegistroEditando(registro);
        setProyecto(registro.proyecto?.nombre || '');
        setEmpresa(registro.proyecto?.empresas?.nombre || '');
        setHoras(registro.horas || '');
        setDescripcion(registro.descripcion || '');
        setNumeroFactura(registro.numero_factura || '');
        setFacturado(registro.facturado || '');
        setModalAbierto(true);
        refModalAdd.current?.showModal();
    };

    const putData = async () => {
        try {
            const token = localStorage.getItem('access');
            if (!token) return;

            // 1. Armamos el payload
            const payload = {
                proyecto_id: registroEditando.proyecto?.id,
                numero_factura: numeroFactura,
                facturado: facturado,
                horas: horas,             
                descripcion: descripcion  
            };

            console.log("Datos que se están enviando a Django:", payload);

            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/registros/${registroEditando.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Actualiza el estado local
                setData(prevData => 
                    prevData.map(user => ({
                        ...user,
                        registros: (user.registros || []).map(reg => 
                            reg.id === registroEditando.id 
                                ? { ...reg, numero_factura: numeroFactura, facturado: facturado }
                                : reg
                        )
                    }))
                );

                setModalAbierto(false);
                refModalAdd.current?.close();
                resetearFormulario();
            } else {
                // 2. CAPTURAMOS EL ERROR EXACTO DE DJANGO
                const errorData = await response.json();
                console.error("Motivo del rechazo de Django (400):", errorData);
                
                // Mostramos el error convertido a texto en el recuadro rojo del modal
                setMensaje(JSON.stringify(errorData));
            }
        } catch (error) {
            console.error("Error en la petición PUT:", error);
            setMensaje('Error de conexión con el servidor');
        }
    };

    // 1. Aplanar los datos
    const allRecords = data.flatMap(user => 
        (user.registros || []).map(registro => ({
            ...registro,
            username: user.username || user.email
        }))
    );

    // 2. Extraer valores únicos para los selects y el modal
    const uniqueProjectsMap = new Map();
    allRecords.forEach(rec => {
        if (rec.proyecto && !uniqueProjectsMap.has(rec.proyecto.id)) {
            uniqueProjectsMap.set(rec.proyecto.id, rec.proyecto);
        }
    });
    const selectProyectos = Array.from(uniqueProjectsMap.values());
    const uniqueWeeks = [...new Set(allRecords.map(rec => rec.semana).filter(Boolean))].sort((a,b) => a - b);

    // 3. Aplicar Filtros
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

    // 4. Calcular métricas
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
            {modalInvalidAccess()}

            {/* Modal de edición de registro */}
            <dialog 
                ref={refModalAdd} 
                className={styles.modal} 
                style={{ display: modalAbierto ? '' : 'none' }}
                onCancel={() => {
                    setModalAbierto(false);
                    resetearFormulario();
                }}
            >
                <div className={styles.modal_header}>
                    <h1>{registroEditando ? 'Editar registro' : 'Nuevo registro'}</h1>
                    <button onClick={() => {
                        setModalAbierto(false)
                        refModalAdd.current?.close()
                        resetearFormulario()
                    }}>x</button>
                </div>
                {mensaje && <div style={{padding: '10px', margin: '10px', backgroundColor: '#ffe3e3', color: '#b71c1c', borderRadius: '4px'}}>{mensaje}</div>}
                
                <div className={styles.modal_inputs}>
                    <label>
                        Proyecto                            
                        <input value={proyecto} disabled style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }} />
                    </label>
                    <label>
                        Empresa
                        <input value={empresa} disabled style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }} />
                    </label>
                    <label>
                        Horas
                        <input value={horas} disabled style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }} />
                    </label>                        
                    <label>
                        N° Factura
                        <input value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} />
                    </label>
                    <label>
                        Facturado
                        <select value={facturado} onChange={(e) => setFacturado(e.target.value)}>
                            <option value="">-- Selecciona --</option>
                            <option value="si">si</option>
                            <option value="no">no</option>
                        </select>
                    </label>
                </div>

                <div className={styles.modal_input_description}>
                    <label>
                        Descripcion
                        <textarea value={descripcion} disabled style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}/>
                    </label>
                </div>

                <div className={styles.modal_buttons}>
                    <button onClick={() => {
                        setModalAbierto(false)
                        refModalAdd.current?.close()
                        resetearFormulario()
                    }} style={{backgroundColor: 'white', color: 'rgb(100, 116, 139)'}}>Cancelar</button>
                    <button onClick={() => {
                        if (registroEditando) {
                            putData()
                        }
                    }} style={{backgroundColor: 'rgb(37, 99, 235)', color: 'white'}}>Guardar cambios</button>
                </div>
            </dialog>

            <div className={styles.vista_consultor}>
                <div className={styles.vista_consultor_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Auxiliares Administrativos</h1>
                        <p>Gestión de registros y facturación</p>  
                    </div>
                    <div className={styles.encabezado_imagen}>
                        <div className={styles.encabezado_select}>
                            <Image src={currentLogo} width={40} height={40} alt='logo de la empresa' unoptimized />
                            <select 
                                value={selectedProject} 
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value=''>Todos los Proyectos</option>
                                {selectProyectos.map(proj => (
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
                                    <tr 
                                        key={registro.id || idx} 
                                        onClick={() => abrirModalEditar(registro)}
                                        style={{cursor: 'pointer', transition: 'background-color 0.2s'}}
                                    >
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