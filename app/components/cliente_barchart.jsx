import ReactECharts from 'echarts-for-react';

export default function BarChart ({ records = [] }) {

    // 1. Objeto para agrupar las horas por cada número de semana
    const hoursPerWeek = {};

    // 2. Recorremos los registros para sumar las horas en su semana correspondiente
    records.forEach(rec => {
        const week = rec.semana;
        if (week && rec.horas) {
            // Si la semana aún no existe en nuestro objeto, la inicializamos en 0
            if (!hoursPerWeek[week]) {
                hoursPerWeek[week] = 0;
            }
            // Sumamos las horas
            hoursPerWeek[week] += parseFloat(rec.horas);
        }
    });

    // 3. Extraemos las semanas encontradas y las ordenamos de menor a mayor
    const sortedWeeks = Object.keys(hoursPerWeek).sort((a, b) => parseInt(a) - parseInt(b));

    // 4. Preparamos los arreglos dinámicos para la gráfica
    const xAxisData = sortedWeeks.map(week => `Semana ${week}`);
    const chartData = sortedWeeks.map(week => parseFloat(hoursPerWeek[week].toFixed(2)));

    const options = {
        title: {
            text: 'Horas por semana',
            left: 'left',
            textStyle: {
                fontSize: 14
            }
        },
        grid: {
            left: '3%',
            right: '3%',
            bottom: '5%',
            top: '15%', 
            containLabel: true 
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            // Inyectamos las etiquetas dinámicas de las semanas
            data: xAxisData.length > 0 ? xAxisData : ['Sin datos']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                // Inyectamos el total de horas dinámico
                data: chartData,
                type: 'bar',
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, // Izquierda
                        y: 0, // Arriba
                        x2: 0, // Derecha
                        y2: 1, // Abajo
                        colorStops: [
                            {
                                offset: 0, color: '#188df0' // Color arriba
                            }, 
                            {
                                offset: 1, color: '#83bff6' // Color abajo
                            }
                        ],
                        global: false 
                    },
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
            />
        </div>
    );
}