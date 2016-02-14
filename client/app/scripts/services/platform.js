
'use strict';
var app = angular.module('instanews.service.platform', ['ionic', 'ngCordova']);

app.factory('Platform', [
  '$cordovaDevice',
  '$cordovaDialogs',
  '$cordovaFile',
  '$ionicActionSheet',
  '$ionicLoading',
  '$ionicNavBarDelegate',
  '$q',
  function(
    $cordovaDevice,
    $cordovaDialogs,
    $cordovaFile,
    $ionicActionSheet,
    $ionicLoading,
    $ionicNavBarDelegate,
    $q
  ) {

    var ready = $q.defer();

    var device = {
      type: '',
      token: ''
    };

    var getDevice = function() {
      return device;
    };

    var setDevice = function(dev) {
      device = dev;
    };

    var setDeviceToken = function(token) {
      device.token = token;
    };

    var getUUID = function() {
      if(ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
        return $cordovaDevice.getUUID();
      }
      return;
    };

    var isIOS = function() {
      return ionic.Platform.isIOS();
    };

    var isAndroid = function() {
      return ionic.Platform.isAndroid();
    };

    var isAndroid6 = function() {
      var version = ionic.Platform.version();
      console.log(version);
      return (isAndroid() && ionic.Platform.version() >= 6);
    };

    var isBrowser = function() {
      var ip = ionic.Platform;
      if(ip && window.cordova) {
        if(ip.isIOS() || ip.isAndroid() || ip.isWindowsPhone()) {
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    };

    /*
     * Sets or unsets the back button depending on if we are
     * running on a device or in the browser respectivelly
     */
    var initBackButton = function () {
      if(isBrowser()) {
        $ionicNavBarDelegate.showBackButton(false);
      } else {
        $ionicNavBarDelegate.showBackButton(true);
      }
    };

    var showToast = function(message) {
      if(!isBrowser()) {
        setTimeout( function() {
          window.plugins.toast.showShortCenter(message);
        }, 250);
      }
      console.log(message);
    };

    var showSheet = function(sheet) {
      $ionicActionSheet.show(sheet);
    };

    var showAlert = function (message, title, buttonName, cb) {
      if(!cb) {
        cb = buttonName;
        if(!cb) {
          buttonName = 'Ok';
          cb = title;
          if(!cb) {
            title = 'Alert';

            cb = function () {
              console.log('Dialog was confirmed');
            };
          } else if (typeof cb === 'function') {
            title = 'Alert';
          }
        } else if (typeof cb === 'function') {
          buttonName = 'Ok';
        }
      }

      $cordovaDialogs.alert(message, title, buttonName)
      .then(cb);
    };

    var showConfirm = function (message, title, buttonNames, cb) {
      if(!cb) {
        cb = buttonNames;
        if(!cb) {
          buttonNames = ['Ok', 'Cancel'];
          cb = title;
          if(!cb) {
            title = 'Confirm';

            cb = function () {
              console.log('Dialog was confirmed');
            };
          } else if (typeof cb === 'function') {
            title = 'Confirm';
          }
        } else if (typeof cb === 'function') {
          buttonNames = ['Ok', 'Cancel'];
        }
      }

      $cordovaDialogs.confirm(message, title, buttonNames)
      .then(cb);
    };

    var getDataDir = function() {
      return cordova.file.dataDirectory;
    };

    var getCacheDir = function() {
      return cordova.file.cacheDirectory;
    };

    var isCameraPresent = function () {
      return (navigator.camera && navigator.camera.getPicture);
    };

    var isVideoPresent = function () {
      return (navigator.device && navigator.device.capture && navigator.device.capture.captureVideo);
    };

    var getWidth = function () {
      return window.innerWidth;
    };

    var isLandscape = function () {
      var isLandscape = false;
      if(typeof(window.orientation) === 'number') {
        isLandscape = (window.orientation % 180);
      } else {
        isLandscape = (window.innerHeight < window.innerWidth);
      }

      return isLandscape;
    };

    var getDeviceType = function () {
      var height = Math.max(window.innerHeight, window.innerWidth);
      var type = 'phone';
      if( 900 <= height ) {
        type = 'tablet';
      }
      return type;
    };

    // Screen size logic
    var getSizeClass = function (max) {
      var pr = window.devicePixelRatio;
      var sizeClass;
      switch(getDeviceType()) {
        case 'phone':
          sizeClass = Math.floor(pr -1);
        break;
        case 'tablet':
          sizeClass = Math.ceil(pr*3/2);
        break;
        default:
          sizeClass = 0;
        break;
      }

      if(max || max === 0) {
        sizeClass = Math.min(sizeClass, max);
      }
      return sizeClass;
    };

    var getSizeClassPrefix = function (max) {
      var sizes = ['XS','S','M','L'];
      if(max) {
        max = Math.min(sizes.length -1, max);
      } else {
        max = 0;
      }

      return sizes[getSizeClass(max)];
    };

    var isTablet = function () {
      return 'tablet' === getDeviceType();
    };

    /* Initialization */
    if(isBrowser()) {
      console.log('App is running in the browser!');
      ready.resolve();
    }
    else {
      ionic.Platform.ready( function( device ) {
        /* jshint undef:false */
        if(navigator.connection && navigator.connection.type === Connection.NONE) {
          Platform.showAlert('Instanews is unavailable offline. Please try again later', 'Sorry', function () {
            if(navigator.app) {
              navigator.app.exitApp();
            }
          });
        } else {
          setTimeout(function () {
            ready.resolve( device);
          });

          setTimeout(function () {
            console.log('Splashscreen timeout');
            if(navigator.splashscreen) {
              navigator.splashscreen.hide();
            }
          }, 5000);
        }
      });
    }

    var keyboard = {
      hide: function () {
        if(window.cordova && cordova.plugins && cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.close();
        }
      },
      show: function () {
        if(window.cordova && cordova.plugins && cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.show();
        }
      }
    };

    var loading = {
      show: function () {
        if(!loading.loader ) {
           loading.loader = $ionicLoading.show({
            delay: 100,
            template: 'Loading...'
          });
          return loading.loader;
        }
      },
      hide: function () {
        if(loading.loader) {
          $ionicLoading.hide();
          loading.loader = null;
        }
      }
    };

    // Initialize the platform
    ready.promise
      .then(function() {
      loading.show();

      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        if(isIOS()) {
          console.log('Disabling keyboard scroll!');
          cordova.plugins.Keyboard.disableScroll(true);
        }
      }

      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      if (window.Mobihelp) {
        var options = {
          domain: 'instanews.freshdesk.com'
        };

        if(isIOS()) {
          //TODO Get iOS credentials
          options.appKey = 'instanews-2-fca5122354a07cf1c41c7e08e38cd988';
          options.appSecret = '093fc47da209e872dba380fb4f2c9cf226cc5193';
        } else if(isAndroid()) {
          options.appKey = 'instanews-1-66224bdfe44137a2d5272cc8976fbb73';
          options.appSecret = 'f5259266e2fb7076eaca67caecbcf2acf2259866';
        }
        window.Mobihelp.init(options);

        var getUnreadCount = function () {
          support.getUnreadCount(function (count) {
            support.unreadCount = count;
          });
        };

        //Refresh the count every 5 minutes
        setInterval(getUnreadCount, 5*60*1000);
        getUnreadCount();
      }
    });

    var support = {
      unreadCount: 0,
      show: function () {
        if(window.Mobihelp) {
          window.Mobihelp.showSupport();
        }
      },
      showConversations: function () {
        if(window.Mobihelp) {
          window.Mobihelp.showConversations();
        }
      },
      addData: function (key, data, isSensitive) {
        isSensitive = isSensitive || false;
        if(window.Mobihelp) {
          console.log('Adding support data');
          var addOne = function (key, val) {
            window.Mobihelp.addCustomData(function (succ, err) {
              if(succ) {
                if(!isSensitive) {
              //    console.log(key + ': ' + val);
                }
              } else {
                console.log('Failed to write custom data to support');
                console.log(err);
              }
            }, key, val, isSensitive);
          };

          var add =  function(key, obj, parents) {
            if(parents.length < 3) {
              parents.push(key);
              if(typeof obj === 'number' || typeof obj === 'string') {
                addOne(parents.join('.'), obj, isSensitive);
              } else if (typeof obj === 'object') {
                Object.getOwnPropertyNames(obj).forEach(function (val) {
                  add(val, obj[val], parents.slice());
                });
              }
            }
          };

          add(key, data, []);
        }
      },
      setEmail: function (email) {
        if(window.Mobihelp) {
          window.Mobihelp.setUserEmail(email);
        }
      },
      setName: function (name) {
        if(window.Mobihelp) {
          window.Mobihelp.setUserFullName(name);
        }
      },
      getUnreadCount: function (cb) {
        if(window.Mobihelp) {
          window.Mobihelp.getUnreadCountAsync(function (succ, count) {
            if(!succ) {
              console.log('Failed to get the unread count');
              count = 0;
            }
            cb(count);
          });
        }
      },
      clearData: function () {
        if(window.Mobihelp) {
          window.Mobihelp.clearCustomData(function (succ, err) {
            if(!succ) {
              console.log('Failed to clear custom support data!');
              console.log(err);
            } else {
              console.log('Cleared custom support data');
            }
          });
        }
      },
      clearUser: function () {
        if(window.Mobihelp) {
          window.Mobihelp.clearUserData();
          support.unreadCount = 0;
        }
      },
      clear: function () {
        support.clearData();
        support.clearUser();
      }
    };

    var getAppNameLogo = function () {
     //return '<img src="images/favicon.ico"/>stanews'; 
     return 'InstaNews'; 
    };

    //TODO Move to FileTransfer
    var removeFile = function (name, cb) {
      //TODO Add a directory option
      $cordovaFile.removeFile(getDataDir(), name)
      .then(function () {
        cb();
      }, cb);
    };

    return {
      support: support,
      keyboard: keyboard,
      getAppNameLogo: getAppNameLogo,
      loading: loading,
      getUUID: getUUID,
      getDataDir: getDataDir,
      getCacheDir: getCacheDir,
      showSheet: showSheet,
      showAlert: showAlert,
      showConfirm: showConfirm,
      showToast: showToast,
      removeFile: removeFile,
      initBackButton: initBackButton,
      isIOS: isIOS,
      isAndroid: isAndroid,
      isAndroid6: isAndroid6,
      isBrowser: isBrowser,
      isCameraPresent: isCameraPresent,
      isVideoPresent: isVideoPresent,
      isTablet: isTablet,
      isLandscape: isLandscape,
      getWidth: getWidth,
      getDevice: getDevice,
      setDevice: setDevice,
      setDeviceToken: setDeviceToken,
      getSizeClassPrefix: getSizeClassPrefix,
      ready: ready.promise
    };
  }
]);
