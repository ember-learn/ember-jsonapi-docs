var S3 = require('s3')
var RSVP = require('rsvp')
var path = require('path')
var fs = require('fs')

function mkdirp (dir) {
  return new RSVP.Promise(function (resolve, reject) {
    return require('mkdirp')(dir, {}, function (err, made) {
      if (err) return reject(err)
      resolve(made)
    })
  })
}

// These are read-only credentials to the builds.emberjs.com bucket only.
var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

var options = {
  s3Params: {
    Bucket: 'builds.emberjs.com',
    Prefix: 'tags'
  }
}

var client = S3.createClient({
  s3Options: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

function getObjects () {
  return new RSVP.Promise(function (resolve, reject) {
    var data = []

    client.listObjects(options).on('data', function (d) {
      data = data.concat(d.Contents)
    }).on('end', function () {
      resolve(data)
    }).on('error', reject)
  })
}

function downloadReleaseDocs (data) {
  var objects = data.filter(filterReleaseDocs)
  return RSVP.map(objects, downloadFile)
}

function downloadFile (document) {
  var name = path.basename(document.Key)
  var dir = path.basename(path.dirname(document.Key))

  var finalFile = path.join('tmp', dir, name)

  return mkdirp(path.dirname(finalFile)).then(function () {
    return new RSVP.Promise(function (resolve, reject) {
      if (fs.existsSync(finalFile)) {
        return resolve(finalFile)
      } else {
        client.downloadFile({
          localFile: finalFile,
          s3Params: {
            Bucket: 'builds.emberjs.com',
            Key: document.Key
          }
        })
          .on('end', function () {
            resolve(finalFile)
          })
          .on('error', function (err) {
            console.warn('err! ' + err)
            reject(err)
          })
      }
    })
  })
}

function filterReleaseDocs (document) {
  var key = document.Key.split('/')
  var tag = key[key.length - 2]
  var versionRegex = /v\d+\.\d+\.\d+$/
  return versionRegex.test(tag) && /-docs\.json/.test(key)
}

function getNewDocsToIndex (db, docs) {
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

module.exports = function fetch (db, releaseToGenDocFor) {
  return getObjects().then(docs => {
    let filteredDocs = docs.filter(doc => doc.Key.indexOf(releaseToGenDocFor) !== -1)
    return getNewDocsToIndex(db, filteredDocs)
  }).then(downloadReleaseDocs)
}
