
var LIMIT = 10;

module.exports = function(app) {

  var Journalist = app.models.journalist;
  var Stat = app.models.stat;
  var debug = app.debug('hooks:journalist');

  Journalist.afterRemote('prototype.__get__articles',
      function(ctx, instance, next) {
        debug('afterRemote __get__articles', ctx, instance, next);
        //Automatically remove all duplicate articles
        //Duplicates can be present since the articles associated
        //with a journalist come through their subarticles
        var uniqueIds = [];
        for(var i = 0; i < instance.length; i++) {
          if(uniqueIds.indexOf(instance[i].id) > -1 ) {
            instance.splice(i,1);
            i--;
          }
          else {
            uniqueIds.push(instance[i].id);
          }
        }

        next();
      });

  Journalist.afterRemoteError('login', function(ctx, next) {
    app.dd.increment('journalist.login.error');
    debug('afterRemoteError login', ctx, next);
    app.brute.prevent(ctx.req, ctx.res, function() {
      next();
    });
  });

  Journalist.afterRemoteError('confirm', function (ctx,next) {
    app.dd.increment('journalist.confirm.error');
    debug('afterRemoteError confirm', ctx);
    app.brute.prevent(ctx.req, ctx.res, function() {
      next();
    });
  });

  Journalist.beforeRemote('create', function(ctx, instance, done) {
    debug('beforeRemote create', ctx, instance, done);
    // var excTime = Date.now();
    var next = function (err) {
      // excTime = Date.now() - excTime;
      //    app.dd.timing('journalist.create.timing',excTime); //Execution time in ms
      done(err);
    };

    var user;
    if( ctx && ctx.req && ctx.req.body) {
      user = ctx.req.body;
    }
    else if( instance ) {
      user = instance;
    }
    else {
      next(new Error('Bad user given for creation!'));
    }

  //TODO make this the same as front end password check
    if( !user.password || user.password.length < 8) {
      var e = new Error('Password is too weak!');
      e.status = 403;
      next(e);
    }
    else {
      Journalist.count({
        or: [{
              email: user.email
            },
        {
          username: user.username
        }]
      }, function(err, count) {
        if( err) {
          next(err);
        }
        else if(count === 0) {
          next();
        }
        else {
          var er = new Error('Username or email is already used!'); 
          er.status = 403;
          next(er);
        }
      });
    }
  });

  Journalist.afterRemote('create', function(ctx, user, next) {
    debug('after create', user, next);
    Journalist.sendConfirmation(user, next);
  });

  Journalist.observe('access', function(ctx, next) {
    debug('access', ctx, next);

    //Limit the queries to LIMIT per request
    if( !ctx.query.limit || ctx.query.limit > LIMIT) {
      ctx.query.limit = LIMIT;
    }
    next();
  });
};
