'use strict'

var fs = require('fs')
var glob = require('glob')
var path = require('path')
let Inflected = require('inflected')

module.exports = function readDocs (docName) {
  let fileName = Inflected.dasherize(docName) + '-docs.json'
  var folders = glob.sync(`tmp/*/${fileName}`)

  return folders.map(function (docs) {
    var version = path.basename(path.dirname(docs)).replace('v', '')
    var data

    try {
      data = JSON.parse(fs.readFileSync(docs, { encoding: 'utf8' }))
    } catch (e) {
      console.error(docs)
      console.error(e.stack)
      process.exit(1);
    }

    return {
      version: version,
      data: data
    }
  })
}
