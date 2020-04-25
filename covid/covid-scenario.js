var slider = new Slider("#scenario-selector-slider", {
    ticks: [0, 10, 20, 30],
    ticks_labels: ['Regional', '100Km', '200Km', '400Km'],
    ticks_snap_bounds: 5,
    value: 0
});

var models = {
    0: 'Regional',
    10: '100Km',
    20: '200Km',
    30: '400Km'
};

var linesData = {
    'Regional': lfLinesRegional,
    '100Km': lfLines100,
    '200Km': lfLines200,
    '400Km': lfLines400
}

var testsData = {
    'Regional': testsRegional,
    '100Km': tests100,
    '200Km': tests200,
    '400Km': tests400
}

var linesOpacity = {
    'Regional': 0.7,
    '100Km': 0.5,
    '200Km': 0.4,
    '400Km': 0.3
}

function totTests(data) {
    var tot = 0;
    for(var el of data) {
        tot += el.tests;
    }
    return tot;
}

var totReal = totTests(italyTestedSwabsDaily);
var gainModel = {
    'Regional': "+" + Math.round(100 * 100 * (totTests(testsRegional) - totReal) / totReal) / 100 + "%",
    '100Km':    "+" + Math.round(100 * 100 * (totTests(tests100) - totReal) / totReal) / 100 + "%",
    '200Km':    "+" + Math.round(100 * 100 * (totTests(tests200) - totReal) / totReal) / 100 + "%",
    '400Km':    "+" + Math.round(100 * 100 * (totTests(tests400) - totReal) / totReal) / 100 + "%"
};

var chartLabels = [];
var chartSeries = [];
function addRealDataChart() {
    chartSeries.push([]);

    for(var datum of italyTestedSwabsDaily) {
        chartLabels.push(datum.day.split('-')[2]);
        chartSeries[0].push(datum.tests);
    }

    return new Chartist.Line('#scenario-swabs-tested', {
        labels: labels,
        series: series
    }, {
        fullWidth: true,
        showArea: true,
        low: 20000,
        high: 65000,
        chartPadding: {
            left: 40,
            bottom: 40,
            right: 40
        },
        plugins: [
            Chartist.plugins.ctAxisTitle({
                axisX: {
                    axisTitle: 'Day of April',
                    offset: {
                        x: 0,
                        y: 50
                    },
                    textAnchor: 'middle'
                },
                axisY: {
                    axisTitle: 'Tested swabs',
                    offset: {
                        x: 0,
                        y: 15
                    },
                    textAnchor: 'middle',
                    flipTitle: true
                }
            })
        ]
    });
}

var mapBoxAccessToken = "pk.eyJ1IjoiYWxiZXJ0b3NhbnRpbmkiLCJhIjoiY2s5NzkzZ3R4MGE4YjNsbWdwb2d2b2V1ZSJ9.CpsyxeVLiqygz6YLQc0sZQ";
var lmap = L.map('scenario-labs-clusters').setView([42, 12.5], 6);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 10,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: mapBoxAccessToken
}).addTo(lmap);
var currentLines = L.featureGroup().addTo(lmap);
var currentModelMap = "";
var currentModelChart = "";
var chart = addRealDataChart();

for(labData of lfLabs) {
    lmap.addLayer(L.circleMarker(
        L.latLng(labData.lat, labData.lon),
        {
            radius: 4,
            stroke: false,
            fill: true,
            fillColor: '#3B7F58',
            fillOpacity: 1.0
        })
    );
}

function addLines(lines, opacity) {
    for(l of lines) {
        ln = L.polyline([
            [l.start_lat, l.start_lon],
            [l.end_lat, l.end_lon]
        ], {
            color: '#3B7F58',
            opacity: opacity,
            weight: 1
        }).addTo(currentLines);
    }
}

function loadLabsMap(model) {
    if(model == currentModelMap) {
        return;
    }
    currentModelMap = model;

    currentLines.clearLayers();
    addLines(linesData[model], linesOpacity[model]);
}

function loadResultsChart(model) {
    if(model == currentModelChart) {
        return;
    }
    currentModelChart = model;

    if(chartSeries.length > 1) {
        chartSeries.pop();
    }

    if(chartSeries.length != 1) {
        console.error("Unexpected series size!");
    }

    chartSeries.push([])
    for(var el of testsData[model]) {
        chartSeries[1].push(el.tests);
    }

    console.log(chartSeries);

    chart.update({labels: chartLabels, series: chartSeries});
}

slider.setValue(0);
document.getElementById('model-name').innerHTML = 'Regional';
document.getElementById('model-gain').innerHTML = gainModel['Regional'];
loadLabsMap('Regional');
loadResultsChart('Regional')

slider.on("change", function(e) {
    var allowedValues = slider.getAttribute("ticks");

    if(allowedValues.includes(e.newValue)) {
        document.getElementById('model-name').innerHTML = models[e.newValue];
        document.getElementById('model-gain').innerHTML = gainModel[models[e.newValue]];

        loadLabsMap(models[e.newValue]);
        loadResultsChart(models[e.newValue]);
    }
});