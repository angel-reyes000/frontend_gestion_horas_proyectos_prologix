"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash } from 'react-icons/fa';

export default function Proyectos() {
    const router = useRouter();

    // 1. NUEVO: Estado para validar la autorización
    const [autorizado, setAutorizado] = useState(false);

    // 2. NUEVO: Efecto para verificar el rol ANTES de mostrar la pantalla
    useEffect(() => {
        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            // Si no es admin, lo redirigimos al login
            router.replace('/login');
        } else {
            // Si es admin, le permitimos ver la pantalla
            setAutorizado(true);
        }
    }, [router]);

    const [data, setData] = useState([]);
    const [empresasList, setEmpresasList] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    
    // Estados del formulario
    const [currentId, setCurrentId] = useState(null);
    const [empresa, setEmpresa] = useState('');
    const [proyecto, setProyecto] = useState('');
    const [descripcion, setDescripcion] = useState('');

    // Estados de control
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const refModal = useRef(null);

    useEffect(() => {
        // Solo llamamos a la API si el usuario está autorizado
        if (autorizado) {
            const token = localStorage.getItem('access');
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            };

            async function fetchData() {
                try {
                    // Fetch Proyectos
                    const resProyectos = await fetch('http://localhost:8000/api/proyectos/', { headers });
                    if (resProyectos.status === 200) {
                        const datosProyectos = await resProyectos.json();
                        setData(datosProyectos);
                        setFilteredData(datosProyectos);
                    } else {
                        console.log("Error al cargar proyectos");
                    }

                    // Fetch Empresas para el select
                    const resEmpresas = await fetch('http://localhost:8000/api/empresas/', { headers });
                    if (resEmpresas.status === 200) {
                        const datosEmpresas = await resEmpresas.json();
                        setEmpresasList(datosEmpresas);
                    } else {
                        console.log("Error al cargar empresas");
                    }
                } catch (error) {
                    console.log("Error en fetch: ", error.message);
                }
            }

            fetchData();
        }
    }, [autorizado]); // Dependencia agregada para que se ejecute al confirmar autorización

    // Filtro de búsqueda global
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
        // Validación: Que no se repita el nombre del proyecto
        const nombreDuplicado = data.some(
            item => item.nombre.toLowerCase() === proyecto.toLowerCase() && item.id !== currentId
        );

        if (nombreDuplicado) {
            alert("Ya existe un proyecto registrado con ese nombre.");
            return;
        }

        // Validación: Asegurarse de que se seleccionó una empresa
        if (!empresa) {
            alert("Por favor, selecciona una empresa.");
            return;
        }

        try {
            const token = localStorage.getItem('access');
            
            // CORRECCIÓN: Cambiamos 'empresa_id' a 'empresas' para coincidir con tu modelo
            const payload = {
                nombre: proyecto,
                empresas: parseInt(empresa), 
                descripcion: descripcion
            };

            if (isEditMode) {
                payload.id = currentId; // Se envía el ID por body
            }

            const response = await fetch('http://localhost:8000/api/proyectos/', {
                method: isEditMode ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (response.ok || response.status === 201) {
                const datosGuardados = await response.json();
                if (isEditMode) {
                    setData(data.map(item => item.id === currentId ? datosGuardados : item));
                } else {
                    setData([...data, datosGuardados]);
                }
                closeModal();
            } else {
                console.log("No se pudo guardar el registro. Código de estado:", response.status);
                
                // Manejo seguro por si Django devuelve un HTML (Error 500) en lugar de JSON
                const textData = await response.text();
                try {
                    const errorJson = JSON.parse(textData);
                    console.error("Detalles del error (JSON):", errorJson);
                } catch (e) {
                    console.error("El servidor devolvió un error 500 (HTML). Revisa la terminal donde estás corriendo tu backend (Django) para ver la línea exacta que está fallando.");
                }
            }
        } catch (error) {
            console.log("Error de red o ejecución: ", error.message);
        }
    }

    async function handleDelete() {
        const confirmar = window.confirm("¿Estás seguro de eliminar este registro?");
        if (!confirmar) return;

        try {
            const token = localStorage.getItem('access');
            const response = await fetch('http://localhost:8000/api/proyectos/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id: currentId }), // Se envía el ID por body
            });

            if (response.ok) {
                setData(data.filter(item => item.id !== currentId));
                closeModal();
            } else {
                console.log("No se pudo eliminar el registro");
            }
        } catch (error) {
            console.log("Error al eliminar: ", error.message);
        }
    }

    // 3. NUEVO: Si no está autorizado, devolvemos null para evitar parpadeos visuales
    if (!autorizado) {
        return null;
    }

    function modalAdd() {
        return (
            <>
                {/* Agregado display condicional para arreglar el error del modal flotante transparente */}
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
                            <input value={proyecto} onChange={(e) => setProyecto(e.target.value)} placeholder='Nombre del proyecto'/>
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