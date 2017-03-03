'use strict'

let RSVP = require('rsvp')
let saveDoc = require('./save-document')

module.exports = function (document) {
  let things = document.data

  return RSVP.map(things, klass => {
    if (!klass.id) {
      console.log(klass)
      console.log(new Error('WHAT').stack)
      process.exit(1)
    }
    let document = {
      data: klass
    }

    return saveDoc(document)
  }).then(() => document)
}
