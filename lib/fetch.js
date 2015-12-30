var S3 = require('s3');
var RSVP = require('rsvp');
var path = require('path');
var fs = require('fs');

function mkdirp(dir) {
  return new RSVP.Promise(function(resolve, reject) {
    return require('mkdirp')(dir, {}, function(err, made) {
      if (err) return reject(err);
      resolve(made);
    });
  });
}

// These are read-only credentials to the builds.emberjs.com bucket only.
var AWS_ACCESS_KEY_ID ='AKIAIXREYVPBF32SMHYA';
var AWS_SECRET_ACCESS_KEY = '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';

var options = {
  s3Params: {
    Bucket: 'builds.emberjs.com',
    Prefix: 'tags'
  }
};

var client = S3.createClient({
  s3Options: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

function getObjects() {
  return new RSVP.Promise(function(resolve, reject) {
    var data = [];

    client.listObjects(options).on('data', function(d) {
      data = data.concat(d.Contents);
    }).on('end', function() {
      resolve(data);
    }).on('error', reject);
  });
}

function downloadReleaseDocs(data) {
  var objects = data.filter(filterReleaseDocs);
  return RSVP.map(objects, downloadFile);
}

function downloadFile(document) {
  var key = document.Key.split('/');
  var name = path.basename(document.Key);
  var dir  = path.basename(path.dirname(document.Key));

  var finalFile = path.join('tmp', dir, name);

  return mkdirp(path.dirname(finalFile)).then(function() {
    return new RSVP.Promise(function(resolve, reject) {
        if (fs.existsSync(finalFile)) {
          console.log(finalFile + ' already exists! not re-downloading');
          return resolve();
        } else {
          client.downloadFile({
            localFile: finalFile,
            s3Params: {
              Bucket: 'builds.emberjs.com',
              Key: document.Key
            }
          })
          .on('end', function() {
            console.log('done downloading! ' + dir + ' ' + name);
            resolve();
          })
          .on('error', function(err) {
            console.warn('err! ' + err);
            reject(err);
          });
        }
      });
  });
}

function filterReleaseDocs(document) {
  var key = document.Key.split('/');
  var name = key[key.length - 1];
  var tag = key[key.length - 2];
  var versionRegex = /v\d+\.\d+\.\d+$/;
  return versionRegex.test(tag) && name === 'ember-docs.json';
}

module.exports = function fetch() {
  return getObjects().then(downloadReleaseDocs);
};

