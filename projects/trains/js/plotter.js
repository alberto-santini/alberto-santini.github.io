var chart;

nv.addGraph(function() {
  chart = nv.models.lineChart()
            .margin({left: 100})
            .useInteractiveGuideline(true)
            .showLegend(true)
            .showYAxis(true)
            .showXAxis(true)
            .width(800)
            .height(500);

  chart.xAxis
    .axisLabel('Position (m)')
    .tickFormat(d3.format(',r'));

  chart.yAxis
    .axisLabel('Speed (m/s)')
    .tickFormat(d3.format('.02f'));

  var myData = positionSpeedProfile(new TrainEnergyData({}));

  d3.select('#position-speed-canvas svg')
    .datum(myData)
    .call(chart)
    .style({'width': '100%', 'height': '100%'});

  nv.utils.windowResize(function() { chart.update() });
  
  return chart;
});

var redraw = function(ted) {
  var myData = positionSpeedProfile(ted);
  
  d3.select('#position-speed-canvas svg')
    .datum(myData)
    .call(chart)
    .style({'width': '100%', 'height': '100%'});
}

var positionSpeedProfile = function(ted) {
  var data = [];
  var last_speed = 0.0;
  var zeroed = 1;
  data.push({x: 0, y: last_speed});
    
  // Maximum acceleration
  for(var i = 1; i < ted.x1; ++i) {
    var speed = ted.next_speed_umax(last_speed);
    data.push({
      x: i,
      y: speed
    });
    last_speed = speed;
    if(speed < 0) {
      zeroed = i;
      break;
    }
  }

  // Cruising
  for(var i = ted.x1; i < ted.x2; ++i) {
    var speed = ted.next_speed_cruise(last_speed);
    data.push({
      x: i,
      y: speed
    });
    last_speed = speed;
    if(speed < 0) {
      zeroed = i;
      break;
    }
  }

  // Coasting
  for(var i = ted.x2; i < ted.x3; ++i) {
    var speed = ted.next_speed_coast(last_speed);
    data.push({
      x: i,
      y: speed
    });
    last_speed = speed;
    if(speed < 0) {
      zeroed = i;
      break;
    }
  }

  // Maximum breaking
  var i = ted.x3;
  var speed = last_speed;

  while(speed > 0.0) {
    speed = ted.next_speed_umin(last_speed);
    data.push({
      x: i,
      y: speed
    });
    last_speed = speed;
    ++i;
    zeroed = i;
  }

  // Zero an eventually negative value
  data.pop();
  data.push({x: zeroed, y: 0.0});
  
  return [
    {
      values: data,
      key: 'Speed vs position',
      color: '#ff7f0e'
    }
  ];
}