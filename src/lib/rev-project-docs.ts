import * as SafePromise from 'bluebird'
import * as compareVersions from 'compare-versions'
import * as fs from 'fs-extra'

import { AppStore } from './classes/app-store'

export async function revProjectDocs(projects) {
	const dataDir = AppStore.config.get('dataDir')

	return SafePromise.map(projects, async project => {
		const projRevFile = `${dataDir}/rev-index/${project}.json`

		let projRevFileContent = await fs.readJson(
			`${dataDir}/json-docs/${project}/projects/${project}.json`
		)

		projRevFileContent.data.attributes.availableVersions = []

		projRevFileContent.data.relationships['project-versions'].data.forEach(({ id }) =>
			projRevFileContent.data.attributes.availableVersions.push(id.replace(`${project}-`, ''))
		)

		projRevFileContent.data.attributes.availableVersions = projRevFileContent.data.attributes.availableVersions.sort(
			compareVersions
		)

		return fs.writeJson(projRevFile, projRevFileContent)
	})
}
