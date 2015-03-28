/*var app = angular.module('instanews.map', ['ionic', 'ngResource']);

app.controller('MapCtrl', [
      '$scope',
      '$ionicLoading',
      '$compile',
      'Common',
      function($scope,
         $ionicLoading,
         $compile,
         Common) {

   $scope.articles = Common.articles;
   $scope.mPos = Common.mPosition;

   var map, myCircle;
   var posWatch;
   var markers = [];

   var northPole = new google.maps.LatLng(90.0000, 0.0000);
   var southPole = new google.maps.LatLng(-90.0000, 0.0000);

   //Reload the markers when we recieve new articles
   $scope.$watch('articles', function (newValue, oldValue) {
      if (newValue !== oldValue) getMarkers();
   }, true);

   //Watch our accuracy so that we always know if we hit our limit
   $scope.$watch('mPos.accuracy', function(newValue, oldValue) {
      if (newValue !== oldValue) {
         if (newValue >= $scope.mPos.radius) {
            $scope.mPos.limit = true;
            $scope.mPos.radius =  newValue;
         }
         else {
            $scope.mPos.limit = false;
         }
      }
   });

   //Update our circle and markers when the radius changes
   $scope.$watch('mPos.radius', function (newValue, oldValue) {
      if (newValue !== oldValue) {
         updateMyCircle();
         updateMarkers();
      }
   }, true);

   //Update the markers on the map
   function updateMarkers() {
      if( markers.length === 0) {
         getMarkers();
      }
      angular.forEach( markers, function (marker) {
         if (!Common.withinRange({lat: marker.position.k, lng: marker.position.D})) {
            marker.setVisible(false);
         }
         else marker.setVisible(true);
      });
   }

   //Get the markers initially
   function getMarkers() {
      //TODO only update the changed ones not all
      for( var i = 0 ; i < markers.length ; i++) {
         markers[i].setMap(null);
      }
      markers = [];

      var tempMarker = {
         map: map,
         animation: google.maps.Animation.DROP//,
         /*
         icon: {
            size: new google.maps.Size(120, 120),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(0, 20),
            scaledSize: new google.maps.Size(30,30)
         }
         */
 /*     };

      for( var i = 0; i < $scope.articles.length; i++) {
         tempMarker.position = new google.maps.LatLng($scope.articles[i].location.lat, $scope.articles[i].location.lng);
         tempMarker.title = $scope.articles[i].title;
 //        tempMarker.icon.url = 'img/ionic.png';

         if (!Common.withinRange($scope.articles[i].location)) {
            tempMarker.visible = false;
         }
         markers.push(new google.maps.Marker(tempMarker));
      }
   }

   //Update my circle
   function updateMyCircle() {
      if( !myCircle) {
         drawMyCircle();
      }

      myCircle.setRadius($scope.mPos.radius);
      //Update the map to contain the circle
      var bounds = myCircle.getBounds();
      map.fitBounds(bounds);
      //If the bounds contain either the north or south pole then
      // move to the equator for the center of the map
      if ( bounds.contains(northPole) || bounds.contains(southPole)) {
         var equator = new google.maps.LatLng(0.0000, $scope.mPos.lng);
         map.setCenter(equator);
      }
   }

   //Draw my circle initially
   function drawMyCircle() {
      var options = {
         strokeColor: 'blue',
         strokeOpacity: 0.3,
         strokeWeight: 0,
         fillColor: 'blue',
         fillOpacity: 0.1,
         map: map,
         center: new google.maps.LatLng($scope.mPos.lat,$scope.mPos.lng)
      };
      options.radius = $scope.mPos.radius;

      myCircle = new google.maps.Circle(options);
      map.fitBounds(myCircle.getBounds());
      console.log(options.radius);
      $scope.mPos.radSlider = Common.radToSlide(options.radius);
   }

   //Update our position
   function updatePosition(position) {
      $scope.mPos.lat = position.coords.latitude;
      $scope.mPos.lng = position.coords.longitude;
      $scope.mPos.accuracy = position.coords.accuracy;

      updateMyCircle();
      updateMarkers();
   }

   //Error callback
   var error = function(err) {
      console.log(err);
   };

   //Initialize the map
    var initializeMap = function() {
      var mPosition = new google.maps.LatLng($scope.mPos.lat,$scope.mPos.lng);

      var mapOptions = {
         center: mPosition,
         zoom: 8,
         mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      // Load the map
      map = new google.maps.Map(document.getElementById("map"), mapOptions);

      posWatch = navigator.geolocation.watchPosition( updatePosition, error, {enableHighAccuracy: true});

      //Refresh the map everytime we enter the view
      $scope.$on('$ionicView.enter', function() {
         google.maps.event.trigger(map, 'resize');
      });

    };


    //Wait for the device to be ready and then load the map
    //TODO Re initialize the map
    ionic.DomUtil.ready( function() {
       if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) { //Mobile map load
          document.addEventListener("deviceready", initializeMap, false);
       } else { //Web version
          initializeMap();
       }
    });

}]);
*/