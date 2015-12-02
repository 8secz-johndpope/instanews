
'use strict';
var app = angular.module('instanews.controller.post', ['ionic', 'ngResource', 'uuid']);

app.controller('PostCtrl', [
  '$stateParams',
  '$scope',
  '$ionicModal',
  '$ionicHistory',
  'Article',
  'Articles',
  'Post',
  'Platform',
  'Maps',
  'User',
  'Upload',
  'Camera',
  function(
    $stateParams,
    $scope,
    $ionicModal,
    $ionicHistory,
    Article,
    Articles,
    Post,
    Platform,
    Maps,
    User,
    Upload,
    Camera
  ) {

    $scope.user = User.get();
    $scope.getMarker = Maps.getMarker;
    $scope.uploads = [];

    var updateUser = function() {
      $scope.user = User.get();
    };

    User.registerObserver(updateUser);

    $scope.$watch('newArticle.title', function (newTitle, oldTitle) {
      if(newTitle !== oldTitle) {
        if(newTitle && newTitle.length > 0) {
          var title = Case.title(newTitle);

          // Capitalize the first character of the first word
          title = title.charAt(0).toUpperCase() + title.substr(1);

          // Capitalize the first character of the last word
          var lastSpaceIdx = title.lastIndexOf(' ');
          if(lastSpaceIdx > -1) {
            var lastWord = title.substr(lastSpaceIdx + 1);
            if(lastWord.length > 0) {
              title = title.slice(0, lastSpaceIdx + 1) + lastWord.charAt(0).toUpperCase() + lastWord.substr(1); 
            }
          }
          $scope.newArticle.title = title;
        }
      }
    });

    $scope.place = {
      getMap: Maps.getPostMap,
      ignore: ['country', 'administrative_area_level_1'],
      localizeCallback: function (err, pos) {
        if(err) {
          console.log('Error: ' + err);
        }
        else {
          Maps.setMarker(Maps.getPostMap(), pos);
        }
      },
      localize: function () {}    // localize is filled in by the autocomplete directive
    };

    //If we have an ID given then we know we are posting subarticles within an article
    // istanbul ignore else 
    if( !$stateParams.id ) {
      $scope.newArticle = {
        title: ''
      };
      //Refresh the map everytime we enter the view
      $scope.$on('$ionicView.afterEnter', function() {
        console.log('Post after enter');
        $scope.place.localize();
      });
    }

    $scope.map = {
      id: 'postMap'
    };

     var geocoder = new google.maps.Geocoder();

     $scope.$watch(function (scope) {
       return scope.place.value;
     }, function (newValue, oldValue) {
       if(newValue !== oldValue) {

         var centerMap = function (place) {
           var map = Maps.getPostMap();
           if(place.geometry.viewport) {
             Maps.fitBounds(map, place.geometry.viewport);
           }
           else {
             Maps.setCenter(map, place.geometry.location);
           }

           Maps.setMarker(map, place.geometry.location);
         };

         console.log('New place!');
         console.log(newValue);

         if(newValue.geometry) {
           centerMap(newValue);
         } else {
           geocoder.geocode({'address': newValue.description}, function(results, status) {
             if (status === google.maps.GeocoderStatus.OK) {
               centerMap(results[0]);
             } else {
               console.log('Geocode was not successful for the following reason: ' + status);
             }
           }); 
         }
       }
     });

    $scope.data = {
      text: '',
    };

    $scope.goBack = function() {
      Platform.showSheet({
        destructiveText: 'Delete',
        titleText: 'Your unpublished content will be lost if you continue!',
        cancelText: 'Cancel',
        cancel:  function() {},
        buttonClicked: function() {
          $ionicHistory.goBack();
        },
        destructiveButtonClicked: function() {
          console.log('post goback button was clicked');
          Upload.destroy($scope.uploads);
          $ionicHistory.goBack();
        }
      });
    };

    var exit = function() {
      if( Post.isPosting() ) {
        Platform.showToast('We\'ll let you know when your content is uploaded');
      }

      $ionicHistory.goBack();
    };

    $scope.post = function () {
      if($scope.uploads.length) {
        if(!$stateParams.id) {
          var marker = Maps.getMarker();
          if(marker && $scope.newArticle.title) {
            var position = {
              lat: marker.getPosition().lat(),
              lng: marker.getPosition().lng()
            };

            var article = {
              isPrivate: false,
              location: position,
              title: $scope.newArticle.title
            };

            Post.post($scope.uploads, article);
            exit();
          }
          else {
            console.log('Error: Cannot post article without both position and title');
          }

        } else {
          Post.post($scope.uploads, $stateParams.id);
          exit();
        }
      } else {
        console.log('Cannot post without subarticles');
      }
    };

    /* Text Posting */

    //Modal for posting text
    $ionicModal.fromTemplateUrl('templates/postTextModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then( function (modal) {
      $scope.postTextModal = modal;
    });

    //Clean up the temp text value and hide the modal
    $scope.trashText = function() {
      $scope.data.text = '';
      $scope.postTextModal.hide();
    };

    //Move the text out of the form so that it is ready to be submitted
    $scope.saveText = function() {
      $scope.uploads.push(Upload.text($scope.data.text));
      $scope.trashText();
    };

    /* Video posting */
    //Capture video using the video camera
    $scope.captureVideo = function() {
      Camera.captureVideo()
      .then( function(video) {
        if(video) {
          $scope.uploads.push(Upload.video(video));
        }
      },
      // istanbul ignore next
      function(err) {
        console.log(err);
      });
    };

    /* Photo posting */

    //Get a photo(s) from the gallery
    $scope.openMediaGallery = function() {
      Camera.openMediaGallery()
      .then( function(media) {
        if(media) {
          console.log(media);
          if(media.type.indexOf('image') > -1) {
            $scope.uploads.push(Upload.picture(media));
          } else if (media.type.indexOf('video') > -1) {
            $scope.uploads.push(Upload.video(media));
          }
        }
      },
      // istanbul ignore next
      function(err) {
        console.log(err);
      });
    };

    //Capture a photo using the camera and store it into the new article
    $scope.capturePicture = function() {
      Camera.capturePicture()
      .then( function(photo) {
        if(photo) {
          $scope.uploads.push(Upload.picture(photo));
        }
      }, 
      // istanbul ignore next
      function(err) {
        console.log('Error: Failed to capture a new photo: ' + JSON.stringify(err));
      });
    };
  }]);
