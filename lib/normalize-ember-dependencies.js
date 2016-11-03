'use strict'

let _ = require('lodash')
let byType = require('./filter-jsonapi-doc').byType

module.exports = (giantDocument) => {
  let nonEmberDocs = giantDocument.data.filter((doc) => {
    if (!doc.relationships) {
      return false
    }

    return true
  })

  nonEmberDocs.forEach(document => {
    _.forIn(document.relationships, (relationship, relationshipName) => {
      if (Array.isArray(relationship.data)) {
        document.relationships[relationshipName].data = _.map(relationship.data, fixEmberRelationship)
      } else if (relationship.data) {
        document.relationships[relationshipName].data = fixEmberRelationship(relationship.data)
      }
    })
  })

  function missingDoc (relationship) {
    return {
      id: relationship.id,
      type: 'missing',
      attributes: {
        name: relationship.id
      }
    }
  }

  let missing = nonEmberDocs.map(document => {
    let missing = []

    _.forIn(document.relationships, (relationship, relationshipName) => {
      if (Array.isArray(relationship.data)) {
        missing = missing
                  .concat(relationship.data.filter(rel => rel.type === 'missing'))
                  .map(m => missingDoc(m))
      } else if (relationship.data) {
        if (relationship.data.type === 'missing') {
          missing.push(missingDoc(relationship.data))
        }
      }
    })

    return missing
  })

  missing = _.flatten(missing)

  giantDocument.data = giantDocument.data.concat(missing)

  function fixEmberRelationship (relationship) {
    let type = relationship.type
    let id = relationship.id

    let doc = giantDocument.data.find(model => model.id === id)

    if (doc || type === 'project-version' || type === 'project') {
      return relationship
    } else {
      let nonVersionedID = id.split('-').pop()
      let matchingDocuments = byType(giantDocument, type)

      let latest = _(matchingDocuments)
                  .filter(d => d.name === nonVersionedID)
                  .sortBy(d => d.relationships['project-version'].data.id)
                  .reverse()
                  .value()[0]

      if (latest) {
        return {
          id: latest.id,
          type: latest.type
        }
      } else {
        return {
          id: id.split('-').pop(),
          type: 'missing'
        }
      }
    }
  }
}
