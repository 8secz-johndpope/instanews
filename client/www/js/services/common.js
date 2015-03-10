
var app = angular.module('instanews.common', ['ionic', 'ngResource']);

app.service('Common', [
      '$rootScope',
      '$filter',
      'Article',
      'Comment',
      function($rootScope, $filter, Article, Comment){

   //Initialize and refresh
   var articles = Article.find();

   var onRefresh = function () {
      Article.find( function (res) {
         articles = res;
         $rootScope.$broadcast('scroll.refreshComplete');
      });
   };

   var mPosition = {
      lat: 45.61545,
      lng: -66.45270,
      radius: 500,
      accuracy: 0,
      radSlider: 0
   };

   //Radius Slider
   var RadiusMax = Math.PI*6371000; //Half the earths circumference
   var RadiusMin = 500; //Minimum radius in meters
   var maxSlider = 500; //Slider range from 0 to 100
   var scale = maxSlider / Math.log(RadiusMax - RadiusMin + 1);

   mPosition.radSlider = radToSlide(mPosition.radius);

   $rootScope.$watch( function () {
      return mPosition.radSlider;
   }, function (newValue, oldValue) {
      if (newValue !== oldValue) {
         var radius = slideToRad(newValue);

         if (radius < mPosition.accuracy) {
            mPosition.radSlider = radToSlide(mPosition.accuracy);
            //TODO Use this limit instead of checking everywhere
            mPosition.limit = true;
         }
         else {
            mPosition.radius = radius;
            mPosition.limit = false;
         }
      }
   }, true);

   // Conversion functions
   Number.prototype.toRad = function() {
      return this * Math.PI / 180;
   };

   function radToSlide(radius) {
      return (Math.ceil(Math.log(radius - RadiusMin + 1)*scale)).toString();
   }

   function slideToRad(radSlider) {
      var radius =  Math.exp(parseInt(radSlider) / scale) + RadiusMin - 1;
      return radius;
   }

   // Could replace with google API call, but this keeps it local and fast
   var withinRange = function (position) {
      //haversine method
      var mLat = mPosition.lat.toRad();
      var lat = position.lat.toRad();
      var dLat = (mPosition.lat - position.lat).toRad();
      var dLng = (mPosition.lng - position.lng).toRad();

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
               Math.cos(mLat) * Math.cos(lat) *
               Math.sin(dLng/2) * Math.sin(dLng/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      //Earths radius is 6371Km

      if ( mPosition.limit ) {
         return (6371000 * c <= mPosition.accuracy);
      }
      else {
         return (6371000 * c <= mPosition.radius);
      }
   };

   //Instance methods **TODO get rid of copy and make this work
   //                   -> No documentation for instance remoteMethods for loopback
   var upvote = function (instance) {
      //For some reason the instance call replaces
      //the calling instance with the return value
      //so make a copy of the instance for now
      if ( instance.commentableId ) {
         Comment.prototype$upvote({id: instance.myId})
         .$promise
         .then( function(res) {
            instance._votes = res.instance._votes;
         });
      }
      else {
         var copy = angular.copy(instance);
         copy.$prototype$upvote({id: instance.myId})
         .then( function (res) {
            instance._votes = res.instance._votes;
         });
      }
   };

   var downvote = function (instance) {
      // ^^^ DITTO
      if ( instance.commentableId ) {
         Comment.prototype$downvote({id: instance.myId})
         .$promise
         .then( function(res) {
            instance._votes = res.instance._votes;
         });
      }
      else {
         var copy = angular.copy(instance);
         copy.$prototype$downvote({id: instance.myId})
         .then( function (res) {
            instance._votes = res.instance._votes;
         });
      }
   };

   //Comments
   var createComment = function (instance, content) {
      instance.constructor.comments.create({
         id: instance.myId,
         content: content,
         commentableId: instance.myId,
         commentableType: instance.constructor.modelName.toLowerCase()
      })
      .$promise
      .then( function(res, err) {
         instance.comments.push(res);
      });
   };

   var toggleComments = function(instance) {
      if(!instance.showComments) {

         //Comments can have any kind of parent
         //so we check for it before updating
         if ( instance.commentableId ) {
            model = Comment;
         }
         else {
            model = instance.constructor;
         }

         //Retrieve the comments from the server
         model.prototype$__get__comments({id: instance.myId})
         .$promise
         .then( function (res) {
            instance.comments = res;
            instance.showComments = true;
         });
      }
      else {
         instance.showComments = false;
      }
   };

   //Getters
   var getArticle = function (id) {
      var val = $filter('filter')(articles, {myId: id});
      if (val.length > 0) {
         return val[0];
      }
   };

   return {
      articles: articles,
      getArticle: getArticle,
      radToSlide: radToSlide,
      onRefresh: onRefresh,
      mPosition: mPosition,
      withinRange: withinRange,
      createComment: createComment,
      toggleComments: toggleComments,
      downvote: downvote,
      upvote: upvote
   };
}]);
