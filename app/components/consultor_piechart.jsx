"use client"

import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

export default function PieChart({ datos = [], semana, semanaFiltro }) {
    
    // Agrupar los datos dinámicamente y calcular totales
    const { chartData, totalHoras } = useMemo(() => {
        // 1. Asegurarnos de que tomamos solo los datos de la semana actual/filtrada
        const datosSemana = datos.filter(obj => obj.semana === semana);

        let total = 0;
        // 2. Agrupar sumando las horas de cada proyecto en esa semana
        const agrupado = datosSemana.reduce((acc, curr) => {
            const nombre = curr.proyecto?.nombre || 'Desconocido';
            const horas = parseFloat(curr.horas || 0);
            total += horas;
            acc[nombre] = (acc[nombre] || 0) + horas;
            return acc;
        }, {});

        // 3. Darle a los datos el formato que pide ECharts [{name, value}]
        const formatData = Object.keys(agrupado).map(nombre => ({
            name: nombre,
            value: agrupado[nombre]
        })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor (opcional)

        return { chartData: formatData, totalHoras: total };
    }, [datos, semana]);

    const option = {
        // Paleta de colores lo más fiel a la imagen (agregamos extra por si hay más de 5 proyectos)
        color: ['#2b66f5', '#16ba7b', '#8f56fa', '#f59d15', '#ced4da', '#ff5252', '#00bcd4'],
        
        tooltip: {
            trigger: "item",
            formatter: "{b}: {c} h ({d}%)"
        },

        // Títulos: El general dinámico y el del centro de la dona
        title: [
            {
                text: semanaFiltro ? `Horas por proyecto (Semana ${semanaFiltro})` : "Horas por proyecto (esta semana)",
                left: "0%",
                top: "0%",
            },
            {
                text: `${totalHoras.toFixed(2)}h\ntotal`,
                left: "30%",      // Mismo que el centro de la dona
                top: "50%",
                textAlign: "center",
                textVerticalAlign: "middle",
                textStyle: {
                    fontSize: 15,
                    fontWeight: 'bold',
                    color: '#333'
                }
            }
        ],
        
        // Leyenda personalizada para mostrar Nombre + Horas + Porcentaje
        legend: {
            orient: "vertical",
            right: "5%", // Ajustado para que no se corte si los nombres son largos
            top: "middle",
            icon: "circle",
            textStyle: {
                color: "#555",
                fontSize: 14,
            },
            // Formateador personalizado de leyenda
            formatter: function (name) {
                const item = chartData.find(d => d.name === name);
                if (!item) return name; // Fallback si no encuentra el dato

                const pct = totalHoras > 0 ? ((item.value / totalHoras) * 100).toFixed(1) : 0;
                return `${name}: ${item.value.toFixed(1)}h (${pct}%)`;
            }
        },
        
        series: [
            {
                type: "pie",
                radius: ["50%", "75%"],
                center: ["30%", "50%"],
                
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
                
                // Pasa la data calculada. Si no hay datos, muestra un segmento vacío para no colapsar.
                data: chartData.length > 0 ? chartData : [{ value: 0, name: "Sin registros" }],
            },
        ],
    };

    return <ReactECharts option={option} style={{ height: 350, width: "100%" }} />;
}