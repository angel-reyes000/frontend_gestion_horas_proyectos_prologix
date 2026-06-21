"use client"

import styles from '../../styles/components/menu.module.scss'
import { FaThLarge, FaUsers, FaSignOutAlt } from "react-icons/fa";
import Image from 'next/image';
import Logo from '../../public/logo.png';
import { useRouter, usePathname } from 'next/navigation';

export default function Menu () {
    const router = useRouter(); 
    const pathname = usePathname(); // Obtenemos la ruta actual

    function cerrar_sesion () {
        const cerrar = confirm("Estas seguro de cerrar sesion?");

        if (cerrar) {
            localStorage.removeItem('token');
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('rol_usuario');
            router.push('/login')
        } else {
            console.log("Manteniendo la misma sesion.");
        }
    } 

    return (
        <>  
            <div className={styles.menu_fake}></div>
            
            <div className={styles.menu}>
                <div className={styles.menu_logo}>
                    <Image src={Logo} width={150} alt='logo de la empresa' className={styles.logo_img}/>
                </div>
                
                <div className={styles.menu_secciones}>
                    <ul>
                        <li 
                            onClick={() => router.push('/prologix_admin')}
                            className={pathname === '/prologix_admin' ? styles.activo : ''}
                        >
                            <FaThLarge size={26} className={styles.icono} />
                            <p>Gestión de proyectos</p>
                        </li>
                        <li 
                            onClick={() => router.push('/prologix_admin/usuarios_y_permisos')}
                            className={pathname === '/prologix_admin/usuarios_y_permisos' ? styles.activo : ''}
                        >
                            <FaUsers size={26} className={styles.icono} />
                            <p>Usuarios y permisos</p>
                        </li>
                    </ul>
                </div>
                
                <div className={styles.menu_cerrar_sesion}>
                    <div onClick={() => cerrar_sesion()} className={styles.cerrar_sesion}>
                        <FaSignOutAlt size={26} className={styles.icono_cerrar} />
                        <h2>Cerrar sesión</h2>
                    </div>                    
                </div>
            </div>
        </>
    )
}