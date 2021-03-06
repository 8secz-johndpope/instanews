'use strict';

var app = angular.module('instanews.directive.comments', ['ionic', 'ngResource']);

app.directive('incomments', [
  '$timeout',
  'Comment',
  'Comments',
  'Navigate',
  'Platform',
  'TextInput',
  function (
    $timeout,
    Comment,
    Comments,
    Navigate,
    Platform,
    TextInput
  ) {

    return {
      restrict: 'E',
      scope: {
        owner: '='
      }, 
      controller: function($scope) {

        $scope.Platform = Platform;

        $scope.Comments = Comments.findOrCreate($scope.owner.modelName, $scope.owner.id).getLoader({
          keepSync: true
        });

        //Preload comments if there are any
        if($scope.owner.createCommentCount > 0) {
          $scope.Comments.reload();
        }

        $scope.$on('$destroy', function() {
          $scope.Comments.remove();
        });

        $scope.Comments.sync();

        $scope.$watch('owner.showComments', function (newVal, oldVal) {
          if( newVal && !oldVal) {
            $scope.Comments.reload();
          }
        });

        var newComment = '';

        var scrollSpec = {
          scrollHandle: 'feed'
        };

        var Scroll = Navigate.scroll(scrollSpec);

        var viewInApp = function(cb) {
          var data = {
            focusType: $scope.owner.modelName,
            focusId: $scope.owner.id
          };
          Platform.branch.viewInApp(data, cb);
        };

        $scope.create = function () {
          Platform.analytics.trackEvent('addComment', 'start');
          viewInApp(function () {
            Navigate.ensureLogin( function () {
              var textInput = TextInput.get();
              textInput.maxLength = 2200;
              if($scope.owner.commentableId) {
                textInput.placeholder = 'Write a reply...';
              }
              textInput.text = newComment;

              textInput.open(function (text) {
                Comment.create({
                  content: text,
                  commentableId: $scope.owner.id,
                  commentableType: $scope.owner.modelName
                }).$promise
                .then(function() {
                  Platform.analytics.trackEvent('addComment', 'success');
                  $scope.owner.createCommentCount++;
                  $scope.Comments.reload();
                }, function(err) {
                  console.log(err);
                  Platform.analytics.trackEvent('addComment', 'error');
                });
              }, function (partialText) {
                //Interruption function
                newComment = partialText;
                Platform.analytics.trackEvent('addComment', 'partial');
              });

              // Wait a frame
              $timeout(function () {
                Scroll.anchorScroll($scope.owner.id);
              }, 16);
            });
          });
        };
      },
      templateUrl: 'templates/directives/comments.html'
    };
  }
]);
