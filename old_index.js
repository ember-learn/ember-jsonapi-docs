'use strict'

let RSVP = require('rsvp')
let _ = require('lodash')
let archiver = require('archiver-promise')
let path = require('path')

let fetch = require('./lib/fetch')
let readDocs = require('./lib/read-docs')
let addSinceTags = require('./lib/add-since-tags')
let addInheritedItems  = require('./lib/add-inherited-items')
let addSubModulesParent = require('./lib/add-sub-modules-parent')
let createClassesOnDisk = require('./lib/create-classes')
let { createVersionIndex, updateVersionIndex } = require('./lib/manage-version-index')
let normalizeEmberDependencies = require('./lib/normalize-ember-dependencies')
let normalizeIDs = require('./lib/normalize-ids')
let markup = require('./lib/markup')

function transformProjectFiles (projectName) {
  console.log(`Reading docs for ${projectName}`)

  return RSVP.resolve(readDocs(projectName))
    .then((stuff) => {
      console.log(`Adding sub modules parent for ${projectName}`)
      return addSubModulesParent(stuff)
    }).then((stuff) => {
      console.log(`Adding since tags for ${projectName}`)
      return addSinceTags(stuff)
    }).then((stuff) => {
      console.log(`Adding inherited items for ${projectName}`)
      return addInheritedItems(stuff)
    }).then(yuiDocs => {
      console.log(`Normalizing yui docs for ${projectName}`)
      return normalizeIDs(yuiDocs, projectName)
    }).then(doc => {
      console.log(`Creating version index for ${projectName}`)
      return createVersionIndex(projectName, doc).then(() => doc)
    }).then(doc => {
      console.log(`Converting markdown to html for ${projectName}`)
      return markup(doc)
    })
}

let projects = ['ember', 'ember-data']
let specificDocsVersion = process.argv[2] ? process.argv[2] : ''
let docsVersionMsg = specificDocsVersion !== '' ? '. For version ' + specificDocsVersion : ''

console.log(`Downloading docs for ${projects.join(' & ')} ${docsVersionMsg}`)

fetch(specificDocsVersion)
.then(() => RSVP.map(projects, transformProjectFiles))
.then(docs => {

  let giantDocument = {
    data: _.flatten(docs.map(doc => doc.data))
  }
  console.log('normalizing dependencies')
  normalizeEmberDependencies(giantDocument)
  return createClassesOnDisk(giantDocument)
}).then(() => {
  console.log('Updating versions index')
  projects.map(updateVersionIndex)

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

.catch(function (err) {
  console.warn('err!', err, err.stack)
  process.exit(1)
})
