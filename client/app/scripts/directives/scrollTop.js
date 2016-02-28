'use strict';

var app = angular.module('instanews.directive.scrollTop', ['ionic', 'ngResource']);

app.directive('inScrollTop', [
  'Navigate',
  '$ionicGesture',
  '$timeout',
  function (
    Navigate,
    $ionicGesture,
    $timeout
  ) {
    return {
      restrict: 'E',
      scope: {
        scrollHandle: '@'
      },
      controller: function(
        $scope,
        _
      ) {
        $scope.swipeDownObj = {};

        $scope.scroll = Navigate.scroll({
          scrollHandle: $scope.scrollHandle,
          $timeout: $timeout,
        });
        $scope.scroll.showScrollToTop = false;

        $scope.$on('$ionicView.unloaded', function () {
          $ionicGesture.off($scope.swipeDownObj, 'swipedown', function (err) {
            if(err) {
              console.log('Error: Failed to clear gesture!');
              console.log(err.stack);
            }
          });
        });

        $scope.showScrollToTop = function () {
          return $scope.scroll.showScrollToTop;
        };

        var onSwipeDown = _.debounce(function () {
          if(!$scope.scroll.showScrollToTop) {
            $scope.$apply(function () {
              $scope.scroll.showScrollToTop = true;
              $timeout(function() {
                $scope.scroll.showScrollToTop = false;
              }, 2000);
            });
          }
        }, 3000, true);

        var element = angular.element(document.getElementById($scope.scrollHandle));
        $ionicGesture.on('swipedown', onSwipeDown, element, $scope.swipeDownObj);
      },
      templateUrl: 'templates/directives/scrollTop.html'
    };
  }
]);
