import _ from 'lodash'

export default function addSinceTags(docSets) {
  let versionIndex = Object.create(null)

  docSets.forEach(versionData => {
    let data = versionData.data
    let version = (versionData.version = versionData.version.replace('v', ''))
    let classItems = data.classitems.filter(({ itemtype }) => itemtype)

    classItems.forEach(classItem => {
      let classItemName = `${classItem.class}#${classItem.name}`
      classItem.version = version
      createMethodEntry(versionIndex, classItemName, classItem.itemtype, version)
    })

    let classes = _.values(data.classes)

    classes.forEach(klass => {
      klass.version = version
      createMethodEntry(versionIndex, klass.name, 'class', version)
    })
  })

  sortVersionIndex(versionIndex)

  let classItems = classItemsWithItemType(docSets)

  classItems.forEach(classItem => {
    let classItemName = `${classItem.class}#${classItem.name}`
    let version = versionIndex[classItem.itemtype][classItemName][0]

    classItem.since = version
  })

  let classes = _.chain(docSets)
    .map('data')
    .map('classes')
    .flatten()
    .map(klassSet => _.values(klassSet))
    .flatten()
    .value()

  classes.forEach(klass => (klass.since = versionIndex['class'][klass.name][0]))

  return Promise.resolve(docSets)
}

function sortVersionIndex(versionIndex) {
  let keys = Object.keys(versionIndex)

  keys.forEach(key =>
    Object.keys(versionIndex[key]).forEach(item => versionIndex[key][item].sort()),
  )
}

const createMethodEntry = (versionIndex, method, itemType, version) => {
  versionIndex[itemType] = versionIndex[itemType] || Object.create(null)
  versionIndex[itemType][method] = versionIndex[itemType][method] || []
  versionIndex[itemType][method].push(version)
}

const classItemsWithItemType = versions =>
  versions.reduce(
    (memo, { data }) => memo.concat(data.classitems.filter(({ itemtype }) => itemtype)),
    [],
  )
