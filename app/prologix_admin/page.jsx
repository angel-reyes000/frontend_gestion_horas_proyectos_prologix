"use client"

import styles from '../../styles/prologix_usuarios/prologix_admin.module.scss';
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import { FaExclamationTriangle } from "react-icons/fa";

export default function PrologixAdmin () {
    const refModalInvalidAccess = useRef(null);
    const [invalidAccess, setInvalidAccess] = useState(false);

    const router = useRouter();

    useEffect(() => {
        async function getData () {
            try {
                const token = localStorage.getItem('access');

                const response = await fetch(`${process.env.NEXT_PUBLIC_CONNECTION_BACKEND}/api/users/`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (response.status !== 200) {
                    setInvalidAccess(true)
                    refModalInvalidAccess.current.showModal();
                }

                const data = await response.json()

            } catch (error) {
                console.log("Error: ", error.message)
            }
        }

        getData()

    })

    function modalInvalidAccess () {
        return invalidAccess ? (
            <>
                <dialog className={styles.modal} ref={refModalInvalidAccess}>
                        <FaExclamationTriangle size={100} style={{color: 'yellow'}}/>
                        <h1>Acceso invalido</h1>
                        <button onClick={() => router.push('/login')}>Ir a iniciar sesion</button>
                </dialog>
            </>
        ) :
        null
    }

    return (
        <>  
            {modalInvalidAccess()}
            <h1>Hola admin</h1>
            <button onClick={() => console.log(`Access: ${localStorage.getItem('access')} refresh: ${localStorage.getItem('refresh')}`)}>Data</button>
        </>
    )
}