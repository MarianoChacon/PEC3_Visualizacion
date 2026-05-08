const filtrarDatosPorPais = (dataSet, seleccion) => {
    let indices;
    
    if (seleccion === "todos") {
        indices = Object.keys(dataSet.country);
    } else {
        indices = Object.keys(dataSet.country).filter(
            key => dataSet.country[key] === seleccion
        );
    }

    const paresValores = indices.map(idx => {
        return [
            dataSet.kids[idx] || 0,
            dataSet.totalDays[idx] || 0
        ];
    });

    return paresValores;
};

async function leerDatos() {
    try {
        const respuesta = await fetch('hotel_bookings_clean.json');
        return await respuesta.json();
    } catch (error) {
        console.error("Error cargando el JSON:", error);
    }
};

const getOptionChart1 = (dataToShow) => {
return {
  xAxis: {
    scale: true
  },
  yAxis: {
    scale: true
  },
  series: [
    // {
    //   type: 'effectScatter',
    //   symbolSize: 20,
    //   data: [
    //     dataToShow[5],
    //     dataToShow[6000]
    //   ]
    // },
    {
      type: 'scatter',
      // prettier-ignore
      data: dataToShow
    }
  ]
};
};

const initCharts = async () => {
    const chartDom1 = document.getElementById("chart1");
    const filterSelect = document.getElementById("miFiltro"); 

    if (chartDom1) {

        const dataSet = await leerDatos(); 
        if (!dataSet) return;

        const todosLosPaises = Object.values(dataSet.country);
        const paisesUnicos = [...new Set(todosLosPaises)].sort();

        filterSelect.innerHTML = `<option value="todos">Todos los países</option>` + 
            paisesUnicos.map(pais => `<option value="${pais}">${pais}</option>`).join('');

        const chart1 = echarts.init(chartDom1);
        
        const actualizarGrafico = (seleccion) => {
            const resultado = filtrarDatosPorPais(dataSet, seleccion);
            // 'resultado' ya contiene los pares [kids, totalDays]
            chart1.setOption(getOptionChart1(resultado), true); 
        };

        actualizarGrafico("todos");

        filterSelect.addEventListener('change', (e) => {
            actualizarGrafico(e.target.value);
        });

        window.addEventListener('resize', () => chart1.resize());
    }
};

window.addEventListener('load', initCharts);