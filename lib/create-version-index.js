'use strict'

let PouchDB = require('pouchdb')
let _ = require('lodash')

// creates a version index at /projects/:project
// that contains a list of versions in the relationships
// object.
module.exports = function createVersionIndex (versions) {
  let db = new PouchDB('http://localhost:5984/projects')
  let document = {
    _id: 'ember',
    data: {
      id: 'ember',
      type: 'project',
      attributes: {
        'github-url': 'https://github.com/emberjs/ember.js'
      },
      relationships: {
        'project-versions': versions.map((version) => {
          return {
            id: `ember-${version.version}`,
            type: 'project-version'
          }
        })
      }
    }
  }

  return (
  db.get('ember')
    .catch((err) => {console.warn(err);  return document})
    .then((doc) => {
      return db.put(_.extend({}, doc, document))
    }).then(() => versions)
  )
}
