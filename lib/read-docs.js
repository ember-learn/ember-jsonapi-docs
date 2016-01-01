var fs = require('fs')
var glob = require('glob')
var path = require('path')

module.exports = function readDocs () {
  var folders = glob.sync('tmp/*/ember-docs.json')

  return folders.map(function (docs) {
    var version = path.basename(path.dirname(docs)).replace('v', '')

    return {
      version: version,
      data: JSON.parse(fs.readFileSync(docs))
    }
  })
}
