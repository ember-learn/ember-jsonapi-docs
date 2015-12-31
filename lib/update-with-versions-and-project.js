'use strict'

let _ = require('lodash')

function generateID(projectName, version, id) {
  return `${projectName}-${version}-${id}`
}

function updateDocument(doc, projectName, version) {
  let dup = doc

  dup.id = generateID(projectName, version, dup.id)

  Object.keys(dup.relationships || {}).forEach(relationshipKey => {
    let relationship = dup.relationships[relationshipKey]

    if (relationship && relationship.data) {
      if (Array.isArray(relationship.data)) {
        relationship.data.forEach(data => {
          data.id  = generateID(projectName, version, data.id)
        })
      } else {
        relationship.data.id = generateID(projectName, version, relationship.data.id)
      }
    }
  })

  return dup
}

module.exports = function updateWithIDs(document, projectName, version) {
  let dup = _.cloneDeep(document)

  if (Array.isArray(dup.data)) {
    dup.data = dup.data.map(data => {
      return updateDocument(data, projectName, version)
    })
  } else {
    dup.data = updateDocument(dup.data, projectName, version)
  }

  dup.included = (dup.included || []).map(included => {
    return {
      data: updateDocument(included.data, projectName, version)
    }
  })

  return dup
}
