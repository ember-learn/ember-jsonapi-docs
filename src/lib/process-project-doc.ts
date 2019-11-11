import * as fs from 'fs-extra'
import * as rmfr from 'rmfr'
import addInheritedItems from './add-inherited-items'
import createClassesOnDisk from './create-classes'
import getVersionIndex from './get-version-index'
import markup from './markup'
import transformModules from './modules-transform'
import normalizeEmberDependencies from './normalize-ember-dependencies'
import normalizeIDs from './normalize-ids'
import revProjVersionFiles from './rev-docs'

export async function processProjectDoc(projectName: string, doc: any) {
	let docVersion = doc.version
	console.log(`Starting to process ${projectName}-${docVersion}`)

	const existingFolder = `tmp/json-docs/${projectName}/${docVersion}`

	if (await fs.pathExists(existingFolder)) {
		await rmfr(existingFolder)
	}

	return transformModules(doc)
		.then(addInheritedItems)
		.then(d => normalizeIDs([d], projectName))
		.then(markup)
		.then(({ data }) => normalizeEmberDependencies({ data }))
		.then(doc => createClassesOnDisk(doc, projectName, docVersion))
		.then(doc => getVersionIndex(doc, projectName))
		.then(doc => {
			revProjVersionFiles(projectName, docVersion)
			console.log(`Finished processing ${projectName}-${docVersion}`)
			return doc
		})
}
