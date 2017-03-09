'use strict'

let _ = require('lodash')

function updateDocument (doc, projectName, version) {
  let dup = _.cloneDeep(doc)

  dup.relationships = dup.relationships || {}

  dup.relationships['project-version'] = {
    data: {
      id: `${projectName}-${version}`,
      type: `project-version`
    }
  }

  return dup
}

module.exports = function updateWithIDs (document, projectName, version) {
  let dup = _.cloneDeep(document)

  if (Array.isArray(dup.data)) {
    dup.data = dup.data.map(data => {
      return updateDocument(data, projectName, version)
    })
  } else {
    dup.data = updateDocument(dup.data, projectName, version)
  }

  dup.included = (dup.included || []).map(included => {
    return updateDocument(included, projectName, version)
  })

  return dup
}
