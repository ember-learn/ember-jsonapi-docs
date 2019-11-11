import * as SafePromise from 'bluebird'
import * as fs from 'fs-extra'
import * as glob from 'glob'
import * as path from 'path'

export default function readDocs(projects: string[]) {
	return SafePromise.reduce(
		projects,
		async (acc, projectName) => {
			let projectFiles = glob.sync(
				`node_modules/@ember-learn/released-js-docs/dist/${projectName}/*.json`
			)

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
