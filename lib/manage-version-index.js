'use strict'

let saveDoc = require('./save-document')
let byType = require('./filter-jsonapi-doc').byType
let fs = require('fs-extra')
let path = require('path')
let _ = require('lodash')

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
  let projectFile = path.join('tmp', 'json-docs', 'projects', `${projectName}.json`)
  if (fs.existsSync(projectFile)) {
    fs.copySync(projectFile, path.join('tmp', 'json-docs', 'projects', `cached-${projectName}.json`))
  }

  return saveDoc(document).then(() => versions)
}

  // Updates the version index at tmp/json-docs/projects/:projectName with the newly created docs
module.exports.updateVersionIndex = function updateVersionIndex (projectName) {
  let latestProjectFile = path.join('tmp', 'json-docs', 'projects', `${projectName}.json`)
  let document = JSON.parse(fs.readFileSync(latestProjectFile))
  let cachedProjectFile = path.join('tmp', 'json-docs', 'projects', `cached-${projectName}.json`)
  if (fs.existsSync(cachedProjectFile)) {
    let cachedDocument = JSON.parse(fs.readFileSync(cachedProjectFile))
    document.data.relationships['project-versions'].data = _.uniq(document.data.relationships['project-versions'].data.concat(cachedDocument.data.relationships['project-versions'].data))
    fs.writeFileSync(latestProjectFile, JSON.stringify(document))
  }
}
