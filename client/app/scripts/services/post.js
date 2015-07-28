
'use strict';

var app = angular.module('instanews.service.post', ['ionic', 'ngResource', 'uuid']);

app.factory('Post', [
  'Article',
  'LocalStorage',
  'ENV',
  'FileTransfer',
  'User',
  'Platform',
  'rfc4122',
  function(
    Article,
    LocalStorage,
    ENV,
    FileTransfer,
    User,
    Platform,
    rfc4122
  ) {

   var posting = false;
   var pending = [];
   
   Platform.ready
   .then( function() {
     LocalStorage.readFiles('pending', function(err, res) {
       if(err) {
         console.log('Error: Failed to retrieve pending articles: ' + JSON.stringify(err));
       }
       else {
         pending = res;
       }
       //TODO Prompt the user to do something with the pending articles
     });
   });

   var getNewArticle = function() {
     var art =  {
       tempId: '',
       videos: [],
       photos: [],
       text: []
     };
     art.tempId = rfc4122.v4();
      
     saveArticle(art);
     return art;
   };

   var getArticle = function(tempId) {
     if( tempId ) {
       for( var i = 0; i < pending.length; i++) {
         if( pending[i].tempId === tempId ) {
           return pending[i];
         }
       }
       console.log('Error: No articles were found the the tempId ' + tempId);
     }
     else {
       return getNewArticle();
     }
   };

   /* Saving functions */
   var saveArticle = function(article) {
     var idx = -1;
     for( var i = 0; i < pending.length; i++) {
       if( pending[i].tempId === article.tempId ) {
         idx = i;
         break;
       }
     }

     if( idx < 0) {
       pending.push(article);
     }
     else {
       pending[idx] = article;
     }

     LocalStorage.writeFile('pending', article.tempId + '.json', article);
   };

   var saveTitle = function(title, tempId) {
     var article = getArticle(tempId);
     article.title = title;
     saveArticle(article);
     return article;
   };

   var savePosition = function(position, tempId) {
     if( position.lat && position.lng ) {
       var article = getArticle(tempId);
       article.position = position;
       saveArticle(article);
       return article;
     }
     else {
       console.log('Error: Bad position given! Will not save the position!');
     }
   };

   var saveParentId = function(parentId, tempId) {
     var article = getArticle(tempId);
     article.parentId = parentId;
     saveArticle(article);
     return article;
   };

   var saveVideos = function(videos, tempId) {
     var article = getArticle(tempId);
     article.videos = article.videos.concat(videos);
     saveArticle(article);
     return article;
   };

   var savePhotos = function(photos, tempId) {
     var article = getArticle(tempId);
     article.photos = article.photos.concat(photos);
     saveArticle(article);
     return article;
   };

   var saveText = function(text, tempId) {
     var article = getArticle(tempId);
     article.text = article.text.concat(text);
     saveArticle(article);
     return article;
   };

   /* Deletion functions */
   var deleteVideo = function(video, tempId) {
     var article = getArticle(tempId);
     for( var i = 0; i < article.videos.length; i++) {
       if(article.videos[i].name === video.name) {
         article.videos.splice(i,1);
         break;
       }
     }
     saveArticle(article);
   };

   var deletePhoto = function(photo, tempId) {
     var article = getArticle(tempId);
     for( var i = 0; i < article.photos.length; i++) {
       if(article.photos[i].name === photo.name) {
         article.photos.splice(i,1);
         break;
       }
     }
     saveArticle(article);
   };

   var deleteText = function(text, tempId) {
     var article = getArticle(tempId);
     for( var i = 0; i < article.text.length; i++) {
       if(article.text[i] === text) {
         article.text.splice(i,1);
         break;
       }
     }
     saveArticle(article);
   };

   var deleteArticle = function(article) {
     for( var i = 0; i < pending.length; i++) {
       if(pending[i].tempId === article.tempId) {
         pending.splice(i,1);
         break;
       }
     }
     LocalStorage.deleteFile('pending', article.tempId + '.json');
   };

   var isPosting = function() {
     return posting;
   };

   /* Posting functions */
   var post = function(tempId) {

     posting = true;
     var article = getArticle(tempId);
     var total = article.text.length + article.videos.length + article.photos.length;
     
     if(total > 0) {
       if( article.title && article.position ) {
         Article.create({
            isPrivate: false,
            location: article.position,
            username: User.get().username,
            title: article.title
         })
         .$promise
         .then( function(res) {
           article.parentId = res.id;
           article.title = null;
           article.position = null;
           saveArticle(article);
           postSubarticle(article);
         });
       }
       else if(article.parentId) {
         postSubarticle(article);
       }
       else {
         console.log('Error: Cannot post the given content because there are missing parts');
         posting = false;
       }
     }
     else {
       console.log('There were no subarticles given so the article will not be saved');
       posting = false;
     }
   };

   var progress = function () {
         //console.log('Progress: ' + JSON.stringify(progress));
   };
    
   //Determine the type of subarticle the data is posting and then
   // call the appropriate posting function
  var postSubarticle = function(art) {

    var total = art.videos.length + art.photos.length + art.text.length;
    var finished = 0;

    var onSuccess = function() {
      finished++;
      if( finished === total) {
        posting = false;
        deleteArticle(art);
        Platform.showToast('Your content has finished uploading');
      }
    };

    //Called after the video has been uploaded
     var onVideoUploadSuccess = function() {
       console.log('Succesful upload of video!');

       options.fileName = sub._file.poster; 
       options.mimeType = 'image/jpeg'; 

       FileTransfer.upload(server, video.thumbnailURI, options)
       .then( function() {
         console.log('Succesful upload of thumbnail!');
          Article.subarticles.create(sub)
          .$promise
          .then( function() {
            console.log('Successful subarticle creation!');
            deleteVideo(video, art.tempId);
            onSuccess();
          }, function(err) {
            console.log('Error: Failed to post subarticle: ' + JSON.stringify(err));
          });
       }, function(err) {
         console.log('Error: Failed to upload thumbnail: ' + JSON.stringify(err));
       }, progress);
     };

     //Called after the photo has been uploaded
    var onPhotoUploadSuccess = function() {
      //Success Callback
      console.log('Successful image upload!');
      Article.subarticles.create(subarticle)
      .$promise
      .then( function() {
        deletePhoto(photo, art.tempId);
        onSuccess();
        console.log('Successful subarticle creation!');
      }, function(err) {
        console.log('Error: Failed to post subarticle: ' + JSON.stringify(err));
      });
    };

    //Called after the text has been posted
    var onTextPostSuccess = function() {
      deleteText(text, art.tempId);
      onSuccess();
      console.log('Successful subarticle creation!');
    };

    var error = function(err) {
      //TODO Notify the user and ask if they want to retry
      console.log('Error: ' + JSON.stringify(err));
    };

     //Upload all videos
    for(var i = 0; i < art.videos.length; i++) {
      var video = art.videos[i];

      var sub = createVideo(art.parentId, video);
      var server = ENV.apiEndpoint + '/storages/' + sub._file.container + '/upload';

      var options = {
        fileName: video.name,
        mimeType: video.type,
        headers: { 'Authorization': User.getToken()}
      };

      FileTransfer.upload(server, video.nativeURL, options)
      .then( onVideoUploadSuccess, error, progress);
    }

    //Upload all photos
    for(var j = 0; j < art.photos.length; j++) {

      var photo =  art.photos[j];
      var subarticle = createPhoto(art.parentId, photo);
      var photoServer = ENV.apiEndpoint + '/storages/' + subarticle._file.container + '/upload';

      var opt = {
        fileName: photo.name,
        mimeType: photo.type,
        headers: { 'Authorization': User.getToken()}
      };

      FileTransfer.upload(photoServer, photo.nativeURL, opt)
      .then( onPhotoUploadSuccess, error, progress);
    }

    //Upload all text
    for(var k = 0; k < art.text.length; k++) {
      var text = art.text[k];
      Article.subarticles.create(createText(art.parentId, text))
      .$promise
      .then(onTextPostSuccess, error);
    }
  };

  //Create a text subarticle for the given parentId
   var createText = function(id, text) {
      return {
         id: id,
         parentId: id,
         username: User.get().username,
         text: text
      };
   };

  //Create a video subarticle for the given parentID
  var createVideo = function(id, video) {
    var container = 'instanews.videos.us.east';
    var poster = video.name.slice(0,video.name.lastIndexOf('.') + 1) + 'jpg';
    return {
      id: id,
      parentId: id,
      username: User.get().username,
      _file: {
        type: video.type,
        container: container,
        name: video.name,
        size: video.size,
        poster: poster,
        lastModified: video.lastModified,
        caption: video.caption
      }
    };
  };

  //Create a photo subarticle for the given parentId
  var createPhoto = function(id, photo) {
    var container = 'instanews.photos.us.east';

    var subarticle = {
      id: id,
      parentId: id,
      username: User.get().username,
      _file: {
        container: container,
        type: photo.type,
        name: photo.name,
        size: photo.size,
        lastModified: photo.lastModified,
        caption: photo.caption
      }
    };

    return subarticle;
  };

  return {
    getArticle: getArticle,
    saveVideos: saveVideos,
    savePhotos: savePhotos,
    saveText: saveText,
    saveTitle: saveTitle,
    saveParentId: saveParentId,
    savePosition: savePosition,
    deleteVideo: deleteVideo,
    deletePhoto: deletePhoto,
    deleteText: deleteText,
    deleteArticle: deleteArticle,
    post: post,
    isPosting: isPosting
  };
}]);
