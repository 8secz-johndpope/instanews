// Ionic Starter App
'use strict';
/*jshint camelcase: false */

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('instanews', [
  'ionic',
  'config',
  'instanews.controller.article',
  'instanews.controller.feed',
  'instanews.controller.login',
  //'instanews.controller.notification',
  'instanews.controller.post',
//  'instanews.controller.profile',
  'instanews.directive.autocomplete',
  'instanews.directive.comments',
  'instanews.directive.list',
  'instanews.directive.map',
  'instanews.directive.media',
  'instanews.directive.textFooter',
  'instanews.directive.upload',
  'instanews.directive.votes',
  'instanews.service.articles',
  'instanews.service.camera',
  'instanews.service.fileTransfer',
  'instanews.service.list',
  'instanews.service.localStorage',
  'instanews.service.maps',
  'instanews.service.navigate',
  //'instanews.service.notifications',
  'instanews.service.platform',
  'instanews.service.position',
  'instanews.service.post',
  'instanews.service.subarticles',
  'instanews.service.textInput',
  'instanews.service.upload',
  'instanews.service.user',
  'lbServices',
  'ui.router',
  'angularMoment',
  'ngCordova'
])

.config([
  'LoopBackResourceProvider',
  'ENV',
  // istanbul ignore next
  function(LoopBackResourceProvider, ENV) {
    LoopBackResourceProvider.setUrlBase(ENV.apiEndpoint);
  }
])

.constant(
  '_',
  window._
)

.controller('AppCtrl', [
  '$scope',
  'User',
  function (
    $scope,
    User
  ) {
    //Update user function
    var updateUser = function() {
      $scope.user = User.get();
    };

    //Set up an observer on the user model
    User.registerObserver(updateUser);

    $scope.login = User.login;
    $scope.logout = User.logout;
  }
])

.config(function(
  $stateProvider,
  $urlRouterProvider,
  $ionicConfigProvider
) {

  //No transitions for performance
  $ionicConfigProvider.views.transition('none');

  //Setup back button to not have text
  $ionicConfigProvider.backButton.text('').previousTitleText(false);

  //$ionicConfigProvider.tabs.position('bottom'); //Places them at the bottom for all OS
  //$ionicConfigProvider.tabs.style('standard'); //Makes them all look the same across all OS
  //$ionicConfigProvider.backButton.previousTitleText(false).text('');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('app', {
    url:'/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.feed', {
    url:'/feed',
    views: {
      'menuContent' : {
        templateUrl: 'templates/feed.html',
        controller: 'FeedCtrl'
      }
    }
  })

  .state('app.article', {
    url: '/articles/{id}',
    views: {
      'menuContent' : {
        templateUrl: 'templates/article.html',
        controller: 'ArticleCtrl'
      }
    }
  })

  /*
  .state('app.notif', {
    cache: false,
    url: '/notif/{id}',
    views: {
      'menuContent' : {
        templateUrl: 'templates/notif.html',
        controller: 'NotificationCtrl'
      }
    }
  })

  .state('app.profile', {
    url:'/profile/{username}',
    views: {
      'menuContent' : {
        templateUrl: 'templates/profile.html',
        controller: 'ProfileCtrl'
      }
    }
  })
  */

  .state('app.login', {
    url: '/login',
    views: {
      'menuContent' : {
        templateUrl: 'templates/login.html',
        controller: 'LoginCtrl'
      }
    }
  })

  .state('articlePost', {
    cache: false,
    url: '/post/article',
    templateUrl: 'templates/articlePost.html',
    controller: 'PostCtrl'
  })

  .state('subarticlePost', {
    cache: false,
    url: '/post/article/{id}',
    templateUrl: 'templates/subarticlePost.html',
    controller: 'PostCtrl'
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/feed');

});

moment.locale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: '%d sec',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  }
}); 
