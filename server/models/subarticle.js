var common = require('./common');

module.exports = function(Subarticle) {


   common.initVotes(Subarticle);

   var staticDisable = [
      'exists',
      'create',
      'find',
      'count',
      'findOne',
      'upsert',
      'prototype.updateAttributes',
      'deleteById',
      'updateAll'
   ];

   var nonStaticDisable = [
      //disable all comment REST endpoints
      '__get__comments',
      '__delete__comments',
      '__destroyById__comments',
      '__findById__comments',
      '__create__comments',
      '__updateById__comments',
      '__count__comments',
      //disable all upvote REST endpoints
      '__get__upVotes',
      '__delete__upVotes',
      '__destroyById__upVotes',
      '__findById__upVotes',
      '__create__upVotes',
      '__updateById__upVotes',
      '__count__upVotes',
      //disable all downvote REST endpoints
      '__get__downVotes',
      '__delete__downVotes',
      '__destroyById__downVotes',
      '__findById__downVotes',
      '__create__downVotes',
      '__updateById__downVotes',
      '__count__downVotes',
      //disable all file REST endpoints
      '__get__file',
      '__destroy__file',
      '__create__file',
      '__update__file',
      //disable the article REST endpoint
      '__get__article',
      //disable the journalist REST endpoint
      '__get__journalist'
   ];

   common.disableRemotes(Subarticle,staticDisable,true);
   common.disableRemotes(Subarticle,nonStaticDisable,false);

   //TODO Move this into the hooks directory
   Subarticle.observe('before save', function(ctx, next) {
      var inst = ctx.instance;

      if ( inst ) {
         if ( inst._file ) {
            if ( inst._file.type === 'video') {
  //             console.log('Saving a video');
               if ( !inst._file.poster ) {
                  inst._file.poster = 'img/ionic.png';
               }
            }
            else {
//               console.log('Saving some other media type');
            }
         }
      }
      next();
   });

};

