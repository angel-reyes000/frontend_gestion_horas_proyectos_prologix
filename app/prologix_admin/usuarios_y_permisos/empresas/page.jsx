"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../../../../styles/prologix_usuarios/prologix_admin/vista_tablas.module.scss';
import { FaPlus, FaSearch, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import AOS from "aos";
import "aos/dist/aos.css";

export default function Empresas() {
    const router = useRouter();

    // Estado para validar la autorización
    const [autorizado, setAutorizado] = useState(false);

    // Estados de Alertas
    const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '' });
    const refAlerta = useRef(null);

    // Inicializar AOS
    useEffect(() => {
        AOS.init({ duration: 500 });
    }, []);

    // Función para mostrar alertas personalizadas
    const mostrarAlerta = (titulo, mensaje) => {
        setAlerta({ visible: true, titulo, mensaje });
        if (refAlerta.current) refAlerta.current.showModal();
    };

    const cerrarAlerta = () => {
        setAlerta({ visible: false, titulo: '', mensaje: '' });
        if (refAlerta.current) refAlerta.current.close();
    };

    // Efecto para verificar el rol ANTES de mostrar la pantalla
    useEffect(() => {
        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            mostrarAlerta('Acceso inválido', 'No tienes permisos para acceder a esta sección.');
            setTimeout(() => {
                router.replace('/login');
            }, 2000);
        } else {
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
        if (autorizado) {
            const token = localStorage.getItem('access');

            async function getData () {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/empresas/`,{
                        method: 'GET',
                        headers: {
                            'content-type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (response.status === 401 || response.status === 403) {
                        mostrarAlerta('Sesión caducada', 'Tu sesión ha terminado o el acceso es inválido. Serás redirigido al login.');
                        localStorage.clear();
                        setTimeout(() => router.replace('/login'), 3000);
                        return;
                    }

                    if (!response.ok) {
                        mostrarAlerta('Error en la petición', `No se pudieron cargar los datos (Error: ${response.status}).`);
                        return;
                    }

                    const datos = await response.json();
                    setData(datos);
                } catch (error) {
                    mostrarAlerta('Error de red', 'No se pudo establecer conexión con el servidor.');
                    console.log("Error de conexión:", error.message);
                }
            }

            getData();
        }
    }, [autorizado, router]);

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
        // Validación Frontend: Campos faltantes
        if (!empresa.trim()) {
            mostrarAlerta('Campos faltantes', 'El nombre de la empresa es requerido.');
            return;
        }

        // Validación Frontend: Campos inválidos (basado en models.CharField(max_length=50))
        if (empresa.trim().length > 50) {
            mostrarAlerta('Campos inválidos', 'El nombre de la empresa no puede exceder los 50 caracteres.');
            return;
        }

        const existeDuplicado = data.some(
            (item) => item.nombre.toLowerCase() === empresa.trim().toLowerCase() && item.id !== editId
        );

        if (existeDuplicado) {
            mostrarAlerta('Campos inválidos', 'Ya existe una empresa registrada con ese nombre.');
            return;
        }

        try {
            const token = localStorage.getItem('access');
            const formData = new FormData();

            formData.append("nombre", empresa.trim());
            if (logo) {
                formData.append("logo", logo);
            }
            
            if (editId) {
                formData.append("id", editId);
            }

            const method = editId ? 'PUT' : 'POST';

            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/empresas/`, {
                method: method,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            // Validaciones Backend
            if (response.status === 401 || response.status === 403) {
                mostrarAlerta('Sesión caducada', 'Tu sesión ha terminado. Serás redirigido al login.');
                localStorage.clear();
                setTimeout(() => router.replace('/login'), 3000);
                return;
            }

            if (response.status === 400) {
                const errorData = await response.json();
                mostrarAlerta('Campos inválidos', `Los datos enviados no son válidos: ${JSON.stringify(errorData)}`);
                return;
            }

            if (!response.ok) {
                mostrarAlerta('Error general', 'Ocurrió un error inesperado al intentar guardar el registro.');
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
            mostrarAlerta('Error de red', 'No se pudo guardar la información por problemas de conexión.');
            console.log("Error en guardar: ", error.message);
        }
    }

    async function deleteData () {
        const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este registro?");
        if (!confirmar || !editId) return;

        try {
            const token = localStorage.getItem('access');

            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/empresas/`, {
                method: 'DELETE',
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id: editId }),
            });

            if (response.status === 401 || response.status === 403) {
                mostrarAlerta('Sesión caducada', 'Tu sesión ha terminado. Serás redirigido al login.');
                localStorage.clear();
                setTimeout(() => router.replace('/login'), 3000);
                return;
            }

            if (!response.ok) {
                mostrarAlerta('Error en la petición', 'No se pudo eliminar el registro. Puede que esté asociado a otros datos (Proyectos).');
                return;
            }

            setData(data.filter(item => item.id !== editId));
            closeModal();

        } catch (error) {
            mostrarAlerta('Error de red', 'No se pudo completar la eliminación por problemas de red.');
            console.log("Error en borrar: ", error.message);
        }
    }

    const filteredData = data.filter((obj) => {
        return Object.values(obj).some((val) =>
            String(val).toLowerCase().includes(search.toLowerCase())
        );
    });

    if (!autorizado) {
        return (
            <>
                <dialog ref={refAlerta} className={styles.dialog_alerta}>
                    <div className={styles.alerta_contenido} data-aos="zoom-in">
                        <div className={styles.alerta_icono}>
                            <FaExclamationTriangle size={45} color="#eab308" />
                        </div>
                        <div className={styles.alerta_textos}>
                            <h2>{alerta.titulo}</h2>
                            <p>{alerta.mensaje}</p>
                        </div>
                        <button className={styles.alerta_boton} onClick={cerrarAlerta}>Entendido</button>
                    </div>
                </dialog>
            </>
        );
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
                                placeholder='Nombre de la empresa (Máx. 50 caracteres)'
                                maxLength={50}
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
            {/* MODAL DE ALERTAS GLOBALES */}
            <dialog ref={refAlerta} className={styles.dialog_alerta}>
                <div className={styles.alerta_contenido} data-aos="fade-down">
                    <div className={styles.alerta_icono}>
                        <FaExclamationTriangle size={45} color="#eab308" />
                    </div>
                    <div className={styles.alerta_textos}>
                        <h2>{alerta.titulo}</h2>
                        <p>{alerta.mensaje}</p>
                    </div>
                    <button className={styles.alerta_boton} onClick={cerrarAlerta}>Entendido</button>
                </div>
            </dialog>

            {modalAdd()}
            <div className={styles.vista_completa}>
                <div className={styles.vista_volver}>
                    <p onClick={() => router.push('/prologix_admin/usuarios_y_permisos')} style={{cursor: 'pointer'}}>{'< '}Volver</p>
                </div>
                <div className={styles.vista_encabezado}>
                    <div className={styles.encabezado_titulo}>
                        <h1>Empresas</h1>
                        <p>Administra empresas registradas.</p>
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