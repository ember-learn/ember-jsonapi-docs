'use strict'

let saveDoc = require('./save-document')
let byType = require('./filter-jsonapi-doc').byType

module.exports.createVersionIndex = function createVersionIndex (projectName, versions) {
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
    }
  }

  return saveDoc(document, projectName).then(() => versions)
}
