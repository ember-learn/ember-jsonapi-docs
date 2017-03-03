'use strict'

let _ = require('lodash')
let RSVP = require('rsvp')
let saveDoc = require('./save-document')

function removeLongDocsBecauseEmber1HasWeirdDocs (document) {
  let str = 'A Suite can'
  return document.id.indexOf(str) === -1
}

function extractRelationship (doc) {
  return {
    id: doc.id,
    type: doc.type
  }
}

function filterForVersion (version) {
  return function (doc) {
    var projectVersion = doc.relationships['project-version'].data.id.split('-').pop()
    return version.version === projectVersion
  }
}

function isPrivate (doc) {
  return doc.attributes.access === 'private' || doc.attributes.deprecated === true
}

function isPublic (doc) {
  return doc.attributes.access !== 'private' && doc.attributes.deprecated !== true
}

function normalizeIDs (versions, projectName) {
  let tojsonapi = require('yuidoc-to-jsonapi/lib/converter')
  let updateIDs = require('./update-with-versions-and-project')
  let findType = require('./filter-jsonapi-doc').byType

  let jsonapidocs = versions.map(version => {
    let jsonapidoc = tojsonapi(version.data)
    return updateIDs(jsonapidoc, projectName, version.version)
  })

  let jsonapidoc = {
    data: _.flatten(jsonapidocs.map(d => d.data))
  }

  jsonapidoc.data = jsonapidoc.data.filter(removeLongDocsBecauseEmber1HasWeirdDocs)

  let projectVersions = versions.map(version => {
    let classes = findType(jsonapidoc, 'class')
      .filter(filterForVersion(version))
      .filter(doc => {
        return removeLongDocsBecauseEmber1HasWeirdDocs(doc)
      })

    let namespaces = classes.filter(doc => doc.attributes.static === 1)
    classes = classes.filter(doc => doc.attributes.static !== 1)

    namespaces.forEach(ns => {
      ns.type = 'namespace'
    })

    let modules = findType(jsonapidoc, 'module')
      .filter(filterForVersion(version))

    return {
      id: `${projectName}-${version.version}`,
      type: 'project-version',
      attributes: {
        version: version.version
      },
      relationships: {
        classes: {
          data: classes.map(extractRelationship)
        },
        namespaces: {
          data: namespaces.map(extractRelationship)
        },
        modules: {
          data: modules.map(extractRelationship)
        },
        project: {
          data: {
            id: projectName,
            type: 'project'
          }
        },
        'private-classes': {
          data: classes
            .filter(isPrivate)
            .map(extractRelationship)
        },
        'public-classes': {
          data: classes
            .filter(isPublic)
            .map(extractRelationship)
        },
        'private-namespaces': {
          data: namespaces
            .filter(isPrivate)
            .map(extractRelationship)
        },
        'public-namespaces': {
          data: namespaces
            .filter(isPublic)
            .map(extractRelationship)
        },
        'private-modules': {
          data: modules
            .filter(isPrivate)
            .map(extractRelationship)
        },
        'public-modules': {
          data: modules
            .filter(isPublic)
            .map(extractRelationship)
        }
      }
    }
  })

  let doc = {
    data: jsonapidoc.data.concat(projectVersions)
  }

  let versionDocs = RSVP.map(projectVersions, (projectVersion) => {
    let doc = {
      data: projectVersion
    }

    return saveDoc(doc)
  })

  return versionDocs.then(() => doc)
}

module.exports = normalizeIDs
