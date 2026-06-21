"use client"

import styles from '../../../styles/prologix_usuarios/prologix_admin/usuarios_y_permisos.module.scss';
import { FaBriefcase, FaFileAlt } from "react-icons/fa";
import { 
    FaUser,
    FaUsers,
    FaShieldHalved,
    FaUserPlus,
    FaCircleExclamation // <-- Añadimos un icono para el modal de error
} from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

// Importamos AOS y sus estilos para la animación del modal
import AOS from "aos";
import "aos/dist/aos.css";

export default function UsuariosPermisos () {
    const router = useRouter();

    const [autorizado, setAutorizado] = useState(false);
    
    // Estado y Referencia para controlar nuestro modal de validaciones/errores
    const dialogRef = useRef(null);
    const [alerta, setAlerta] = useState({ visible: false, titulo: '', mensaje: '', tipo: '' });

    // -------------------------------------------------------------------------
    // LÓGICA DE VALIDACIÓN BASADA EN MODELOS DE DJANGO
    // -------------------------------------------------------------------------
    const validarCamposDjango = (modelo, datos) => {
        let errores = [];

        if (modelo === 'Empresas') {
            if (!datos.nombre || datos.nombre.trim() === '') errores.push('El nombre de la empresa es obligatorio.');
            if (datos.nombre && datos.nombre.length > 50) errores.push('El nombre no puede exceder los 50 caracteres.');
        }

        if (modelo === 'Proyectos') {
            if (!datos.empresas) errores.push('La empresa es obligatoria.');
            if (!datos.nombre || datos.nombre.trim() === '') errores.push('El nombre del proyecto es obligatorio.');
            if (datos.nombre && datos.nombre.length > 50) errores.push('El nombre no puede exceder los 50 caracteres.');
            if (!datos.descripcion || datos.descripcion.trim() === '') errores.push('La descripción del proyecto es obligatoria.');
        }

        if (modelo === 'Registros') {
            if (!datos.fecha_actual) errores.push('La fecha actual es obligatoria.');
            if (datos.numero_factura && datos.numero_factura.length > 20) errores.push('El número de factura no puede exceder los 20 caracteres.');
            if (datos.facturado && !['si', 'no'].includes(datos.facturado)) errores.push('El valor de facturado debe ser "si" o "no".');
            if (!datos.usuario) errores.push('El usuario es obligatorio.');
            if (!datos.proyecto) errores.push('El proyecto es obligatorio.');
            if (!datos.horas) {
                errores.push('Las horas son obligatorias.');
            } else {
                const horasStr = datos.horas.toString();
                // max_digits=4, decimal_places=2
                if (!/^\d{1,2}(\.\d{1,2})?$/.test(horasStr)) errores.push('Las horas deben tener máximo 4 dígitos en total y 2 decimales.');
            }
            if (!datos.descripcion || datos.descripcion.trim() === '') errores.push('La descripción es obligatoria.');
        }

        return errores;
    };

    // -------------------------------------------------------------------------
    // MANEJADOR DE ERRORES Y ALERTAS
    // -------------------------------------------------------------------------
    const mostrarAlerta = (titulo, mensaje, tipo) => {
        setAlerta({ visible: true, titulo, mensaje, tipo });
        if (dialogRef.current) {
            dialogRef.current.showModal();
        }
    };

    const cerrarAlerta = () => {
        if (dialogRef.current) {
            dialogRef.current.close();
        }
        setAlerta({ ...alerta, visible: false });

        // Evaluamos si el error requiere expulsar al usuario tras darle aceptar al modal
        if (alerta.tipo === 'sesion_caducada' || alerta.tipo === 'acceso_invalido') {
            router.replace('/login');
        }
    };

    // Función exportable o usable en tus peticiones para invocar los errores requeridos
    const dispararError = (tipoError, detalles = '') => {
        switch (tipoError) {
            case 'sesion_caducada':
                mostrarAlerta('Sesión Caducada', 'Tu sesión ha expirado o no has iniciado sesión. Serás redirigido al login.', 'sesion_caducada');
                break;
            case 'acceso_invalido':
                mostrarAlerta('Acceso Inválido', 'No tienes permisos de administrador para ver esta pantalla.', 'acceso_invalido');
                break;
            case 'red':
                mostrarAlerta('Error de Red', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.', 'red');
                break;
            case 'peticion':
                mostrarAlerta('Error en la Petición', 'Ocurrió un problema al procesar tu solicitud en el servidor. Intenta de nuevo.', 'peticion');
                break;
            case 'campos_faltantes':
                mostrarAlerta('Campos Faltantes', `Faltan datos obligatorios por llenar: ${detalles}`, 'campos_faltantes');
                break;
            case 'campos_invalidos':
                mostrarAlerta('Campos Inválidos', `Verifica la información ingresada. ${detalles}`, 'campos_invalidos');
                break;
            default:
                mostrarAlerta('Error General', 'Ocurrió un error inesperado en el sistema. Contacta a soporte.', 'general');
                break;
        }
    };

    // -------------------------------------------------------------------------
    // EFECTO INICIAL (AUTORIZACIÓN Y ANIMACIONES)
    // -------------------------------------------------------------------------
    useEffect(() => {
        AOS.init({ duration: 600, once: true }); // Inicializamos AOS

        const rol = localStorage.getItem('rol_usuario');
        
        // Validación de sesión y accesos pasando por el sistema de errores en lugar de redirect directo
        if (!rol) {
            dispararError('sesion_caducada');
        } else if (rol !== 'administrador') {
            dispararError('acceso_invalido');
        } else {
            setAutorizado(true);
        }
    }, [router]);

    return (
        <>
            {/* MODAL DE VALIDACIONES / ERRORES */}
            <dialog ref={dialogRef} className={styles.dialog_alerta}>
                <div className={styles.alerta_contenido} data-aos="zoom-in">
                    <div className={styles.alerta_icono}>
                        <FaCircleExclamation size={45} color="#e11d48" />
                    </div>
                    <div className={styles.alerta_textos}>
                        <h2>{alerta.titulo}</h2>
                        <p>{alerta.mensaje}</p>
                    </div>
                    <button className={styles.alerta_boton} onClick={cerrarAlerta}>
                        Aceptar
                    </button>
                </div>
            </dialog>

            {/* RENDERIZADO DEL CONTENIDO PROTEGIDO (Solo si está autorizado) */}
            {autorizado && (
                <div className={styles.usuarios_permisos}>
                    <div className={styles.usuarios_permisos_encabezado}>
                        <h1>Configuración</h1>
                        <p>Administra clientes, consultores, empresas, proyectos, administradores y grupos.</p>
                    </div>
                    <div className={styles.usuarios_permisos_recuadros}>
                        <div className={styles.recuadros_recuadro}>
                            <div className={styles.recuadro}> 
                                <div className={styles.recuadro_imagen} style={{backgroundColor: 'rgb(208, 184, 255)'}}>
                                    <FaBriefcase size={30} style={{color: 'rgb(95, 43, 200)'}}/>
                                </div>
                                <div className={styles.recuadro_texto}>
                                    <h2>Empresas</h2>
                                    <p>Administra las empresas registradas en el sistema.</p>
                                </div>
                                <div className={styles.recuadro_boton}>
                                    <button onClick={() => router.push('/prologix_admin/usuarios_y_permisos/empresas')} style={{border: '2px solid rgb(208, 184, 255)', color: 'rgb(95, 43, 200)'}}>Ver empresas</button>
                                </div>
                            </div>
                            <div className={styles.recuadro}>
                                <div className={styles.recuadro_imagen} style={{backgroundColor: 'rgb(255, 184, 184)'}}>
                                    <FaFileAlt size={30} style={{color: 'rgb(200, 43, 43)'}}/>
                                </div>
                                <div className={styles.recuadro_texto}>
                                    <h2>Proyectos</h2>
                                    <p>Administra los proyectos asociados a las empresas.</p>
                                </div>
                                <div className={styles.recuadro_boton}>
                                    <button onClick={() => router.push('/prologix_admin/usuarios_y_permisos/proyectos')} style={{border: '2px solid rgb(255, 184, 184)', color: 'rgb(200, 43, 43)'}}>Ver proyectos</button>
                                </div>
                            </div>
                        </div>
                        <div className={styles.recuadros_recuadro}>
                            <div className={styles.recuadro}> 
                                <div className={styles.recuadro_imagen} style={{backgroundColor: 'rgb(184, 194, 255)'}}>
                                    <FaUsers size={30} style={{color: 'rgb(43, 56, 200)'}}/>
                                </div>
                                <div className={styles.recuadro_texto}>
                                    <h2>Clientes</h2>
                                    <p>Administra la información relacionada con cada cliente.</p>
                                </div>
                                <div className={styles.recuadro_boton}>
                                    <button onClick={() => router.push('/prologix_admin/usuarios_y_permisos/clientes')} style={{border: '2px solid rgb(208, 184, 255)', color: 'rgb(95, 43, 200)'}}>Ver clientes</button>
                                </div>
                            </div>
                            <div className={styles.recuadro}>
                                <div className={styles.recuadro_imagen} style={{backgroundColor: 'rgb(184, 255, 188)'}}>
                                    <FaUser size={30} style={{color: 'rgb(34, 156, 68)'}}/>
                                </div>
                                <div className={styles.recuadro_texto}>
                                    <h2>Consultores</h2>
                                    <p>Administra la información relacionada con cada consultor.</p>
                                </div>
                                <div className={styles.recuadro_boton}>
                                    <button onClick={() => router.push('/prologix_admin/usuarios_y_permisos/consultores')} style={{border: '2px solid rgb(184, 255, 188)', color: 'rgb(34, 156, 68)'}}>Ver consultores</button>
                                </div>
                            </div>
                            <div className={styles.recuadro}>
                                <div className={styles.recuadro_imagen} style={{backgroundColor: 'rgb(255, 238, 184)'}}>
                                    <FaShieldHalved size={30} style={{color: 'rgb(152, 138, 31)'}}/>
                                </div>
                                <div className={styles.recuadro_texto}>
                                    <h2>Administradores</h2>
                                    <p>Administra la información relacionada con cada administrador.</p>
                                </div>
                                <div className={styles.recuadro_boton}>
                                    <button onClick={() => router.push('/prologix_admin/usuarios_y_permisos/administradores')} style={{border: '2px solid rgb(255, 238, 184)', color: 'rgb(152, 138, 31)'}} >Ver admins</button>
                                </div>
                            </div>
                            <div className={styles.recuadro}>
                                <div className={styles.recuadro_imagen} style={{backgroundColor: 'rgb(251, 255, 184)'}}>
                                    <FaUserPlus size={30} style={{color: 'rgb(140, 152, 31)'}}/>
                                </div>
                                <div className={styles.recuadro_texto}>
                                    <h2>Auxiliares administrativos</h2>
                                    <p>Administra la información relacionada con cada auxiliar.</p>
                                </div>
                                <div className={styles.recuadro_boton}>
                                    <button onClick={() => router.push('/prologix_admin/usuarios_y_permisos/auxiliares_administrativos')} style={{border: '2px solid rgb(251, 255, 184)', color: 'rgb(140, 152, 31)'}} >Ver auxiliares</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}