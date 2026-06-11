"use client"

import styles from '../../styles/components/menu.module.scss'
import { FaThLarge, FaUsers } from "react-icons/fa";
import Image from 'next/image';
import Logo from '../../public/logo.png';
import { FaSignOutAlt } from "react-icons/fa";
import { useRouter } from 'next/navigation';

export default function Menu () {
    const router = useRouter(); 

    return (
        <>  
            <div className={styles.menu_fake}>
                <h1>.</h1>
            </div>
            <div className={styles.menu}>
                <div className={styles.menu_logo}>
                    <Image src={Logo} width={300}/>
                </div>
                <div className={styles.menu_secciones}>
                    <ul>
                        <li><FaThLarge size={40} style={{color: 'white'}}/><p>Gestion de proyectos</p></li>
                        <li><FaUsers size={40} style={{color: 'white'}}/><p>Usuarios y permisos</p></li>
                    </ul>
                </div>
                <div className={styles.menu_cerrar_sesion}>
                    <div className={styles.cerrar_sesion}>
                        <FaSignOutAlt size={40} style={{color: 'white'}}/>
                        <h2>Cerrar sesion</h2>
                    </div>
                    
                </div>
            </div>
        </>
    )
}