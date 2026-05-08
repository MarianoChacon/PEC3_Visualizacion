async function leerDatos() {
    try {
        const respuesta = await fetch('hotel_bookings_clean.json');
        if (!respuesta.ok) throw new Error("No se pudo cargar el JSON");
        return await respuesta.json();
    } catch (error) {
        console.error("Error cargando el JSON:", error);
    }
}
const obtenerTotalesKidsBool = (dataSet) => {
    const conteo = { "Con Niños": 0, "Sin Niños": 0 };
    
    Object.values(dataSet.kids_bool || {}).forEach(val => {
        // Asumiendo que 1 es 'Con Niños' y 0 es 'Sin Niños'
        if (val === 1) conteo["Con Niños"]++;
        else conteo["Sin Niños"]++;
    });

    return [
        { name: 'Sin Niños', value: conteo["Sin Niños"] },
        { name: 'Con Niños', value: conteo["Con Niños"] }
    ];
};



const prepararDatosJitter = (dataSet) => {
    // Definimos las categorías del eje X
    const categoriasX = ['0 Niños', '1 Niño', '2 Niños', '3 Niños'];
    const dataScatter = [];

    Object.keys(dataSet.kids || {}).forEach(idx => {
        const k = dataSet.kids[idx];
        const d = dataSet.totalDays[idx];
        
        // Solo procesamos si el valor de kids está en nuestro rango de categorías (0-3)
        if (k >= 0 && k <= 3) {
            // El formato para este gráfico es: [índice_categoría, valor_Y]
            // ECharts se encarga del jittering automáticamente
            dataScatter.push([k, d]); 
        }
    });

    return { dataScatter, categoriasX };
};

const getOptionJitter = (info, chartWidth) => {
    const { dataScatter, categoriasX } = info;
    
    // Calculamos el ancho del jitter basado en el espacio disponible por categoría
    const jitterWidth = (chartWidth / categoriasX.length) * 0.8;

    return {
        title: {
            text: 'Estancia por cantidad de Niños (con Jittering)',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            enterable: true,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            formatter: (params) => {
                const id = `mini-chart-${params.dataIndex}`;
                
                // Renderizamos el mini-gráfico después de que aparezca el tooltip
                setTimeout(() => {
                    renderizarMiniBarra(id, info.totalesKids);
                }, 0);

                return `
                    <div style="font-weight: bold; margin-bottom: 5px;">Distribución Global:</div>
                    <div id="${id}" style="width:200px; height:120px;"></div>
                `;
            }
        },
        grid: {
            left: 80,
            right: 50,
            bottom: 50
        },
        xAxis: {
            type: 'category',
            data: categoriasX,
            // Aquí activamos la magia del jittering automático de ECharts
            jitter: jitterWidth,
            boundaryGap: true,
            axisTick: { alignWithLabel: true }
        },
        yAxis: {
            type: 'value',
            name: 'Días de estancia',
            min: 0,
            splitLine: { show: true, lineStyle: { type: 'dashed' } }
        },
        series: [
            {
                name: 'Reservas',
                type: 'scatter',
                data: dataScatter,
                symbolSize: 6,
                itemStyle: {
                    opacity: 0.4,
                    color: '#5470c6'
                }
            }
        ]
    };
};

function renderizarMiniBarra(containerId, datosTotales) {
    const dom = document.getElementById(containerId);
    if (!dom) return;

    const miniChart = echarts.init(dom);
    miniChart.setOption({
        grid: { top: 10, bottom: 30, left: 40, right: 10 },
        xAxis: {
            type: 'category',
            data: datosTotales.map(d => d.name),
            axisLabel: { fontSize: 10 }
        },
        yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
        series: [{
            type: 'bar',
            data: datosTotales.map(d => d.value),
            itemStyle: { color: '#5470c6' },
            label: { show: true, position: 'top', fontSize: 9 }
        }]
    });
}

const initCharts = async () => {
    const dataSet = await leerDatos();
    if (!dataSet) return;

    // Calculamos los totales una sola vez
    const totalesKids = obtenerTotalesKidsBool(dataSet);
    const info = prepararDatosJitter(dataSet);
    info.totalesKids = totalesKids; // Los guardamos para el tooltip

    const chart = echarts.init(document.getElementById("chart1"));
    chart.setOption(getOptionJitter(info, chart.getWidth()));
};

window.addEventListener('load', initCharts);