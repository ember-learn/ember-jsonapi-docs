'use strict'

let fs = require('fs-extra')
let glob = require('glob')
let path = require('path')
let Inflected = require('inflected')

module.exports = function readDocs (projectName) {
  console.log(`Read ${projectName}`)

  let fileName = Inflected.dasherize(projectName) + '-docs.json'
  let folders = glob.sync(`tmp/s3-docs/v*/${fileName}`)

  return folders.map(docs => {
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
}
