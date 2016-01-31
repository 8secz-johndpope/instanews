
'use strict';
var app = angular.module('instanews.directive.votes', ['ionic', 'ngResource']);

app.directive('invotes', [
  '$timeout',
  'Comments',
  'UpVote',
  'DownVote',
  'Votes',
  'Navigate',
  'Platform',
  'Position',
  function (
    $timeout,
    Comments,
    UpVote,
    DownVote,
    Votes,
    Navigate,
    Platform,
    Position) {

      return {
        restrict: 'E',
        scope: {
          votable: '='
        },
        controller: function($scope, $location) {

          $scope.Platform = Platform;
          $scope.Comments = Comments.findOrCreate($scope.votable.modelName, $scope.votable.id) || {};

          var update = function () {
            $timeout(function () {
              $scope.votable.upVotes = Votes.up.find($scope.votable);
              $scope.votable.downVotes = Votes.down.find($scope.votable);

              if($scope.votable.upVotes.length) {
                $scope.votable.upVoted = true;
                $scope.votable.downVoted = false;
              }
              else if($scope.votable.downVotes.length) {
                $scope.votable.downVoted = true;
                $scope.votable.upVoted = false;
              }
            });
          };

          update();
          Votes.up.registerObserver(update);
          Votes.down.registerObserver(update);

          var Scroll;
          var spec = {
            scrollHandle: '',
            $location: $location
          };

          //Get the proper delegate_handle
          if($scope.votable.modelName === 'subarticle') {
            spec.scrollHandle = 'subarticle';
            Scroll = Navigate.scroll(spec);
          } else if ($scope.votable.modelName === 'article') {
            spec.scrollHandle = 'feed';
            Scroll = Navigate.scroll(spec);
          } // else comments: Do not zoom in on subcomments

          $scope.toggleComments = function() {
            if($scope.Comments.enableFocus) {
              $scope.votable.showComments = false;
              $scope.Comments.unfocusAll();
            } else {
              if(!$scope.votable.showComments) {
                $scope.votable.showComments = true;
              }
              else {
                $scope.votable.showComments = false;
              }
            }

            //TODO Consider removing this as it does not animate/look good
            if(Scroll) {
              Scroll.toggleAnchorScroll($scope.votable.id);
            }
          };

          $scope.upvote = function () {
            //TODO Move this into the Votes service
            Navigate.ensureLogin( function () {
              if($scope.votable.upVoted) {
                //TODO Delete the vote if it already exists
              } else {
                $scope.votable.upVoteCount++;
                $scope.votable.upVoted = true;
              }

              if($scope.votable.downVoted) {
                Votes.down.remove($scope.votable);
                $scope.votable.downVoteCount--;
                $scope.votable.downVoted = false;
              }

              var position = Position.getPosition();
              var vote = {
                clickableId: $scope.votable.id,
                clickableType: $scope.votable.modelName
              };

              // istanbul ignore else 
              if(position) {
                vote.location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
              }

              UpVote.create(vote)
              .$promise
              .then(
                function(res) {
                  Votes.up.add(res);
                  console.log('Successfully upvoted');
                }, 
                // istanbul ignore  next 
                function(err) {
                  console.log('Error: Failed to create an upvote');
                  console.log(err);
                });
            });
          };

          $scope.downvote = function () {
            Navigate.ensureLogin( function () {
              if($scope.votable.downVoted) {
                //TODO Delete the vote if it already exists
              } else {
                $scope.votable.downVoteCount++;
                $scope.votable.downVoted = true;
              }

              if($scope.votable.upVoted) {
                Votes.up.remove($scope.votable);
                $scope.votable.upVoteCount--;
                $scope.votable.upVoted = false;
              }

              var position = Position.getPosition();
              var vote = {
                clickableId: $scope.votable.id,
                clickableType: $scope.votable.modelName
              };

              // istanbul ignore else 
              if(position) {
                vote.location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
              }

              DownVote.create(vote)
              .$promise
              .then(
                function(res) {
                  Votes.down.add(res);
                  console.log('Successfully downVoted');
                },
                // istanbul ignore next 
                function(err) {
                  console.log('Error: Failed to create an downVote');
                  console.log(err);
                });
            });
          };
        },
        templateUrl: 'templates/directives/votes.html'
      };
    }]);
