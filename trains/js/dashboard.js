// ==== Caution: SPAGHETTI CODE AHEAD

var default_ted = new TrainEnergyData({});

// ==== Mass ================================================================================

var min_mass = 100000;
var max_mass = 1000000;
var step_mass = 10000;
var slider_mass = $("input.slider[name=mass-slider]").slider({
  'min': min_mass,
  'max': max_mass,
  'step': step_mass,
  'value': default_ted.mass
});
var num_mass = $("input[name=mass]");

num_mass.val(slider_mass.slider('getValue'));

slider_mass.change(function() {
  num_mass.val(slider_mass.slider('getValue'));
  check_valid_values();
});

num_mass.change(function() {
  var n = num_mass.val();
  
  if($.isNumeric(n)) {
    var nn = parseFloat(n);
    
    if(min_mass <= nn && nn <= max_mass) {
      slider_mass.slider('setValue', nn);
      check_valid_values();
    }
  }
});

// ==== x1,x2,x3 ================================================================================

var min_x = 0;
var max_x = 10000;
var step_x = 100;
var slider_x = [];
var num_x = [];

for(var i = 1; i <= 3; ++i) {
  slider_x[i] = $("input.slider[name=x" + i + "-slider]").slider({
    'min': min_x,
    'max': max_x,
    'step': step_x,
    'value': default_ted.x[i-1]
  });
  
  num_x[i] = $("input[name=x" + i + "]");
  num_x[i].val(slider_x[i].slider('getValue'));
}

slider_x[1].change(function() {
  num_x[1].val(slider_x[1].slider('getValue'));
  check_valid_values();
});

num_x[1].change(function() {
  var n = num_x[1].val();
  
  if($.isNumeric(n)) {
    var nn = parseFloat(n);
    
    if(min_x <= nn && nn <= max_x) {
      slider_x[1].slider('setValue', nn);
      check_valid_values();
    }
  }
});

slider_x[2].change(function() {
  num_x[2].val(slider_x[2].slider('getValue'));
  check_valid_values();
});

num_x[2].change(function() {
  var n = num_x[2].val();
  
  if($.isNumeric(n)) {
    var nn = parseFloat(n);
    
    if(min_x <= nn && nn <= max_x) {
      slider_x[2].slider('setValue', nn);
      check_valid_values();
    }
  }
});

slider_x[3].change(function() {
  num_x[3].val(slider_x[3].slider('getValue'));
  check_valid_values();
});

num_x[3].change(function() {
  var n = num_x[3].val();
  
  if($.isNumeric(n)) {
    var nn = parseFloat(n);
    
    if(min_x <= nn && nn <= max_x) {
      slider_x[3].slider('setValue', nn);
      check_valid_values();
    }
  }
});

// ==== Breaking force ================================================================================

var min_brk = 20000;
var max_brk = 150000;
var step_brk = 5000;
var slider_brk = $("input.slider[name=brk-slider]").slider({
  'min': min_brk,
  'max': max_brk,
  'step': step_brk,
  'value': default_ted.brk
});
var num_brk = $("input[name=brk]");

num_brk.val(slider_brk.slider('getValue'));

slider_brk.change(function() {
  num_brk.val(slider_brk.slider('getValue'));
  check_valid_values();
});

num_brk.change(function() {
  var n = num_brk.val();
  
  if($.isNumeric(n)) {
    var nn = parseFloat(n);
    
    if(min_brk <= nn && nn <= max_brk) {
      slider_brk.slider('setValue', nn);
      check_valid_values();
    }
  }
});

// ==== Theta ================================================================================

var min_theta = -0.2;
var max_theta = 0.2;
var step_theta = 0.01;
var slider_theta = $("input.slider[name=theta-slider]").slider({
  'min': min_theta,
  'max': max_theta,
  'step': step_theta,
  'value': default_ted.theta
});
var num_theta = $("input[name=theta]");

num_theta.val(slider_theta.slider('getValue'));

slider_theta.change(function() {
  num_theta.val(slider_theta.slider('getValue'));
  check_valid_values();
});

num_theta.change(function() {
  var n = num_theta.val();
  
  if($.isNumeric(n)) {
    var nn = parseFloat(n);
    
    if(min_theta <= nn && nn <= max_theta) {
      slider_theta.slider('setValue', nn);
      check_valid_values();
    }
  }
});

// ==== Davis equation ================================================================================

$("input[name=a]").val(default_ted.a);
$("input[name=b]").val(default_ted.b);
$("input[name=c]").val(default_ted.c);

// ==== Tractive effort ================================================================================

$("input[name=f1]").val(default_ted.f1);
$("input[name=f2]").val(default_ted.f2);
$("input[name=fv2]").val(default_ted.fv2);
$("input[name=f3]").val(default_ted.f3);
$("input[name=fv3]").val(default_ted.fv3);

var update = $("button#update-graph");

update.click(function() {
  if(check_valid_values()) {
    var ted = new TrainEnergyData({
      'x1': parseFloat(num_x[1].val()),
      'x2': parseFloat(num_x[2].val()),
      'x3': parseFloat(num_x[3].val()),
      'f1': parseFloat($("input[name=f1]").val()),
      'f2': parseFloat($("input[name=f2]").val()),
      'fv2': parseFloat($("input[name=fv2]").val()),
      'f3': parseFloat($("input[name=f3]").val()),
      'fv3': parseFloat($("input[name=fv3]").val()),
      'brk': parseFloat(num_brk.val()),
      'mass': parseFloat(num_mass.val()),
      'a': parseFloat($("input[name=a]").val()),
      'b': parseFloat($("input[name=b]").val()),
      'c': parseFloat($("input[name=c]").val()),
      'theta': parseFloat(num_theta.val()) * Math.PI / 180
    });
            
    update.prop('disabled', true);
    redraw(ted);
    update.prop('disabled', false);
  }
});

// =================================================================

var check_valid_x = function() {
  var valid = true;
  
  if($.isNumeric(num_x[1].val()) && $.isNumeric(num_x[2].val())) {
    var x1 = parseFloat(num_x[1].val());
    var x2 = parseFloat(num_x[2].val());
    
    if(x1 > x2) {
      num_x[1].css('border-color', 'red');
      num_x[1].css('color', 'red');
      num_x[2].css('border-color', 'red');
      num_x[2].css('color', 'red');
      valid = false;
    } else {
      num_x[1].css('border-color', 'black');
      num_x[1].css('color', 'black');
      num_x[2].css('border-color', 'black');
      num_x[2].css('color', 'black');
    }
  } else {
    valid = false;
  }

  if($.isNumeric(num_x[2].val()) && $.isNumeric(num_x[3].val())) {
    var x2 = parseFloat(num_x[2].val());
    var x3 = parseFloat(num_x[3].val());
    
    if(x2 > x3) {
      num_x[2].css('border-color', 'red');
      num_x[2].css('color', 'red');
      num_x[3].css('border-color', 'red');
      num_x[3].css('color', 'red');
      valid = false;
    } else {
      if($.isNumeric(num_x[1].val()) && parseFloat(num_x[1].val()) <= x2) {
        num_x[2].css('border-color', 'black');
        num_x[2].css('color', 'black');
      }
      
      num_x[3].css('border-color', 'black');
      num_x[3].css('color', 'black');
    }
  } else {
    valid = false;
  }
  
  return valid;
}

var check_numeric_and_bounds = function(element, lb, ub) {
  if($.isNumeric(element.val())) {
    if(lb <= parseFloat(element.val()) && parseFloat(element.val()) <= ub) {
      element.css('border-color', 'black');
      element.css('color', 'black');
      $("#error-message").html("");
      return true;
    }
  }
  
  element.css('border-color', 'red');
  element.css('color', 'red');
  $("#error-message").html("Error in data!");
  return false;
}

var check_valid_values = function() {
  return check_valid_x() &&
    check_numeric_and_bounds(num_mass, min_mass, max_mass) &&
    check_numeric_and_bounds(num_brk, min_brk, max_brk) &&
    check_numeric_and_bounds(num_x[1], min_x, max_x) &&
    check_numeric_and_bounds(num_x[2], min_x, max_x) &&
    check_numeric_and_bounds(num_x[3], min_x, max_x) &&
    check_numeric_and_bounds(num_theta, min_theta, max_theta) &&
    check_numeric_and_bounds($("input[name=a]"), 0, 10000) &&
    check_numeric_and_bounds($("input[name=b]"), 0, 100) &&
    check_numeric_and_bounds($("input[name=c]"), 0, 10) &&
    check_numeric_and_bounds($("input[name=f1]"), 0, 200000) &&
    check_numeric_and_bounds($("input[name=f2]"), 0, 200000) &&
    check_numeric_and_bounds($("input[name=fv2]"), 0, 20000) &&
    check_numeric_and_bounds($("input[name=f3]"), 0, 200000) &&
    check_numeric_and_bounds($("input[name=fv3]"), 0, 20000);
}