var labels = []
var series = []

for(var datum of italyTestedSwabsDaily) {
    labels.push(datum.day.split('-')[2]);
    series.push(datum.tests);
}

new Chartist.Line('#italy-chart', {
    labels: labels,
    series: [series]
}, {
    fullWidth: true,
    low: 20000,
    showArea: true,
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
      }),
      Chartist.plugins.ctPointLabels({
          textAnchor: 'left',
          labelClass: 'italy-chart-point-label'
      })
    ]
});