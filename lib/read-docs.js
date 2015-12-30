var fs = require('fs')
var glob = require('glob')
var path = require('path')

module.exports = function readDocs () {
  var folders = glob.sync('tmp/*')

  return folders.map(function (folder) {
    var version = path.basename(folder)
    var docs = path.join(folder, 'ember-docs.json')

    return {
      version: version,
      data: JSON.parse(fs.readFileSync(docs))
    }
  })
}
