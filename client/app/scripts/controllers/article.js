'use strict';

var app = angular.module('instanews.controller.article', ['ionic', 'ngResource']);

app.controller('ArticleCtrl', [
  '$scope',
  '$stateParams',
  'Article',
  'Articles',
  'Subarticles',
  'Maps',
  function(
    $scope,
    $stateParams,
    Article,
    Articles,
    Subarticles,
    Maps
  ) {

   //TODO Create a click for the article $stateParams.id

   //TODO OnScroll create new view for items scrolled past

   //Scope variables
   $scope.article = Articles.getOne($stateParams.id);
   $scope.areItemsAvailable = Subarticles.areItemsAvailable;

   $scope.map = {
     id: 'articleMap'
   };

   var marker;

   //Refresh the map everytime we enter the view
   $scope.$on('$ionicView.afterEnter', function() {
      var map = Maps.getArticleMap();
      if(map) {
         marker = Maps.setMarker(map,$scope.article.location);
      }
   });

   $scope.$on('$ionicView.afterLeave', function() {
      marker = Maps.deleteMarker(marker);
      Subarticles.deleteAll();
      Subarticles.unregisterObserver(updateSubarticles);
   });

  $scope.onRefresh = function () {
    console.log('Refresh');
    Subarticles.deleteAll($stateParams.id);
    Subarticles.load($stateParams.id, function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.loadMore = function() {
    Subarticles.load($stateParams.id, function() {
      console.log('Loading more');
      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  };

   var updateSubarticles = function() {
     $scope.subarticles = Subarticles.get($stateParams.id);
   };

   Subarticles.registerObserver(updateSubarticles);
}]);

