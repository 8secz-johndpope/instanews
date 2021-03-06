'use strict';

var app = angular.module('instanews.service.user', ['ionic', 'ngResource','ngCordova']);

/* jshint camelcase: false */
app.service('User', [
  'Installation',
  'Journalist',
  'LocalStorage',
  'LoopBackAuth',
  '$state',
  'Platform',
  function(
    Installation,
    Journalist,
    LocalStorage,
    LoopBackAuth,
    $state,
    Platform
  ){

    var user;

    var observers = [];

    var registerObserver = function(cb) {
      observers.push(cb);
    };

    var notifyObservers = function() {
      angular.forEach(observers, function(cb) {
        cb();
      });
    };

    var get = function() {
      return user;
    };

    var getToken = function() {
      if(user && user.id) {
        return user.id;
      }
    };

    var set = function(usr) {
      user = usr;

      notifyObservers();
      install();
    };

    var clearData = function() {
      set();
    };

    var install = function() {

      var device = Platform.getDevice();

      //TODO check if device is already installed
      if ( user &&
          user.userId &&
            device &&
              device.type &&
                device.token &&
                  device.token !== 'OK'
         ) {
           console.log('Attempting to install device on the server');

           var appConfig = {
             appId: 'instanews',
             userId: user.userId,
             deviceType: device.type,
             deviceToken: device.token,
             status: 'Active'
           };

           if(device.oldToken) {
             appConfig.oldDeviceToken = device.oldToken;
           }

           Installation.create(appConfig, function () {
             console.log('Created a new device installation');
             delete device.oldToken;
             Platform.setDevice(device);
             if(Platform.isIOS()) {
               LocalStorage.secureWrite('deviceToken', device.token);
             }
           },
           // istanbul ignore next
           function(err) {
             console.log('Error trying to install device');
             console.log(err);
           });
         }
    };

    //Load the login page
    var login = function() {
      //TODO Should probably use Navigate.go just in case
      //    It unfortunately adds a circular dependency
      $state.go('app.login');
    };

    //Logout
    var logout = function() {
      Journalist.logout()
      .$promise
      .then( function(res) {
        clearData();
        console.log('Logged out: ' + res);
      });
    };

    var isMine = function(item) {
      return (user && user.userId === item.username);
    };

    var isAdmin = function() {
      return (user && user.user && user.user.isAdmin);
    };

    var clearBadge = function () {
      if(user) {
        Journalist.clearBadge({
          id: user.userId
        }, function () {
          console.log('Successfully cleared the badge');
        }, function (err) {
          console.log('Failed to clear the badge');
          console.log(err);
        });
      }
    };

    var reload = function () {
      if(user) {
        Journalist.findById({
          id: user.userId 
        }, function (usr) {
          user.user = usr;
          set(user);
        }, function (err) {
          console.log(err);
         });
      }
    };

    //TODO Create Support and Analytics services respectively
    var updateSupport = function () {
      if(user && user.user) {
        Platform.support.setEmail(user.user.email);
        Platform.support.setName(user.userId);
      } else {
        Platform.support.clearUser();
      }
    };
    var updateAnalytics = function () {
      if(user && user.user) {
        Platform.analytics.setUser(user.user.uniqueId);
      }
    };

    // If a user is logged in already then request a new token
     // istanbul ignore else 
    if(LoopBackAuth.accessTokenId && LoopBackAuth.currentUserId) {
      //Request a new token that expires in 6 weeks
      //Journalist.accessTokens.create({
      Journalist.prototype$__create__accessTokens({
        id: LoopBackAuth.currentUserId,
        ttl: 6*7*24*60*60 
      }, null, function(user) {
        Journalist.findById({
          id: LoopBackAuth.currentUserId
        }, function (usr) {
          user.user = usr;
          console.log('Refreshed user');
          console.log(user);
          set(user);
        }, function (err) {
          console.log(err);
        });
      }, 
      // istanbul ignore next
      function(err) {
        console.log('Error: Cannot create token for user: ' + err);
      });
    }

    Platform.ready
    .then(function () {
      document.addEventListener('resume', function () {
        console.log('Resuming app!');
        reload();
      }, false);

      if(!Platform.isBrowser()) {
        //TODO These should be added in support, and analytics services respectively
        registerObserver(updateSupport);
        registerObserver(updateAnalytics);
        updateSupport();
        updateAnalytics();
      }
    });

    return {
      clearData: clearData,
      clearBadge: clearBadge,
      install: install,
      login: login,
      logout: logout,
      isMine: isMine,
      isAdmin: isAdmin,
      reload: reload,
      get: get,
      agreeToTerms: Journalist.agreeToTerms.bind(Journalist),
      agreeToPrivacy: Journalist.agreeToPrivacy.bind(Journalist),
      getToken: getToken,
      set: set,
      registerObserver: registerObserver
    };
  }]);
