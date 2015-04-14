
var common = require('./common');

module.exports = function(Journalist) {

   var staticDisable = [
      'exists',
      'updateAll',
      'count'
   ];

   var nonStaticDisable = [
      '__destroy__votes',
      '__update__votes',
      '__create__votes',
      '__get__votes',
      '__create__upVotes',
      '__delete__upVotes',
      '__updateById__upVotes',
      '__upsert__upVotes',
      '__destroyById__upVotes',
      '__create__downVotes',
      '__delete__downVotes',
      '__updateById__downVotes',
      '__upsert__downVotes',
      '__destroyById__downVotes',
      '__delete__articles',
      '__get__accessTokens',
      '__create__accessTokens',
      '__delete__accessTokens',
      '__updateById__accessTokens',
      '__findById__accessTokens',
      '__destroyById__accessTokens',
      '__count__accessTokens'
   ];

   common.disableRemotes(Journalist,staticDisable,true);
   common.disableRemotes(Journalist,nonStaticDisable,false);


   Journalist.afterRemote('prototype.__get__articles',
   function(ctx, instance, next) {

      //Automatically remove all duplicate articles
      //since they are gotten through a through model
      var uniqueIds = [];
      for(var i = 0; i < instance.length; i++) {
         if(uniqueIds.indexOf(instance[i].myId) > -1 ) {
            instance.splice(i,1);
            i--;
         }
         else {
            uniqueIds.push(instance[i].myId);
         }
      }

      next();
   });

   Journalist.observe('access', function(ctx, next) {
      var inst = ctx.instance;
      if ( inst) {
         //TODO Complete this
         inst.password = '';
      }
      next();
   });
};