import * as SafePromise from 'bluebird'
import * as fs from 'fs-extra'
import * as path from 'path'

export default function readDocs(
	projects: string[],
	getProjectFiles: (projectName: string) => string[]
) {
	return SafePromise.reduce(
		projects,
		async (acc, projectName) => {
			let projectFiles = getProjectFiles(projectName)

			let docs = await SafePromise.map(projectFiles, async projFile => {
				let version = path.parse(projFile).name

				try {
					let data = await fs.readJSON(projFile)
					return { project: projectName, version, data }
				} catch (e) {
					console.error(version)
					console.error(e.stack)
					process.exit(1)
				}
			})

			return { ...acc, [projectName]: docs }
		},
		{}
	)
}
