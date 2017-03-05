let _ = require('lodash')
let RSVP = require('rsvp')

module.exports = function addSubModulesParent (docSets) {
  docSets.forEach((versionData) => {
    let modules = _.values(versionData.data.modules)

    modules.forEach((mod) => {
      if (mod.is_submodule) {
        mod.parent = mod.module
      }
    })
  })

  return RSVP.resolve(docSets)
}
