import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'
import RSVP from 'rsvp'
import { dasherize } from 'inflected'

export default function readDocs(projects, specificVersion = '') {
	console.log('Reading project files')

	let docs = {}
	projects.forEach(projectName => {
		let fileName = `${dasherize(projectName)}-docs.json`
		let folders = glob.sync(`tmp/s3-docs/v${specificVersion}*/${fileName}`)
		let projectFile = `tmp/json-docs/${projectName}/projects/${projectName}.json`
		let prevIndexedVersions = []
		if (fs.existsSync(projectFile)) {
			projectFile = JSON.parse(fs.readFileSync(projectFile))
			projectFile.data.relationships['project-versions'].data.forEach(({ id }) => {
				let version = id.replace(`${projectName}-`, '')
				prevIndexedVersions.push(`tmp/s3-docs/v${version}/${projectName}-docs.json`)
			})
		}

		folders = folders.filter(f => {
			if (!prevIndexedVersions.includes(f)) {
				return f
			} else {
				let version = f.replace('tmp/s3-docs/v', '').replace(`/${projectName}-docs.json`, '')
				console.log(`${projectName}-${version} has already been indexed in json-docs`)
			}
		})

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
			console.log('returning from readDocs')
			return {
				project: projectName,
				version,
				data,
			}
		})
	})

	return RSVP.resolve(docs)
}
