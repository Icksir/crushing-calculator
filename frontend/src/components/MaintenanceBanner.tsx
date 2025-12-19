'use client';

import { useState, useEffect } from 'react';
import { getMaintenanceStatus, MaintenanceResponse } from '@/lib/api';
// 1. Importamos el hook de idioma (ajusta la ruta si es necesario)
import { useLanguage } from '@/context/LanguageContext'; 

export default function MaintenanceBanner() {
  const [info, setInfo] = useState<MaintenanceResponse | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await getMaintenanceStatus();
        setInfo(prev => {
          if (!prev || prev.active !== data.active || JSON.stringify(prev.messages) !== JSON.stringify(data.messages)) {
            setIsVisible(true);
            return data;
          }
          return prev;
        });
      } catch (err) {
        console.error(err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!info || !info.active || !isVisible) return null;

  const currentMessage = info.messages[language] || info.messages['en'] || Object.values(info.messages)[0];

  return (
    // CONTENEDOR PRINCIPAL: Rojo, fijo, oculta lo que se salga
    <div className="relative w-full bg-red-600 text-white h-10 flex items-center overflow-hidden shadow-md z-50">
      
      {/* WRAPPER DEL TEXTO ANIMADO 
         - animate-marquee: La clase que definimos en CSS
         - whitespace-nowrap: Obligatorio para que sea una sola línea larga
         - will-change-transform: Optimiza el rendimiento en navegadores
      */}
      <div className="w-full">
        <div className="animate-marquee whitespace-nowrap font-bold text-sm sm:text-base px-4 will-change-transform">
          ⚠️ {currentMessage} ⚠️
        </div>
      </div>

      {/* BOTÓN DE CERRAR (La X)
         - absolute right-0: Pegado a la derecha
         - z-10: Por encima del texto
         - bg-red-600: Fondo rojo sólido para que el texto no se vea "a través" de la X
         - shadow-[-5px_0_10px_rgba(220,38,38,1)]: Una pequeña sombra roja a la izquierda para suavizar el corte
      */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center px-2 bg-red-600 z-10 shadow-[-10px_0_15px_rgba(220,38,38,1)]">
        <button 
          onClick={handleClose}
          className="p-1 hover:bg-red-800 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-white"
          aria-label="Cerrar aviso"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}