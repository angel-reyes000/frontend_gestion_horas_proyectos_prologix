import ReactECharts from 'echarts-for-react';

export default function BarChart () {

    const options = {
        title: {
            text: 'Carga de trabajo por consultor (Horas - Mes actual)',
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
            data: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                data: [120, 200, 150, 80, 70, 110, 130],
                type: 'bar',
                // <-- Aquí aplicamos el gradiente
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, // Izquierda
                        y: 0, // Arriba
                        x2: 0, // Derecha
                        y2: 1, // Abajo (Esto hace que el gradiente sea de arriba hacia abajo)
                        colorStops: [
                            {
                                offset: 0, color: '#188df0' // Color en la parte de arriba (0%)
                            }, 
                            {
                                offset: 1, color: '#83bff6' // Color en la parte de abajo (100%)
                            }
                        ],
                        global: false 
                    },
                    // Opcional: redondear las esquinas superiores de las barras
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
};