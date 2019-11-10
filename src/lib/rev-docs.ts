import revFile from 'rev-file'
import fs from 'fs-extra'
import ora from 'ora'
import { Promise } from 'rsvp'
import { basename as getFileName } from 'path'
import { isArray } from 'lodash/lang'
import { singularize } from 'inflected'
const glob = require('glob')

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
			projVerRevContent.data.relationships[k].data.forEach(({ type, id }) => {
				if (!projVerRevContent.meta[type]) {
					projVerRevContent.meta[type] = {}
				}
				projVerRevContent.meta[type][id] = ''
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
		.filter(f => !f.includes('project-versions'))
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
	opProgress.succeed('Revving done!')
	Promise.resolve()
}

export default revProjVersionFiles
