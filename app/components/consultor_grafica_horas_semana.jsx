"use client"

import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

export default function GraficaHorasSemana({ datos = [], semana, semanaFiltro }) {

    const chartData = useMemo(() => {
        // Inicializamos la semana con 0 horas para los 7 días [Lun, Mar, Mié, Jue, Vie, Sáb, Dom]
        const horasPorDia = [0, 0, 0, 0, 0, 0, 0];

        // 1. Filtrar los datos por la semana que estamos visualizando (KPI)
        const datosSemana = datos.filter(obj => obj.semana === semana);

        // 2. Sumar las horas agrupadas por el día exacto de la fecha
        datosSemana.forEach(obj => {
            if (obj.fecha_actual) {
                // Separamos la fecha (YYYY-MM-DD) para evitar desfases de zona horaria en JavaScript
                const [year, month, day] = obj.fecha_actual.split('-');
                const fechaObj = new Date(year, month - 1, day);
                
                // getDay() retorna: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
                const diaSemana = fechaObj.getDay(); 
                
                // Ajustamos el índice para que Lunes sea 0 y Domingo sea 6 (como en nuestro eje X)
                const indiceDia = (diaSemana + 6) % 7; 
                
                horasPorDia[indiceDia] += parseFloat(obj.horas || 0);
            }
        });

        // Retornamos el arreglo manteniendo 2 decimales para que la gráfica no se rompa con números muy largos
        return horasPorDia.map(h => parseFloat(h.toFixed(2)));
    }, [datos, semana]);

    const option = {
        grid: {
            left: 10,
            right: 10,
            top: 70,
            bottom: 20,
            containLabel: true
        },
        title: {
            // Título dinámico que responde al select de semanas
            text: semanaFiltro ? `Horas (Semana ${semanaFiltro})` : "Horas esta semana",
            left: "left",
        },
        tooltip: {
            trigger: "axis",
            // Formato para que al pasar el mouse diga "10.5 h"
            formatter: "{b}: {c} h"
        },
        xAxis: {
            type: "category",
            data: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        },
        yAxis: {
            type: "value",
        },
        series: [
        {
            name: "Horas Trabajadas", 
            type: "line",
            data: chartData, // <-- Array dinámico de horas calculado arriba
            smooth: false, // Puedes cambiar a 'true' si prefieres la curva suave
            areaStyle: {
                color: "rgba(0, 123, 255, 0.3)"
            },
            itemStyle: {
                color: "#2b66f5" // Un color azul que combina bien con tu interfaz
            }
        },
        ],
    };

    return <ReactECharts option={option} style={{ height: '350px', width: '100%' }}/>
}