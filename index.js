const RSVP = require('rsvp')
const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2))

const markup = require('./lib/markup')
const readDocs = require('./lib/read-docs')
const fetchYuiDocs = require('./lib/fetch-yui-docs')
const createClassesOnDisk = require('./lib/create-classes')
const transformYuiObject = require('./lib/transform-yui-object')
const normalizeEmberDependencies = require('./lib/normalize-ember-dependencies')
const getVersionIndex = require('./lib/get-version-index')
const saveDoc = require('./lib/save-document')
const revProjVersionFiles = require('./lib/rev-docs')
const { syncToLocal, syncToS3 } = require('./lib/s3-sync')

RSVP.on('error', function (reason) {
  console.log(reason)
  process.exit(1)
})

let possibleProjects = ['ember', 'ember-data']
let projects = argv.project && possibleProjects.includes(argv.project) ? [argv.project] : possibleProjects
let specificDocsVersion = argv.version ? argv.version : ''

let docsVersionMsg = specificDocsVersion !== '' ? '. For version ' + specificDocsVersion : ''
console.log(`Downloading docs for ${projects.join(' & ')}${docsVersionMsg}`)

syncToLocal()
  .then(() => fetchYuiDocs(projects, specificDocsVersion))
  .then(() => readDocs(projects, specificDocsVersion))
  .then(docs => {
    return RSVP.map(projects, projectName => {
      return RSVP.map(docs[projectName], doc => {
        let docVersion = doc.version
        console.log(`Starting to process ${projectName}-${docVersion}`)
        return transformYuiObject([doc], projectName).then(markup).then(doc => {
          let giantDocument = {
            data: doc.data
          }
          console.log('normalizing dependencies')
          return normalizeEmberDependencies(giantDocument)
        }).then(doc => {
          return createClassesOnDisk(doc, projectName, docVersion)
        }).then(doc => {
          console.log(`Finished processing ${projectName}-${docVersion}`)
          return getVersionIndex(doc, projectName)
        }).then(doc => {
          revProjVersionFiles(projectName, docVersion)
          return doc
        })
      }).then((docs) => {
        let [docToSave, ...remainingDocs] = docs.filter(doc => doc.data.id === projectName)

        if (!docToSave) {
          return Promise.resolve()
        }

        let existingDoc = `tmp/json-docs/${projectName}/projects/${projectName}.json`
        if (fs.existsSync(existingDoc)) {
          existingDoc = fs.readJsonSync(existingDoc)
          docToSave.data.relationships['project-versions'].data = docToSave.data.relationships['project-versions'].data.concat(existingDoc.data.relationships['project-versions'].data)
        }

        remainingDocs.forEach(d => {
          docToSave.data.relationships['project-versions'].data = docToSave.data.relationships['project-versions'].data.concat(d.data.relationships['project-versions'].data)
        })
        return saveDoc(docToSave, projectName).then(() => projectName)
      })
    })
  })
  .then(() => {
    ['ember', 'ember-data'].map(project => {
      const projRevFile = `tmp/rev-index/${project}.json`
      let projRevFileContent = fs.readJsonSync(`tmp/json-docs/${project}/projects/${project}.json`)
      projRevFileContent.meta = {
        availableVersions: []
      }
      projRevFileContent.data.relationships['project-versions'].data.forEach(pV => projRevFileContent.meta.availableVersions.push(pV.id.replace(`${project}-`, '')))
      fs.writeJsonSync(projRevFile, projRevFileContent)
    })
  })
  .then(syncToS3)
