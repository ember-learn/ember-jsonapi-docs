'use strict'

let _ = require('lodash')
let RSVP = require('rsvp')

function addSubModulesParentAttribute (moduleObj) {
  moduleObj.parent = moduleObj.is_submodule ? moduleObj.module : null
}

function filterStaticAndDerived (classes, className) {
  let included = !classes[className].hasOwnProperty('static') &&
        classes[className].hasOwnProperty('file')
  return included
}

function addPrivatePublicClassesAttributes (module, classes) {
  let classNames = Object.keys(module.classes)
  let applicableClassNames = _.filter(classNames, _.curry(filterStaticAndDerived)(classes))
  let partitionedClasses = _.partition(applicableClassNames, (className) => {
    return classes[className].access === 'private' ||
      classes[className].deprecated === true ||
      !classes[className].hasOwnProperty('access')
  })
  module.publicclasses = partitionedClasses[1]
  module.privateclasses = partitionedClasses[0]
  delete module.classes
}

function isPublicStaticMethod (item) {
  return item.itemtype === 'method' && item.access === 'public' && item.static === 1
}

function separateByClassName (result, value) {
  (result[value.class] || (result[value.class] = [])).push(value)
  return result
}

function sortByName (items) {
  return _.sortBy(items, 'name')
}

function separateFunctions (moduleName, classitems) {
  let matchesModule = (item) => item.module === moduleName
  return _.flow([
    _.curryRight(_.filter)(matchesModule),
    _.curryRight(_.filter)(isPublicStaticMethod),
    sortByName,
    _.curryRight(_.reduce)(separateByClassName, {})
  ])(classitems)
}

function cleanUpSubmodules (mod) {
  return _.flow([
    _.curryRight(_.filter)(item => item !== 'undefined'),
    _.curryRight(_.reduce)((result, value) => {
      result[value] = 1
      return result
    }, {})
  ])(Object.keys(mod.submodules))
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
      mod.submodules = cleanUpSubmodules(mod)
    })
  })

  return RSVP.resolve(docSets)
}
