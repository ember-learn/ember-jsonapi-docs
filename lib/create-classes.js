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
    let version = document.data.attributes.version
    let displayVersion = version ? `-${version}` : ' (missing)'
    console.log(`Creating ${klass.id} in ${projectName}${displayVersion}`)
    return saveDoc(document, projectName, version)
  }).then(() => document)
}
