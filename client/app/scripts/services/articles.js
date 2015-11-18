
'use strict';

var app = angular.module('instanews.service.articles', ['ionic', 'ngResource','ngCordova']);

app.service('Articles', [
  '$filter',
  'Article',
  'list',
  'Subarticles',
  'Platform',
  'Position',
  function(
    $filter,
    Article,
    list,
    Subarticles,
    Platform,
    Position
  ){

    var options = {
      filter: {
       skip: 0,
       order: 'rating DESC'
      }
    };

    // Triggered when an item in the list wants to be updated
    var update = function (newValue, oldValue) {
      if( newValue.modified >= oldValue.modified ) {
        oldValue.rating = newValue.rating;
        oldValue.title = newValue.title;
        oldValue.modified = newValue.modified;
        oldValue.downVoteCount = newValue.downVoteCount;
        oldValue.upVoteCount = newValue.upVoteCount;
        oldValue.topSub = newValue.topSub;
        oldValue.upVotes = newValue.upVotes;
        oldValue.verified = newValue.verified;
        oldValue.version = newValue.version;
      }
    };

    // Triggered when a new batch of articles wants to be added to the list
    // allows for additional filtering
    var addFilter = function(arts) {
      var hidden = [],
        inView = [];

      arts.forEach(function(article) {
        var position = Position.posToLatLng(article.location);
        if(Position.withinBounds(position)) {
          inView.push(article);
        } else {
          hidden.push(article);
        }
      });

      console.log('hidden:');
      console.log(hiddenArticles.add(hidden));
      return inView;
    };

    // Create a list for articles within view
    var articles = list({
      find: Article.find,
      update: update,
      addFilter: addFilter,
      options: options
    });

    // Create a headless list for out of view articles
    var hiddenArticles = list({
      update: update
    });

    // Reorganize the articles into the viewable array and the hidden array
    var reorganize = function() {
      var toOutView = articles.remove(function (article) {
        var position = Position.posToLatLng(article.location);
        return !Position.withinBounds(position);
      });

      var toInView = hiddenArticles.remove(function (article) {
        var position = Position.posToLatLng(article.location);
        return Position.withinBounds(position);
      });

      console.log(toOutView.length + ' going out of view and ' + toInView.length + ' going into the view');
      articles.add(toInView);
      hiddenArticles.add(toOutView);
    };

    //Update the filter bounds 
    var updateBounds = function() {
      var bounds = Position.getBounds();

      // istanbul ignore else
      if(bounds) {
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        options.filter.where = {
          location: {
            geoWithin: {
              $box: [
                [sw.lat(), sw.lng()],
                [ne.lat(), ne.lng()]
              ]
            }
          }
        };
      }
      else {
        console.log('Bounds not set yet!');
      }

      options.filter.skip = 0;

      console.log('UpateBounds');

      Platform.loading.show();

      articles.load(function () {
        //TODO Lets rethink this potentially unnecessary reorganize
        reorganize();
        Platform.loading.hide();
      });
    };

    Position.registerBoundsObserver(updateBounds);

    return articles;
  }
]);
