'use strict'

let PouchDB = require('pouchdb')
let RSVP = require('rsvp')
let classWithIncluded = require('./filter-jsonapi-doc').classWithIncluded
let byType = require('./filter-jsonapi-doc').byType
let _ = require('lodash')
let Queue = require('promise-queue')

module.exports = function putClassesInCouch (document, projectName, version) {
  let classes = byType(document, 'class')
  var db = new PouchDB('http://localhost:5984/classes')

  let queue = new Queue(10)

  return RSVP.map(classes, (klass) => {
    return queue.add(() => {
      let docID = `${projectName}-${version}-${klass.id}`

      let jsonapidoc = classWithIncluded(document, klass.id)

      return (
      db
        .get(docID)
        .catch(() => jsonapidoc /* do nothing, probably 404 */)
        .then((doc) => {
          let updatedDocument = _.merge({}, {_id: docID}, doc, jsonapidoc)

          return db.put(updatedDocument)
        })
      )
    })
  })
}
