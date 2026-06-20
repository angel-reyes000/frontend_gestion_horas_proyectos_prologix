"use client"

import styles from '../../styles/components/menu.module.scss'
import { FaThLarge, FaUsers } from "react-icons/fa";
import Image from 'next/image';
import Logo from '../../public/logo.png';
import { FaSignOutAlt } from "react-icons/fa";
import { useRouter } from 'next/navigation';

export default function Menu () {
    const router = useRouter(); 

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
            <div className={styles.menu_fake}>
                <h1>.</h1>
            </div>
            <div className={styles.menu}>
                <div className={styles.menu_logo}>
                    <Image src={Logo} width={300} alt='logo de la empresa'/>
                </div>
                <div className={styles.menu_secciones}>
                    <ul>
                        <li onClick={() => router.push('/prologix_admin')}><FaThLarge size={40} style={{color: 'white'}}/><p>Gestion de proyectos</p></li>
                        <li onClick={() => router.push('/prologix_admin/usuarios_y_permisos')}><FaUsers size={40} style={{color: 'white'}}/><p>Usuarios y permisos</p></li>
                    </ul>
                </div>
                <div className={styles.menu_cerrar_sesion}>
                    <div onClick={() => cerrar_sesion()} className={styles.cerrar_sesion}>
                        <FaSignOutAlt size={40} style={{color: 'white'}}/>
                        <h2>Cerrar sesion</h2>
                    </div>                    
                </div>
            </div>
        </>
    )
}