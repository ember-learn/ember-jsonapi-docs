'use strict'

let saveDoc = require('./save-document')
let byType = require('./filter-jsonapi-doc').byType

// creates a version index at /projects/:project
// that contains a list of versions in the relationships
// object.
module.exports = function createVersionIndex (db, projectName) {
  return function (versions) {
    let document = {
      data: {
        id: projectName,
        type: 'project',
        attributes: {
          'github-url': 'https://github.com/emberjs/ember.js'
        },
        relationships: {
          'project-versions': {
            data: byType(versions, 'project-version').map(item => {
              return {
                id: item.id,
                type: item.type
              }
            })
          }
        }
      },
      included: byType(versions, 'project-version')
    }

    return saveDoc(document, db).then(() => versions)
  }
}
