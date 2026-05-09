const anotacionesCancelados = {
    "0": "37.31% Canc.",
    "1": "30.86% Canc.",
    "2": "41.15% Canc.",
    "3": "27.03% Canc."
};
let mostrandoResaltado = false;
let myChart;
let infoGlobal;
let mostrandoCancelados = false;
let modoActual = 'estancia';
let paisSeleccionado = 'todos';

const actualizarGrafico = () => {
    // 1. Aplicamos el filtro de país sobre el total de datos
    const datosFiltrados = paisSeleccionado === 'todos' 
        ? infoGlobal.dataScatter 
        : infoGlobal.dataScatter.filter(item => item.country_filter === paisSeleccionado);

    // 2. Si quieres que los botones de "Solo no canceladas" afecten también:
    // Aquí podrías añadir más lógica de filtrado si fuera necesario

    // 3. Generamos los elementos visuales (textos)
    const elementosGraficos = mostrandoResaltado ? [0, 1, 2, 3].map(cat => ({
        type: 'text',
        left: `${18 + (cat * 21)}%`,
        top: '25%',
        style: { text: anotacionesCancelados[cat], font: 'bold 12px sans-serif', fill: '#FF4D4F' },
        silent: true
    })) : [];

    // 4. Pintamos el gráfico con la métrica y colores actuales
    myChart.setOption({
        yAxis: {
            name: modoActual === 'estancia' ? 'Días de estancia' : 'Precio Medio (ADR)',
            scale: true
        },
        series: [{
            id: 'serie-principal',
            data: datosFiltrados.map(item => ({
                value: modoActual === 'estancia' ? item.estancia : item.precio,
                itemStyle: {
                    color: !mostrandoResaltado ? '#5470c6' : (item.is_canceled === 1 ? '#FF4D4F' : '#088216'),
                    opacity: mostrandoResaltado ? 0.6 : 0.4
                }
            }))
        }],
        graphic: elementosGraficos
    }, { replaceMerge: ['graphic'] });
};

const filtrarPorPais = (evento) => {
    paisSeleccionado = evento.target.value; // Actualiza el país global
    actualizarGrafico();
};

const switchResaltado = () => {
    mostrandoResaltado = !mostrandoResaltado; // Cambia el estado de color
    actualizarGrafico();
};

const cambiarMetrica = () => {
    modoActual = (modoActual === 'estancia') ? 'precio' : 'estancia';
    const btn = document.getElementById('btnCambiarMetrica');
    if (btn) btn.innerText = modoActual === 'estancia' ? 'Ver ADR' : 'Ver Estancia';
    actualizarGrafico();
};

// --- El botón de "Solo no canceladas" es un filtro extra ---
const filtrarNoCanceladas = () => {
    mostrandoResaltado = false; 
    // Aplicamos el filtro de país + el filtro de no canceladas
    const filtrados = infoGlobal.dataScatter.filter(item => {
        const cumplePais = paisSeleccionado === 'todos' || item.country_filter === paisSeleccionado;
        return cumplePais && item.is_canceled === 0;
    });

    myChart.setOption({
        series: [{
            id: 'serie-principal',
            data: filtrados.map(item => ({
                value: modoActual === 'estancia' ? item.estancia : item.precio,
                itemStyle: { color: '#088216', opacity: 0.5 }
            }))
        }],
        graphic: [] 
    }, { replaceMerge: ['graphic'] });
};



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
    
    if (!dataSet.kids || !dataSet.totalDays) return { dataScatter: [], categoriasX };
    const paisesUnicos = [...new Set(Object.values(dataSet.country_filter || {}))].sort();
    Object.keys(dataSet.kids).forEach(idx => {
        const k = dataSet.kids[idx];
        const d = dataSet.totalDays[idx];
        const adr = dataSet.adr[idx];
        const country = dataSet.country_filter[idx];
        const canceled = dataSet.is_canceled ? dataSet.is_canceled[idx] : 0;
        
        // Filtramos para evitar valores nulos o fuera de rango
        if (k !== undefined && d !== undefined && k >= 0 && k <= 3) {
            dataScatter.push({
                // El valor DEBE ser un array [x, y]
                estancia: [k, d],
                precio:[k,adr],
                country_filter: country,
                is_canceled: canceled
            }); 
        }
    });

    return { dataScatter, categoriasX, paisesUnicos };
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
                id: 'serie-principal',
                name: 'Reservas',
                type: 'scatter',
                data: dataScatter.map(item => ({
                        value: item.estancia, 
                        is_canceled: item.is_canceled
                })),
                symbolSize: 6,
                universalTransition: { enabled: true },
                animationDuration: 1000, // Duración de la transició
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

// Inicializar todos los graficos
const initCharts = async () => {
    const dataSet = await leerDatos();
    if (!dataSet) return;

    // 1. Procesar datos
    const totalesKids = obtenerTotalesKidsBool(dataSet);
    infoGlobal = prepararDatosJitter(dataSet);
    infoGlobal.totalesKids = totalesKids;

    // 2. Llenar el select de países
    const select = document.getElementById('filtroPais');
    if (select) {
        infoGlobal.paisesUnicos.forEach(pais => {
            const opcion = document.createElement('option');
            opcion.value = pais;
            opcion.text = pais;
            select.appendChild(opcion);
        });
        select.addEventListener('change', filtrarPorPais);
    }

    // 3. Iniciar el gráfico
    myChart = echarts.init(document.getElementById("chart1"));
    myChart.setOption(getOptionJitter(infoGlobal, myChart.getWidth()));

    // 4. Listeners de botones con validación (para evitar errores si no están en el HTML)
    const btnCancelados = document.getElementById('btnCancelados');
    if (btnCancelados) btnCancelados.addEventListener('click', switchResaltado);

    const btnSoloNoCanceladas = document.getElementById('btnSoloNoCanceladas');
    if (btnSoloNoCanceladas) btnSoloNoCanceladas.addEventListener('click', filtrarNoCanceladas);

    const btnCambiarMetrica = document.getElementById('btnCambiarMetrica');
    if (btnCambiarMetrica) btnCambiarMetrica.addEventListener('click', cambiarMetrica);
};

window.addEventListener('load', initCharts);