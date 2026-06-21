"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash, FaExclamationCircle } from 'react-icons/fa';

// Importaciones de AOS requeridas
import AOS from "aos";
import "aos/dist/aos.css";

export default function Proyectos() {
    const router = useRouter();

    const [autorizado, setAutorizado] = useState(false);

    // Inicializar AOS
    useEffect(() => {
        AOS.init({ duration: 300 });
    }, []);

    useEffect(() => {
        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            router.replace('/login');
        } else {
            setAutorizado(true);
        }
    }, [router]);

    const [data, setData] = useState([]);
    const [empresasList, setEmpresasList] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    
    const [currentId, setCurrentId] = useState(null);
    const [empresa, setEmpresa] = useState('');
    const [proyecto, setProyecto] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const refModal = useRef(null);

    // NUEVO: Estado y Ref para las Alertas (Validaciones)
    const alertModalRef = useRef(null);
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        redirectMode: false
    });

    const showAlert = (title, message, redirectMode = false) => {
        setAlertConfig({ isOpen: true, title, message, redirectMode });
        setTimeout(() => alertModalRef.current?.showModal(), 10);
    };

    const closeAlert = () => {
        alertModalRef.current?.close();
        setAlertConfig({ ...alertConfig, isOpen: false });
        if (alertConfig.redirectMode) {
            localStorage.clear();
            router.replace('/login');
        }
    };

    // Manejo de errores genérico en las respuestas HTTP
    const handleApiResponseErrors = async (response) => {
        if (response.status === 401 || response.status === 403) {
            showAlert("Sesión caducada", "Tu sesión ha expirado o el acceso es inválido. Por favor, inicia sesión nuevamente.", true);
            return true;
        }
        if (response.status === 400) {
            const textData = await response.text();
            try {
                const errorJson = JSON.parse(textData);
                const errorMsg = Object.entries(errorJson).map(([k, v]) => `${k}: ${v}`).join(', ');
                showAlert("Campos inválidos", `Error en los datos enviados: ${errorMsg}`);
            } catch {
                showAlert("Campos inválidos", "Verifica la información de los campos enviados e inténtalo de nuevo.");
            }
            return true;
        }
        if (!response.ok) {
            showAlert("Error en la petición", `Ocurrió un problema inesperado (Código: ${response.status}). Inténtalo de nuevo más tarde.`);
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (autorizado) {
            const token = localStorage.getItem('access');
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            };

            async function fetchData() {
                try {
                    const resProyectos = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/proyectos/`, { headers });
                    
                    if (await handleApiResponseErrors(resProyectos)) return;

                    const datosProyectos = await resProyectos.json();
                    setData(datosProyectos);
                    setFilteredData(datosProyectos);

                    const resEmpresas = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/empresas/`, { headers });
                    
                    if (await handleApiResponseErrors(resEmpresas)) return;

                    const datosEmpresas = await resEmpresas.json();
                    setEmpresasList(datosEmpresas);
                    
                } catch (error) {
                    showAlert("Error de red", "No se pudo conectar con el servidor. Verifica tu conexión a internet.");
                }
            }

            fetchData();
        }
    }, [autorizado]); 

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const resultados = data.filter(item => 
            item.nombre?.toLowerCase().includes(query) ||
            item.empresas?.nombre?.toLowerCase().includes(query) ||
            item.fecha_registro?.toLowerCase().includes(query) ||
            item.descripcion?.toLowerCase().includes(query)
        );
        setFilteredData(resultados);
    }, [searchQuery, data]);

    const openAddModal = () => {
        setIsEditMode(false);
        setCurrentId(null);
        setEmpresa('');
        setProyecto('');
        setDescripcion('');
        setIsModalOpen(true);
        setTimeout(() => refModal.current?.showModal(), 10);
    };

    const openEditModal = (obj) => {
        setIsEditMode(true);
        setCurrentId(obj.id);
        setEmpresa(obj.empresas?.id || ''); 
        setProyecto(obj.nombre);
        setDescripcion(obj.descripcion || '');
        setIsModalOpen(true);
        setTimeout(() => refModal.current?.showModal(), 10);
    };

    const closeModal = () => {
        refModal.current?.close();
        setIsModalOpen(false);
        setCurrentId(null);
    };

    async function handleSave() {
        // Validaciones del Frontend basadas en el modelo de Django
        if (!empresa) {
            showAlert("Campos faltantes", "Por favor, selecciona una empresa para el proyecto.");
            return;
        }

        if (!proyecto || proyecto.trim() === '') {
            showAlert("Campos faltantes", "El nombre del proyecto es obligatorio.");
            return;
        }

        if (proyecto.length > 50) {
            showAlert("Campos inválidos", `El nombre del proyecto no puede exceder los 50 caracteres. Actual: ${proyecto.length}`);
            return;
        }

        if (!descripcion || descripcion.trim() === '') {
            showAlert("Campos faltantes", "La descripción del proyecto es obligatoria.");
            return;
        }

        const nombreDuplicado = data.some(
            item => item.nombre.toLowerCase() === proyecto.trim().toLowerCase() && item.id !== currentId
        );

        if (nombreDuplicado) {
            showAlert("Campos inválidos", "Ya existe un proyecto registrado con ese nombre.");
            return;
        }

        try {
            const token = localStorage.getItem('access');
            
            const payload = {
                nombre: proyecto.trim(),
                empresas: parseInt(empresa), 
                descripcion: descripcion.trim()
            };

            if (isEditMode) {
                payload.id = currentId;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/proyectos/`, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (await handleApiResponseErrors(response)) return;

            const datosGuardados = await response.json();
            if (isEditMode) {
                setData(data.map(item => item.id === currentId ? datosGuardados : item));
            } else {
                setData([...data, datosGuardados]);
            }
            closeModal();
            
        } catch (error) {
            showAlert("Error de red", "No se pudo completar la operación debido a un problema de conexión.");
        }
    }

    async function handleDelete() {
        const confirmar = window.confirm("¿Estás seguro de eliminar este registro?");
        if (!confirmar) return;

        try {
            const token = localStorage.getItem('access');
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/proyectos/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id: currentId }),
            });

            if (await handleApiResponseErrors(response)) return;

            setData(data.filter(item => item.id !== currentId));
            closeModal();
            
        } catch (error) {
            showAlert("Error de red", "Ocurrió un error al intentar eliminar el registro.");
        }
    }

    if (!autorizado) {
        return null;
    }

    // Modal para mostrar errores
    function modalAlert() {
        return (
            <dialog ref={alertModalRef} className={styles.dialog_alerta} style={{ display: alertConfig.isOpen ? 'block' : 'none' }}>
                <div className={styles.alerta_contenido} data-aos="zoom-in">
                    <div className={styles.alerta_icono}>
                        <FaExclamationCircle size={50} color="#dc2626" />
                    </div>
                    <div className={styles.alerta_textos}>
                        <h2>{alertConfig.title}</h2>
                        <p>{alertConfig.message}</p>
                    </div>
                    <button className={styles.alerta_boton} onClick={closeAlert}>Aceptar</button>
                </div>
            </dialog>
        );
    }

    function modalAdd() {
        return (
            <>
                <dialog ref={refModal} className={styles.dialog} style={{ display: isModalOpen ? 'block' : 'none' }}>
                    <div className={styles.dialog_encabezado}>
                        <div className={styles.dialog_titulo}>
                            <h1>{isEditMode ? 'Editar registro' : 'Añadir registro'}</h1>
                            <p>Completa la información requerida en el formulario.</p>
                        </div>
                        <div className={styles.dialog_boton}>
                            <button onClick={closeModal}>x</button>
                        </div>
                    </div>                    
                    <div className={styles.dialog_inputs}>
                        <label>
                            Nombre del proyecto:
                            <input value={proyecto} onChange={(e) => setProyecto(e.target.value)} placeholder='Nombre del proyecto' maxLength={50}/>
                        </label> 
                        <label>
                            Nombre de la empresa:
                            <select value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
                                <option value="" disabled>Seleccione una empresa</option>
                                {empresasList.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                                ))}
                            </select>
                        </label> 
                        <label className={styles.label_textarea}>
                            Descripción:
                            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder='Descripción'/>
                        </label>               
                    </div>
                    <div className={styles.dialog_botones}>
                        <div className={styles.botones_guardar_cancelar}>
                            <button onClick={closeModal} style={{color: 'gray', border: '1px solid gray'}}>Cancelar</button>
                            <button onClick={handleSave} style={{backgroundColor: '#2563eb', color: 'white'}}>Guardar</button>
                        </div>
                        {isEditMode && (
                            <div className={styles.botones_borrar}>
                                <button onClick={handleDelete}><FaTrash size={20}/></button>
                            </div>
                        )}
                    </div>
                </dialog>
            </>
        )
    }

    return (
        <>  
            {modalAlert()}
            {modalAdd()}
            <div className={styles.vista_completa}>
                <div className={styles.vista_volver}>
                    <p onClick={() => router.push('/prologix_admin/usuarios_y_permisos')} style={{cursor: 'pointer'}}>{'< '}Volver</p>
                </div>
                <div className={styles.vista_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Proyectos</h1>
                        <p>Administra proyectos registrados.</p>
                    </div>
                    <div className={styles.encabezado_boton}>
                        <button onClick={openAddModal}><FaPlus style={{marginRight: '2%'}}/>Añadir registro</button>
                    </div>
                </div>
                <div className={styles.vista_tabla}>
                    <div className={styles.vista_tabla_input}>
                        <FaSearch />
                        <input 
                            placeholder="Buscar..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <table className={styles.tabla}>
                        <thead>
                            <tr>
                                <td>Empresa</td>
                                <td>Proyecto</td>
                                <td>Fecha inicio</td>
                                <td>Descripcion</td>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(obj => (
                                <tr key={obj.id} onClick={() => openEditModal(obj)} style={{ cursor: 'pointer' }}>
                                    <td>{obj.empresas?.nombre || ''}</td>
                                    <td>{obj.nombre}</td>
                                    <td>{obj.fecha_registro}</td>
                                    <td>{obj.descripcion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}