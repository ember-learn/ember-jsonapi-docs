'use strict'

let RSVP = require('rsvp')
let _ = require('lodash')
var fetch = require('./lib/fetch')
var readDocs = require('./lib/read-docs')
var addSinceTags = require('./lib/add-since-tags')
var putClassesInCouch = require('./lib/classes-in-couch')
var createVersionIndex = require('./lib/create-version-index')
var createProjectVersions = require('./lib/create-project-versions')
let rm = require('rimraf')
let PouchDB = require('pouchdb')
let byType = require('./lib/filter-jsonapi-doc')

let db = new PouchDB('http://localhost:5984/documentation')
let PROJECT_NAME = 'ember'
let fs = require('fs')

if (fs.existsSync('tmp/docs')) {
  rm.sync('tmp/docs')
}

fetch()
  .then(readDocs)
  .then(addSinceTags)
  .then(yuidocs => {
    return normalizeIDs(yuidocs, PROJECT_NAME)
  })
  .then(createVersionIndex(db, PROJECT_NAME))
  .then(function (versions) {
    //return createProjectVersions(versions, 'ember', db).then(() => {
      return putClassesInCouch(versions, db)
    //})
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
    data: _.flatten(jsonapidocs.map(d => d.data)),
  }

  function extractRelationship(doc) {
    return {
      id: doc.id,
      type: doc.type
    }
  }

  let findType = require('./lib/filter-jsonapi-doc').byType

  let projectVersions = versions.map(version => {
    return {
      id: `${projectName}-${version.version}`,
      type: 'project-version',
      attributes: {
        version: version.version
      },
      relationships: {
        classes: {
          data: findType(jsonapidoc, 'class').map(extractRelationship)
        },
        modules: {
          data: findType(jsonapidoc, 'module').map(extractRelationship)
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

  let project = {
    type: 'project',
    id: `${projectName}`,
    attributes: {
      name: projectName,
      github_url: 'https://github.com/emberjs/ember.js'
    }
  }

  let doc = {
    data: jsonapidoc.data.concat(projectVersions).concat([project])
  }

  let saveDoc = require('./lib/save-document')

  let versionDocs = RSVP.map(projectVersions, (projectVersion) => {
    let doc = {
      data: projectVersion
    }

    return saveDoc(doc)
  })

  return versionDocs.then(() => doc)
}

