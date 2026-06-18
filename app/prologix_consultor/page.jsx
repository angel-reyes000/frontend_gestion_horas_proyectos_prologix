"use client"

import styles from '../../styles/prologix_usuarios/prologix_vista_usuarios.module.scss';
import { FaClock, FaArrowTrendUp, FaBorderAll } from "react-icons/fa6";
import { FaPlus, FaTrash } from "react-icons/fa";
import Image from 'next/image';
import Logo from '../../public/logo.png';
import GraficaHorasSemana from '../components/consultor_grafica_horas_semana';
import GraficaHorasProyectosSemana from '../components/consultor_grafica_horas_proyectos_semana';
import { useEffect, useState, useRef } from 'react';

export default function PrologixConsultor () {
    const [data, setData] = useState([]);
    const [selectProyectos, setSelectProyectos] = useState([]);
    const [empresa, setEmpresa] = useState('');
    const [proyecto, setProyecto] = useState('');
    const [semana, setSemana] = useState('');
    const [horas, setHoras] = useState(0);
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(''); // <-- NUEVO ESTADO PARA FECHA
    const [modalAbierto, setModalAbierto] = useState(false);
    const [registroEditando, setRegistroEditando] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [proyectoFiltro, setProyectoFiltro] = useState('');
    const [logoEmpresa, setLogoEmpresa] = useState(null);
    
    // --- NUEVOS ESTADOS PARA LOS FILTROS ---
    const [semanaFiltro, setSemanaFiltro] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const refModalAdd = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem('access');

        if (!token) {
            console.log('No hay token disponible');
            return;
        }

        getDataRegistros()

        async function getDataProyectos () {
            const response = await fetch('http://localhost:8000/api/proyectos/', {
                method: 'GET',
                headers: {
                    'content-type' : 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })

            const datos = await response.json()
            setSelectProyectos(datos);
        }

        getDataProyectos()

    }, [])

    useEffect(() => {
        if (proyecto && selectProyectos.length > 0) {
            const proyectoSeleccionado = selectProyectos.find(p => p.nombre === proyecto);
            if (proyectoSeleccionado && proyectoSeleccionado.empresas) {
                setEmpresa(proyectoSeleccionado.empresas.nombre);
            }
        }
    }, [proyecto, selectProyectos])

    useEffect(() => {
        if (modalAbierto && refModalAdd.current && !refModalAdd.current.open) {
            refModalAdd.current.showModal();
        }
    }, [modalAbierto]);

    async function postData() {
        const token = localStorage.getItem('access');
        try {
            // <-- SE AGREGA VALIDACIÓN DE FECHA
            if (!proyecto || !horas || !descripcion || !fecha) {
                setMensaje('Por favor completa todos los campos');
                return;
            }

            const proyectoSeleccionado = selectProyectos.find(p => p.nombre === proyecto);
            
            if (!proyectoSeleccionado) {
                setMensaje('Selecciona un proyecto válido');
                return;
            }

            const datosEnvio = {
                horas: parseFloat(horas),
                proyecto_id: proyectoSeleccionado.id,
                descripcion: descripcion,
                fecha_actual: fecha // <-- SE ENVÍA LA FECHA A DJANGO
            };

            const response = await fetch('http://localhost:8000/api/registros/', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(datosEnvio)
            })

            const responseText = await response.text();

            if (response.status === 201) {
                setMensaje('Registro creado exitosamente');
                resetearFormulario();
                setModalAbierto(false); 
                getDataRegistros();
            } else {
                try {
                    const error = JSON.parse(responseText);
                    setMensaje('Error al crear registro: ' + JSON.stringify(error));
                } catch {
                    setMensaje('Error del servidor: ' + responseText.substring(0, 100));
                }
            }

        } catch (error) {
            console.log("Error al hacer post en registros", error)
            setMensaje('Error: ' + error.message);
        }
    }

    async function putData() {
        const token = localStorage.getItem('access');
        try {
            // <-- SE AGREGA VALIDACIÓN DE FECHA
            if (!proyecto || !semana || !horas || !descripcion || !fecha) {
                setMensaje('Por favor completa todos los campos');
                return;
            }

            const proyectoSeleccionado = selectProyectos.find(p => p.nombre === proyecto);
            
            if (!proyectoSeleccionado) {
                setMensaje('Selecciona un proyecto válido');
                return;
            }

            const datosEnvio = {
                horas: parseFloat(horas),
                proyecto_id: proyectoSeleccionado.id,
                descripcion: descripcion,
                fecha_actual: fecha // <-- SE ENVÍA LA FECHA A DJANGO
            };

            const response = await fetch(`http://localhost:8000/api/registros/${registroEditando.id}/`, {
                method: 'PUT',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(datosEnvio)
            })

            const responseText = await response.text();

            if (response.status === 200) {
                setMensaje('Registro actualizado exitosamente');
                resetearFormulario();
                setModalAbierto(false); 
                getDataRegistros();
            } else {
                try {
                    const error = JSON.parse(responseText);
                    setMensaje('Error al actualizar registro: ' + JSON.stringify(error));
                } catch {
                    setMensaje('Error del servidor: ' + responseText.substring(0, 100));
                }
            }

        } catch (error) {
            console.log("Error al hacer put en registros", error)
            setMensaje('Error: ' + error.message);
        }
    }

    async function deleteData() {
        if (!registroEditando) return;
        
        const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este registro?");
        if (!confirmar) return;

        const token = localStorage.getItem('access');
        try {
            const response = await fetch(`http://localhost:8000/api/registros/${registroEditando.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (response.status === 204 || response.status === 200) {
                setMensaje('Registro eliminado exitosamente');
                resetearFormulario();
                setModalAbierto(false); 
                getDataRegistros();
            } else {
                setMensaje('Error al eliminar registro');
            }
        } catch (error) {
            console.log("Error al hacer delete en registros", error);
            setMensaje('Error: ' + error.message);
        }
    }

    function resetearFormulario() {
        setProyecto('');
        setEmpresa('');
        setSemana('');
        setHoras(0);
        setDescripcion('');
        setFecha(''); // <-- SE RESETEA LA FECHA
        setRegistroEditando(null);
        setMensaje('');
    }

    function abrirEditarRegistro(registro) {
        setRegistroEditando(registro);
        setProyecto(registro.proyecto.nombre);
        setEmpresa(registro.proyecto.empresas.nombre);
        setSemana(registro.semana.toString());
        setHoras(registro.horas.toString());
        setDescripcion(registro.descripcion);
        // <-- SE CARGA LA FECHA AL EDITAR (Toma fecha_actual o fecha según el serializer de Django)
        setFecha(registro.fecha_actual || ''); 
        setModalAbierto(true);
    }

    async function getDataRegistros() {
        const token = localStorage.getItem('access');
        try {
            const response = await fetch('http://localhost:8000/api/registros/', {
                method: 'GET',
                headers: {
                    'content-type' : 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })

            const datos = await response.json()
            setData(datos)
        } catch (error) {
            console.log("Error al obtener registros", error)
        }
    }

    const datosFiltrados = Array.isArray(data) ? data.filter(obj => {
        const matchProyecto = proyectoFiltro === '' || obj.proyecto?.id?.toString() === proyectoFiltro;
        const matchSemana = semanaFiltro === '' || obj.semana?.toString() === semanaFiltro;
        
        const termino = busqueda.toLowerCase();
        const matchBusqueda = busqueda === '' || (
            (obj.proyecto?.numero_factura?.toString().toLowerCase().includes(termino)) ||
            (obj.proyecto?.nombre?.toLowerCase().includes(termino)) ||
            (obj.proyecto?.empresas?.nombre?.toLowerCase().includes(termino)) ||
            (obj.semana?.toString().toLowerCase().includes(termino)) ||
            (obj.fecha_actual?.toLowerCase().includes(termino)) ||
            (obj.horas?.toString().toLowerCase().includes(termino)) ||
            (obj.descripcion?.toLowerCase().includes(termino))
        );

        return matchProyecto && matchSemana && matchBusqueda;
    }) : [];

    const semanasDisponibles = Array.isArray(data) 
        ? [...new Set(data.map(item => item.semana))].sort((a, b) => b - a) 
        : [];

    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    };

    const semanaKPI = semanaFiltro !== '' ? parseInt(semanaFiltro) : getWeekNumber(new Date());

    const horasEstaSemana = datosFiltrados
        .filter(obj => obj.semana === semanaKPI)
        .reduce((acumulador, actual) => acumulador + parseFloat(actual.horas || 0), 0);

    const promedioDiario = (horasEstaSemana / 5).toFixed(2);

    const totalProyectosActivos = new Set(datosFiltrados.map(obj => obj.proyecto?.id)).size;

    return (
        <>
            {modalAbierto && (
                <dialog 
                    ref={refModalAdd} 
                    className={styles.modal} 
                    onCancel={() => {
                        setModalAbierto(false);
                        resetearFormulario();
                    }}
                >
                    <div className={styles.modal_header}>
                        <h1>{registroEditando ? 'Editar registro' : 'Nuevo registro'}</h1>
                        <button onClick={() => {
                            setModalAbierto(false)
                            resetearFormulario()
                        }}>x</button>
                    </div>
                    {mensaje && <div style={{padding: '10px', margin: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px'}}>{mensaje}</div>}
                    <div className={styles.modal_inputs}>
                        <label>
                            Proyecto                            
                            <select value={proyecto} onChange={(e) => setProyecto(e.target.value)}>
                                <option>-- Seleccion un proyecto --</option>
                                {selectProyectos.map(obj => (
                                    <option key={obj.id}>{obj.nombre}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Empresa
                            <select value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
                                {selectProyectos.find(p => p.nombre === proyecto)?.empresas && (
                                    <option disabled>{selectProyectos.find(p => p.nombre === proyecto).empresas.nombre}</option>
                                )}
                            </select>
                        </label>
                        <label>
                            Horas
                            <input value={horas} onChange={(e) => setHoras(e.target.value)} />
                        </label>    
                        <label>
                            Fecha
                            {/* <-- SE VINCULA EL INPUT DATE AL ESTADO DE REACT */}
                            <input type='date' value={fecha} onChange={(e) => setFecha(e.target.value)} />
                        </label>                      
                    </div>
                    <div className={styles.modal_input_description}>
                        <label>
                            Descripcion
                            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}/>
                        </label>
                    </div>
                    <div className={styles.modal_botones}>
                        <div className={styles.botones_guardar_cancelar}>
                            <button onClick={() => {
                                setModalAbierto(false)
                                resetearFormulario()
                            }} style={{backgroundColor: 'white', color: 'rgb(100, 116, 139)', border: '2px solid rgb(228, 228, 228)'}}>Cancelar</button>
                            <button onClick={() => {
                                if (registroEditando) {
                                    putData()
                                } else {
                                    postData()
                                }
                            }} style={{backgroundColor: 'rgb(37, 99, 235)', color: 'white'}}>Guardar cambios</button>
                        </div>
                        {registroEditando && (
                            <div className={styles.botones_borrar}>
                                <button onClick={deleteData}>
                                    <FaTrash size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </dialog>
            )}

            <div className={styles.vista_consultor}>
                <div className={styles.vista_consultor_encabezado}>
                    <div className={styles.encabezado_titulo}>
                      <h1>Mis Horas</h1>
                        <p>Registra y gestiona las horas que trabajas en tus proyectos</p>  
                    </div>
                    <div className={styles.encabezado_imagen}>
                        <div className={styles.encabezado_select}>
                            <Image src={logoEmpresa || Logo} width={50} height={50} alt='logo de la empresa' unoptimized={logoEmpresa ? true : false}/>
                            <select value={proyectoFiltro} onChange={(e) => {
                                setProyectoFiltro(e.target.value);
                                if (e.target.value === '') {
                                    setLogoEmpresa(null);
                                } else {
                                    const proyectoSeleccionado = selectProyectos.find(p => p.id.toString() === e.target.value);
                                    if (proyectoSeleccionado && proyectoSeleccionado.empresas) {
                                        if (proyectoSeleccionado.empresas.logo) {
                                            const pathLogo = proyectoSeleccionado.empresas.logo;
                                            const urlBackend = `http://localhost:8000${pathLogo.startsWith('/') ? '' : '/'}${pathLogo}`;
                                            setLogoEmpresa(urlBackend);
                                        } else {
                                            setLogoEmpresa(null);
                                        }
                                    } else {
                                        setLogoEmpresa(null);
                                    }
                                }   
                            }}>
                                <option value=''>Todos los Proyectos</option>
                                {Array.isArray(selectProyectos) && selectProyectos.map(proj => (
                                    <option key={proj.id} value={proj.id}>{proj.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <Image src={Logo} width={200} height={200} alt='logo de la empresa'/>
                    </div>
                </div>

                <div className={styles.vista_consultor_recuadros}>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(219, 199, 255)'}}>
                            <FaClock size={30} style={{color: 'rgb(166, 118, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>{semanaFiltro ? `Horas (Semana ${semanaFiltro})` : 'Horas esta semana'}</p>
                            <h2>{horasEstaSemana.toFixed(2)}</h2>
                        </div>
                    </div>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(255, 223, 147)'}}>
                            <FaArrowTrendUp size={30} style={{color: 'rgb(255, 128, 37)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Promedio diario</p>
                            <h2>{promedioDiario}</h2>
                        </div>
                    </div>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(186, 191, 255)'}}>
                            <FaBorderAll size={30} style={{color: 'rgb(37, 52, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Total de proyectos</p>
                            <h2>{totalProyectosActivos}</h2>
                        </div>
                    </div>
                </div>

                <div className={styles.vista_consultor_graficas}>
                    <div className={styles.graficas_lineas}>
                        <GraficaHorasSemana 
                            datos={datosFiltrados} 
                            semana={semanaKPI} 
                            semanaFiltro={semanaFiltro} 
                        />
                    </div>
                    <div className={styles.graficas_pastel}>
                        <GraficaHorasProyectosSemana 
                            datos={datosFiltrados} 
                            semana={semanaKPI} 
                            semanaFiltro={semanaFiltro} 
                        />
                    </div>
                </div>

                <div className={styles.vista_consultor_tabla}>
                    <div className={styles.vista_consultor_tabla_encabezado}>
                        <div className={styles.vista_consultor_titulo}>
                             <h1>Registro de mis horas</h1>
                        </div>
                        <div className={styles.vista_consultor_acciones}>
                            
                            <div className={styles.acciones_select}>
                                <label>
                                    Semana:
                                    <select value={semanaFiltro} onChange={(e) => setSemanaFiltro(e.target.value)}>
                                        <option value="">Todas</option>
                                        {semanasDisponibles.map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            
                            <div className={styles.acciones_input}>
                                <input 
                                    placeholder='Buscar...' 
                                    value={busqueda} 
                                    onChange={(e) => setBusqueda(e.target.value)} 
                                />
                            </div>

                            <div className={styles.acciones_boton}>
                                <button onClick={() => { 
                                    setModalAbierto(true)                                       
                                }}><FaPlus style={{display: 'inline', marginRight: '2%'}}/>Registrar horas</button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.tabla}>
                        <table>
                            <thead>
                                <tr>
                                    <th>N°Factura</th>
                                    <th>Proyecto</th>
                                    <th>Empresa</th>
                                    <th>Semana</th>
                                    <th>Fecha</th>
                                    <th>Horas</th>
                                    <th>Descripcion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosFiltrados.map(obj => (
                                    <tr 
                                        key={obj.id} 
                                        onClick={() => abrirEditarRegistro(obj)} 
                                        style={{cursor: 'pointer', transition: 'background-color 0.2s'}} 
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'} 
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td><p>{obj.proyecto?.numero_factura || 'N/A'}</p></td>
                                        <td style={{fontWeight: '600'}}>{obj.proyecto?.nombre}</td>
                                        <td>{obj.proyecto?.empresas?.nombre}</td>
                                        <td>{obj.semana}</td>
                                        {/* LA TABLA YA ESTÁ RENDERIZANDO obj.fecha_actual AQUÍ */}
                                        <td>{obj.fecha_actual}</td>
                                        <td style={{fontWeight: '600'}}>{obj.horas}</td>
                                        <td>{obj.descripcion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table> 
                    </div>
                    
                </div>
            </div>
        </>
    )
}