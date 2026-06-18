"use client"

import styles from '../../../styles/prologix_usuarios/prologix_admin/usuarios_y_permisos.module.scss';
import { FaBriefcase } from "react-icons/fa6";
import { FaFileAlt } from "react-icons/fa";
import { FaUser,
        FaUsers,
        FaShieldHalved,
        FaUserPlus
} from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // <-- Importamos useEffect y useState

export default function UsuariosPermisos () {
    const router = useRouter();

    // 1. NUEVO: Agregamos el estado para validar la autorización
    const [autorizado, setAutorizado] = useState(false);

    // 2. NUEVO: Agregamos este useEffect para verificar el rol ANTES de mostrar la pantalla
    useEffect(() => {
        const rol = localStorage.getItem('rol_usuario');
        if (rol !== 'administrador') {
            // Si el rol en localStorage no es admin, lo expulsamos al login
            router.replace('/login');
        } else {
            // Si es admin, le damos permiso para ver la pantalla
            setAutorizado(true);
        }
    }, [router]);

    // 3. NUEVO: Si no está autorizado, devolvemos null para evitar que la vista parpadee
    if (!autorizado) {
        return null;
    }

    return (
        <>
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
                                <button onClick={() => router.push('/prologix_admin/usuarios_y_permisos/empresas')} style={{border: '2px solid rgb(208, 184, 255)', color: 'rgb(95, 43, 200)'}}>Ver clientes</button>
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
                                <button style={{border: '2px solid rgb(255, 238, 184)', color: 'rgb(152, 138, 31)'}} >Ver admins</button>
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
        </>
    )
}