'use strict'

let RSVP = require('rsvp')
let _ = require('lodash')
let rm = require('rimraf')
let PouchDB = require('pouchdb')
let fs = require('fs')
let glob = require('glob')

let fetch = require('./lib/fetch')
let readDocs = require('./lib/read-docs')
let addSinceTags = require('./lib/add-since-tags')
let addInheritedItems = require('./lib/add-inherited-items')
let addSubModulesParent = require('./lib/add-sub-modules-parent')
let putClassesInCouch = require('./lib/classes-in-couch')
let createVersionIndex = require('./lib/create-version-index')
let normalizeEmberDependencies = require('./lib/normalize-ember-dependencies')
let normalizeIDs = require('./lib/normalize-ids')
let markup = require('./lib/markup')
let batchUpdate = require('./lib/batch-update')

require('marked')

let db = new PouchDB(process.env.COUCH_URL, {
  auth: {
    username: process.env.COUCH_USERNAME,
    password: process.env.COUCH_PASSWORD
  }
})

if (fs.existsSync('tmp/docs')) {
  rm.sync('tmp/docs')
}

function transformProjectFiles (projectName) {
  console.log('reading docs for ' + projectName)
  let promise = RSVP.resolve(readDocs(projectName))
    .then((stuff) => {
      console.log('adding sub modules parent for ' + projectName)
      return addSubModulesParent(stuff)
    }).then((stuff) => {
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
      return markup(doc)
    })

  return promise
}

let projects = ['ember', 'ember-data']
let releaseToGenDocFor = process.argv[2] ? process.argv[2] : ''

console.log('downloading docs for ' + projects.join(' & '))

fetch(db, releaseToGenDocFor).then(downloadedFiles => {
  RSVP.map(projects, transformProjectFiles).then(docs => {
    let giantDocument = {
      data: _.flatten(docs.map(doc => doc.data))
    }
    console.log('normalizing dependencies')
    normalizeEmberDependencies(giantDocument)

    return putClassesInCouch(giantDocument, db)
  }).then(function () {
    let docs = glob.sync('tmp/docs/**/*.json')

    console.log('putting document in CouchDB')
    return batchUpdate(db, docs)
  }).catch(function (err) {
    console.warn('err!', err, err.stack)
    process.exit(1)
  })
})
