
var should = require('chai').should(),
    supertest = require('supertest'),
    app = require('../server/server'),
    api = supertest(app),
    assert = require('assert');

function importTest(name, path) {
   describe(name, function () {
      require(path);
   });
}

exports.assert = assert;
exports.app = app;
exports.api = api;
exports.importTest = importTest;
