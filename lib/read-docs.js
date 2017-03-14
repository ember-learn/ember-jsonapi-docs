'use strict'

const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')
const RSVP = require('rsvp')
const Inflected = require('inflected')

module.exports = function readDocs (projects, specificVersion = '') {
  console.log(`Reading project files`)

  let docs = {}

  projects.forEach(projectName => {
    let fileName = Inflected.dasherize(projectName) + '-docs.json'
    let folders = glob.sync(`tmp/s3-docs/v${specificVersion}*/${fileName}`)
    docs[projectName] = folders.map(docs => {
      let version = path.basename(path.dirname(docs)).replace('v', '')
      let data

      try {
        data = JSON.parse(fs.readFileSync(docs, { encoding: 'utf8' }))
      } catch (e) {
        console.error(docs)
        console.error(e.stack)
        process.exit(1)
      }

      return {
        project: projectName,
        version: version,
        data: data
      }
    })
  })

  return RSVP.resolve(docs)
}
