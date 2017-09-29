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

function isPublicStaticMethod(item) {
  return item.itemtype === 'method' && item.access === 'public' && item.static === 1
}

function separateByClassName(result, value) {
  (result[value.class] || (result[value.class] = [])).push(value)
  return result
}

function sortByName(items) {
  return _.sortBy(items, 'name')
}

function separateFunctions(moduleName, classitems) {
  let matchesModule = (item) => item.module === moduleName;
  return _.flow([
    _.curryRight(_.filter)(matchesModule),
    _.curryRight(_.filter)(isPublicStaticMethod),
    sortByName,
    _.curryRight(_.reduce)(separateByClassName, {})
  ])(classitems)
}

module.exports = function transformModules (docSets) {
  docSets.forEach(function (versionData) {
    let modules = _.values(versionData.data.modules)
    let classes = versionData.data.classes
    let classitems = versionData.data.classitems
    modules.forEach((mod) => {
      addSubModulesParentAttribute(mod)
      addPrivatePublicClassesAttributes(mod, classes)
      mod.staticfunctions = separateFunctions(mod.name, classitems)
    })
  })

  return RSVP.resolve(docSets)
}
