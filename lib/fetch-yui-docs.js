let S3 = require('s3')
let RSVP = require('rsvp')
let path = require('path')
let fs = require('fs-extra')
let mkdirp = require('mkdir-promise')

// These are read-only credentials to the builds.emberjs.com bucket only.
let { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env

let client = S3.createClient({
  s3Options: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

let options = {
  s3Params: {
    Bucket: 'builds.emberjs.com',
    Prefix: 'tags'
  }
}

function getObjects () {
  return new RSVP.Promise((resolve, reject) => {
    let data = []

    client.listObjects(options).on('data', (d) => {
      data = data.concat(d.Contents)
    }).on('end', () => resolve(data)).on('error', reject)
  })
}

function downloadFile (document) {
  let name = path.basename(document.Key)
  let dir = path.basename(path.dirname(document.Key))

  let finalFile = path.join('tmp', 's3-docs', dir, name)

  return mkdirp(path.dirname(finalFile)).then(() => {
    return new RSVP.Promise((resolve, reject) => {
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
          .on('end', () => {
            console.log(`Downloaded ${finalFile}`)
            resolve(finalFile)
          })
          .on('error', (err) => {
            console.warn('err! ' + err)
            reject(err)
          })
      }
    })
  })
}

function filterReleaseDocs (document) {
  let key = document.Key.split('/')
  let tag = key[key.length - 2]
  let versionRegex = /v\d+\.\d+\.\d+$/
  return versionRegex.test(tag) && /-docs\.json/.test(key)
}

module.exports = function fetchYuiDocs (projects, specificDocsVersion) {
  return getObjects().then(docs => {
    let projectFiles = projects.map(p => `${p}-docs.json`)

    let filteredDocs = docs.filter(filterReleaseDocs).filter(doc => {
      return projectFiles.includes(doc.Key.split('/').pop()) && doc.Key.indexOf(specificDocsVersion) !== -1
    })

    return RSVP.map(filteredDocs, downloadFile)
  })
}
