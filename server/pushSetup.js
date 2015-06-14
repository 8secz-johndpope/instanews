
module.exports = function (app) {
  // Setup push notifications
  var App = app.models.app;
  var Push = app.models.push;
  var Votes = app.models.votes;
  var appName = 'instanews';

  if ( process.env.NODE_ENV === 'production' ||
	 process.env.NODE_ENV === 'staging' ) 
  {
	 var cred = require('./conf/credentials');

	 var gcmServerApiKey = cred.get('gcmServerApiKey'); 
	 var apnsCertData = cred.get('apnsCert');
	 var apnsKeyData = cred.get('apnsKey');

	 startPushServer();
  }

  function startPushServer() {

	 Push.on('error', function (err) {
		 console.log('Push Notification error: ', err.stack);
	 });


	 App.observe('before save', function(ctx, next) {
		 var inst = ctx.instance;
		 if( inst) {
			 if( inst.name === appName) {
				 inst.id = 'instanews';
			 }
		 }
		 next();
	 });

	 App.register('zanemcca', appName,{
		 description: 'Local Citizen Journalism',
		 pushSettings: {
			 apns: {
				 certData: apnsCertData,
				 keyData: apnsKeyData,
				 pushOptions: {
					 //Could add aditional options in here
				 },
				 feedbackOptions: {
					 batchFeedback: true,
					 interval: 300
				 }
			 },
			 gcm: {
				 serverApiKey: gcmServerApiKey
			 }
		 }
	 },function(err, app) {
		 if (err) {
			 console.log('Error Registering app: ' , err);
		 }
  /*      else {
			 console.log('Registration of app successful: ' , app);
		 }
		 */
	 });
  }
};
