'use strict'

let RSVP = require('rsvp')
let _ = require('lodash')
var fetch = require('./lib/fetch')
var readDocs = require('./lib/read-docs')
var addSinceTags = require('./lib/add-since-tags')
var addInheritedItems = require('./lib/add-inherited-items')
var putClassesInCouch = require('./lib/classes-in-couch')
var createVersionIndex = require('./lib/create-version-index')
let normalizeEmberDependencies = require('./lib/normalize-ember-dependencies')
let normalizeIDs = require('./lib/normalize-ids')
let rm = require('rimraf')
let PouchDB = require('pouchdb')
require('marked')

let db = new PouchDB(process.env.COUCH_URL, {
  auth: {
    username: process.env.COUCH_USERNAME,
    password: process.env.COUCH_PASSWORD
  }
})
let fs = require('fs')

if (fs.existsSync('tmp/docs')) {
  rm.sync('tmp/docs')
}

function fetchProject (projectName) {
  console.log('downloading docs for ' + projectName)
  let promise = fetch()
    .then((stuff) => {
      console.log('reading docs for ' + projectName)
      return readDocs(projectName)
    })
    .then((stuff) => {
      console.log('adding since tags for ' + projectName)
      return addSinceTags(stuff)
    }).then((stuff) => {
      console.log('adding inherited items for ' + projectName)
      return addInheritedItems(stuff)
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
