/**
 * Chartist.js plugin to display a title for 1 or 2 axes.
 * version 0.0.7
 * author: alex stanbury
 */
/* global Chartist */
(function(Chartist) {
  "use strict";

  var axisDefaults = {
    axisTitle: "",
    axisClass: "ct-axis-title",
    offset: {
      x: 0,
      y: 0
    },
    textAnchor: "middle",
    flipTitle: false
  };

  var defaultOptions = {
    axisX: axisDefaults,
    axisY: axisDefaults
  };

  var getTitle = function(title) {
    if (title instanceof Function) {
      return title();
    }
    return title;
  };

  var getClasses = function(classes) {
    if (classes instanceof Function) {
      return classes();
    }
    return classes;
  };

  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.ctAxisTitle = function(options) {
    options = Chartist.extend({}, defaultOptions, options);

    return function ctAxisTitle(chart) {
      chart.on("created", function(data) {
        if (!options.axisX.axisTitle && !options.axisY.axisTitle) {
          throw new Error(
            "ctAxisTitle plugin - You must provide at least one axis title"
          );
        } else if (!data.axisX && !data.axisY) {
          throw new Error(
            "ctAxisTitle plugin can only be used on charts that have at least one axis"
          );
        }

        var xPos,
          yPos,
          title,
          chartPadding = Chartist.normalizePadding(data.options.chartPadding); // normalize the padding in case the full padding object was not passed into the options

        //position axis X title
        if (options.axisX.axisTitle && data.axisX) {
          xPos =
            data.axisX.axisLength / 2 +
            data.options.axisY.offset +
            chartPadding.left;

          yPos = chartPadding.top;

          if (data.options.axisY.position === "end") {
            xPos -= data.options.axisY.offset;
          }

          if (data.options.axisX.position === "end") {
            yPos += data.axisY.axisLength;
          }

          title = new Chartist.Svg("text");
          title.addClass(getClasses(options.axisX.axisClass));
          title.text(getTitle(options.axisX.axisTitle));
          title.attr({
            x: xPos + options.axisX.offset.x,
            y: yPos + options.axisX.offset.y,
            "text-anchor": options.axisX.textAnchor
          });

          data.svg.append(title, true);
        }

        //position axis Y title
        if (options.axisY.axisTitle && data.axisY) {
          xPos = 0;

          yPos = data.axisY.axisLength / 2 + chartPadding.top;

          if (data.options.axisX.position === "start") {
            yPos += data.options.axisX.offset;
          }

          if (data.options.axisY.position === "end") {
            xPos = data.axisX.axisLength;
          }

          var transform =
            "rotate(" +
            (options.axisY.flipTitle ? -90 : 90) +
            ", " +
            xPos +
            ", " +
            yPos +
            ")";

          title = new Chartist.Svg("text");
          title.addClass(getClasses(options.axisY.axisClass));
          title.text(getTitle(options.axisY.axisTitle));
          title.attr({
            x: xPos + options.axisY.offset.x,
            y: yPos + options.axisY.offset.y,
            transform: transform,
            "text-anchor": options.axisY.textAnchor
          });
          data.svg.append(title, true);
        }
      });
    };
  };
})(Chartist);

// ----------


/**
* Chartist.js plugin to display a data label on top of the points in a line chart.
*
*/
/* global Chartist */
(function (window, document, Chartist) {
  'use strict';

  var defaultOptions = {
    currency: undefined,
    currencyFormatCallback: undefined,
    tooltipOffset: {
      x: 0,
      y: -20
    },
    anchorToPoint: false,
    appendToBody: false,
    class: undefined,
    pointClass: 'ct-point'
  };

  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.tooltip = function (options) {
    options = Chartist.extend({}, defaultOptions, options);

    return function tooltip(chart) {
      var tooltipSelector = options.pointClass;
      if (chart.constructor.name == Chartist.Bar.prototype.constructor.name) {
        tooltipSelector = 'ct-bar';
      } else if (chart.constructor.name ==  Chartist.Pie.prototype.constructor.name) {
        // Added support for donut graph
        if (chart.options.donut) {
          // Added support or SOLID donut graph
          tooltipSelector = chart.options.donutSolid ? 'ct-slice-donut-solid' : 'ct-slice-donut';
        } else {
          tooltipSelector = 'ct-slice-pie';
        }
      }

      var $chart = chart.container;
      var $toolTip = $chart.querySelector('.chartist-tooltip');
      if (!$toolTip) {
        $toolTip = document.createElement('div');
        $toolTip.className = (!options.class) ? 'chartist-tooltip' : 'chartist-tooltip ' + options.class;
        if (!options.appendToBody) {
          $chart.appendChild($toolTip);
        } else {
          document.body.appendChild($toolTip);
        }
      }
      var height = $toolTip.offsetHeight;
      var width = $toolTip.offsetWidth;

      hide($toolTip);

      function on(event, selector, callback) {
        $chart.addEventListener(event, function (e) {
          if (!selector || hasClass(e.target, selector))
          callback(e);
        });
      }

      on('mouseover', tooltipSelector, function (event) {
        var $point = event.target;
        var tooltipText = '';

        var isPieChart = (chart instanceof Chartist.Pie) ? $point : $point.parentNode;
        var seriesName = (isPieChart) ? $point.parentNode.getAttribute('ct:meta') || $point.parentNode.getAttribute('ct:series-name') : '';
        var meta = $point.getAttribute('ct:meta') || seriesName || '';
        var hasMeta = !!meta;
        var value = $point.getAttribute('ct:value');

        if (options.transformTooltipTextFnc && typeof options.transformTooltipTextFnc === 'function') {
          value = options.transformTooltipTextFnc(value);
        }

        if (options.tooltipFnc && typeof options.tooltipFnc === 'function') {
          tooltipText = options.tooltipFnc(meta, value);
        } else {
          if (options.metaIsHTML) {
            var txt = document.createElement('textarea');
            txt.innerHTML = meta;
            meta = txt.value;
          }

          meta = '<span class="chartist-tooltip-meta">' + meta + '</span>';

          if (hasMeta) {
            tooltipText += meta + '<br>';
          } else {
            // For Pie Charts also take the labels into account
            // Could add support for more charts here as well!
            if (chart instanceof Chartist.Pie) {
              var label = next($point, 'ct-label');
              if (label) {
                tooltipText += text(label) + '<br>';
              }
            }
          }

          if (value) {
            if (options.currency) {
              if (options.currencyFormatCallback != undefined) {
                value = options.currencyFormatCallback(value, options);
              } else {
                value = options.currency + value.replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, '$1,');
              }
            }
            value = '<span class="chartist-tooltip-value">' + value + '</span>';
            tooltipText += value;
          }
        }

        if(tooltipText) {
          $toolTip.innerHTML = tooltipText;
          setPosition(event);
          show($toolTip);

          // Remember height and width to avoid wrong position in IE
          height = $toolTip.offsetHeight;
          width = $toolTip.offsetWidth;
        }
      });

      on('mouseout', tooltipSelector, function () {
        hide($toolTip);
      });

      on('mousemove', null, function (event) {
        if (false === options.anchorToPoint)
        setPosition(event);
      });

      function setPosition(event) {
        height = height || $toolTip.offsetHeight;
        width = width || $toolTip.offsetWidth;
        var offsetX = - width / 2 + options.tooltipOffset.x
        var offsetY = - height + options.tooltipOffset.y;
        var anchorX, anchorY;

        if (!options.appendToBody) {
          var box = $chart.getBoundingClientRect();
          var left = event.pageX - box.left - window.pageXOffset ;
          var top = event.pageY - box.top - window.pageYOffset ;

          if (true === options.anchorToPoint && event.target.x2 && event.target.y2) {
            anchorX = parseInt(event.target.x2.baseVal.value);
            anchorY = parseInt(event.target.y2.baseVal.value);
          }

          $toolTip.style.top = (anchorY || top) + offsetY + 'px';
          $toolTip.style.left = (anchorX || left) + offsetX + 'px';
        } else {
          $toolTip.style.top = event.pageY + offsetY + 'px';
          $toolTip.style.left = event.pageX + offsetX + 'px';
        }
      }
    }
  };

  function show(element) {
    if(!hasClass(element, 'tooltip-show')) {
      element.className = element.className + ' tooltip-show';
    }
  }

  function hide(element) {
    var regex = new RegExp('tooltip-show' + '\\s*', 'gi');
    element.className = element.className.replace(regex, '').trim();
  }

  function hasClass(element, className) {
    return (' ' + element.getAttribute('class') + ' ').indexOf(' ' + className + ' ') > -1;
  }

  function next(element, className) {
    do {
      element = element.nextSibling;
    } while (element && !hasClass(element, className));
    return element;
  }

  function text(element) {
    return element.innerText || element.textContent;
  }

} (window, document, Chartist));

// -------------

/**
 * Chartist.js plugin to display a data label on top of the points in a line chart.
 *
 */
/* global Chartist */
(function(window, document, Chartist) {
  'use strict';

  var defaultOptions = {
    labelClass: 'ct-label',
    labelOffset: {
      x: 0,
      y: -10
    },
    textAnchor: 'middle',
    align: 'center',
    labelInterpolationFnc: Chartist.noop
  };

  var labelPositionCalculation = {
    point: function(data) {
      return {
        x: data.x,
        y: data.y
      };
    },
    bar: {
      left: function(data) {
        return {
          x: data.x1,
          y: data.y1
        };
      },
      center: function(data) {
        return {
          x: data.x1 + (data.x2 - data.x1) / 2,
          y: data.y1
        };
      },
      right: function(data) {
        return {
          x: data.x2,
          y: data.y1
        };
      }
    }
  };

  Chartist.plugins = Chartist.plugins || {};
  Chartist.plugins.ctPointLabels = function(options) {

    options = Chartist.extend({}, defaultOptions, options);

    function addLabel(position, data) {
      // if x and y exist concat them otherwise output only the existing value
      var value = data.value.x !== undefined && data.value.y ?
        (data.value.x + ', ' + data.value.y) :
        data.value.y || data.value.x;

      data.group.elem('text', {
        x: position.x + options.labelOffset.x,
        y: position.y + options.labelOffset.y,
        style: 'text-anchor: ' + options.textAnchor
      }, options.labelClass).text(options.labelInterpolationFnc(value));
    }

    return function ctPointLabels(chart) {
      if (chart instanceof Chartist.Line || chart instanceof Chartist.Bar) {
        chart.on('draw', function(data) {
          var positonCalculator = labelPositionCalculation[data.type] && labelPositionCalculation[data.type][options.align] || labelPositionCalculation[data.type];
          if (positonCalculator) {
            addLabel(positonCalculator(data), data);
          }
        });
      }
    };
  };

}(window, document, Chartist));