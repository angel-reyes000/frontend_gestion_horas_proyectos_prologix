import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

export default function BarChart ({ records = [] }) {
    
    // Agrupamos y sumamos las horas por semana y por consultor para las últimas 12 semanas
    const chartData = useMemo(() => {
        // 1. Obtener las últimas 12 semanas únicas
        const allWeeks = [...new Set(records.map(r => r.semana).filter(Boolean))]
            .map(Number)
            .sort((a, b) => b - a) // Ordenar de mayor a menor para obtener las más recientes
            .slice(0, 12)          // Tomar solo las últimas 12
            .sort((a, b) => a - b); // Volver a ordenar de menor a mayor para la gráfica

        // 2. Obtener la lista de consultores únicos
        const uniqueConsultants = [...new Set(records.map(r => r.username || 'Sin usuario'))];

        // 3. Inicializar los datos de cada consultor para cada una de las 12 semanas
        const seriesMap = {};
        uniqueConsultants.forEach(consultant => {
            // Rellenamos con 0s iniciales correspondientes a cada semana
            seriesMap[consultant] = new Array(allWeeks.length).fill(0);
        });

        // 4. Acumular las horas en la posición correcta (semana) para cada consultor
        records.forEach(record => {
            const week = Number(record.semana);
            const weekIndex = allWeeks.indexOf(week);
            
            // Si la semana del registro está dentro de nuestras últimas 12 semanas
            if (weekIndex !== -1) {
                const username = record.username || 'Sin usuario';
                const horas = parseFloat(record.horas || 0);
                seriesMap[username][weekIndex] += horas;
            }
        });

        // 5. Preparar datos para los ejes y series de ECharts
        const xAxisData = allWeeks.map(w => `Sem. ${w}`);
        
        const seriesData = uniqueConsultants.map(consultant => ({
            name: consultant,
            type: 'bar',
            stack: 'total', // Propiedad clave para hacer barras apiladas
            data: seriesMap[consultant].map(h => Number(h.toFixed(2)))
            // Nota sobre diseño: Se retira el color fijo (gradiente azul) para que 
            // ECharts asigne colores distintos a cada consultor y se puedan diferenciar visualmente.
        }));

        return { xAxisData, seriesData, legendData: uniqueConsultants };
    }, [records]);

    const options = {
        title: {
            text: 'Carga de trabajo por consultor (Últimas 12 semanas)',
            left: 'left',
            textStyle: {
                fontSize: 14
            }
        },
        // Se añade la leyenda para identificar a cada consultor por color
        legend: {
            data: chartData.legendData,
            type: 'scroll', // Por si hay muchos consultores
            top: '10%'
        },
        grid: {
            left: '3%',
            right: '3%',
            bottom: '0%', 
            top: '25%', // Se incrementa el top para que no se encime con la leyenda
            containLabel: true 
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: chartData.xAxisData,
            axisLabel: {
                interval: 0,
                rotate: 25 
            }
        },
        yAxis: {
            type: 'value',
            name: 'Horas'
        },
        series: chartData.seriesData
    };

    return (
        <div style={{ width: '100%', height: '400px' }}>
            <ReactECharts 
                option={options} 
                style={{ height: '100%', width: '100%' }} 
                notMerge={true} 
            />
        </div>
    );
};