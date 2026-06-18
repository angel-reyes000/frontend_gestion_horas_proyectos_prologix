import ReactECharts from 'echarts-for-react';

export default function LineChart () {

    const options = {
        title: {
            text: 'Horas trabajadas por semana',
            left: 'left', // <-- Mueve el título a la izquierda
            textStyle: {
                fontSize: 14 // <-- Hace la letra del título más pequeña
            }
        },
        grid: {
            // <-- La propiedad grid ajusta el tamaño interno y quita el espacio muerto
            left: '3%',
            right: '3%',
            bottom: '5%',
            top: '15%', // Deja un poco de espacio arriba para que la gráfica no choque con el título
            containLabel: true // Asegura que los textos de los ejes (Lunes, 820, etc.) no se corten
        },
        tooltip: {
            trigger: 'axis' // Útil para ver el valor exacto al pasar el cursor
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
                data: [820, 932, 901, 934, 1290, 1330, 1320],
                type: 'line', // <-- ¡Aquí está la magia! Cambiamos 'bar' por 'line'
                smooth: true, // Opcional: hace que la línea sea curva en lugar de recta
                color: '#ee6666', // Color de la línea principal
                // 👇 ESTO ES LO NUEVO: El área con degradado debajo de la línea
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1, // El degradado va de arriba (0) hacia abajo (1)
                        colorStops: [
                            {
                                offset: 0,
                                color: 'rgba(238, 102, 102, 0.7)' // Color más fuerte pegado a la línea
                            },
                            {
                                offset: 1,
                                color: 'rgba(238, 102, 102, 0.05)' // Casi transparente en la parte inferior
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
            />
        </div>
    );
};