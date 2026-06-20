import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';

export default function BarChart ({ records = [] }) {
    
    // Agrupamos y sumamos las horas por consultor basado en los datos filtrados
    const chartData = useMemo(() => {
        const groupedData = {};

        records.forEach(record => {
            const username = record.username || 'Sin usuario';
            const horas = parseFloat(record.horas || 0);

            if (!groupedData[username]) {
                groupedData[username] = 0;
            }
            groupedData[username] += horas;
        });

        // Extraemos los nombres (eje X) y los totales de horas (eje Y)
        const xAxisData = Object.keys(groupedData);
        // Redondeamos a 2 decimales para mantener limpieza en los datos
        const seriesData = Object.values(groupedData).map(h => Number(h.toFixed(2))); 

        return { xAxisData, seriesData };
    }, [records]);

    const options = {
        title: {
            text: 'Carga de trabajo por consultor (Horas Totales)',
            left: 'left',
            textStyle: {
                fontSize: 14
            }
        },
        grid: {
            left: '3%',
            right: '3%',
            bottom: '0%', // Espacio extra para que los nombres no se corten
            top: '20%', 
            containLabel: true 
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow' // Agrega un sombreado a la barra al hacer hover
            }
        },
        xAxis: {
            type: 'category',
            data: chartData.xAxisData,
            axisLabel: {
                interval: 0, // Fuerza a que se muestren todos los nombres de los consultores
                rotate: 25 // Rota los nombres levemente por si son muy largos
            }
        },
        yAxis: {
            type: 'value',
            name: 'Horas'
        },
        series: [
            {
                data: chartData.seriesData,
                type: 'bar',
                // <-- Se mantiene tu gradiente original
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, // Izquierda
                        y: 0, // Arriba
                        x2: 0, // Derecha
                        y2: 1, // Abajo
                        colorStops: [
                            {
                                offset: 0, color: '#188df0' // Color en la parte de arriba
                            }, 
                            {
                                offset: 1, color: '#83bff6' // Color en la parte de abajo
                            }
                        ],
                        global: false 
                    },
                    // Se mantienen las esquinas redondeadas
                    borderRadius: [4, 4, 0, 0] 
                }
            }
        ]
    };

    return (
        <div style={{ width: '100%', height: '400px' }}>
            <ReactECharts 
                option={options} 
                style={{ height: '100%', width: '100%' }} 
                // Evitamos que la gráfica se desmonte abruptamente al filtrar
                notMerge={true} 
            />
        </div>
  );
};