"use client"

import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";

export default function Administradores() {
    const router = useRouter();
    
    // 1. Estado para validar la autorización
    const [autorizado, setAutorizado] = useState(false);

    // Estados para Alertas Globales
    const alertRef = useRef(null);
    const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', tipo: '' });

    // 2. Efecto para verificar el rol ANTES de mostrar la pantalla e inicializar AOS
    useEffect(() => {
        AOS.init({ duration: 500, once: true });

        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            router.replace('/login');
        } else {
            setAutorizado(true);
        }
    }, [router]);

    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    
    // Estados para el Modal y CRUD
    const dialogRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false); 
    const [modalMode, setModalMode] = useState('create');
    const [formData, setFormData] = useState({
        id: null,
        nombre: '', 
        email: '',  
        username: '',
        password: '',
        is_active: true
    });

    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : '';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Función para mostrar alertas y superponer sobre el dialog existente
    const mostrarAlerta = (titulo, mensaje, tipo = 'error') => {
        setAlerta({ visible: true, titulo, mensaje, tipo });
        setTimeout(() => {
            if (alertRef.current && !alertRef.current.open) {
                alertRef.current.showModal();
            }
        }, 10);
    };

    const cerrarAlerta = () => {
        setAlerta({ ...alerta, visible: false });
        if (alertRef.current) alertRef.current.close();
    };

    // Función centralizada para manejar la respuesta del backend
    const validarRespuestaBackend = async (response) => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                mostrarAlerta("Sesión caducada / Acceso inválido", "Tu sesión ha terminado o no tienes permisos. Serás redirigido al login.", "error");
                localStorage.removeItem('access');
                localStorage.removeItem('rol_usuario');
                setTimeout(() => { router.replace('/login'); }, 3000);
                throw new Error("HTTP_401_403");
            }
            if (response.status === 400) {
                let errorMsg = "Los datos enviados no son válidos.";
                try {
                    const errorData = await response.json();
                    errorMsg = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
                } catch (e) {}
                mostrarAlerta("Error en la petición (Campos inválidos)", errorMsg, "error");
                throw new Error("HTTP_400");
            }
            if (response.status >= 500) {
                mostrarAlerta("Error general del servidor", "Ocurrió un problema en el backend.", "error");
                throw new Error("HTTP_500");
            }
            mostrarAlerta("Error desconocido", `Ocurrió un error inesperado (Status: ${response.status}).`, "error");
            throw new Error("HTTP_UNKNOWN");
        }
        return response;
    };

    // Atrapa errores de red (cuando ni siquiera llega al backend)
    const manejarErrorCatch = (error) => {
        if (error.message.includes("HTTP_")) return; // Ya fue manejado arriba
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            mostrarAlerta("Error de red", "No se pudo conectar con el servidor. Verifica tu conexión a internet.", "error");
        } else {
            mostrarAlerta("Error", error.message || "Ha ocurrido un error inesperado.", "error");
        }
    };

    // 1. Obtener Datos Iniciales
    const fetchData = async () => {
        try {
            const grupo = 'administrador';
            const resUsers = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users?grupo=${grupo}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            await validarRespuestaBackend(resUsers);
            const jsonData = await resUsers.json();
            setData(jsonData);

        } catch (error) {
            manejarErrorCatch(error);
        }
    };

    useEffect(() => {
        if (autorizado) {
            fetchData();
        }
    }, [autorizado]); 

    // 2. Filtro de Búsqueda
    const filteredData = data.filter((obj) => {
        const termino = search.toLowerCase();
        
        const usuarioStr = (obj.username || obj.email || `Administrador ${obj.id}`).toLowerCase();
        const estadoStr = obj.is_active ? 'activo' : 'inactivo';
        const fechaStr = obj.date_joined ? obj.date_joined.split('T')[0] : 'sin fecha';

        return usuarioStr.includes(termino) || 
               estadoStr.includes(termino) || 
               fechaStr.includes(termino);
    });

    // 3. Manejo del Formulario y Modal
    const abrirModalCrear = () => {
        setModalMode('create');
        setFormData({ id: null, nombre: '', email: '', username: '', password: '', is_active: true });
        setIsOpen(true); 
        dialogRef.current?.showModal();
    };

    const abrirModalEditar = (user) => {
        setModalMode('edit');
        setFormData({
            id: user.id,
            nombre: user.first_name || user.nombre || '', 
            email: user.email || '',                      
            username: user.username,
            password: '', 
            is_active: user.is_active
        });
        setIsOpen(true);
        dialogRef.current?.showModal();
    };

    const cerrarModal = () => {
        setIsOpen(false); 
        dialogRef.current?.close();
    };

    // Validaciones del Frontend
    const validarCamposFrontend = () => {
        if (!formData.nombre || !formData.email || !formData.username) {
            mostrarAlerta("Error de campos faltantes", "Los campos Nombre, Email y Usuario son obligatorios.", "error");
            return false;
        }
        if (modalMode === 'create' && !formData.password) {
            mostrarAlerta("Error de campos faltantes", "La contraseña es obligatoria para un nuevo usuario.", "error");
            return false;
        }
        // Validación basada en longitud máxima (como en los modelos de Django charfield 50/150)
        if (formData.nombre.length > 50) {
            mostrarAlerta("Error de campos inválidos", "El nombre excede el límite de 50 caracteres.", "error");
            return false;
        }
        if (formData.username.length > 150) {
            mostrarAlerta("Error de campos inválidos", "El nombre de usuario excede el límite de 150 caracteres.", "error");
            return false;
        }
        // Validación de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            mostrarAlerta("Error de campos inválidos", "Por favor ingresa un correo electrónico válido.", "error");
            return false;
        }
        return true;
    };

    // 4. Funciones CRUD
    const handleGuardar = async () => {
        if (!validarCamposFrontend()) return;

        try {
            const url = modalMode === 'create' 
                ? `${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users/` 
                : `${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users/${formData.id}/`;
            
            const method = modalMode === 'create' ? 'POST' : 'PUT'; 

            const payload = {
                first_name: formData.nombre, 
                nombre: formData.nombre,     
                email: formData.email,       
                username: formData.username,
                is_active: formData.is_active,
                grupos: ['administrador']
            };

            if (formData.password) payload.password = formData.password;

            const response = await fetch(url, { method, headers, body: JSON.stringify(payload) });

            await validarRespuestaBackend(response);
            
            cerrarModal();
            fetchData(); 
            
        } catch (error) {
            manejarErrorCatch(error);
        }
    };

    const handleEliminar = async () => {
        if (!formData.id) return;
        const confirmacion = window.confirm("¿Estás seguro de eliminar este registro?");
        if (!confirmacion) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users/${formData.id}/`, {
                method: 'DELETE',
                headers
            });

            await validarRespuestaBackend(response);
            
            cerrarModal();
            fetchData();
        } catch (error) {
            manejarErrorCatch(error);
        }
    };

    if (!autorizado) {
        return null;
    }

    return (
        <>
            {/* MODAL DE ALERTAS / VALIDACIONES */}
            <dialog 
                ref={alertRef} 
                className={styles.dialog_alerta}
                style={{ display: alerta.visible ? '' : 'none' }}
            >
                {alerta.visible && (
                    <div className={styles.alerta_contenido} data-aos="zoom-in" data-aos-duration="300">
                        <div className={styles.alerta_icono}>
                            <FaExclamationCircle size={40} color="#e74c3c" />
                        </div>
                        <div className={styles.alerta_textos}>
                            <h2>{alerta.titulo}</h2>
                            <p>{alerta.mensaje}</p>
                        </div>
                        <button className={styles.alerta_boton} onClick={cerrarAlerta}>
                            Entendido
                        </button>
                    </div>
                )}
            </dialog>

            {/* MODAL DEL FORMULARIO ORIGINAL */}
            <dialog 
                ref={dialogRef} 
                className={styles.dialog} 
                style={{ display: isOpen ? '' : 'none' }}
            >
                <div className={styles.dialog_encabezado}>
                    <div className={styles.dialog_titulo}>
                        <h1>{modalMode === 'create' ? 'Añadir registro' : 'Editar registro'}</h1>
                        <p>Completa la información requerida en el formulario.</p>
                    </div>
                    <div className={styles.dialog_boton}>
                        <button onClick={cerrarModal}>x</button>
                    </div>
                </div>                  
                
                <div className={styles.dialog_inputs}>
                    <label>
                        Nombre:
                        <input 
                            placeholder="Nombre..." 
                            value={formData.nombre}
                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        />
                    </label>
                    <label>
                        Email:
                        <input 
                            type='email' 
                            placeholder="Email..." 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </label>  
                    <label>
                        Usuario:
                        <input 
                            placeholder="Nombre de usuario..." 
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </label> 
                    <label>
                        Contraseña:
                        <input 
                            type="password"
                            placeholder={modalMode === 'edit' ? "Dejar en blanco para no cambiar..." : "Contraseña..."} 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </label>
                    
                    <label>
                        Estado:
                        <select 
                            value={formData.is_active ? 'Activo' : 'Inactivo'}
                            onChange={(e) => setFormData({...formData, is_active: e.target.value === 'Activo'})}
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </label>                       
                </div>

                <div className={styles.dialog_botones}>
                    <div className={styles.botones_guardar_cancelar}>
                        <button onClick={cerrarModal} style={{color: 'gray', border: '1px solid gray'}}>Cancelar</button>
                        <button onClick={handleGuardar} style={{backgroundColor: '#2563eb', color: 'white'}}>Guardar</button>
                    </div>
                    {modalMode === 'edit' && (
                        <div className={styles.botones_borrar}>
                            <button onClick={handleEliminar}>
                                <FaTrash size={20} />
                            </button>
                        </div>                     
                    )}
                </div>
            </dialog>

            <div className={styles.vista_completa}>
                <div className={styles.vista_volver}>
                    <p onClick={() => router.push('/prologix_admin/usuarios_y_permisos')} style={{cursor: 'pointer'}}>{'< '}Volver</p>
                </div>
                <div className={styles.vista_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Administradores</h1>
                        <p>Administra administradores registrados.</p>
                    </div>
                    <div className={styles.encabezado_boton}>
                        <button onClick={abrirModalCrear}>
                            <FaPlus style={{marginRight: '2%'}} />
                            Añadir registro
                        </button>
                    </div>
                </div>
                
                <div className={styles.vista_tabla}>
                    <div className={styles.vista_tabla_input}>
                        <FaSearch />
                        <input 
                            placeholder="Buscar..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <table className={styles.tabla}>
                        <thead>
                            <tr>
                                <td>Usuario</td>
                                <td>Estado</td>
                                <td>Fecha ingreso</td>                                
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((obj, index) => {
                                const isActive = obj.is_active;
                                const fechaIngreso = obj.date_joined ? obj.date_joined.split('T')[0] : 'Sin fecha';

                                return (
                                    <tr 
                                        key={obj.id || index} 
                                        onClick={() => abrirModalEditar(obj)} 
                                        style={{cursor: 'pointer'}}
                                        title="Haz clic para editar"
                                    >
                                        <td>{obj.username || obj.email || `Administrador ${obj.id}`}</td>
                                        <td>
                                            <span className={isActive ? styles.activo : styles.inactivo}>
                                                {isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>{fechaIngreso}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}