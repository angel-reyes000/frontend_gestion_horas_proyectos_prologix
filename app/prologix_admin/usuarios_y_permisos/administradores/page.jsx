"use client"

import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Administradores() {
    const router = useRouter();
    
    // 1. Estado para validar la autorización
    const [autorizado, setAutorizado] = useState(false);

    // 2. Efecto para verificar el rol ANTES de mostrar la pantalla
    useEffect(() => {
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

    // 1. Obtener Datos Iniciales
    const fetchData = async () => {
        try {
            const grupo = 'administrador';
            const resUsers = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users?grupo=${grupo}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resUsers.ok) setData(await resUsers.json());

        } catch (error) {
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
        
        // Usuario
        const usuarioStr = (obj.username || obj.email || `Administrador ${obj.id}`).toLowerCase();
            
        // Estado
        const estadoStr = obj.is_active ? 'activo' : 'inactivo';
        
        // Fecha de ingreso
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
                is_superuser: true, 
                is_staff: true, // <--- AQUÍ SE AGREGA EL CAMPO
                grupos: ['administrador']
            };

            if (formData.password) payload.password = formData.password;

            const response = await fetch(url, { method, headers, body: JSON.stringify(payload) });

            if (response.ok) {
                cerrarModal();
                fetchData(); 
            } else {
                console.error("Error al guardar");
            }
        } catch (error) {
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

            if (response.ok) {
                cerrarModal();
                fetchData();
            } else {
                console.error("Error al eliminar");
            }
        } catch (error) {
            console.error("Error: ", error.message);
        }
    };

    // Si no está autorizado, devolvemos null para evitar parpadeos visuales
    if (!autorizado) {
        return null;
    }

    return (
        <>
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
