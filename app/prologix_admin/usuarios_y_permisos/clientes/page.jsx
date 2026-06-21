"use client"

import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";

export default function Clientes() {
    const router = useRouter();
    
    const [autorizado, setAutorizado] = useState(false);

    useEffect(() => {
        // Inicializar AOS
        AOS.init({ duration: 300 });

        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            router.replace('/login');
        } else {
            setAutorizado(true);
        }
    }, [router]);

    const [data, setData] = useState([]);
    const [allProyectos, setAllProyectos] = useState([]); 
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
        proyectos: [], 
        is_active: true
    });

    // Estados para Alertas de Validación
    const alertaDialogRef = useRef(null);
    const [alerta, setAlerta] = useState({
        isOpen: false,
        titulo: '',
        mensaje: '',
        accion: null
    });

    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : '';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // --- FUNCIONES DE ALERTA Y MANEJO DE ERRORES ---
    const mostrarAlerta = (titulo, mensaje, accion = null) => {
        setAlerta({ isOpen: true, titulo, mensaje, accion });
        alertaDialogRef.current?.showModal();
    };

    const cerrarAlerta = () => {
        const accionPendiente = alerta.accion;
        setAlerta({ isOpen: false, titulo: '', mensaje: '', accion: null });
        alertaDialogRef.current?.close();
        if (accionPendiente) accionPendiente();
    };

    const manejarErrorBackend = async (response) => {
        if (response.status === 401 || response.status === 403) {
            mostrarAlerta("Sesión caducada / Acceso inválido", "Tu sesión ha terminado o no tienes los permisos necesarios. Por favor, inicia sesión nuevamente.", () => {
                localStorage.removeItem('access');
                localStorage.removeItem('rol_usuario');
                router.replace('/login');
            });
            return true;
        }
        if (response.status === 400) {
            try {
                const errorData = await response.json();
                // Extraer mensajes de error del JSON
                const mensajes = Object.entries(errorData).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join(' | ');
                mostrarAlerta("Error de campos inválidos o faltantes", mensajes || "Revisa la información enviada.");
            } catch {
                mostrarAlerta("Error en la petición", "Los datos enviados son inválidos o están incompletos.");
            }
            return true;
        }
        if (!response.ok) {
            mostrarAlerta("Error general", `Ha ocurrido un error inesperado en el servidor (Código: ${response.status}). Inténtalo de nuevo más tarde.`);
            return true;
        }
        return false;
    };

    const validarFrontend = () => {
        if (!formData.nombre.trim()) return "El campo 'Nombre' es obligatorio.";
        if (formData.nombre.length > 50) return "El 'Nombre' no puede exceder los 50 caracteres."; // Basado en max_length=50 de tu modelo
        if (!formData.username.trim()) return "El campo 'Usuario' es obligatorio.";
        if (!formData.email.trim()) return "El campo 'Email' es obligatorio.";
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) return "El formato del 'Email' es inválido.";
        
        if (modalMode === 'create' && !formData.password) return "La 'Contraseña' es obligatoria para nuevos registros.";
        return null;
    };

    // 1. Obtener Datos Iniciales
    const fetchData = async () => {
        try {
            const grupo = 'cliente'; 
            const resUsers = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users?grupo=${grupo}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (await manejarErrorBackend(resUsers)) return;
            if (resUsers.ok) setData(await resUsers.json());

            const resProyectos = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/proyectos`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (await manejarErrorBackend(resProyectos)) return;
            if (resProyectos.ok) setAllProyectos(await resProyectos.json());

        } catch (error) {
            mostrarAlerta("Error de red", "No se pudo conectar con el servidor. Verifica tu conexión a internet o intenta más tarde.");
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
        
        const usuarioStr = (obj.username || obj.email || `Cliente ${obj.id}`).toLowerCase();
        const empresasStr = obj.empresas_nombres && obj.empresas_nombres.length > 0 
            ? obj.empresas_nombres.join(' ').toLowerCase() 
            : 'sin empresas';
        const proyectosStr = obj.proyectos_nombres && obj.proyectos_nombres.length > 0 
            ? obj.proyectos_nombres.join(' ').toLowerCase() 
            : 'sin proyectos asignados';
        const estadoStr = obj.is_active ? 'activo' : 'inactivo';
        const fechaStr = obj.date_joined ? obj.date_joined.split('T')[0] : 'sin fecha';

        return usuarioStr.includes(termino) || 
               empresasStr.includes(termino) || 
               proyectosStr.includes(termino) || 
               estadoStr.includes(termino) || 
               fechaStr.includes(termino);
    });

    // 3. Manejo del Formulario y Modal
    const abrirModalCrear = () => {
        setModalMode('create');
        setFormData({ id: null, nombre: '', email: '', username: '', password: '', proyectos: [], is_active: true });
        setIsOpen(true); 
        dialogRef.current?.showModal();
    };

    const abrirModalEditar = (user) => {
        setModalMode('edit');
        const projectIds = user.registros 
            ? Array.from(new Set(user.registros.map(r => {
                const id = typeof r.proyecto === 'object' ? r.proyecto?.id : r.proyecto;
                return parseInt(id);
            }).filter(id => !isNaN(id)))) 
            : [];

        setFormData({
            id: user.id,
            nombre: user.first_name || user.nombre || '', 
            email: user.email || '',                      
            username: user.username,
            password: '', 
            proyectos: user.proyectos_asignados || [], 
            is_active: user.is_active
        });
        
        setIsOpen(true);
        dialogRef.current?.showModal();
    };

    const cerrarModal = () => {
        setIsOpen(false); 
        dialogRef.current?.close();
    };

    const handleProyectosChange = (e) => {
        const options = Array.from(e.target.selectedOptions);
        const values = options.map(opt => parseInt(opt.value));
        setFormData({ ...formData, proyectos: values });
    };

    const empresasRelacionadas = allProyectos
        .filter(p => formData.proyectos.includes(p.id) && p.empresas)
        .map(p => p.empresas);
    
    const empresasUnicasForm = Array.from(new Map(empresasRelacionadas.map(e => [e.id, e])).values());

    // 4. Funciones CRUD
    const handleGuardar = async () => {
        const errorFrontend = validarFrontend();
        if (errorFrontend) {
            mostrarAlerta("Campos faltantes o inválidos", errorFrontend);
            return;
        }

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
                proyectos: formData.proyectos,
                grupos: ['cliente']
            };

            if (formData.password) payload.password = formData.password;

            const response = await fetch(url, { method, headers, body: JSON.stringify(payload) });

            if (await manejarErrorBackend(response)) return;

            if (response.ok) {
                cerrarModal();
                fetchData(); 
            }
        } catch (error) {
            mostrarAlerta("Error de red", "No se pudo comunicar con el servidor para guardar el registro.");
            console.error("Error: ", error.message);
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

            if (await manejarErrorBackend(response)) return;

            if (response.ok) {
                cerrarModal();
                fetchData();
            }
        } catch (error) {
            mostrarAlerta("Error de red", "No se pudo comunicar con el servidor para eliminar el registro.");
            console.error("Error: ", error.message);
        }
    };

    if (!autorizado) {
        return null;
    }

    return (
        <>
            {/* Modal de Alertas / Validaciones */}
            <dialog 
                ref={alertaDialogRef} 
                className={styles.dialog_alerta}
                style={{ display: alerta.isOpen ? '' : 'none' }}
            >
                {alerta.isOpen && (
                    <div className={styles.alerta_contenido} data-aos="zoom-in">
                        <div className={styles.alerta_icono}>
                            <FaExclamationCircle size={50} color="#ef4444" />
                        </div>
                        <div className={styles.alerta_textos}>
                            <h2>{alerta.titulo}</h2>
                            <p>{alerta.mensaje}</p>
                        </div>
                        <button className={styles.alerta_boton} onClick={cerrarAlerta}>
                            Aceptar
                        </button>
                    </div>
                )}
            </dialog>

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
                        Proyectos:
                        <select multiple value={formData.proyectos} onChange={handleProyectosChange}>
                            {allProyectos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </label>      
                    
                    <label>
                        Empresas (Autogenerado):
                        <select multiple disabled value={empresasUnicasForm.map(e => e.id)}>
                            {empresasUnicasForm.map(e => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                        </select>
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
                        <h1>Clientes</h1>
                        <p>Administra clientes registrados.</p>
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
                                <td>Empresas</td>
                                <td>Proyectos</td>
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
                                        <td>{obj.username || obj.email || `Cliente ${obj.id}`}</td>
                                        <td>
                                            {obj.empresas_nombres && obj.empresas_nombres.length > 0 
                                                ? obj.empresas_nombres.join(', ') 
                                                : 'Sin empresas'}
                                        </td>
                                        <td>
                                            {obj.proyectos_nombres && obj.proyectos_nombres.length > 0 
                                                ? obj.proyectos_nombres.join(', ') 
                                                : 'Sin proyectos asignados'}
                                        </td>
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