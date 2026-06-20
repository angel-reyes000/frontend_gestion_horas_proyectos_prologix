"use client"

import styles from '../../styles/login/login.module.scss';
import Image from 'next/image';
import Logo from '../../public/logo.png';
import { FaUser, FaLock } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login(){
    const [usuario, setUsuario] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [invalidAccess, setInvalidAccess] = useState(false);
    const router = useRouter();

    async function getUsers (e) {
        e.preventDefault();

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
            })

            const data = await response.json();

            const access = data.access;
            const refresh = data.refresh;

            if (localStorage.getItem("access") || localStorage.getItem("refresh")) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
            }

            localStorage.setItem("access", access)
            localStorage.setItem("refresh", refresh)

            if (access !== undefined && refresh !== undefined) {
                if (data.groups.includes("administrador")) {
                    // NUEVO: Guardamos el rol
                    localStorage.setItem("rol_usuario", "administrador"); 
                    router.push('/prologix_admin')

                } else if (data.groups.includes("consultor")) {
                    // NUEVO: Guardamos el rol
                    localStorage.setItem("rol_usuario", "consultor"); 
                    router.push('/prologix_consultor')

                } else if (data.groups.includes("auxiliar")) {
                    // NUEVO: Guardamos el rol
                    localStorage.setItem("rol_usuario", "auxiliar"); 
                    router.push('/prologix_auxiliar')

                } else if (data.groups.includes("cliente")) {
                    localStorage.setItem("rol_usuario", "cliente"); 
                    router.push('/prologix_cliente')
                }
            } else {
                console.log("Acceso invalido")
                setInvalidAccess(true)
            }

        } catch (error) {
            console.log("ERROR")
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
                        <div className={styles.form_input}>
                            <FaUser size={15}/>
                            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder='Ingresa tu usuario'></input> 
                        </div>                
                    </label>
                    <label>
                        Contraseña:
                        <div className={styles.form_input}>
                            <FaLock size={15}/>
                            <input type='password' value={contraseña} onChange={(e) => setContraseña(e.target.value)} placeholder='Ingresa tu contraseña'></input>                            
                        </div>
                        {invalidAccess ? <p style={{color: 'red', fontSize: '0.8rem', textAlign: 'right'}}>Acceso invalido.</p> : null}
                    </label>
                </div>
                <div className={styles.form_button}>
                    <button type='submit'>Iniciar sesion</button>
                </div>
            </form>                  
            <button onClick={() => console.log(`Access: ${localStorage.getItem('access')} refresh: ${localStorage.getItem('refresh')}`)}>Data</button>
        </div>
        </>
    )
}