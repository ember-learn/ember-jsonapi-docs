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

    return {
      version: version,
      data: JSON.parse(fs.readFileSync(docs))
    }
  })
}
