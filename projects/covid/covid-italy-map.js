var mapBoxAccessToken = "pk.eyJ1IjoiYWxiZXJ0b3NhbnRpbmkiLCJhIjoiY2s5NzkzZ3R4MGE4YjNsbWdwb2d2b2V1ZSJ9.CpsyxeVLiqygz6YLQc0sZQ";
var map = L.map('italy-map').setView([42, 12.5], 6);
var geojson;

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 10,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: mapBoxAccessToken
}).addTo(map);

var minTests = Infinity;
var maxTests = 0;
for(const [regName, regTests] of Object.entries(italyTests)) {
    italyRegions.features.forEach(function(feat, id, ary) {
        var featName = feat.properties.name;

        if(featName == regName.toLowerCase()) {
            ary[id].properties.tests = regTests;
        }
    });

    if(regTests < minTests) {
        minTests = regTests;
    }

    if(regTests > maxTests) {
        maxTests = regTests;
    }
}

function getColour(tests) {
    if(tests < minTests) {
        tests = minTests;
    }

    if(tests > maxTests) {
        tests = maxTests;
    }

    var normalised = (tests - minTests) / (maxTests - minTests);
    var colour = interpolateLinearly(normalised, Blues);
    var rgb = "rgb(" + Math.round(colour[0]*255) + ","
                     + Math.round(colour[1]*255) + ","
                     + Math.round(colour[2]*255) + ")";

    return rgb;
}

function style(feature) {
    return {
        fillColor: getColour(feature.properties.tests),
        weight: 2,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.8
    }
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: 'white',
        fillOpacity: 0.8
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

geojson = L.geoJson(italyRegions, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'list-group map-info');
    this.update();
    return this._div;
};

info.update = function (props) {
    this._div.innerHTML =
        '<header class="list-group-item"><h1>Number of swabs tested</h1></header>' +
        (props ?
            '<div class="list-group-item"><strong>' + props.name + '</strong><br>' + props.tests + ' swabs tested</div>' :
            '<div class="list-group-item">Hover over a region</div>'
        );
};

info.addTo(map);

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'list-group map-legend');
    var grades = [2000, 5000, 10000, 25000, 50000, 75000, 90000];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<div class="list-group-item map-legend-entry">' +
            '<span style="background-color: ' +
            getColour(grades[i]) +
            ';"></span> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+') +
            '</div>';
    }

    return div;
};

legend.addTo(map);