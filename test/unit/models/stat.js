
/*jshint expr: true*/

var chai = require('chai');
chai.use(require('chai-stats'));

var expect = chai.expect;
var sinon = require('sinon');
var common =  require('../../common');

var app = common.req('server');

var Stat = {
  on: function (event, cb) {}
};
common.req('models/stat')(Stat);

var loopback = require('loopback');

exports.run = function () {
  describe('Stat', function () {

    //Use sandbox for any beforeEach stubbing
    var sandbox;
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('getCustomRating' , function () {
      var run, instance, Model, ctx, stat;
      beforeEach(function () {
        instance = {
          id: 6
        };

        stat = 'stat';
        ctx = {
          get: function(name) {
            return stat;
          }
        };

        cb = function () {};
        run = function (cb) {
          return Stat.getCustomRating(Model, instance, cb);
        };

        sandbox.stub(loopback, 'getCurrentContext', function () {
          return ctx;
        });
      });

      it('should call Stat.getRating with the results from convertRawStats', function (done) {
        var cStat = 'cStat';
        var get = sandbox.stub(Stat, 'getRating', function (instance, stats) {
          expect(stats).to.equal(cStat);
        });

        var convert = sandbox.stub(Stat, 'convertRawStats', function (instance, stats) {
          expect(stats).to.equal(stat);
          return cStat;
        });
        run(function (err, res) {
          expect(get.calledOnce).to.be.true;
          expect(convert.calledOnce).to.be.true;
          done();
        });
      });

      it('should not call Stat.getRating because no user stat was found', function (done) {
        stat = null;
        run(function (err, res) {
          expect(res).to.deep.equal(instance);
          done();
        });
      });
    });

    describe('getRating', function () {
      var rateable,
      run,
      stats;

      beforeEach(function () {
        run = function () {
          return Stat.getRating(rateable, stats);
        };
      });

      //TODO Run tests on various inputs 
      describe('Initialization', function () {
        var bonus, weight;
        beforeEach(function () {
          rateable = {
            upVoteCount: 0,
            downVoteCount: 0,
            viewCount: 0,
            getCommentsCount: 0,
            getSubarticlesCount: 0,
            notSubarticleRating: 1,
            notCommentRating: 1
          };

          bonus = {
            upVoteCount: 25,
            downVoteCount: 20,
            viewCount: 120,
            getCommentsCount: 27,
            getSubarticlesCount: 28,
          };

          weight = {
            upVotes: 1,
            downVotes: 1,
            subarticles: 1,
            comments: 1
          };
        });

        var tests = [{
          notSubarticleRating: 0.75,
          notCommentRating: 0.25,
          message: 'should use all available data',
          // P( up U comments U subarticles ) - P((comments U subarticles) & downvotes)
          result: 0.14812103818800249 
        },
        {
          notCommentRating: 0.25,
          message: 'should use the upvote, comment and downvote data',
          // P( up U comments ) - P(comments & downvotes)
          result: 0.11041135204081633 
        },
        {
          message: 'should only use the upvote data',
          // P( up )
          result: 25/120*(45/(45 + 120)) 
        }];

        tests.forEach(function(test) {
          it(test.message, function () {
            rateable = {
              upVoteCount: 0,
              downVoteCount: 0,
              viewCount: 0,
              clickCount: 0
            };

            if(test.notSubarticleRating) {
              rateable.getSubarticlesCount = 0;
              rateable.notSubarticleRating = test.notSubarticleRating;
            }
            if(test.notCommentRating) {
              rateable.getCommentsCount = 0;
              rateable.notCommentRating = test.notCommentRating;
            }

            Stat.bonus = bonus;
            Stat.weight = weight;
            var obj = run();
            expect(obj.rating).to.almost.equal(test.result, 5);
          });
        });

        it('should use the given input data from the rateable item', function () {
          rateable = {
            upVoteCount: 150,
            downVoteCount: 5,
            viewCount: 200,
            getCommentsCount: 20,
            getSubarticlesCount: 125,
            notSubarticleRating: 0.8,
            notCommentRating: 0.6
          };

          Stat.bonus = bonus;
          Stat.weight = weight;
          var obj = run();
          expect(obj.rating).to.almost.equal(0.26613451790368436, 5);
        });
      });
    });

    describe('getUnion', function () {
      var tests = [{
        input: [0.5, 0.5],
        result: 0.75
      },
      {
        input: [0, 0.25],
        result: 0.25
      },
      {
        input: [0.25, 0],
        result: 0.25
      },
      {
        input: [1, 1],
        result: 1
      },
      {
        input: [0.75, "0.5"],
        result: 0.875
      },
      {
        input: [0.5, 1/3, 0.25],
        result: 0.75 
      },
      {
        input: [5, 0.5],
        result: NaN 
      },
      {
        input: [{}, 0.5],
        result: NaN 
      },
      {
        input: [],
        result: 0 
      }
      ];


      tests.forEach(function(test) {
        var itString = 'P(';
        for(var j  =0; j < test.input.length; j++) {
          itString += test.input[j];
          if(j !== test.input.length -1) {
            itString += ' U ';
          }
        }
        itString += ') = ' + test.result;

        it(itString, function () {
          if(isNaN(test.result)) {
            expect(isNaN(Stat.getUnion.apply(Number,test.input))).to.be.true;
          } else {
            expect(Stat.getUnion.apply(Number,test.input)).to.almost.equal(test.result, 7);
          }
        });
      });
    });

    describe('getIntersection', function () {
      var tests = [{
        input: [0.5, 0.5],
        result: 0.25
      },
      {
        input: [0, 0.25],
        result: 0
      },
      {
        input: [0.25, 0],
        result: 0
      },
      {
        input: [1, 1],
        result: 1
      },
      {
        input: [0.75, "0.5"],
        result: 0.375
      },
      {
        input: [0.5, 1/3, 0.25],
        result: 0.041666666
      },
      {
        input: [5, 0.5],
        result: NaN 
      },
      {
        input: [{}, 0.5],
        result: NaN 
      },
      {
        input: [],
        result: 0 
      }
      ];


      tests.forEach(function(test) {
        var itString = 'P(';
        for(var j  =0; j < test.input.length; j++) {
          itString += test.input[j];
          if(j !== test.input.length -1) {
            itString += ' \u2229 ';
          }
        }
        itString += ') = ' + test.result;

        it(itString, function () {
          if(isNaN(test.result)) {
            expect(isNaN(Stat.getIntersection.apply(Number,test.input))).to.be.true;
          } else {
            expect(Stat.getIntersection.apply(Number,test.input)).to.almost.equal(test.result, 7);
          }
        });
      });
    });
  });
};
