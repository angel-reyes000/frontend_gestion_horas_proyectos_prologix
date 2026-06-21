"use client"

import styles from '../../styles/prologix_usuarios/prologix_vista_usuarios.module.scss';
import { FaClock, FaArrowTrendUp, FaBorderAll, FaExclamationTriangle } from "react-icons/fa";
import { FaPlus, FaTrash } from "react-icons/fa";
import Image from 'next/image';
import Logo from '../../public/logo.png';
import GraficaHorasSemana from '../components/consultor_grafica_horas_semana';
import PieChart from '../components/consultor_piechart';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AOS from "aos";
import "aos/dist/aos.css";

export default function PrologixConsultor () {
    const router = useRouter();

    const [data, setData] = useState([]);
    const [selectProyectos, setSelectProyectos] = useState([]);
    const [empresa, setEmpresa] = useState('');
    const [proyecto, setProyecto] = useState('');
    const [semana, setSemana] = useState('');
    const [horas, setHoras] = useState(0);
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [registroEditando, setRegistroEditando] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [proyectoFiltro, setProyectoFiltro] = useState('');
    const [logoEmpresa, setLogoEmpresa] = useState(null);
    
    const [semanaFiltro, setSemanaFiltro] = useState('');
    const [busqueda, setBusqueda] = useState('');

    // --- NUEVOS ESTADOS Y REFERENCIAS PARA ALERTAS ---
    const [alertaModal, setAlertaModal] = useState({ abierto: false, titulo: '', mensaje: '', tipo: 'error', redirigir: false });
    const refModalAdd = useRef(null);
    const refAlerta = useRef(null);

    // Inicializar AOS
    useEffect(() => {
        AOS.init({ duration: 500 });
    }, []);

    // Control del modal de alertas
    useEffect(() => {
        if (alertaModal.abierto && refAlerta.current && !refAlerta.current.open) {
            refAlerta.current.showModal();
        } else if (!alertaModal.abierto && refAlerta.current && refAlerta.current.open) {
            refAlerta.current.close();
        }
    }, [alertaModal.abierto]);

    const mostrarAlerta = (titulo, mensaje, tipo = 'error', redirigir = false) => {
        setAlertaModal({ abierto: true, titulo, mensaje, tipo, redirigir });
    };

    const cerrarAlerta = () => {
        setAlertaModal({ ...alertaModal, abierto: false });
        if (alertaModal.redirigir) {
            localStorage.removeItem('access');
            router.push('/login');
        }
    };

    const manejarErroresPeticion = async (response) => {
        if (response.status === 401 || response.status === 403) {
            mostrarAlerta('Sesión caducada', 'Tu sesión ha terminado o el acceso es inválido. Serás redirigido al inicio de sesión.', 'error', true);
            return true;
        }
        if (!response.ok) {
            let errorMsg = `Error en la petición HTTP (${response.status})`;
            try {
                const errorData = await response.json();
                errorMsg = JSON.stringify(errorData);
            } catch (e) {
                const textData = await response.text();
                errorMsg = textData.substring(0, 100);
            }
            mostrarAlerta('Error en la petición', `Detalles: ${errorMsg}`, 'error');
            return true;
        }
        return false;
    };

    // Validaciones base de datos (Django Models)
    const validarCampos = () => {
        if (!proyecto || !horas || !descripcion || !fecha) {
            mostrarAlerta('Campos faltantes', 'Por favor completa todos los campos (Proyecto, Empresa, Horas, Fecha, Descripción).', 'error');
            return false;
        }
        const parsedHoras = parseFloat(horas);
        if (isNaN(parsedHoras) || parsedHoras <= 0 || parsedHoras >= 100) {
            mostrarAlerta('Campos inválidos', 'Las horas deben ser mayores a 0 y menores a 100 (máximo 4 dígitos).', 'error');
            return false;
        }
        if (!/^\d+(\.\d{1,2})?$/.test(horas.toString())) {
            mostrarAlerta('Campos inválidos', 'El formato de horas admite un máximo de 2 decimales.', 'error');
            return false;
        }
        const proyectoSeleccionado = selectProyectos.find(p => p.nombre === proyecto);
        if (!proyectoSeleccionado) {
            mostrarAlerta('Campos inválidos', 'Selecciona un proyecto válido.', 'error');
            return false;
        }
        return proyectoSeleccionado;
    };

    useEffect(() => {
        const token = localStorage.getItem('access');

        if (!token) {
            mostrarAlerta('Acceso inválido', 'No hay un token de sesión disponible. Por favor, inicia sesión.', 'error', true);
            return;
        }

        getDataRegistros();

        async function getDataProyectos () {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/proyectos/`, {
                    method: 'GET',
                    headers: {
                        'content-type' : 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });

                if (await manejarErroresPeticion(response)) return;

                const datos = await response.json();
                setSelectProyectos(datos);
            } catch (error) {
                mostrarAlerta('Error de red', 'No se pudo conectar con el servidor para obtener los proyectos.', 'error');
            }
        }

        getDataProyectos();
    }, []);

    useEffect(() => {
        if (proyecto && selectProyectos.length > 0) {
            const proyectoSeleccionado = selectProyectos.find(p => p.nombre === proyecto);
            if (proyectoSeleccionado && proyectoSeleccionado.empresas) {
                setEmpresa(proyectoSeleccionado.empresas.nombre);
            }
        }
    }, [proyecto, selectProyectos]);

    useEffect(() => {
        if (modalAbierto && refModalAdd.current && !refModalAdd.current.open) {
            refModalAdd.current.showModal();
        }
    }, [modalAbierto]);

    async function postData() {
        const proyectoSeleccionado = validarCampos();
        if (!proyectoSeleccionado) return;

        const token = localStorage.getItem('access');
        const datosEnvio = {
            horas: parseFloat(horas),
            proyecto_id: proyectoSeleccionado.id,
            descripcion: descripcion,
            fecha_actual: fecha
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/registros/`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(datosEnvio)
            });

            if (await manejarErroresPeticion(response)) return;

            if (response.status === 201) {
                setMensaje('Registro creado exitosamente');
                resetearFormulario();
                setModalAbierto(false); 
                getDataRegistros();
            } else {
                mostrarAlerta('Error general', `No se pudo crear el registro. Código HTTP: ${response.status}`, 'error');
            }
        } catch (error) {
            mostrarAlerta('Error de red', `Hubo un problema de conexión: ${error.message}`, 'error');
        }
    }

    async function putData() {
        if (!semana) {
            mostrarAlerta('Campos faltantes', 'La semana es obligatoria para actualizar.', 'error');
            return;
        }
        
        const proyectoSeleccionado = validarCampos();
        if (!proyectoSeleccionado) return;

        const token = localStorage.getItem('access');
        const datosEnvio = {
            horas: parseFloat(horas),
            proyecto_id: proyectoSeleccionado.id,
            descripcion: descripcion,
            fecha_actual: fecha
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/registros/${registroEditando.id}/`, {
                method: 'PUT',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(datosEnvio)
            });

            if (await manejarErroresPeticion(response)) return;

            if (response.status === 200) {
                setMensaje('Registro actualizado exitosamente');
                resetearFormulario();
                setModalAbierto(false); 
                getDataRegistros();
            } else {
                mostrarAlerta('Error general', `No se pudo actualizar el registro. Código HTTP: ${response.status}`, 'error');
            }
        } catch (error) {
            mostrarAlerta('Error de red', `Hubo un problema de conexión al actualizar: ${error.message}`, 'error');
        }
    }

    async function deleteData() {
        if (!registroEditando) return;
        
        const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este registro?");
        if (!confirmar) return;

        const token = localStorage.getItem('access');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/registros/${registroEditando.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (await manejarErroresPeticion(response)) return;

            if (response.status === 204 || response.status === 200) {
                setMensaje('Registro eliminado exitosamente');
                resetearFormulario();
                setModalAbierto(false); 
                getDataRegistros();
            } else {
                mostrarAlerta('Error al eliminar', `Ocurrió un error inesperado al intentar borrar el registro (${response.status})`, 'error');
            }
        } catch (error) {
            mostrarAlerta('Error de red', `No se pudo conectar al servidor para eliminar: ${error.message}`, 'error');
        }
    }

    function resetearFormulario() {
        setProyecto('');
        setEmpresa('');
        setSemana('');
        setHoras(0);
        setDescripcion('');
        setFecha(''); 
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
        setFecha(registro.fecha_actual || ''); 
        setModalAbierto(true);
    }

    async function getDataRegistros() {
        const token = localStorage.getItem('access');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/registros/`, {
                method: 'GET',
                headers: {
                    'content-type' : 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (await manejarErroresPeticion(response)) return;

            const datos = await response.json();
            setData(datos);
        } catch (error) {
            mostrarAlerta('Error de red', `No se pudieron cargar los registros: ${error.message}`, 'error');
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
            {/* Modal para Errores / Validaciones usando 'styles.' */}
            <dialog ref={refAlerta} className={styles.dialog_alerta}>
                <div className={styles.alerta_contenido} data-aos="zoom-in">
                    <div className={styles.alerta_icono}>
                        <FaExclamationTriangle size={45} color={alertaModal.tipo === 'error' ? '#ef4444' : '#f59e0b'} />
                    </div>
                    <div className={styles.alerta_textos}>
                        <h2>{alertaModal.titulo}</h2>
                        <p>{alertaModal.mensaje}</p>
                    </div>
                    <button className={styles.alerta_boton} onClick={cerrarAlerta}>
                        Entendido
                    </button>
                </div>
            </dialog>

            {/* Modal para Agregar/Editar Registro */}
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
                            setModalAbierto(false);
                            resetearFormulario();
                        }}>x</button>
                    </div>
                    {mensaje && <div style={{padding: '10px', margin: '10px', backgroundColor: '#e2f5e8', borderRadius: '4px', color: '#145c32'}}>{mensaje}</div>}
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
                            <input type="number" step="0.01" min="0" max="99.99" value={horas} onChange={(e) => setHoras(e.target.value)} />
                        </label>   
                        <label>
                            Fecha
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
                            <label>
                                Mostrar por:
                                <select value={proyectoFiltro} onChange={(e) => {
                                    setProyectoFiltro(e.target.value);
                                    if (e.target.value === '') {
                                        setLogoEmpresa(null);
                                    } else {
                                        const proyectoSeleccionado = selectProyectos.find(p => p.id.toString() === e.target.value);
                                        if (proyectoSeleccionado && proyectoSeleccionado.empresas) {
                                            if (proyectoSeleccionado.empresas.logo) {
                                                const pathLogo = proyectoSeleccionado.empresas.logo;
                                                const urlBackend = `${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}${pathLogo.startsWith('/') ? '' : '/'}${pathLogo}`;
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
                            </label>
                        </div>
                        <div className={styles.encabezado_logos}>
                            <Image src={logoEmpresa || Logo} width={200} height={200} alt='logo de la empresa' unoptimized={logoEmpresa ? true : false}/>
                            <Image src={Logo} width={120} height={120} alt='logo de la empresa'/>
                        </div>                        
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
                        <PieChart 
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