import RSVP from 'rsvp'
import fs from 'fs-extra'
import rimraf from 'rimraf'

import markup from './lib/markup'
import readDocs from './lib/read-docs'
import fetchYuiDocs from './lib/fetch-yui-docs'
import createClassesOnDisk from './lib/create-classes'
import transformYuiObject from './lib/transform-yui-object'
import normalizeEmberDependencies from './lib/normalize-ember-dependencies'
import getVersionIndex from './lib/get-version-index'
import saveDoc from './lib/save-document'
import revProjVersionFiles from './lib/rev-docs'
import { downloadExistingDocsToLocal, uploadDocsToS3 } from './lib/s3-sync'
import fixBorkedYuidocFiles from './lib/fix-borked-yuidoc-files'

export async function apiDocsProcessor(
	projects,
	specificDocsVersion,
	ignorePreviouslyIndexedDoc,
	runClean,
	noSync
) {
	RSVP.on('error', reason => {
		console.log(reason)
		process.exit(1)
	})

	let docsVersionMsg = specificDocsVersion !== '' ? `. For version ${specificDocsVersion}` : ''
	console.log(`Downloading docs for ${projects.join(' & ')}${docsVersionMsg}`)

	if (!noSync) {
		await downloadExistingDocsToLocal()
		let filesToProcess = await fetchYuiDocs(projects, specificDocsVersion, runClean)
		await fs.mkdirp('tmp/s3-original-docs')
		await RSVP.Promise.all(filesToProcess.map(fixBorkedYuidocFiles))
	}

	await readDocs(projects, specificDocsVersion, ignorePreviouslyIndexedDoc, runClean)
		.then(docs => {
			return RSVP.map(projects, projectName => {
				return RSVP.map(docs[projectName], doc => {
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
				}).then(docs => {
					let [docToSave, ...remainingDocs] = docs.filter(({ data }) => data.id === projectName)

					if (!docToSave) {
						return Promise.resolve()
					}

					let existingDoc = `tmp/json-docs/${projectName}/projects/${projectName}.json`
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
				const projRevFile = `tmp/rev-index/${project}.json`
				let projRevFileContent = fs.readJsonSync(
					`tmp/json-docs/${project}/projects/${project}.json`
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
		.then(uploadDocsToS3)
		.then(() => {
			console.log('\n\n\n')
			console.log('Done!')
		})
}
