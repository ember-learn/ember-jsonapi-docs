import fs from 'fs-extra'
import glob from 'glob'
import { dasherize } from 'inflected'
import { get as deepGet } from 'lodash'
import { getLatestPatchVersions } from './get-latest-patch-versions'

export default function readDocs(
	projects,
	specificVersion = '',
	ignorePreviouslyIndexedDoc = false,
	runClean = false
) {
	return projects.reduce(async (prevPromise, projectName) => {
		let prevValue = await prevPromise
		let prevIndexedVersions = []

		let projectFile = `tmp/json-docs/${projectName}/projects/${projectName}.json`

		console.log(projectFile, await fs.pathExists(projectFile))

		if (await fs.pathExists(projectFile)) {
			projectFile = await fs.readJson(projectFile)

			prevIndexedVersions = deepGet(projectFile, 'data.relationships.project-versions.data').map(
				({ id }) => id.replace(`${projectName}-`, '')
			)
		}

		let folders = glob.sync(`tmp/s3-docs/v${specificVersion}*/${dasherize(projectName)}-docs.json`)

		let availableSourceVersions = folders.map(x =>
			x.replace('tmp/s3-docs/v', '').replace(`/${projectName}-docs.json`, '')
		)

		if (!runClean) {
			if (!ignorePreviouslyIndexedDoc) {
				availableSourceVersions = availableSourceVersions.filter(
					version => !prevIndexedVersions.includes(version)
				)
			}

			folders = folders.filter(f => {
				if (!prevIndexedVersions.includes(f) || ignorePreviouslyIndexedDoc) {
					return f
				} else {
					let version = f.replace('tmp/s3-docs/v', '').replace(`/${projectName}-docs.json`, '')
					console.log(`${projectName}-${version} has already been indexed in json-docs`)
				}
			})
		}

		availableSourceVersions = getLatestPatchVersions(availableSourceVersions)

		let docs = await Promise.all(
			availableSourceVersions.map(async version => {
				let data

				try {
					data = await fs.readJSON(`tmp/s3-docs/v${version}/${projectName}-docs.json`)
					return { project: projectName, version, data }
				} catch (e) {
					console.error(version)
					console.error(e.stack)
					process.exit(1)
				}
			})
		)

		return { ...prevValue, [projectName]: docs }
	}, Promise.resolve({}))
}
