
var common = require('./common');
var cred = require('../conf/credentials');
var aws = require('aws-sdk');
var MessageValidator = require('sns-validator');
var validator = new MessageValidator();

module.exports = function(Storage) {

  var staticDisable = [
    'getContainers',
    'getContainer',
    'createContainer',
    'destroyContainer',
    'getFiles',
    'removeFile',
    'getFile'
  ];

  var transcoder;
  var credentials = cred.get('aws');
  if(credentials) {
    transcoder = new aws.ElasticTranscoder({
      region: 'us-east-1',
      accessKeyId: credentials.keyId,
      secretAccessKey: credentials.key
    });

    sns = new aws.SNS({
      region: 'us-east-1',
      accessKeyId: credentials.keyId,
      secretAccessKey: credentials.key
    });
  }

  var containers = [{
    Name: 'instanews.videos.in',
    Output: 'instanews.videos',
    Params: {
      PipelineId: '1444324496785-65xn4p',
      Input: {
        Key: null,
        AspectRatio: 'auto', 
        Container: 'auto',
        FrameRate: 'auto',
        Resolution: 'auto',
        Interlaced: 'auto'
      },
      //TODO Do a gif to use as the poster
      Outputs: [{
        Key: '2M',
        SegmentDuration: '5', //Seconds/segment
        Rotate: 'auto',
        //HLS 2M
        PresetId: '1351620000001-200010' 
      },
      {
        Key: 'hd.mp4',
        Rotate: 'auto',
        //iPhone4S+ (1920x1080 Mp4 High-profile AAC)
        PresetId: '1351620000001-100020' 
      },
      {
        Key: 'sd.mp4',
        Rotate: 'auto',
        //iPhone1-3 (640x480 Mp4 baseline AAC
        PresetId: '1351620000001-100040' 
      }]
      //TODO webM
    }
  }];

  var getContainer = function (name) {
    for(var i in containers) {
      var cntr = containers[i];
      if(cntr.Name === name) {
        return cntr;
      }
    }
  };

  var getTranscoderParams = function (containerName, filename) {
    var cntr = getContainer(containerName);
    var name = filename.slice(0, filename.lastIndexOf('.'));

    cntr.Params.Input.Key = filename;
    for(var j in cntr.Params.Outputs) {
      cntr.Params.Outputs[j].Key = name + '-' + cntr.Params.Outputs[j].Key;
    }
    return cntr.Params;
  };

  var getOutputContainerName = function(input) {
    var cntr = getContainer(input);
    if(cntr) {
      return cntr.Output;
    }
  };

  common.disableRemotes(Storage, staticDisable,true);

  Storage.triggerTranscoding = function (containerName, file, cb) {
    var params = getTranscoderParams(containerName, file);

    if(params) {
      if(transcoder) {
        transcoder.createJob(params, function (err, res) {
          if(err) {
            console.error('Failed to create transcoding job');
            console.error(err.stack);
            return cb(err);
          } 

          var id = res.Job.Id;
          var obj = {
            id: id,
            container: getOutputContainerName(containerName),
            outputs: []
          };

          var outputs = res.Job.Outputs;
          for(var i in outputs) {
            var key = outputs[i].Key;
            if(outputs[i].SegmentDuration) {
              key += '.m3u8';
            }
            obj.outputs.push(key);
          }

          console.log('Transcoding Job ' + id + ' has started!');
          cb(null, obj);
        });
      } else {
        console.warn('No transcoder established!');
        cb();
      }
    } else {
      console.warn('No transcoding params were found for ' + containerName);
      cb();
    }
  };

  Storage.transcodingComplete = function (ctx, job, next) {
    var req = ctx.req;

    var chunks = [];
    req.on('data', function(chunk) {
      chunks.push(chunk);
    });

    req.on('end', function () {

      if(chunks.length > 0) {
        var job;
        try {
          job = chunks.join('');
          job = JSON.parse(job);
          //job = JSON.parse(job);
        } catch(e) {
          var err = new Error('Failed to parse the raw body');
          console.log(e);
          return next(err);
        }

        console.log('\nJob After Parse');
        console.dir(job, { colors: true });

        validator.validate(job, function(err, job) {
          if(err) {
            console.error(err.stack);
            next(err);
          } else {

            switch(job.Type) {
              case 'Notification':
                var message = job.Message;
              try {
                message = JSON.parse(message);
                console.dir(message, { colors: true });
                //TODO call Subarticle.update to change the pending subarticle to complete

                console.log('Transcoding Job ' + message.jobId + ' has finished!');
                return next();
              } catch(e) {
                var err = new Error('Failed to parse the notification message');
                console.log(e);
                return next(err);
              }
              break;
              case 'SubscriptionConfirmation':
                if(sns) {
                sns.confirmSubscription({
                  Token: job.Token,
                  TopicArn: job.TopicArn
                }, function(err, data) {
                  if( err) {
                    console.error(err.stack);
                    next(err);
                  } else {
                    console.dir(data, {colors: true});
                    next();
                  }
                });
              } else {
                console.warn('No SNS connection established');
                next();
              }
              break;
              default:
                var e = new Error('Unknown message type ' + job.Type);
              e.status = 403;
              next(e);
              break;
            }
          }
        });
      } else {
        console.log('No data passed into transcodingComplete');
        next();
      }
    });
  };

  Storage.remoteMethod(
    'transcodingComplete',
    {
      description: 'Handles job completion notifications passed from the transcoder',
      accepts: [{
        arg: 'ctx', type: 'object', 'http': { source: 'context'}
      },
      {
        arg: 'job', type: 'object', 'http': { source: 'body'}
      }]
    }
  );
};
