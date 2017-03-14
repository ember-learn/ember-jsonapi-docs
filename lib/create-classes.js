'use strict'

let RSVP = require('rsvp')
let saveDoc = require('./save-document')

module.exports = function (document, projectName) {
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
    console.log(`Creating ${klass.id} in ${projectName}-${document.data.attributes.version}`)
    return saveDoc(document, projectName, document.data.attributes.version)
  }).then(() => document)
}
