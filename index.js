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
let marked = require('marked')

let db = new PouchDB(process.env.COUCH_URL)
let PROJECT_NAME = 'ember'
let fs = require('fs')

if (fs.existsSync('tmp/docs')) {
  rm.sync('tmp/docs')
}

function fetchProject (projectName) {
  let promise = fetch()
    .then(() => readDocs(projectName))
    .then(addSinceTags)
    .then(yuidocs => {
      return normalizeIDs(yuidocs, projectName)
    }).then(doc => {
      return createVersionIndex(db, projectName, doc).then(() => doc)
    }).then(doc => {
      doc.data.forEach(document => {
        let description

        if (description = document.attributes.description) {
          document.attributes.description = marked(description)
        }
      })
      return putClassesInCouch(doc, db)
    })

  return promise
}

let projects = ['ember', 'ember-data']

RSVP.map(projects, fetchProject).then(docs => {
  let giantDocument = {
    data: _.flatten(docs.map(doc => doc.data))
  }
  normalizeEmberDependencies(giantDocument)
  }).then(function () {
    let glob = require('glob')
    let path = require('path')

    let docs = glob.sync('tmp/docs/**/*.json')

    let Queue = require('promise-queue')
    let queue = new Queue(10)
    return RSVP.map(docs, function (doc) {
      return queue.add(() => {
        let document = require(path.join(__dirname, doc))

        document._id = `${document.data.type}-${document.data.id}`

        console.log(`putting ${document._id} in couchdb`)
        return db.get(document._id).catch(() => document).then(doc => {
          return db.put(_.extend({}, {_rev: doc._rev}, document))
        })
      })
    })
  })
  .catch(function (err) {
    console.warn('err!', err, err.stack)
    process.exit(1)
  })

function normalizeIDs (versions, projectName) {
  let tojsonapi = require('yuidoc-to-jsonapi/lib/converter')
  let updateIDs = require('./lib/update-with-versions-and-project')

  let jsonapidocs = versions.map(version => {
    let jsonapidoc = tojsonapi(version.data)
    return updateIDs(jsonapidoc, projectName, version.version)
  })

  let jsonapidoc = {
    data: _.flatten(jsonapidocs.map(d => d.data))
  }

  function extractRelationship (doc) {
    return {
      id: doc.id,
      type: doc.type
    }
  }

  let findType = require('./lib/filter-jsonapi-doc').byType

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
          data: findType(jsonapidoc, 'class').filter(filterForVersion(version)).map(extractRelationship)
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
