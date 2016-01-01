'use strict'

let RSVP = require('rsvp')
let classWithIncluded = require('./filter-jsonapi-doc').classWithIncluded
let byType = require('./filter-jsonapi-doc').byType
let _ = require('lodash')
let Queue = require('promise-queue')
let updateIDs = require('./update-with-versions-and-project')
let tojsonapi = require('yuidoc-to-jsonapi/lib/converter')
let saveDoc = require('./save-document')

module.exports = function (document, db) {
  let classes = byType(document, 'class')
  let queue = new Queue(10)

  return RSVP.map(classes, klass => {
    let document = {
      _id: klass.id,
      data: klass
    }

    return queue.add(() => {
      return saveDoc(document, db)
    })
  })
}
