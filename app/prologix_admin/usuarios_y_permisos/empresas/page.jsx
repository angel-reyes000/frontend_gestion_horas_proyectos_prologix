"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash } from 'react-icons/fa';

export default function Empresas() {
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
    const [empresa, setEmpresa] = useState('');
    const [logo, setLogo] = useState(null);
    const [search, setSearch] = useState('');
    const [editId, setEditId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const refModal = useRef(null);

    useEffect(() => {
        // Solo llamamos a la API si el usuario está autorizado
        if (autorizado) {
            const token = localStorage.getItem('access');

            async function getData () {
                try {
                    const response = await fetch('http://localhost:8000/api/empresas/',{
                        method: 'GET',
                        headers: {
                            'content-type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (response.status !== 200) {
                        console.log("Error en funcion getData");
                    } else {
                        const datos = await response.json();
                        setData(datos);
                    }
                } catch (error) {
                    console.log("Error de conexión:", error.message);
                }
            }

            getData();
        }
    }, [autorizado]); // Dependencia agregada para que se ejecute al confirmar autorización

    const openModal = (obj = null) => {
        if (obj) {
            setEditId(obj.id);
            setEmpresa(obj.nombre);
        } else {
            setEditId(null);
            setEmpresa('');
        }
        setLogo(null);
        setIsModalOpen(true);
        if (refModal.current) refModal.current.showModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        if (refModal.current) refModal.current.close();
        setEmpresa('');
        setLogo(null);
        setEditId(null);
    };

    async function saveData () {
        if (!empresa.trim()) {
            alert('El nombre de la empresa es requerido.');
            return;
        }

        // Validación para evitar nombres repetidos
        const existeDuplicado = data.some(
            (item) => item.nombre.toLowerCase() === empresa.toLowerCase() && item.id !== editId
        );

        if (existeDuplicado) {
            alert('Ya existe una empresa registrada con ese nombre.');
            return;
        }

        try {
            const token = localStorage.getItem('access');
            const formData = new FormData();

            formData.append("nombre", empresa);
            if (logo) {
                formData.append("logo", logo);
            }
            
            if (editId) {
                formData.append("id", editId);
            }

            const method = editId ? 'PUT' : 'POST';

            const response = await fetch('http://localhost:8000/api/empresas/', {
                method: method,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                console.log("No se pudo guardar el registro");
                return;
            }

            const datos = await response.json();

            if (editId) {
                setData(data.map(item => item.id === editId ? datos : item));
            } else {
                setData([...data, datos]);
            }
            
            closeModal();
            
        } catch (error) {
            console.log("Error en guardar: ", error.message);
        }
    }

    async function deleteData () {
        const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este registro?");
        if (!confirmar || !editId) return;

        try {
            const token = localStorage.getItem('access');

            const response = await fetch('http://localhost:8000/api/empresas/', {
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id: editId }),
            });

            if (!response.ok) {
                console.log("No se pudo eliminar el registro");
                return;
            }

            setData(data.filter(item => item.id !== editId));
            closeModal();

        } catch (error) {
            console.log("Error en borrar: ", error.message);
        }
    }

    const filteredData = data.filter((obj) => {
        return Object.values(obj).some((val) =>
            String(val).toLowerCase().includes(search.toLowerCase())
        );
    });

    // 3. NUEVO: Si no está autorizado, devolvemos null para evitar parpadeos visuales
    if (!autorizado) {
        return null;
    }

    function modalAdd() {
        return (
            <>
                <dialog 
                    ref={refModal} 
                    className={styles.dialog} 
                    style={{ display: isModalOpen ? 'block' : 'none' }}
                >
                    <div className={styles.dialog_encabezado}>
                        <div className={styles.dialog_titulo}>
                            <h1>{editId ? 'Editar registro' : 'Añadir registro'}</h1>
                            <p>Completa la información requerida en el formulario.</p>
                        </div>
                        <div className={styles.dialog_boton}>
                            <button onClick={closeModal}>x</button>
                        </div>
                    </div>                  
                    <div className={styles.dialog_inputs}>
                        <label>
                            Nombre:
                            <input 
                                value={empresa} 
                                onChange={(e) => setEmpresa(e.target.value)} 
                                placeholder='Nombre de la empresa'
                            />
                        </label> 
                        <label>
                            Logo de la empresa:
                            <input 
                                onChange={(e) => setLogo(e.target.files[0])} 
                                type='file' 
                                accept='image/*'
                            />
                        </label>                       
                    </div>
                    <div className={styles.dialog_botones}>
                        <div className={styles.botones_guardar_cancelar}>
                            <button onClick={closeModal} style={{color: 'gray', border: '1px solid gray'}}>Cancelar</button>
                            <button onClick={saveData} style={{backgroundColor: '#2563eb', color: 'white'}}>Guardar</button>
                        </div>
                        {editId && (
                            <div className={styles.botones_borrar}>
                                <button onClick={deleteData}><FaTrash size={20}/></button>
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
                        <h1>Empresas</h1>
                        <p>Administra empresas registrados.</p>
                    </div>
                    <div className={styles.encabezado_boton}>
                        <button onClick={() => openModal()}><FaPlus style={{marginRight: '2%'}}/>Añadir registro</button>
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
                                <td>Fecha inicio</td>
                                <td>Empresa</td>
                                <td>Logo</td>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(obj => (
                                <tr key={obj.id} onClick={() => openModal(obj)} style={{cursor: 'pointer'}}>
                                    <td>{obj.fecha_registro}</td>
                                    <td>{obj.nombre}</td>
                                    <td>
                                        {obj.logo && <Image src={obj.logo} width={50} height={50} alt='logo de empresa' unoptimized />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}