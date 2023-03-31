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

async function transformObject(doc, projectName, docVersion) {
	try {
		const object = await transformYuiObject([doc], projectName)
		const { data } = markup(object)
		const giantDocument = { data }
		console.log('normalizing dependencies')
		let transformed = await normalizeEmberDependencies(giantDocument)
		transformed = await createClassesOnDisk(transformed, projectName, docVersion)
		console.log(`Finished processing ${projectName}-${docVersion}`)
		transformed = getVersionIndex(transformed, projectName)
		revProjVersionFiles(projectName, docVersion)
		return transformed
	} catch (e) {
		console.log(e)
		throw e
	}
}

async function transformProject(project, projectName) {
	const docs = []
	for (const doc of project) {
		let docVersion = doc.version
		console.log(`Starting to process ${projectName}-${docVersion}`)

		const existingFolder = `tmp/json-docs/${projectName}/${docVersion}`
		if (fs.existsSync(existingFolder)) {
			rimraf.sync(existingFolder)
		}

		const transformed = await transformObject(doc, projectName, docVersion)
		docs.push(transformed)
	}

	let [docToSave, ...remainingDocs] = docs.filter(({ data }) => data.id === projectName)

	if (!docToSave) {
		return void 0
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
	await saveDoc(docToSave, projectName)
	return projectName
}

async function transformProjectsDeep(projects, docs) {
	const built = []
	for (const projectName of projects) {
		const transformed = await transformProject(docs[projectName], projectName)
		built.push(transformed)
	}
	return built
}

export async function apiDocsProcessor(
	projects,
	specificDocsVersion,
	ignorePreviouslyIndexedDoc,
	runClean,
	noSync
) {
	if (!noSync) {
		let docsVersionMsg = specificDocsVersion !== '' ? `. For version ${specificDocsVersion}` : ''
		console.log(`Downloading docs for ${projects.join(' & ')}${docsVersionMsg}`)

		await downloadExistingDocsToLocal()
		let filesToProcess = await fetchYuiDocs(projects, specificDocsVersion, runClean)
		await fs.mkdirp('tmp/s3-original-docs')
		await Promise.all(filesToProcess.map(fixBorkedYuidocFiles))
	} else {
		console.log('Skipping downloading docs')
	}

	const _transformProjectsDeep = transformProjectsDeep.bind(null, projects)

	await readDocs(projects, specificDocsVersion, ignorePreviouslyIndexedDoc, runClean)
		.then(_transformProjectsDeep)
		.then(() =>
			projects.map(project => {
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
