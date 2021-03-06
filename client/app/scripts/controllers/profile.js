
'use strict';
var app = angular.module('instanews.controller.profile', ['ionic', 'ngResource']);

/* istanbul ignore next */

app.controller('ProfileCtrl', [
      '$scope',
      '$stateParams',
      'Journalist',
      'User',
      'Navigate',
      function($scope,
         $stateParams,
         Journalist,
         User,
         Navigate) {

   $scope.user = {};

   $scope.me = false;
   $scope.toggleMenu = Navigate.toggleMenu;

   var filter = {
      limit: 50,
      skip: 0,
      include: {
         relation: 'subarticles',
         scope: {
            where: {
               username: ''
            },
            order: 'rating DESC'
         }
      },
      order: 'lastUpdated DESC'
   };

   //Refresh the map everytime we enter the view
   $scope.$on('$ionicView.beforeEnter', function() {

      var user = User.get();

      if( user && $stateParams.username === user.username) {
         $scope.user = user;
         $scope.me = true;
      }
      else {
         $scope.me = false;
         Journalist.findById({id: $stateParams.username})
         .$promise
         .then( function(user) {
            $scope.user = user;
            console.log('Retrieved user: ', $scope.user.username);
         });
      }

      filter.include.scope.where.username = $stateParams.username;

      Journalist.articles({id: $stateParams.username, filter: filter})
      .$promise
      .then( function(res) {
         $scope.articles = res;
      }, function(err) {
         console.log('Error: ' + err.data.error.stack);
      });
   });
}]);
