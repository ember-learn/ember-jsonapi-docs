'use strict'

let tojsonapi = require('yuidoc-to-jsonapi/lib/converter')
let Queue = require('promise-queue')
let RSVP = require('rsvp')
let saveDoc = require('./save-document')
let updateIDs = require('./update-with-versions-and-project')

module.exports = function createProjectVersions (jsonapidoc) {
}
