"use client"

import ReactECharts from 'echarts-for-react';

export default function GraficaHorasSemana () {

    const option = {
        grid: {
            left: 10,
            right: 10,
            top: 70,
            bottom: 20,
            containLabel: true
        },
        title: {
            text: "Horas esta semana",
            left: "left",
        },
        tooltip: {
            trigger: "axis",
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
            name: "Ventas",
            type: "line",
            data: [120, 200, 150, 80, 70, 110, 130],
            smooth: false, // hace la línea curva
            areaStyle: {
                color: "rgba(0, 123, 255, 0.3)"
            }
        },
        ],
    };

    return <ReactECharts option={option} style={{ height: '350px', width: '100%' }}/>
}