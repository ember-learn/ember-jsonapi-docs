'use strict'

let Queue = require('promise-queue')
let RSVP = require('rsvp')
let _ = require('lodash')
var fetch = require('./lib/fetch')
var readDocs = require('./lib/read-docs')
var addSinceTags = require('./lib/add-since-tags')
var putClassesInCouch = require('./lib/classes-in-couch')
var createVersionIndex = require('./lib/create-version-index')
let normalizeEmberDependencies = require('./lib/normalize-ember-dependencies')
let rm = require('rimraf')
let PouchDB = require('pouchdb')
require('marked')

let db = new PouchDB(process.env.COUCH_URL)
let fs = require('fs')

if (fs.existsSync('tmp/docs')) {
  rm.sync('tmp/docs')
}

function removeLongDocsBecauseEmber1HasWeirdDocs (document) {
  let str = 'A Suite can'
  return document.id.indexOf(str) === -1
}

function fetchProject (projectName) {
  console.log('downloading docs for ' + projectName)
  let promise = fetch()
    .then((stuff) => {
      console.log('reading docs for ' + projectName)
      return readDocs(projectName)
    })
    .then((stuff) => {
      console.log('reading docs for ' + projectName)
      return addSinceTags(stuff)
    }).then(yuidocs => {
      console.log('normalizing yuidocs for ' + projectName)
      return normalizeIDs(yuidocs, projectName)
    }).then(doc => {
      console.log('creating version index for ' + projectName)
      return createVersionIndex(db, projectName, doc).then(() => doc)
    }).then(doc => {
      console.log('converting markdown to html for ' + projectName)

      return require('./lib/markup')(doc)
    })

  return promise
}

let projects = ['ember', 'ember-data']

RSVP.map(projects, fetchProject).then(docs => {
  let giantDocument = {
    data: _.flatten(docs.map(doc => doc.data))
  }
  console.log('normalizing dependencies')
  normalizeEmberDependencies(giantDocument)

  return putClassesInCouch(giantDocument, db)
}).then(function () {
  let glob = require('glob')

  let docs = glob.sync('tmp/docs/**/*.json')

  let batchUpdate = require('./lib/batch-update')

  console.log('putting document in CouchDB')
  return batchUpdate(db, docs)
}).catch(function (err) {
  console.warn('err!', err, err.stack)
  process.exit(1)
})

function normalizeIDs (versions, projectName) {
  let tojsonapi = require('yuidoc-to-jsonapi/lib/converter')
  let updateIDs = require('./lib/update-with-versions-and-project')
  let findType = require('./lib/filter-jsonapi-doc').byType

  let jsonapidocs = versions.map(version => {
    let jsonapidoc = tojsonapi(version.data)
    return updateIDs(jsonapidoc, projectName, version.version)
  })

  let jsonapidoc = {
    data: _.flatten(jsonapidocs.map(d => d.data))
  }

  jsonapidoc.data = jsonapidoc.data.filter(removeLongDocsBecauseEmber1HasWeirdDocs)

  function extractRelationship (doc) {
    return {
      id: doc.id,
      type: doc.type
    }
  }

  function filterForVersion (version) {
    return function (doc) {
      var projectVersion = doc.relationships['project-version'].data.id.split('-').pop()
      return version.version === projectVersion
    }
  }

  let projectVersions = versions.map(version => {
    return {
      id: `${projectName}-${version.version}`,
      type: 'project-version',
      attributes: {
        version: version.version
      },
      relationships: {
        classes: {
          data: findType(jsonapidoc, 'class')
                    .filter(filterForVersion(version))
                    .filter(doc => {
                      return removeLongDocsBecauseEmber1HasWeirdDocs(doc)
                    })
                    .map(extractRelationship)
        },
        modules: {
          data: findType(jsonapidoc, 'module').filter(filterForVersion(version)).map(extractRelationship)
        },
        project: {
          data: {
            id: projectName,
            type: 'project'
          }
        }
      }
    }
  })

  let doc = {
    data: jsonapidoc.data.concat(projectVersions)
  }

  let saveDoc = require('./lib/save-document')

  let queue = new Queue(10)
  let versionDocs = RSVP.map(projectVersions, (projectVersion) => {
    let doc = {
      data: projectVersion
    }

    return queue.add(() => saveDoc(doc))
  })

  return versionDocs.then(() => doc)
}
