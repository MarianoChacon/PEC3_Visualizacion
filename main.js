const filtrarDatosPorPais = (dataSet, seleccion) => {
    const paisesUnicos = [...new Set(Object.values(dataSet.country))].sort();

    if (seleccion === "todos") {
        // Calculamos la suma para cada país individualmente
        const sumasTotales = paisesUnicos.map(pais => {
            const indices = Object.keys(dataSet.country).filter(key => dataSet.country[key] === pais);
            return indices.reduce((acc, idx) => acc + (dataSet.children[idx] || 0), 0);
        });
        return { datos: sumasTotales, etiquetas: paisesUnicos };
    } else {
        // Lógica para un solo país
        const indices = Object.keys(dataSet.country).filter(key => dataSet.country[key] === seleccion);
        const sumaTotal = indices.reduce((acc, idx) => acc + (dataSet.children[idx] || 0), 0);
        return { datos: [sumaTotal], etiquetas: [seleccion] };
    }
};

async function leerDatos() {
    try {
        const respuesta = await fetch('hotel_bookings_clean.json');
        return await respuesta.json();
    } catch (error) {
        console.error("Error cargando el JSON:", error);
    }
};

const getOptionChart1 = (dataToShow, labelsToShow) => {
return {
  xAxis: {
    type: 'category',
    data: labelsToShow
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: dataToShow,
      type: 'bar'
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
            chart1.setOption(getOptionChart1(resultado.datos, resultado.etiquetas), true); 
        };

        actualizarGrafico("todos");

        filterSelect.addEventListener('change', (e) => {
            actualizarGrafico(e.target.value);
        });

        window.addEventListener('resize', () => chart1.resize());
    }
};

window.addEventListener('load', initCharts);