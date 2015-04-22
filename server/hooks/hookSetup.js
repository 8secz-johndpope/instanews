
module.exports = function(app) {
   //Setup all server side hooks that we need
   require('./votes.js')(app);
   require('./vote.js')(app);
   require('./installation.js')(app);
   require('./notification.js')(app);
   require('./up-vote.js')(app);
   require('./down-vote.js')(app);
   require('./subarticle.js')(app);
   require('./article.js')(app);
   require('./journalist.js')(app);
   require('./comment.js')(app);
};
