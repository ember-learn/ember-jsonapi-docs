'use strict'

let tojsonapi = require('yuidoc-to-jsonapi/lib/converter')
let Queue = require('promise-queue')
let RSVP = require('rsvp')
let saveDoc = require('./save-document')
let updateIDs = require('./update-with-versions-and-project')

module.exports = function createProjectVersions (versions, projectName, db) {
  let queue = new Queue(10)

  return RSVP.map(versions, version => {
    let jsonapidoc = updateIDs(tojsonapi(version.data), version.version)

    let projectData = {
      type: 'project',
      id: projectName,
      attributes: {
        name: projectName,
        github: 'https://github.com/emberjs/ember.js'
      }
    }

    let id = `project-version-${projectName}-${version.version}`
    let versionDocument = {
      _id: id,
      data: {
        id: `${projectName}-${version.version}`,
        type: 'project-version',
        attributes: {
          version: version.version
        },
        relationships: {
          classes: {
            data: jsonapidoc.data.filter(item => item.type === 'class' && item.static !== 1).map(item => ({id: item.id, type: 'class'}))
          },
          modules: {
            data: jsonapidoc.data.filter(item => item.type === 'module').map(item => ({id: item.id, type: 'module'}))
          },
          namespaces: {
            data: jsonapidoc.data.filter(item => item.type === 'class' && item.static === 1).map(item => ({id: item.id, type: 'namespace'}))
          },
          project: {
            data: {
              id: projectName,
              type: 'project'
            }
          }
        }
      },
      included: [projectData]
    }

    return queue.add(() => saveDoc(versionDocument, projectName, version.version, db))
  })
}
