"use client"

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function App(){
  const router = useRouter();

  useEffect(() => {
    router.push('/login')
  }, [])

  return (
    <>
      <h1>Redireccionando...</h1>
    </>
  )
}
