'use strict'

let _ = require('lodash')
let RSVP = require('rsvp')

module.exports = function addInheritedItems(docSets) {
  docSets.forEach(function(versionData) {
    let data = versionData.data
    let classes = _.values(data.classes).filter(klass => klass && klass.name)
    classes = classes.filter(removeLongDocsBecauseEmber1HasWeirdDocs)
    let classItems = data.classitems.filter(item => item.itemtype)

    classes.forEach(function(klass) {
      let parents = getParents(klass, classes)

      for (let i = 0; i < parents.length; ++i) {
        parents = parents.concat(getParents(parents[i], classes))
      }
      parents.forEach(function(parent) {
        if (!parent) return
        let parentItems = classItems.filter(item => item.class === parent.name)
        parentItems = parentItems.map(item => {
          item = _.clone(item)
          item.inherited = true
          item.inheritedFrom = item.class
          item.class = klass.name
          return item
        })
        data.classitems = data.classitems.concat(parentItems)
      })
    })
  })

  return RSVP.resolve(docSets)
}

function getParents(klass, classes) {
  let parents = []
  if (klass.extends) {
    parents = parents.concat([klass.extends])
  }
  if (klass.uses && klass.uses.length) {
    parents = parents.concat(klass.uses.reverse())
  }
  return parents
    .map(parent => _.find(classes, klass => klass.name === parent))
    .filter(parent => parent)
}

function removeLongDocsBecauseEmber1HasWeirdDocs(document) {
  let str = 'A Suite can'
  return document.name.indexOf(str) === -1
}
