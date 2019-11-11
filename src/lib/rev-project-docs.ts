import * as SafePromise from 'bluebird'
import * as compareVersions from 'compare-versions'
import * as fs from 'fs-extra'

export async function revProjectDocs(projects) {
	return SafePromise.map(projects, async project => {
		const projRevFile = `tmp/rev-index/${project}.json`

		let projRevFileContent = await fs.readJson(`tmp/json-docs/${project}/projects/${project}.json`)

		projRevFileContent.meta = {
			availableVersions: [],
		}

		projRevFileContent.data.relationships['project-versions'].data.forEach(({ id }) =>
			projRevFileContent.meta.availableVersions.push(id.replace(`${project}-`, ''))
		)

		projRevFileContent.meta.availableVersions = projRevFileContent.meta.availableVersions.sort(
			compareVersions
		)

		return fs.writeJson(projRevFile, projRevFileContent)
	})
}
