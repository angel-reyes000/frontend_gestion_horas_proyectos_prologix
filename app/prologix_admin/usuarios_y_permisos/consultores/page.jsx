"use client"

import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Consultores() {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [allProyectos, setAllProyectos] = useState([]); 
    const [search, setSearch] = useState('');
    
    // Estados para el Modal y CRUD
    const dialogRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false); // <--- Nuevo estado para forzar la visibilidad
    const [modalMode, setModalMode] = useState('create');
    const [formData, setFormData] = useState({
        id: null,
        username: '',
        password: '',
        proyectos: [], 
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
            const grupo = 'consultor';
            const resUsers = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users?grupo=${grupo}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resUsers.ok) setData(await resUsers.json());

            const resProyectos = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/proyectos`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resProyectos.ok) setAllProyectos(await resProyectos.json());

        } catch (error) {
            console.error("Error al obtener datos: ", error.message);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Filtro de Búsqueda
    const filteredData = data.filter((obj) => {
        const termino = search.toLowerCase();
        const usuarioStr = (obj.username || obj.email || '').toLowerCase();
        
        const empresasArr = obj.registros ? Array.from(new Set(obj.registros.map(r => r.proyecto?.empresas?.nombre).filter(Boolean))) : [];
        const proyectosArr = obj.registros ? Array.from(new Set(obj.registros.map(r => r.proyecto?.nombre).filter(Boolean))) : [];
        
        const empresasStr = empresasArr.join(' ').toLowerCase();
        const proyectosStr = proyectosArr.join(' ').toLowerCase();
        const estadoStr = obj.is_active ? 'activo' : 'inactivo';
        const fechaStr = obj.date_joined ? obj.date_joined.split('T')[0] : '';

        return usuarioStr.includes(termino) || 
               empresasStr.includes(termino) || 
               proyectosStr.includes(termino) || 
               estadoStr.includes(termino) || 
               fechaStr.includes(termino);
    });

    // 3. Manejo del Formulario y Modal
    const abrirModalCrear = () => {
        setModalMode('create');
        setFormData({ id: null, username: '', password: '', proyectos: [], is_active: true });
        setIsOpen(true); // <--- Actualizamos el estado
        dialogRef.current?.showModal();
    };

    const abrirModalEditar = (user) => {
        setModalMode('edit');
        console.log("Usuario recibido del backend:", user);
        // Extraemos los IDs de los proyectos de forma segura
        const projectIds = user.registros 
            ? Array.from(new Set(user.registros.map(r => {
                // Si el backend manda un objeto, sacamos el id. Si manda solo el número, lo usamos directo.
                const id = typeof r.proyecto === 'object' ? r.proyecto?.id : r.proyecto;
                // Forzamos a que sea un número entero (React necesita que los tipos coincidan para el select)
                return parseInt(id);
            }).filter(id => !isNaN(id)))) // Filtramos nulos o inválidos
            : [];

        setFormData({
            id: user.id,
            username: user.username,
            password: '', 
            proyectos: user.proyectos_asignados || [], // Aquí se asigna el arreglo de IDs limpios
            is_active: user.is_active
        });
        
        setIsOpen(true);
        dialogRef.current?.showModal();
    };

    const cerrarModal = () => {
        setIsOpen(false); // <--- Actualizamos el estado para forzar el ocultamiento
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
        try {
            const url = modalMode === 'create' 
                ? `${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users/` 
                : `${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users/${formData.id}/`;
            
            const method = modalMode === 'create' ? 'POST' : 'PUT'; 

            const payload = {
                username: formData.username,
                is_active: formData.is_active,
                proyectos: formData.proyectos,
                grupos: ['consultor']
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

    return (
        <>
            {/* Se agrega el condicional style={{ display: isOpen ? '' : 'none' }} para arreglar el bug visual */}
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
                        <h1>Consultores</h1>
                        <p>Administra consultores registrados.</p>
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
                                const empresasUnicas = obj.registros
                                    ? Array.from(new Set(obj.registros.map(r => r.proyecto?.empresas?.nombre).filter(Boolean)))
                                    : [];

                                const proyectosUnicos = obj.registros
                                    ? Array.from(new Set(obj.registros.map(r => r.proyecto?.nombre).filter(Boolean)))
                                    : [];

                                const isActive = obj.is_active;
                                const fechaIngreso = obj.date_joined ? obj.date_joined.split('T')[0] : 'Sin fecha';

                                return (
                                    <tr 
                                        key={obj.id || index} 
                                        onClick={() => abrirModalEditar(obj)} 
                                        style={{cursor: 'pointer'}}
                                        title="Haz clic para editar"
                                    >
                                        <td>{obj.username || obj.email || `Consultor ${obj.id}`}</td>
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