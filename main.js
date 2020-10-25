import RSVP from 'rsvp'
import fs from 'fs-extra'
import rimraf from 'rimraf'

import markup from './lib/markup'
import readDocs from './lib/read-docs'
import createClassesOnDisk from './lib/create-classes'
import transformYuiObject from './lib/transform-yui-object'
import normalizeEmberDependencies from './lib/normalize-ember-dependencies'
import getVersionIndex from './lib/get-version-index'
import saveDoc from './lib/save-document'
import revProjVersionFiles from './lib/rev-docs'
import fixBorkedYuidocFiles from './lib/fix-borked-yuidoc-files'

const docsPath = '../ember-api-docs-data';

export async function apiDocsProcessor(
	projects,
	specificDocsVersion,
	ignorePreviouslyIndexedDoc,
	runClean,
) {
	RSVP.on('error', reason => {
		console.log(reason)
		process.exit(1)
	})

	let filesToProcess = projects.map(project => {
		return `${docsPath}/s3-docs/v${specificDocsVersion}/${project}-docs.json`
	})

	await RSVP.Promise.all(filesToProcess.map(fixBorkedYuidocFiles))

	console.log(projects, specificDocsVersion, ignorePreviouslyIndexedDoc, runClean)
	await readDocs(projects, specificDocsVersion, ignorePreviouslyIndexedDoc, runClean)
		.then(docs => {
			return RSVP.map(projects, projectName => {
				return RSVP.map(docs[projectName], doc => {
					let docVersion = doc.version
					console.log(`Starting to process ${projectName}-${docVersion}`)

					const existingFolder = `${docsPath}/json-docs/${projectName}/${docVersion}`
					if (fs.existsSync(existingFolder)) {
						// delete the folder
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
				}).then(docs => {
					let [docToSave, ...remainingDocs] = docs.filter(({ data }) => data.id === projectName)

					console.log('It has this many docs', docs.length)

					if (!docToSave) {
						console.log('no doc to save')
						return Promise.resolve()
					}

					let existingDoc = `${docsPath}/json-docs/${projectName}/projects/${projectName}.json`
					if (fs.existsSync(existingDoc)) {
						existingDoc = fs.readJsonSync(existingDoc)
						docToSave.data.relationships['project-versions'].data = docToSave.data.relationships[
							'project-versions'
						].data.concat(existingDoc.data.relationships['project-versions'].data)
					}

					remainingDocs.forEach(({ data }) => {
						docToSave.data.relationships['project-versions'].data = docToSave.data.relationships[
							'project-versions'
						].data.concat(data.relationships['project-versions'].data)
					})
					return saveDoc(docToSave, projectName).then(() => projectName)
				})
			})
		})
		.then(() =>
			['ember', 'ember-data'].map(project => {
				const projRevFile = `${docsPath}/rev-index/${project}.json`
				let projRevFileContent = fs.readJsonSync(
					`${docsPath}/json-docs/${project}/projects/${project}.json`
				)
				projRevFileContent.meta = {
					availableVersions: [],
				}
				projRevFileContent.data.relationships['project-versions'].data.forEach(({ id }) =>
					projRevFileContent.meta.availableVersions.push(id.replace(`${project}-`, ''))
				)

				fs.writeJsonSync(projRevFile, projRevFileContent)
			})
		)
		.then(() => {
			console.log('\n\n\n')
			console.log('Done!')
		})
}
