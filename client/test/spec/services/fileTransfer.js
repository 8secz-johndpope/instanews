"use strict";

describe('instanews.service.fileTransfer', function() {

  var fileTransfer, cordovaFileTransfer;

  beforeEach(function() {

    module('instanews.service.fileTransfer');

    module(function($provide) {
      $provide.service('$cordovaFileTransfer', function() {
        return {
          upload: function() {},
          download: function() {}
        };
      });
    });
  });

  beforeEach(inject(function(
    $cordovaFileTransfer,
    FileTransfer
  ) {
    cordovaFileTransfer = $cordovaFileTransfer;
    fileTransfer = FileTransfer;
  }));

  describe('upload', function() {
    it('should call $cordovaFileTransfer.upload once', function() {
      sinon.spy(cordovaFileTransfer, 'upload');
      fileTransfer.upload();
      expect(cordovaFileTransfer.upload.calledOnce).to.be.true;
    });
  });

  describe('download', function() {
    it('should call $cordovaFileTransfer.download once', function() {
      sinon.spy(cordovaFileTransfer, 'download');
      fileTransfer.download();
      expect(cordovaFileTransfer.download.calledOnce).to.be.true;
    });
  });
});