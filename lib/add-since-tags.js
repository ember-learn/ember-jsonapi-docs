'use strict'

module.exports = function addSinceTags (docSets) {
  let versionIndex = Object.create(null)

  docSets.forEach(function (versionData) {
    let data = versionData.data
    let version = versionData.version = versionData.version.replace('v', '')
    let classItems = data.classitems.filter(item => item.itemtype)

    classItems.forEach(function (classItem) {
      let classItemName = classItem.class + '#' + classItem.name
      createMethodEntry(versionIndex, classItemName, classItem.itemtype, version)
    })
  })

  sortVersionIndex(versionIndex)

  let classItems = classItemsWithItemType(docSets)

  classItems.forEach(classItem => {
    let classItemName = classItem.class + '#' + classItem.name
    let version = versionIndex[classItem.itemtype][classItemName][0]

    classItem.since = version
  })
}

function sortVersionIndex (versionIndex) {
  let keys = Object.keys(versionIndex)

  keys.forEach(function (key) {
    Object.keys(versionIndex[key]).forEach(function (item) {
      versionIndex[key][item].sort()
    })
  })
}

function createMethodEntry (versionIndex, method, itemType, version) {
  versionIndex[itemType] = versionIndex[itemType] || Object.create(null)
  versionIndex[itemType][method] = versionIndex[itemType][method] || []
  versionIndex[itemType][method].push(version)
}

function classItemsWithItemType (versions) {
  return versions.reduce((memo, versionData) => {
    return memo.concat(versionData.data.classitems.filter(item => item.itemtype))
  }, [])
}
