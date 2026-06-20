import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

export default function LineChart({ records = [] }) {

    // Extraemos y agrupamos los datos automáticamente cada vez que cambian los filtros
    const { xAxisData, seriesData } = useMemo(() => {
        const horasPorSemana = {};

        // Agrupamos la sumatoria de horas por cada semana
        records.forEach(rec => {
            const semana = rec.semana;
            const horas = parseFloat(rec.horas || 0);
            
            if (semana) {
                horasPorSemana[semana] = (horasPorSemana[semana] || 0) + horas;
            }
        });

        // Ordenamos las semanas de menor a mayor y tomamos solo las ÚLTIMAS 12 para el Eje X
        const semanasOrdenadas = Object.keys(horasPorSemana)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .slice(-12); // <-- Filtro de las últimas 12 semanas

        // Preparamos los arreglos finales para la gráfica
        const xData = semanasOrdenadas.map(semana => `Semana ${semana}`);
        const sData = semanasOrdenadas.map(semana => horasPorSemana[semana].toFixed(2)); // Redondeamos a 2 decimales

        return { xAxisData: xData, seriesData: sData };
    }, [records]);

    const options = {
        title: {
            text: 'Horas trabajadas por semana',
            left: 'left',
            textStyle: {
                fontSize: 14
            }
        },
        grid: {
            left: '3%',
            right: '5%',
            bottom: '5%',
            top: '20%',
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            // Formateador para mostrar el texto bonito en el tooltip
            valueFormatter: (value) => value + ' hrs' 
        },
        xAxis: {
            type: 'category',
            data: xAxisData.length > 0 ? xAxisData : ['Sin datos'], // Si no hay datos por el filtro
            boundaryGap: false // Hace que la línea empiece pegada al eje (estilo clásico de line chart)
        },
        yAxis: {
            type: 'value',
            name: 'Horas'
        },
        series: [
            {
                data: seriesData.length > 0 ? seriesData : [0],
                type: 'line',
                smooth: true,
                color: '#ee6666',
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            {
                                offset: 0,
                                color: 'rgba(238, 102, 102, 0.7)'
                            },
                            {
                                offset: 1,
                                color: 'rgba(238, 102, 102, 0.05)'
                            }
                        ]
                    }
                }
            }
        ]
    };

    return (
        <div style={{ width: '100%', height: '400px' }}>
            <ReactECharts 
                option={options} 
                style={{ height: '100%', width: '100%' }} 
                notMerge={true} // Obliga a ECharts a redibujar limpio cuando cambian los datos
            />
        </div>
    );
}