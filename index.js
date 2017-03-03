'use strict'

let RSVP = require('rsvp')
let _ = require('lodash')
let rm = require('rimraf')
let fs = require('fs')
let archiver = require('archiver-promise')
let path = require('path')

let fetch = require('./lib/fetch')
let readDocs = require('./lib/read-docs')
let addSinceTags = require('./lib/add-since-tags')
let addInheritedItems = require('./lib/add-inherited-items')
let addSubModulesParent = require('./lib/add-sub-modules-parent')
let createClassesOnDisk = require('./lib/create-classes')
let createVersionIndex = require('./lib/create-version-index')
let normalizeEmberDependencies = require('./lib/normalize-ember-dependencies')
let normalizeIDs = require('./lib/normalize-ids')
let markup = require('./lib/markup')

require('marked')

if (fs.existsSync('tmp/json-docs')) {
  rm.sync('tmp/json-docs')
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
      return createVersionIndex(projectName, doc).then(() => doc)
    }).then(doc => {
      console.log('converting markdown to html for ' + projectName)
      return markup(doc)
    })

  return promise
}

let projects = ['ember', 'ember-data']
let releaseToGenDocFor = process.argv[2] ? process.argv[2] : ''

console.log('downloading docs for ' + projects.join(' & '))

fetch(releaseToGenDocFor).then(() => {
  RSVP.map(projects, transformProjectFiles).then(docs => {
    let giantDocument = {
      data: _.flatten(docs.map(doc => doc.data))
    }
    console.log('normalizing dependencies')
    normalizeEmberDependencies(giantDocument)

    return createClassesOnDisk(giantDocument)
  }).then(function () {
    console.log('Zipping docs')
    let originalDir = __dirname
    process.chdir(path.join(originalDir, 'tmp'))
    let archive = archiver('docs.tar', {
      gzip: true,
      gzipOptions: {
        level: 1
      }
    })
    archive.directory('json-docs').finalize().then(() => {
      process.chdir(originalDir)
      console.log(`Done! The docs are zipped in tmp/docs.tar`)
    })
  })
}).catch(function (err) {
  console.warn('err!', err, err.stack)
  process.exit(1)
})
