"use client"

import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";

export default function AuxiliaresVista() {
    const router = useRouter();
    
    // 1. Estado para validar la autorización
    const [autorizado, setAutorizado] = useState(false);

    // 2. Efecto para verificar el rol ANTES de mostrar la pantalla e inicializar AOS
    useEffect(() => {
        AOS.init({ duration: 400 }); // Inicializamos las animaciones

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

    // Estado y Ref para el Modal de Alertas/Validaciones
    const alertRef = useRef(null);
    const [alertData, setAlertData] = useState({
        show: false,
        titulo: '',
        mensaje: '',
        accion: null
    });

    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : '';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // --- FUNCIONES DE ALERTA Y VALIDACIÓN ---

    const mostrarAlerta = (titulo, mensaje, accion = null) => {
        setAlertData({ show: true, titulo, mensaje, accion });
        alertRef.current?.showModal();
    };

    const cerrarAlerta = () => {
        const accionPendiente = alertData.accion;
        setAlertData({ show: false, titulo: '', mensaje: '', accion: null });
        alertRef.current?.close();

        // Si la sesión caducó, redirigimos al login tras cerrar el modal
        if (accionPendiente === 'logout') {
            localStorage.clear();
            router.replace('/login');
        }
    };

    const manejarErroresBackend = async (response) => {
        if (response.status === 401) {
            mostrarAlerta('Sesión caducada', 'Tu sesión ha expirado o el token es inválido. Por favor, inicia sesión nuevamente.', 'logout');
        } else if (response.status === 403) {
            mostrarAlerta('Acceso inválido', 'No tienes los permisos necesarios para realizar esta acción u obtener estos datos.');
        } else if (response.status === 400) {
            try {
                const errorData = await response.json();
                const mensajes = Object.values(errorData).flat().join(' ');
                mostrarAlerta('Error de campos inválidos', `Verifica la información enviada: ${mensajes}`);
            } catch (e) {
                mostrarAlerta('Error de campos', 'Se enviaron datos incorrectos o incompletos al servidor.');
            }
        } else if (response.status >= 500) {
            mostrarAlerta('Error general', 'Ocurrió un error interno en el servidor. Intenta de nuevo más tarde.');
        } else {
            mostrarAlerta('Error en la petición', `No se pudo completar la solicitud. (Código: ${response.status})`);
        }
    };

    const validarFormulario = () => {
        // Validar campos faltantes (basado en null=False, blank=False)
        if (!formData.nombre.trim() || !formData.email.trim() || !formData.username.trim()) {
            mostrarAlerta('Error de campos faltantes', 'Los campos Nombre, Email y Usuario son obligatorios.');
            return false;
        }

        // Validar longitud máxima (basado en max_length=50 de tus modelos)
        if (formData.nombre.length > 50 || formData.username.length > 50) {
            mostrarAlerta('Error de campos inválidos', 'El nombre y el usuario no pueden exceder los 50 caracteres.');
            return false;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            mostrarAlerta('Error de campos inválidos', 'Por favor, ingresa un formato de correo electrónico válido.');
            return false;
        }

        // Contraseña obligatoria solo al crear
        if (modalMode === 'create' && !formData.password.trim()) {
            mostrarAlerta('Error de campos faltantes', 'La contraseña es obligatoria al registrar un usuario nuevo.');
            return false;
        }

        return true;
    };

    // --- FUNCIONES CRUD ORIGINALES (CON VALIDACIONES) ---

    // 1. Obtener Datos Iniciales
    const fetchData = async () => {
        try {
            const grupo = 'auxiliar'; 
            const resUsers = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users?grupo=${grupo}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (resUsers.ok) {
                setData(await resUsers.json());
            } else {
                await manejarErroresBackend(resUsers);
            }
        } catch (error) {
            mostrarAlerta('Error de red', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
            console.error("Error al obtener datos: ", error.message);
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
        
        const usuarioStr = (obj.username || obj.email || `Auxiliar ${obj.id}`).toLowerCase();
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

    // 4. Funciones CRUD
    const handleGuardar = async () => {
        if (!validarFormulario()) return; // <--- Validación Frontend

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
                grupos: ['auxiliar'] 
            };

            if (formData.password) payload.password = formData.password;

            const response = await fetch(url, { method, headers, body: JSON.stringify(payload) });

            if (response.ok) {
                cerrarModal();
                fetchData(); 
            } else {
                await manejarErroresBackend(response); // <--- Validación Backend
            }
        } catch (error) {
            mostrarAlerta('Error de red', 'Ocurrió un error inesperado de conexión al guardar los datos.');
            console.error("Error: ", error.message);
        }
    };

    const handleEliminar = async () => {
        if (!formData.id) {
            mostrarAlerta('Error de otra cosa', 'No se ha seleccionado un ID válido para eliminar.');
            return;
        }
        
        const confirmacion = window.confirm("¿Estás seguro de eliminar este registro?");
        if (!confirmacion) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users/${formData.id}/`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                cerrarModal();
                fetchData();
            } else {
                await manejarErroresBackend(response); // <--- Validación Backend
            }
        } catch (error) {
            mostrarAlerta('Error de red', 'Ocurrió un error inesperado de conexión al eliminar.');
            console.error("Error: ", error.message);
        }
    };

    if (!autorizado) {
        return null;
    }

    return (
        <>
            {/* MODAL DE ALERTAS/VALIDACIONES */}
            <dialog 
                ref={alertRef} 
                className={styles.dialog_alerta} 
                style={{ display: alertData.show ? '' : 'none' }}
            >
                {alertData.show && (
                    <div className={styles.alerta_contenido} data-aos="fade-up">
                        <div className={styles.alerta_icono}>
                            <FaExclamationCircle size={45} color="#eab308" />
                        </div>
                        <div className={styles.alerta_textos}>
                            <h2>{alertData.titulo}</h2>
                            <p>{alertData.mensaje}</p>
                        </div>
                        <button className={styles.alerta_boton} onClick={cerrarAlerta}>
                            Entendido
                        </button>
                    </div>
                )}
            </dialog>

            {/* MODAL DEL FORMULARIO CRUD */}
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
                            maxLength={50} // Restricción base Django
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
                            maxLength={50} // Restricción base Django
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
                        <button onClick={cerrarModal} style={{ color: 'gray', border: '1px solid gray' }}>Cancelar</button>
                        <button onClick={handleGuardar} style={{ backgroundColor: '#2563eb', color: 'white' }}>Guardar</button>
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

            {/* PANTALLA PRINCIPAL */}
            <div className={styles.vista_completa}>
                <div className={styles.vista_volver}>
                    <p onClick={() => router.push('/prologix_admin/usuarios_y_permisos')} style={{ cursor: 'pointer' }}>{'< '}Volver</p>
                </div>
                <div className={styles.vista_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Auxiliares administrativos</h1>
                        <p>Gestión de registros y facturación</p>
                    </div>
                    <div className={styles.encabezado_boton}>
                        <button onClick={abrirModalCrear}>
                            <FaPlus style={{ marginRight: '2%' }} />
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
                                        style={{ cursor: 'pointer' }} 
                                        title="Haz clic para editar"
                                    >
                                        <td>{obj.username || obj.email || `Auxiliar ${obj.id}`}</td>
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