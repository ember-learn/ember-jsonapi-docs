var S3 = require('s3');
var RSVP = require('rsvp');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var _ = require('lodash');

var fetch = require('./lib/fetch');
var readDocs = require('./lib/read-docs');

fetch()
.then(readDocs)
.then(function(versions) {
  var VERSION_INDEX = Object.create(null);

  var since = {};

  versions.forEach(function(versionData) {
    var data = versionData.data;
    var version = versionData.version = versionData.version.replace('v', '');

    var classItems = data.classitems.filter(item => item.itemtype);

    function createMethodEntry(method, itemType, version) {
      VERSION_INDEX[itemType] = VERSION_INDEX[itemType] || Object.create(null);
      VERSION_INDEX[itemType][method] = VERSION_INDEX[itemType][method] || [];
      VERSION_INDEX[itemType][method].push(version);
    }

    classItems.forEach(function(method) {
      var methodName = method.class + '#' + method.name;
      createMethodEntry(methodName, method.itemtype, version);
      if (method.since) {
        since[methodName] = true;
      }
    });

  });
  var keys = Object.keys(VERSION_INDEX);

  var methods = versions.reduce(function(memo, version) {
    return memo.concat(version.data.classitems);
  }, []).filter(function(ci) {
    return !ci.since && ci.itemtype;
  });

  keys.forEach(function(key) {
    Object.keys(VERSION_INDEX[key]).forEach(function(item) {
      VERSION_INDEX[key][item].sort();
    });
  });

  methods.forEach(function(method) {
    var methodName = method.class + '#' + method.name;
    var version    = VERSION_INDEX[method.itemtype][methodName][0];
    var key        = methodName;

    method.since = version;
  });

  var PouchDB = require('pouchdb');

  var db = new PouchDB('http://localhost:5984/ember');

  var tojsonapi = require('yuidoc-to-jsonapi/lib/converter');

  var jsonapidocs = versions.map(function(version) {
    var jsonapidoc = tojsonapi(version.data);
    // now that we have one giant ass document, put it on a diet to something smaller.
    //
    var projectData = {
      type: 'project',
      id: 'ember',
      attributes: {
        github: 'https://github.com/emberjs/ember.js'
      }
    };

    var data = {
      _id: version.version,
      data: {
        id: version.version,
        type: 'project_version'
      },
      relationships: {
        classes: {
          data: jsonapidoc.data.filter(item => item.type === 'class').map(item => ({id: item.id, type: 'class'}))
        },
        modules: {
          data: jsonapidoc.data.filter(item => item.type === 'module').map(item => ({id: item.id, type: 'module'}))
        },
        project: {
          data: {
            id: 'ember',
            type: 'project'
          }
        }
      },
      included: [projectData]
    };

    return data;
  });

  return RSVP.map(jsonapidocs, function(jsonapidoc) {
    return db.get(jsonapidoc._id).then(function(doc) {
      return _.merge({}, {_rev: doc._rev}, jsonapidoc);
    }).catch(function() {
      // 404 probably
      return jsonapidoc;
    });
  }).then(function(docs) {
    return RSVP.map(docs, function(doc) {
      console.log('updating ' + doc._id);
      return db.put(doc);
    });
  });
}).catch(function(err) {
  console.warn('err!', err, err.stack);
  process.exit(1);
});

