'use strict';

var app = angular.module('instanews.controller.article', ['ionic', 'ngResource']);

app.controller('ArticleCtrl', [
  '$ionicModal',
  '$scope',
  '$stateParams',
  'Article',
  'Articles',
  'Subarticles',
  'Maps',
  'Post',
  'Platform',
  'Uploads',
  function(
    $ionicModal,
    $scope,
    $stateParams,
    Article,
    Articles,
    Subarticles,
    Maps,
    Post,
    Platform,
    Uploads
  ) {

    $scope.Platform = Platform;
    $scope.Subarticles = Subarticles.findOrCreate($stateParams.id);
    $scope.Uploads = Uploads.findOrCreate($stateParams.id);

    var spec = $scope.Subarticles.getSpec();
    spec.options.filter.limit = 5;
    spec.options.filter.skip = 0;
    $scope.Subarticles.load();

    //Scope variables
    $scope.article = Articles.findById($stateParams.id);

    $scope.map = {
      id: 'articleMap'
    };

    var marker;
    var uploadObserver;

    //Refresh the map everytime we enter the view
    $scope.$on('$ionicView.afterEnter', function() {
      var map = Maps.getArticleMap();
      /* istanbul ignore else */
      if(map) {
        marker = Maps.setMarker(map,$scope.article.location);
      }

      uploadObserver = $scope.Uploads.registerObserver(function () {
        var uploads = $scope.Uploads.get();
        if(uploads.length > 0) {
          $scope.uploadModal.show();
        }
      });
    });

    $scope.$on('$ionicView.afterLeave', function() {
      marker = Maps.deleteMarker(marker);
      uploadObserver.unregister();
    });

    /*
       $scope.onRefresh = function () {
       console.log('Refresh');
       Subarticles.deleteAll($stateParams.id);
       Subarticles.load($stateParams.id, function() {
       $scope.$broadcast('scroll.refreshComplete');
       });
       };
       */

   $ionicModal.fromTemplateUrl('templates/modals/upload.html', {
      scope: $scope,
      animation: 'slide-in-up'
   }).then( function (modal) {
      $scope.uploadModal = modal;
      $scope.post = function (){
        Post.post($scope.Uploads, $stateParams.id);
        modal.hide();
      };

      //TODO Add a delete function to each upload instance and deal with deletion
      //from the upload directive instead of here
      $scope.clear = function () {
        $scope.Uploads.clear();
        modal.hide();
      };
   });
  }
]);

