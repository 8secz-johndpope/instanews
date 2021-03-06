
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var algorithm = 'aes-256-ctr';
var password = process.env.ENCRYPT_PASSWORD;

var keys = [];

/*
 * Decrypt the text and pass back the object
 */
// istanbul ignore next
var decrypt = function decrypt(text) {

  var decipher = crypto.createDecipher(algorithm, password);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');

  var object;

  try {
    object = JSON.parse(dec);
  }
  catch(err) {
    console.error(err);
    return false;
  }

  return object;
};

/*
 * Read the contents of the given file
 */
// istanbul ignore next
function readFile(name) {
  return fs.readFileSync(
    path.resolve(__dirname, name),
    'UTF-8'
  );
}

/*
 * Read and decrypt a given file and return its object
 */
// istanbul ignore next
function decryptFile(filename) {

  var cipher = readFile(filename);
  return decrypt(cipher);
}

/*
 * Return a value given a key from the keys read from .keys 
 */
var get = function(key) {

  var res;

  //console.log('Looking for ' + key);
  keys.forEach( function(pair) {
    //console.log('\t' + pair.key);
    if(pair.key === key) {
      res = pair.value;
      //console.log('\t' + res);
    }
  });

  if( !res ) {
    console.log('The key - ' + key + 'given did not have a match!');
  }

  return res;
};


// Read the keys and decrypt them
// istanbul ignore if 
if( process.env.NODE_ENV === 'production' ||
   process.env.NODE_ENV === 'staging') {
  if(!password) {
    console.error('Error: No password given!');
    //TODO Quit the application
  }
  else {
    if( process.env.NODE_ENV === 'production') {
      keys = decryptFile('.keys');
    }
    else {
      keys = decryptFile('.keys.staging');
    }
    if(!keys) {
      console.error('Error: Failure decrypting file');
      process.exit(1);
    }
  }
}
else {
  //Place any development credentials you need here
  keys = [{
    key: 'mongo',
    value: {
      url: (process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost') + ':' + (process.env.MONGODB_PORT_27027_TCP_PORT || 27017) + '/'
    }
  },
  {
    key: 'sendgrid',
    value: {
      user: 'instanews-dev',
      key: 'couchesareabit2fly4me'
    }
  },
  {
    key: 'redis',
    value: {
      host: (process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost'),
      port: (process.env.REDIS_PORT_6379_TCP_PORT || 6379)
    }
  }];
}

// Export the get function
module.exports.get = get;
