//= require "raphael-min"

/*
  Usage:
  TopfunkySparkline('chart',
               [42, 15, 21, 7],
               { width:400,
                 height:30,
                 title:"Monthly Revenue",
                 target:25,
                 goodThreshold:20});
*/
var TopfunkySparkline = function(elementName, datapoints, opts) {

  this.width  = opts.width;
  this.height = opts.height;

  this.barWidth      = opts.barWidth      || 3;
  this.spacing       = opts.spacing       || 1;
  this.colorGood     = opts.colorGood     || "#6699cc";
  this.colorBad      = opts.colorBad      || "#a8c0d8";
  this.colorTarget   = opts.colorTarget   || "#ffffcc";
  this.goodThreshold = opts.goodThreshold || 20;
  this.target        = opts.target        || 15;

  this.paper = Raphael(elementName, this.width, this.height);

  // Normalize
  var normalizedDatapoints = [];
  var maximumDatavalue = Math.max.apply( Math, datapoints );

  for (var i = 0; i < datapoints.length; i++) {
    normalizedDatapoints[i] = datapoints[i] / maximumDatavalue;
  }

  // Bars
  for (var i = 0; i < datapoints.length; i++) {
    var barColor;
    if (datapoints[i] >= goodThreshold)
      barColor = colorGood;
    else
      barColor = colorBad;

    var x_offset = i*(barWidth+spacing) + this.width - datapoints.length*(barWidth+spacing);
    var y_offset = parseInt(height - normalizedDatapoints[i]*height);
    var bar = paper.rect(x_offset,
               y_offset,
               barWidth,
               Math.ceil(normalizedDatapoints[i]*height))
    bar.attr({stroke:'transparent', fill:barColor});
  }

  // Target line
  var targetLine = paper.rect(0, parseInt(height - (target/maximumDatavalue)*height), width, 1)
  targetLine.attr({stroke:"transparent", fill:colorTarget});
}

