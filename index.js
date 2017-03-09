let RSVP = require('rsvp')
let archiver = require('archiver-promise')
let path = require('path')

let markup = require('./lib/markup')
let readDocs = require('./lib/read-docs')
let fetchYuiDocs = require('./lib/fetch-yui-docs')
let createClassesOnDisk = require('./lib/create-classes')
let transformYuiObject = require('./lib/transform-yui-object')
let normalizeEmberDependencies = require('./lib/normalize-ember-dependencies')
let { createVersionIndex } = require('./lib/manage-version-index')

let projects = ['ember', 'ember-data']
let specificDocsVersion = process.argv[2] ? process.argv[2] : ''
let docsVersionMsg = specificDocsVersion !== '' ? '. For version ' + specificDocsVersion : ''

console.log(`Downloading docs for ${projects.join(' & ')} ${docsVersionMsg}`)

fetchYuiDocs(specificDocsVersion)
.then(() => {
  return RSVP.map(projects, (projName) => {
    return transformYuiObject(readDocs(projName), projName)
            .then(doc => {
              return createVersionIndex(projName, doc).then(() => doc)
            }).then(doc => {
              return markup(doc)
            }).then(doc => {
              let giantDocument = {
                data: doc.data
              }
              console.log('normalizing dependencies')
              normalizeEmberDependencies(giantDocument)
              return createClassesOnDisk(giantDocument, projName)
            })
  })
}).then(() => {
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

RSVP.on('error', function (reason) {
  console.log(reason)
})
