"use client"

import ReactECharts from 'echarts-for-react';

export default function GraficaHorasProyectosSemana() {
    
    const option = {
        // Paleta de colores lo más fiel a la imagen
        color: ['#2b66f5', '#16ba7b', '#8f56fa', '#f59d15', '#ced4da'],
        
        tooltip: {
            trigger: "item",
            formatter: "{b}: {c} h ({d}%)"
        },

        // 2. Títulos: El general y el del centro de la dona
        title: [
            {
                text: "Horas por proyecto (esta semana)",
                left: "0%",
                top: "0%",
            },
            {
                text: "24.5h\ntotal",
                left: "30%",      // Mismo que el centro de la dona
                top: "50%",
                textAlign: "center",
                textVerticalAlign: "middle",
            }
        ],
        // 3. Leyenda personalizada para mostrar Nombre + Horas + Porcentaje
        legend: {
            orient: "vertical",
            right: "15%", // Alineado a la derecha
            top: "middle",
            icon: "circle", // Puntos circulares
            textStyle: {
                color: "#555",
                fontSize: 14,
            },
        },
        series: [
            {
                type: "pie",
                radius: ["50%", "75%"],
                center: ["30%", "50%"], // Movido hacia la izquierda para dar espacio a la leyenda
                
                // Borde blanco para separar los segmentos
                itemStyle: {
                    borderColor: "#fff",
                    borderWidth: 3,
                },
                
                labelLine: {
                    show: false,
                },
                
                label: {
                    show: false,
                },
                
                data: [
                    { value: 8.0, name: "Proyecto Alfa" },
                    { value: 6.0, name: "Proyecto Beta" },
                    { value: 4.5, name: "Proyecto Gamma" },
                    { value: 3.5, name: "Proyecto Delta" },
                    { value: 2.5, name: "Proyecto Épsilon" },
                ],
            },
        ],
    };

    return <ReactECharts option={option} style={{ height: 350, width: "100%" }} />;
}