let path = require('path')
let fs = require('fs')
let RSVP = require('rsvp')

module.exports = function getNewDocsToIndex (db, docs) {
  return db.allDocs({
    keys: ['project-ember', 'project-ember-data'],
    include_docs: true
  }).then(projectVersions => {
    let docsToDownload = docs

    if (projectVersions.total_rows > 0) {
      let [ {doc: emberProjectDoc}, {doc: emberDataProjectDoc} ] = projectVersions.rows

      // Save now for merging later
      let cachedDocsFolder = path.join('tmp', 'cached-docs')
      require('mkdirp').sync(cachedDocsFolder)
      fs.writeFileSync(path.join(cachedDocsFolder, 'project-ember.json'), JSON.stringify(emberProjectDoc))
      fs.writeFileSync(path.join(cachedDocsFolder, 'project-ember-data.json'), JSON.stringify(emberDataProjectDoc))

      let indexedEmberVersions = []
      let indexedEmberDataVersions = []

      emberProjectDoc.data.relationships['project-versions'].data.forEach(doc => {
        indexedEmberVersions.push(doc.id.replace('ember-', ''))
      })

      emberDataProjectDoc.data.relationships['project-versions'].data.forEach(doc => {
        indexedEmberDataVersions.push(doc.id.replace('ember-data-', ''))
      })

      docsToDownload = docsToDownload.filter(doc => {
        let docString = doc.Key.split('/')
        let projectName = docString[2].replace('-docs.json', '')
        let projectVersion = docString[1].replace('v', '')

        if (projectName === 'ember') {
          return indexedEmberVersions.indexOf(projectVersion) === -1
        } else if (projectName === 'ember-data') {
          return indexedEmberDataVersions.indexOf(projectVersion) === -1
        }
      })

      if (docsToDownload.length === 0) {
        console.log('No more docs to index')
        process.exit(0)
      }
    }

    return RSVP.resolve(docsToDownload)
  })
}
