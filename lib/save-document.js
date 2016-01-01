'use strict'

let _ = require('lodash')
let fs = require('graceful-fs')
let RSVP = require('rsvp')
let path = require('path')
let mkdirp = require('mkdirp')
let Inflected = require('inflected')
let pluralize = Inflected.pluralize.bind(Inflected)

// updateOrCreate
module.exports = function saveDoc (document, db) {
  let documentPath = path.join('tmp', 'docs', pluralize(document.data.type), document.data.id + '.json')
  let json = JSON.stringify(document, null, 2)

  return new RSVP.Promise((resolve, reject) => {
    if (document.data.id.length > 50) {
      // wtf ember 1.0 docs??
      return resolve()
    }

    mkdirp.sync(path.dirname(documentPath))

    return fs.writeFile(documentPath, json, (err, ok) => {
      if (err) {
        return reject(err)
      }
      resolve(documentPath)
    })
  })
}
