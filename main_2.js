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
        if (val === 1) conteo["Con Niños"]++;
        else conteo["Sin Niños"]++;
    });

    return [
        { name: 'Sin Niños', value: conteo["Sin Niños"] },
        { name: 'Con Niños', value: conteo["Con Niños"] }
    ];
};



const prepararDatosJitter = (dataSet) => {
    const categoriasX = ['0 Niños', '1 Niño', '2 Niños', '3 Niños'];
    const dataScatter = [];

    // Validamos que existan los datos antes de iterar
    if (!dataSet.kids || !dataSet.totalDays) return { dataScatter: [], categoriasX };

    Object.keys(dataSet.kids).forEach(idx => {
        const k = dataSet.kids[idx];
        const d = dataSet.totalDays[idx];
        const canceled = dataSet.is_canceled ? dataSet.is_canceled[idx] : 0;
        
        // Filtramos para evitar valores nulos o fuera de rango
        if (k !== undefined && d !== undefined && k >= 0 && k <= 3) {
            dataScatter.push({
                // El valor DEBE ser un array [x, y]
                value: [k, d], 
                is_canceled: canceled
            }); 
        }
    });

    return { dataScatter, categoriasX };
};

let myChart; 
let infoGlobal;
let mostrandoCancelados = false;
// Esta es la función para resaltar los cancelados
const resaltarCancelados = () => {
    mostrandoCancelados = !mostrandoCancelados;

    myChart.setOption({
        series: [{
            data: infoGlobal.dataScatter.map(item => ({
                ...item,
                itemStyle: {
                    color: (mostrandoCancelados && item.is_canceled === 1) ? '#FF4D4F' : '#5470c6',
                    opacity: (mostrandoCancelados && item.is_canceled === 1) ? 0.8 : 0.4
                }
            }))
        }]
    });
};



const getOptionJitter = (info, chartWidth) => {
    const { dataScatter, categoriasX } = info;
    
    const jitterWidth = (chartWidth / categoriasX.length) * 0.9;

    return {
        title: {
            animation: false,
            text: 'Estancia por cantidad de Niños',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            enterable: true,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            formatter: (params) => {
                const id = `mini-chart-${params.dataIndex}`;
                
                setTimeout(() => {
                    renderizarMiniBarra(id, info.totalesKids);
                }, 0);

                return `
                    <div style="font-weight: bold; margin-bottom: 5px;">Distribución Global:</div>
                    <div id="${id}" style="width:200px; height:120px;"></div>
                `;
            }
        },
        dataZoom: [
            {
                id: 'dataZoomY',
                type: 'slider',
                yAxisIndex: [0],
                filterMode: 'empty'
            }
        ],
        grid: {
            left: 80,
            right: 50,
            bottom: 50
        },
        xAxis: {
            type: 'category',
            data: categoriasX,
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
                animation: false,
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
        yAxis: {
            show: false
        },
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

    const totalesKids = obtenerTotalesKidsBool(dataSet);
    infoGlobal = prepararDatosJitter(dataSet);
    infoGlobal.totalesKids = totalesKids;  

    myChart = echarts.init(document.getElementById("chart1"));
    myChart.setOption(getOptionJitter(infoGlobal, myChart.getWidth()));
    const btn = document.getElementById('btnCancelados');
    if (btn) {
        btn.addEventListener('click', resaltarCancelados);
    }

};

window.addEventListener('load', initCharts);