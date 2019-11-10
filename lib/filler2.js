import fs from 'fs-extra'
import rimraf from 'rimraf'
import createClassesOnDisk from './create-classes'
import getVersionIndex from './get-version-index'
import markup from './markup'
import normalizeEmberDependencies from './normalize-ember-dependencies'
import revProjVersionFiles from './rev-docs'
import transformYuiObject from './transform-yui-object'

export async function filler2(projectName, doc) {
	let docVersion = doc.version
	console.log(`Starting to process ${projectName}-${docVersion}`)

	const existingFolder = `tmp/json-docs/${projectName}/${docVersion}`
	if (fs.existsSync(existingFolder)) {
		rimraf.sync(existingFolder)
	}

	return transformYuiObject([doc], projectName)
		.then(markup)
		.then(({ data }) => {
			let giantDocument = { data }
			console.log('normalizing dependencies')
			return normalizeEmberDependencies(giantDocument)
		})
		.then(doc => {
			return createClassesOnDisk(doc, projectName, docVersion)
		})
		.then(doc => {
			console.log(`Finished processing ${projectName}-${docVersion}`)
			return getVersionIndex(doc, projectName)
		})
		.then(doc => {
			revProjVersionFiles(projectName, docVersion)
			return doc
		})
}
