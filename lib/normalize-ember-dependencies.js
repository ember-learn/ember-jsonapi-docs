'use strict'

let _ = require('lodash')
let byType = require('./filter-jsonapi-doc').byType

module.exports = (giantDocument) => {

  let nonEmberDocs = giantDocument.data.filter((doc) => {
    if (!doc.relationships) {
      return false;
    }

    let projectVersion = doc.relationships['project-version']

    if (!projectVersion) {
      return false;
    }

    let id = /(.*)-(\d+\.\d+\.\d+)/.exec(projectVersion.data.id)[1]

    return id !== 'ember'
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

  function fixEmberRelationship(relationship) {
    let type = relationship.type;
    let id = relationship.id;

    let doc = giantDocument.data.find(model => model.id === id)

    if (doc || type === 'project-version' || type === 'project') {
      return relationship
    } else {
      let nonVersionedID = id.split('-').pop()
      let matchingDocuments = byType(giantDocument, type)

      let latest = _(matchingDocuments)
                  .filter(d => d.name === nonVersionedID)
                  .sortBy(d => d.relationships['project-version'].id)
                  .reverse()
                  .value()[0]

      if (latest) {
        return {
          data: {
            id: latest.id,
            type: type
          }
        }
      } else {
        return {
          data: {
            id: id,
            type: 'missing'
          }
        }
      }
    }
  }
}

