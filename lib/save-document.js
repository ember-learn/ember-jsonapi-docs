'use strict'

const fs = require('graceful-fs')
const RSVP = require('rsvp')
const path = require('path')
const mkdirp = require('mkdirp')
const Inflected = require('inflected')
const pluralize = Inflected.pluralize.bind(Inflected)

// updateOrCreate
module.exports = function saveDoc (document, projectName, version = '') {
  let documentPath = path.join(
    'tmp',
    'json-docs',
    projectName,
    version,
    pluralize(document.data.type),
    `${document.data.id}.json`
    )

  let json = JSON.stringify(document, null, 2)

  return new RSVP.Promise((resolve, reject) => {
    if (document.data.id.length > 50) {
      // wtf ember 1.0 docs??
      return resolve()
    }

    mkdirp.sync(path.dirname(documentPath))
    // console.log(`Saving ${documentPath}`) // good for debuggin
    return fs.writeFile(documentPath, json, (err, ok) => {
      if (err) {
        return reject(err)
      }
      resolve(documentPath)
    })
  })
}
