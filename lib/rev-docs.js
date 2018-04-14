const glob = require('glob')
const revFile = require('rev-file')
const fs = require('fs-extra')
const ora = require('ora')
const Promise = require('rsvp').Promise
const getFileName = require('path').basename
const isArray = require('lodash/lang').isArray
const Inflected = require('inflected')
const singularize = Inflected.singularize.bind(Inflected)

function revProjVersionFiles(project, ver) {
  let opProgress = ora(`Revving ${project}:${ver} files`).start()
  const projDocsDir = `tmp/json-docs/${project}`
  const revIndexFolder = 'tmp/rev-index'

  fs.mkdirpSync(revIndexFolder)

  fs.copySync(
    `${projDocsDir}/${ver}/project-versions/${project}-${ver}.json`,
    `${revIndexFolder}/${project}-${ver}.json`
  )

  opProgress.text = `Revving ${project}:${ver}`

  const projVerRevFile = `${revIndexFolder}/${project}-${ver}.json`
  let projVerRevContent = fs.readJsonSync(projVerRevFile)
  projVerRevContent.meta = {}

  Object.keys(projVerRevContent.data.relationships).forEach(k => {
    if (isArray(projVerRevContent.data.relationships[k].data)) {
      projVerRevContent.data.relationships[k].data.forEach(d => {
        if (!projVerRevContent.meta[d.type]) {
          projVerRevContent.meta[d.type] = {}
        }
        projVerRevContent.meta[d.type][d.id] = ''
      })
    } else if (k !== 'project') {
      let d = projVerRevContent.data.relationships[k].data
      if (!projVerRevContent.meta[d.type]) {
        projVerRevContent.meta[d.type] = {}
      }
      projVerRevContent.meta[d.type][d.id] = ''
    }
  })
  projVerRevContent.meta['missing'] = {}

  const projVerDir = `${projDocsDir}/${ver}`
  glob
    .sync(`${projVerDir}/**/*.json`)
    .filter(f => f.indexOf('project-versions') === -1)
    .map(f => {
      let fileShortName = f.replace(`${projVerDir}/`, '').replace('.json', '')
      let [fileObjType, entityName] = fileShortName.split('/')
      let revFileName = revFile.sync(f)

      fs.renameSync(f, revFileName)
      projVerRevContent.meta[singularize(fileObjType)][entityName] = getFileName(
        revFileName
      ).replace('.json', '')
    })

  fs.writeJsonSync(projVerRevFile, projVerRevContent)
  opProgress.succeed(`Revving done!`)
  Promise.resolve()
}

module.exports = revProjVersionFiles
