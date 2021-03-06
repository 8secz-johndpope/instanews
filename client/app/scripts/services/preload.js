'use strict';
//jshint undef: false
//var app = angular.module('instanews.service.preload', ['chart.js']);
var app = angular.module('instanews.service.preload', []);

function PreloadFactory(Navigate, Platform, PreloadQueue) {
  var preload = function (spec) {
    var that;
    if(!spec || !spec.list || !spec.scrollHandle) {
      return console.log('Invalid spec for PreloadFactory');
    }

    spec.$timeout = spec.$timeout || setTimeout.bind(this);

    spec.sampleTime = spec.sampleTime || 100;
    spec.msFromNow = spec.msFromNow || 3000;
    spec.avgTime = spec.avgTime || 500;

    if(!spec.msFromNow || spec.msFromNow < spec.sampleTime) {
      spec.msFromNow = spec.sampleTime;
    }

    var scroll = Navigate.scroll(spec);

    /*
    var positions = [{ top:0 }, {top: 0}, {top: 0}];
    var M = 2;
    var M1 = 1;
    var M2 = 0;
    */

   var interval = function(func, wait, iterations) {
     var stop = false;

     var itvl = function() {
       if(!stop && (typeof iterations !== 'number' || iterations > 0)) {
         if(typeof iterations === 'number') {
           iterations--;
         }
         spec.$timeout(itvl, wait);
         try {
           func.call(null);
         } catch(e) {
           stop = true;
           console.log('Interval error!');
           console.log(e);
         }
       }
     };

     itvl();

     return {
       clear: function() {
         stop = true;
       }
     };
   };

    var positions = [{top: 0}, {top:0}];
    var M = 1;
    var M1 = 0;

    var predictScroll = function (timeSteps) { 
      //The Kinematic Equation
      // S = So + dS/dt*(t-to) + 1/2*d^2S/dt^2*(t-to)^2
      // S(m+n) = (1 + n + n^2)*S(m) - (n + 2*n^2)*S(m-1) + n^2*S(m-2)
      /*
       * 3rd Order was a little to volatile for longer term predictions
      var t2 = timeSteps*timeSteps;
      var prediction  = (1 + timeSteps + t2)*positions[M].top;
      prediction += (-(timeSteps + 2*t2))*positions[M1].top;
      prediction += t2*positions[M2].top;
      */

      // Ignore acceleration - 2nd order equation
      // S = So + dS/dt*(t-to)
      // S(m+n) = (1 + n)*S(m) - (n)*S(m-1)
      var prediction  = (1 + timeSteps)*positions[M].top;
      prediction += -timeSteps*positions[M1].top;

      return prediction;
    }; 

    var averageScrollPredict = function (cb, continuous) {
      var count = 0;
      var avgPrediction = 0;
      var avgPos = 0;
      var avgVel = 0;
      var deltaN = Math.floor(spec.avgTime/spec.sampleTime);

      if(!continuous) {
        var pos = scroll.getPosition();
        if(!pos.top) {
          pos = {
            top: 0
          };
        }
        //positions = [pos,pos,pos];
        positions = [pos,pos];
      }

      var last = Date.now();
      var average = interval(function () {
        var cur = Date.now();
        var deltaT = cur - last;
        last = cur;
        /*
         * TODO Find a more reliable way of getting the 
         * scroll height and position since the interval can vary
         * so drastically. If we could measure velocity directly then we 
         * would not need to wory about this at all.
         *
        if(deltaT > spec.sampleTime*2) {
          console.log('Warning! Sampling is off: ' + deltaT);
        }
       */

        positions.push(scroll.getPosition());
        positions.shift();
        var prediction;
        if(continuous) {
          //Continous gives a prediction for msFromNow after callback is called 
          //First result called after avgTime delay
          prediction = predictScroll(Math.floor((spec.msFromNow + spec.avgTime/2) / deltaT));
        } else {
          //Gives a prediction for (msFromNow) after the call was made
          //It takes avgTime to compute the result so it would be (msFromNow - avgTime)ms in the future
          prediction = predictScroll(Math.floor((spec.msFromNow - spec.avgTime/2) / deltaT));
        }

        avgPrediction += prediction/deltaN;
        avgPos += positions[M].top/deltaN;
        avgVel += ((positions[M].top - positions[M1].top)/(deltaT/1000))/deltaN;

        count++;
        if(count === deltaN) {
          cb(avgPrediction, avgPos, avgVel);
          if(continuous) {
            avgVel = 0;
            avgPrediction = 0;
            avgPos = 0;
            count = 0;
          } else {
            average.clear();
          }
        }
      }, spec.sampleTime);

      if(continuous) {
        return {
          stop: function () {
            average.clear();
          }
        };
      } 
    };

    var update = function (pred, pos, vel) {
      var length = spec.list.get().length;

      /*
      var body = document.body;
      var html = document.documentElement;
      var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
      console.log(height);
      var avgHeight = height/length;
      */
      
      //TODO Calculate this from the items directives after they have loaded
      var avgHeight = 500;

      var needed = Math.round(pred/avgHeight) - length;
      var height = scroll.getPosition().top;
      var maxScrollTop =  scroll.getBottom();

      // Ensure we always predict more will be needed if we are within 3 elements from the bottom
      if(needed < 5 && height <= maxScrollTop && maxScrollTop &&(maxScrollTop - height) < 3*avgHeight) {
        //console.log('Bottom Proximity! Height: ' + height + '\tmaxScrollTop: ' + maxScrollTop);
        needed = 5;
      }

      if(needed > 0 && spec.list.areItemsAvailable()) {
        if(needed + length > max || PreloadQueue.stats.getLength() < needed) {
          var limit = Math.min(needed, 50);
          max = length + limit;

          console.log('Have: ' + length + '\tLoading:' + limit + '\tWanted: ' + needed);
          spec.list.more(limit, function (err) {
            if(err) {
              max = length;
              console.log('Failed to get more!');
              console.log(err);
            }
          });
        }
      }

      //console.log('Height: ' + height + '\tPrediction: ' + pred + '\tVelocity: ' + vel);
      //Scroll to the top if we scroll faster than 2 items/sec and if we are scrolled down at least 5 
      if(vel <= -4*avgHeight && height > 5*avgHeight) {
        console.log('Scrolling to top! ' + vel);
        scroll.scrollTop();
      }
    };

    //var started = false;
    var max = 0;
    var predictor;

    var startMonitor = function () {
      var after = function (pred, pos, vel) {
        update(pred, pos, vel);
       // plotCallback(pred,pos);
      };

      predictor = averageScrollPredict(after, true);
    }; 

    var stopMonitor = function () {
      if(predictor) {
        predictor.stop();
        PreloadQueue.flush();
        predictor = null;
      }
    };

    var resetMonitor = function () {
      max = 0;
      if(!predictor) {
        startMonitor();
      }
    };

    /*
     //Plotting data - Depends on angular-chart.js
    Platform.ready.then(function () {
//    Chart.defaults.global.animation = false;
      Chart.defaults.global.animationSteps = 1;
    });

    var plot = {
      data: [[],[],[]],
      series: ['Measured', 'Predicted', 'Max'],
      //data: [[],[]],
      //series: ['Measured', 'Predicted'],
      labels: []
    };

    var plotCallback = function () {};

    var  plotInit = function () {
      var MEASURE = 0;
      var PREDICT = 1;
      var MAX = 2;

      plot.data = [[],[],[]];
      plot.labels = [];

      var currTime = 0;

      var advance = Math.floor(spec.msFromNow/spec.avgTime);

      for(var i = 0; i < advance - 1; i++) {
        plot.data[PREDICT].push(0);
        plot.data[MAX].push(0);
        plot.labels.push(Math.round(i*spec.avgTime/10)/100); 
      }

      plotCallback = function (pred, pos) {
        //Plot update
        spec.$timeout(function () {
          plot.data[MEASURE].push(pos);
          plot.data[PREDICT].push(pred);
          currTime += spec.avgTime;
          plot.data[MAX].push(max);

          //plot.labels.push(Math.round(currTime/10)/100); 
          if(plot.data[MEASURE].length >= advance) {
            plot.labels.push(Math.round(currTime/10)/100); 
          }

          if(plot.data[MEASURE].length >= Math.max(advance*2, 20)) {
            plot.labels.shift(); 
            plot.data[MEASURE].shift(); 
            plot.data[PREDICT].shift(); 
            plot.data[MAX].shift();
          }
        });
      };
    };

    plotInit();
    */

    // That is the object to be constructed
    // it has privlidged access to my, and spec
    that = {
      //plot: plot,
      reset: resetMonitor,
      stop: stopMonitor,
      start: startMonitor
    };

    return that;
  };

  return preload;
}

app.factory('preload', [
  'Navigate',
  'Platform',
  'PreloadQueue',
  PreloadFactory
]);
