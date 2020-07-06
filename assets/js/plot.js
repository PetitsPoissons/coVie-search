// function to fetch data for the plot
var fetchPlotData = (inputCounty, inputState) => {
    plotData = [];
    var date = '';
    for (var i=1; i<31; i++) {
        // adjust date for next fetch
        date = moment().subtract(i, 'd').format('YYYY-MM-DD');
        // fetch covid data for that date, inputCity and inputState
        fetch(`https://covid-19-statistics.p.rapidapi.com/reports?iso=USA&region_province=${inputState}&city_name=${inputCounty}&date=${date}`, {
	        "method": "GET",
	        "headers": {
		        "x-rapidapi-host": "covid-19-statistics.p.rapidapi.com",
		        "x-rapidapi-key": "0963280af0msh0e5fedbfcf26176p193969jsndbe28f1cd420"
	        }
        })
        .then(response => response.json())
        .then(res => savePlotData(res))
        .catch(err => console.log(err));
    }
};

// function to collect relevant plot data
var savePlotData = (dataObj) => {
    var dataPointObj = {};
    dataPointObj['date'] = dataObj.data[0].region.cities[0].date;
    dataPointObj['confirmed'] = dataObj.data[0].region.cities[0].confirmed;
    dataPointObj['deaths'] = dataObj.data[0].region.cities[0].deaths;
    plotData.push(dataPointObj);
    if (plotData.length === 30) {
        displayPlot();
    }
};

// function to display the Plotly plot
var displayPlot = () => {
    // sort plotData by date
    plotData.sort((a, b) => {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    var dates = [];
    var confirmedCases = [];
    var deaths = [];
    plotData.forEach(obj => {
        dates.push(obj.date);
        confirmedCases.push(obj.confirmed);
        deaths.push(obj.deaths);
    });

    // create the traces
    var trace1 = {
        name: '# cases',
        x: dates,
        y: confirmedCases,
        mode: 'lines',
        line: {
            color: 'rgb(91, 192, 222)',
            width: 3
          },
    };
    var trace2 = {
        name: '# deaths',
        x: dates,
        y: deaths,
        mode: 'lines',
        line: {
            color: 'rgb(217, 83, 79)',
            width: 3
          }
    }

    // create the data array for the plot
    var data = [trace1, trace2];

    // define the plot layout
    var layout = {
        xaxis: {
            title: '30-DAY TREND',
            showgrid: false,
            zeroline: false,
            showline: false
        },
        yaxis: {
            showline: false,
            gridcolor: '#ffffff'
        },
        legend: {
            x: 0,
            y: 1.2,
            orientation: 'h'
        },
                margin: {
            l: 50,
            r: 0,
            b: 50,
            t: 0,
            pad: 4
        },
        autosize: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    };

    var config = {
        scrollZoom: false,
        displaylogo: false,
        responsive: true,
        displayModeBar: false
    };

    // display the chart
    Plotly.newPlot('plot', data, layout, config);
};