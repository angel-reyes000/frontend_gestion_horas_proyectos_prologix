"use client"

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function App(){
  const router = useRouter();

  useEffect(() => {
    router.push('/login')
  }, [])
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <div className="relative flex items-center justify-center w-16 h-16">
        {/* Anillo exterior giratorio */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-l-blue-500 animate-spin"></div>
        
        {/* Anillo interior giratorio en dirección contraria */}
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 border-r-purple-500 animate-[spin_0.5s_linear_infinite_reverse]"></div>
        
        {/* Punto central parpadeante */}
        <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
      </div>
    </div>
  );
}