"use client"

import styles from '../../styles/login/login.module.scss';
import Image from 'next/image';
import Logo from '../../public/logo.png';
import { FaUser, FaLock, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// NUEVO: Importaciones de AOS
import AOS from "aos";
import "aos/dist/aos.css";

export default function Login(){
    const [usuario, setUsuario] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [invalidAccess, setInvalidAccess] = useState(false);
    const [iniciandoSesion, setIniciandoSesion] = useState(false);

    // NUEVO: Estados para el manejo de modales de error
    const [modalInfo, setModalInfo] = useState({ titulo: '', mensaje: '', tipo: 'error' });

    const refUsuario = useRef(null);
    const refContenedorUsuario = useRef(null);
    const refContraseña = useRef(null);
    const refContenedorContraseña = useRef(null);
    const refModal = useRef(null); // NUEVO: Referencia al dialog

    const router = useRouter();

    // NUEVO: Inicializar AOS
    useEffect(() => {
        AOS.init({ duration: 600, once: true });
        
        // Simulación: Comprobar si fue redirigido por sesión caducada
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error') === 'sesion_caducada') {
            mostrarModal('Sesión Caducada', 'Tu sesión ha terminado. Por favor, inicia sesión nuevamente.', 'info');
        }
    }, []);

    // NUEVO: Función para mostrar el modal
    const mostrarModal = (titulo, mensaje, tipo = 'error') => {
        setModalInfo({ titulo, mensaje, tipo });
        if (refModal.current) {
            refModal.current.showModal();
        }
    };

    // NUEVO: Función para cerrar el modal
    const cerrarModal = () => {
        if (refModal.current) {
            refModal.current.close();
        }
    };

    const resetearFormularioError = () => {
        setIniciandoSesion(false);
        setInvalidAccess(true);
        if (refUsuario.current) refUsuario.current.disabled = false;
        if (refContraseña.current) refContraseña.current.disabled = false;
        if (refContenedorUsuario.current) refContenedorUsuario.current.style.backgroundColor = '';
        if (refContenedorContraseña.current) refContenedorContraseña.current.style.backgroundColor = '';
    };

    async function getUsers (e) {
        e.preventDefault();
        setInvalidAccess(false);

        // NUEVO: Error de campos faltantes e inválidos
        if (!usuario.trim() || !contraseña.trim()) {
            mostrarModal('Campos faltantes', 'Por favor, completa todos los campos (Usuario y Contraseña) para continuar.', 'error');
            return;
        }

        refUsuario.current.disabled = true;
        refContraseña.current.disabled = true;

        if (refUsuario.current.disabled && refContraseña.current.disabled) {
            refContenedorUsuario.current.style.backgroundColor = 'lightgray';
            refContenedorContraseña.current.style.backgroundColor = 'lightgray';
            setIniciandoSesion(true);
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usuario,
                    password: contraseña,
                })
            });

            // NUEVO: Error en la petición / Acceso inválido / Error general de servidor
            if (!response.ok) {
                resetearFormularioError();
                if (response.status === 401 || response.status === 400) {
                    mostrarModal('Acceso Inválido', 'El usuario o la contraseña son incorrectos. Verifica tus datos e inténtalo de nuevo.', 'error');
                } else if (response.status >= 500) {
                    mostrarModal('Error del Servidor', 'Ha ocurrido un error interno en el servidor. Intenta más tarde.', 'error');
                } else {
                    mostrarModal('Error en la petición', `Error inesperado (${response.status}). No se pudo completar la solicitud.`, 'error');
                }
                return;
            }

            const data = await response.json();
            const access = data.access;
            const refresh = data.refresh;

            if (localStorage.getItem("access") || localStorage.getItem("refresh")) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
            }

            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);

            if (access !== undefined && refresh !== undefined) {
                if (data.groups.includes("administrador")) {
                    localStorage.setItem("rol_usuario", "administrador"); 
                    router.push('/prologix_admin');
                } else if (data.groups.includes("consultor")) {
                    localStorage.setItem("rol_usuario", "consultor"); 
                    router.push('/prologix_consultor');
                } else if (data.groups.includes("auxiliar")) {
                    localStorage.setItem("rol_usuario", "auxiliar"); 
                    router.push('/prologix_auxiliar');
                } else if (data.groups.includes("cliente")) {
                    localStorage.setItem("rol_usuario", "cliente"); 
                    router.push('/prologix_cliente');
                } else {
                    // NUEVO: Error de otra cosa que se pueda ocurrir (Falta de roles)
                    resetearFormularioError();
                    mostrarModal('Acceso Restringido', 'Tu cuenta no tiene un rol asignado válido en el sistema.', 'error');
                }
            } else {
                console.log("Acceso invalido");
                resetearFormularioError();
                mostrarModal('Acceso Inválido', 'No se pudo obtener el acceso correcto al sistema.', 'error');
            }

        } catch (error) {
            console.log("ERROR", error);
            resetearFormularioError();
            // NUEVO: Error de red
            mostrarModal(
                'Error de red', 
                'No fue posible conectarse al servidor. Verifica tu conexión a internet o asegúrate de que el backend esté en línea.', 
                'error'
            );
        }
    }

    return (
        <>
        <div className={styles.fondo_login}>
            <form className={styles.login_form} onSubmit={getUsers}>
                <div className={styles.form_image}>
                    <Image width={300} height={300} src={Logo} alt='Logo de Prologix'/>
                </div>
                <div className={styles.form_title}>
                    <h1>Bienvenido a Prologix</h1>
                </div>
                <div className={styles.form_inputs}>
                    <label>
                        Usuario:
                        <div ref={refContenedorUsuario} className={styles.form_input}>
                            <FaUser size={15}/>
                            {/* NUEVO: Validación frontend basada en base de datos (max_length=150 de django auth user, requerido) */}
                            <input 
                                ref={refUsuario} 
                                value={usuario} 
                                onChange={(e) => setUsuario(e.target.value)} 
                                placeholder='Ingresa tu usuario'
                                maxLength={150}
                                required
                            /> 
                        </div>                
                    </label>
                    <label>
                        Contraseña:
                        <div ref={refContenedorContraseña} className={styles.form_input}>
                            <FaLock size={15}/>
                            <input 
                                ref={refContraseña} 
                                type='password' 
                                value={contraseña} 
                                onChange={(e) => setContraseña(e.target.value)} 
                                placeholder='Ingresa tu contraseña'
                                required
                            />                            
                        </div>
                        {invalidAccess ? <p style={{color: 'red', fontSize: '0.8rem', textAlign: 'right'}}>Acceso invalido.</p> : null}
                        {iniciandoSesion === true ? <p style={{color: 'blue', fontSize: '0.8rem', textAlign: 'right'}}>Iniciando sesion...</p> : null}
                    </label>
                </div>
                <div className={styles.form_button}>
                    <button type='submit'>Iniciar sesion</button>
                </div>
            </form>                  
        </div>

        {/* NUEVO: Elemento Dialog para las alertas */}
        <dialog ref={refModal} className="dialog_alerta">
            <div className="alerta_contenido" data-aos="zoom-in">
                <div className="alerta_icono">
                    {modalInfo.tipo === 'error' ? (
                        <FaTimesCircle size={50} color="#ef4444" />
                    ) : (
                        <FaExclamationTriangle size={50} color="#f59e0b" />
                    )}
                </div>
                <div className="alerta_textos">
                    <h2>{modalInfo.titulo}</h2>
                    <p>{modalInfo.mensaje}</p>
                </div>
                <button type="button" className="alerta_boton" onClick={cerrarModal}>
                    Entendido
                </button>
            </div>
        </dialog>
        </>
    )
}