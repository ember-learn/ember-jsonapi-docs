import * as fs from 'fs-extra'

export async function revProjectDocs(projects) {
	return await Promise.all(
		projects.map(async project => {
			const projRevFile = `tmp/rev-index/${project}.json`

			let projRevFileContent = await fs.readJson(
				`tmp/json-docs/${project}/projects/${project}.json`
			)

			projRevFileContent.meta = {
				availableVersions: [],
			}

			projRevFileContent.data.relationships['project-versions'].data.forEach(({ id }) =>
				projRevFileContent.meta.availableVersions.push(id.replace(`${project}-`, ''))
			)

			return await fs.writeJson(projRevFile, projRevFileContent)
		})
	)
}
