'use strict'

let saveDoc = require('./save-document')
let byType = require('./filter-jsonapi-doc').byType
let fs = require('fs')
let path = require('path')
let _ = require('lodash')

// creates a version index at /projects/:project
// that contains a list of versions in the relationships
// object.
module.exports = function createVersionIndex (db, projectName, versions) {
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

  let cachedProjectFile = path.join('tmp', 'cached-docs', `project-${projectName}.json`)
  if (fs.existsSync(cachedProjectFile)) {
    let cachedDocument = JSON.parse(fs.readFileSync(cachedProjectFile))

    document.data.relationships['project-versions'].data = _.uniq(document.data.relationships['project-versions'].data.concat(cachedDocument.data.relationships['project-versions'].data))
  }

  return saveDoc(document, db).then(() => versions)
}
