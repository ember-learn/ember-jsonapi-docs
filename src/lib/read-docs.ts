import * as SafePromise from 'bluebird'
import * as fs from 'fs-extra'
import * as glob from 'glob'
import * as path from 'path'

export default function readDocs(projects, specificVersion = '') {
	return projects.reduce(async (prevPromise, projectName) => {
		let prevValue = await prevPromise

		let projectFiles = glob.sync(
			`node_modules/@ember-learn/released-js-docs/dist/${projectName}/${specificVersion}*.json`
		)

		let docs = await SafePromise.all(
			projectFiles.map(async projFile => {
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
		)

		return { ...prevValue, [projectName]: docs }
	}, SafePromise.resolve({}))
}
