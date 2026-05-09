const anotacionesCancelados = {
    "0": "37.31% Canc.",
    "1": "30.86% Canc.",
    "2": "41.15% Canc.",
    "3": "27.03% Canc."
};
let mostrandoResaltado = false;
let myChart;
let myChart2D;
let infoGlobal;
let mostrandoCancelados = false;
let modoActual = 'estancia';
let paisSeleccionado = 'todos';
let filtroSoloNoCanceladas = false;


const actualizarGrafico = () => {
    if (!infoGlobal) return;
    
    const datosFiltradosBase = infoGlobal.data3D.filter(item => {
        const cumplePais = paisSeleccionado === 'todos' || item.country_filter === paisSeleccionado;
        const cumpleNoCancelados = !filtroSoloNoCanceladas || item.is_canceled === 0;
        return cumplePais && cumpleNoCancelados;
    });

    
    if (myChart) {
        myChart.setOption({
            series: [{
                type: 'scatter3D',
                data: datosFiltradosBase.map(item => ({ value: item.value }))
            }]
        });
    }

    const markPointData = mostrandoResaltado ? Object.keys(anotacionesCancelados).map(key => ({
            name: 'Porcentaje',
            coord: [parseInt(key), modoActual === 'estancia' ? 40 : 400],
            value: anotacionesCancelados[key],
            itemStyle: { color: 'rgba(0,0,0,0)' },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}',
                color: '#ff4d4f',
                fontWeight: 'bold',
                fontSize: 14,
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: [4, 8],
                borderRadius: 4
            }
        })) : [];

    
    if (myChart2D) {
        myChart2D.setOption({
            title: {
                text: modoActual === 'estancia' ? 'Estancia por Niños' : 'Precio (ADR) por Niños'
            },
            yAxis: {
                name: modoActual === 'estancia' ? 'Días' : 'ADR'
            },
            series: [{
                type: 'scatter',
                data: datosFiltradosBase.map(item => ({
                    value: [item.value[0], modoActual === 'estancia' ? item.value[1] : item.value[2]],
                    itemStyle: {
                        color: !mostrandoResaltado ? '#5470c6' : (item.is_canceled === 1 ? '#ff4d4f' : '#088216'),
                        opacity: 0.6
                    }
                })),
                markPoint: {
                data: markPointData
                }
            }]
        });
    }
};

const filtrarPorPais = (evento) => {
    paisSeleccionado = evento.target.value;
    actualizarGrafico();
};

const switchResaltado = () => {
    mostrandoResaltado = !mostrandoResaltado;
    actualizarGrafico();
};

const cambiarMetrica = () => {
    modoActual = (modoActual === 'estancia') ? 'precio' : 'estancia';
    const btn = document.getElementById('btnCambiarMetrica');
    if (btn) btn.innerText = modoActual === 'estancia' ? 'Ver ADR' : 'Ver Estancia';
    actualizarGrafico();
};

const filtrarNoCanceladas = () => {
    filtroSoloNoCanceladas = !filtroSoloNoCanceladas;
    
    const btn = document.getElementById('btnSoloNoCanceladas');
    if (btn) btn.style.backgroundColor = filtroSoloNoCanceladas ? '#e6f7ff' : '#fff';
    
    actualizarGrafico();
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

// Todo lo relacionado a grafico en 3D //

const prepararDatos3D = (dataSet) => {
    const data3D = []; 
    
    const paisesUnicos = [...new Set(Object.values(dataSet.country_filter || {}))].sort();

    Object.keys(dataSet.kids || {}).forEach(idx => {
        const k = dataSet.kids[idx];
        const d = dataSet.totalDays[idx];
        const adr = dataSet.adr[idx];
        const country = dataSet.country_filter[idx];
        const canceled = dataSet.is_canceled ? dataSet.is_canceled[idx] : 0;
        
        if (k >= 0 && k <= 3) {
           
            data3D.push({
                value: [k, d, adr], 
                country_filter: country,
                is_canceled: canceled
            }); 
        }
    });

    return { data3D, paisesUnicos };
};

const getOption3D = (datos) => {
    return {
        tooltip: {},
        textStyle: {
            fontFamily: 'Libre Franklin', 
        },
        visualMap: {
            show: true,
            min: 0,
            max: 250, 
            dimension: 2,
            inRange: {
                color: ['#313695', '#4575b4', '#abd9e9', '#fee090', '#f46d43', '#a50026']
            }
        },
        xAxis3D: { 
            type: 'category', 
            name: 'Niños',
            data: ['0', '1', '2', '3']
        },
        yAxis3D: { 
            type: 'value', 
            name: 'Días' 
        },
        zAxis3D: { 
            type: 'value', 
            name: 'ADR' 
        },
        grid3D: {
            show: true, 
            boxWidth: 100,
            boxHeight: 80,
            boxDepth: 100,
            axisLine: { lineStyle: { color: '#000' } },
            axisPointer: { show: true },
            viewControl: {
                projection: 'perspective',
                autoRotate: false,
                distance: 200 
            },
            postEffect: {
                enable: true
            }
        },
        series: [{
            type: 'scatter3D',
            data: datos,
            symbolSize: 4,
            itemStyle: {
                opacity: 0.8
            }
        }]
    };
};




// Todo lo relacionado a grafico en 2D //
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
        
        
        if (k !== undefined && d !== undefined && k >= 0 && k <= 3) {
            dataScatter.push({
                
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
    
    const jitterWidth = (chartWidth / categoriasX.length) * 2.5;

    return {
        title: {
            animation: false,
            text: 'Estancia por cantidad de Niños',
            left: 'center',
            textStyle: {
                fontWeight: 'bold'
            }
        },
        textStyle: {
            fontFamily: 'Libre Franklin', 
        },
        tooltip: {
            trigger: 'item',
            triggerOn: 'click',
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
            },
            {
                id: 'dataZoomX',
                type: 'slider',
                xAxisIndex: [0],
                filterMode: 'filter',
                minSpan: 0,
                rangeMode: ['value', 'value'] 
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
            axisTick: { alignWithLabel: true },
            splitLine: {show: true},
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
                animationDuration: 4000,
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

    
    const info3D = prepararDatos3D(dataSet);
    infoGlobal = {
        data3D: info3D.data3D,
        paisesUnicos: info3D.paisesUnicos,
        totalesKids: obtenerTotalesKidsBool(dataSet)
    };

    
    const btnAgregar = document.getElementById('btnAgregar3D');
    const wrapper3D = document.getElementById('wrapper3D');
    const chartDom3D = document.getElementById("chart1");
    const chartDom2D = document.getElementById("chart2");

    
    if (chartDom2D) {
        myChart2D = echarts.init(chartDom2D);
        const info2D = prepararDatosJitter(dataSet);
        myChart2D.setOption(getOptionJitter({ 
            ...info2D, 
            totalesKids: infoGlobal.totalesKids 
        }, chartDom2D.clientWidth));
    }

    
    const select = document.getElementById('filtroPais');
    if (select) {
        select.innerHTML = '<option value="todos">Todos los países</option>';
        infoGlobal.paisesUnicos.forEach(p => {
            let opt = document.createElement('option');
            opt.value = p; opt.text = p;
            select.appendChild(opt);
        });
        select.addEventListener('change', filtrarPorPais);
    }

    
    document.getElementById('btnCancelados')?.addEventListener('click', switchResaltado);
    document.getElementById('btnSoloNoCanceladas')?.addEventListener('click', filtrarNoCanceladas);

    btnAgregar?.addEventListener('click', () => {
        
        if (wrapper3D.style.display === 'none' || wrapper3D.style.display === '') {
            
            wrapper3D.style.display = 'block'; 
            btnAgregar.innerText = 'Quitar Gráfico 3D';
            btnAgregar.classList.replace('btn-primary', 'btn-secondary'); 

            
            if (!myChart) {
                myChart = echarts.init(chartDom3D);
                myChart.setOption(getOption3D(infoGlobal.data3D));
            }

            
            setTimeout(() => {
                myChart.resize();
            }, 150);

        } else {
            
            wrapper3D.style.display = 'none';
            btnAgregar.innerText = 'Agregar Gráfico 3D';
            btnAgregar.classList.replace('btn-secondary', 'btn-primary');
        }
    });

    
    window.addEventListener('resize', () => {
        if (myChart2D) myChart2D.resize();
        
        if (myChart && wrapper3D.style.display !== 'none') {
            myChart.resize();
        }
    });
};


window.addEventListener('load', initCharts);