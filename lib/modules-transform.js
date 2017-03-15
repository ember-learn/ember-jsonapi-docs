'use strict'

let _ = require('lodash')
let RSVP = require('rsvp')

function addSubModulesParentAttribute (moduleObj) {
  moduleObj.parent = moduleObj.is_submodule ? moduleObj.module : null
}

function isPrivate (klass) {
  return klass.access === 'private' || klass.deprecated === true
}

function addPrivatePublicClassesAttributes (module, classes) {
  module.publicclasses = []
  module.privateclasses = []
  Object.keys(module.classes).forEach((className) => {
    isPrivate(classes[className]) ? module.privateclasses.push(className) : module.publicclasses.push(className)
  })
  delete module.classes
}

module.exports = function transformModules (docSets) {
  docSets.forEach(function (versionData) {
    let modules = _.values(versionData.data.modules)
    let classes = versionData.data.classes
    modules.forEach((mod) => {
      addSubModulesParentAttribute(mod)
      addPrivatePublicClassesAttributes(mod, classes)
    })
  })

  return RSVP.resolve(docSets)
}
