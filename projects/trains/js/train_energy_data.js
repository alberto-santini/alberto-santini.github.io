function TrainEnergyData(options) {
  var option_or_default = function(option, default_value) {
    if(typeof option == "undefined") {
      return default_value;
    }
    return option;
  }
    
  this.x1 = option_or_default(options['x1'], 1000);
  this.x2 = option_or_default(options['x2'], 3000);
  this.x3 = option_or_default(options['x3'], 5000);
  
  this.f1 = option_or_default(options['f1'], 50000);
  this.f2 = option_or_default(options['f2'], 56100);
  this.f3 = option_or_default(options['f3'], 33300);
  this.fv2 = option_or_default(options['fv2'], 1440);
  this.fv3 = option_or_default(options['fv3'], 525);
    
  this.brk = option_or_default(options['brk'], 70000);
    
  this.theta = option_or_default(options['theta'], 0.0);
  this.G = 9.81; // Gravitational acceleration
    
  this.mass = option_or_default(options['mass'], 800000);
  
  this.a = option_or_default(options['a'], 2000);
  this.b = option_or_default(options['b'], 20);
  this.c = option_or_default(options['c'], 3.5);
    
  this.x = [this.x1, this.x2, this.x3];
  this.gravitational_force = (-this.G * Math.sin(this.theta) * this.mass);
}

TrainEnergyData.prototype.tractive_force = function(v) {
  if(v <= 4.2) {
    return this.f1;
  } else if(v <= 24.9) {
    return this.f2 - v * this.fv2;
  } else {
    return this.f3 - v * this.fv3;
  }
}

TrainEnergyData.prototype.resistance_force = function(v) {
  return (this.a + this.b * v + this.c * v * v);
}

TrainEnergyData.prototype.next_speed = function(u, v) {
  var denominator = (v < 0.1 ? 1 : v);
  var total_force = u - this.resistance_force(v) + this.gravitational_force;
  var total_acceleration = total_force / this.mass;
  
  return (v + total_acceleration / denominator);
}

TrainEnergyData.prototype.next_speed_umax = function(v) {
  return this.next_speed(this.tractive_force(v), v);
}

TrainEnergyData.prototype.next_speed_cruise = function(v) {
  return v;
}

TrainEnergyData.prototype.next_speed_coast = function(v) {
  return this.next_speed(0, v);
}

TrainEnergyData.prototype.next_speed_umin = function(v) {
  return this.next_speed(-this.brk, v);
}