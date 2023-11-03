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

const docsPath = '../ember-api-docs-data'

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

		const existingFolder = `${docsPath}/json-docs/${projectName}/${docVersion}`
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

	let existingDoc = `${docsPath}/json-docs/${projectName}/projects/${projectName}.json`
	if (fs.existsSync(existingDoc)) {
		existingDoc = fs.readJsonSync(existingDoc)
		const newData = docToSave.data.relationships['project-versions'].data
		const oldData = existingDoc.data.relationships['project-versions'].data
		const updatedData = mergeById(newData, oldData)
		docToSave.data.relationships['project-versions'].data = updatedData
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
	runClean,
) {
	let filesToProcess = projects.map(project => {
		return `${docsPath}/s3-docs/v${specificDocsVersion}/${project}-docs.json`
	})
	await Promise.all(filesToProcess.map(fixBorkedYuidocFiles))

	const _transformProjectsDeep = transformProjectsDeep.bind(null, projects)

	await readDocs(projects, specificDocsVersion, runClean)
		.then(_transformProjectsDeep)
		.then(() =>
			projects.map(project => {
				const projRevFile = `${docsPath}/rev-index/${project}.json`
				let projRevFileContent = fs.readJsonSync(
					`${docsPath}/json-docs/${project}/projects/${project}.json`
				)
				const availableVersions = []
				projRevFileContent.meta = {
					availableVersions,
				}
				projRevFileContent.data.relationships['project-versions'].data.forEach(({ id }) =>
					availableVersions.push(id.replace(`${project}-`, ''))
				)
				console.log({ project, availableVersions })
				fs.writeJsonSync(projRevFile, projRevFileContent)
			})
		)
		.then(() => {
			console.log('\n\n\n')
			console.log('Done!')
		})
}

function mergeById(arr1, arr2) {
	const seen = new Set()
	const result = []
	let maxLen = arr1.length > arr2.length ? arr1.length : arr2.length
	for (let i = 0; i < maxLen; i++) {
		if (i < arr1.length && !seen.has(arr1[i].id)) {
			result.push(arr1[i])
			seen.add(arr1[i].id)

		}
		if (i < arr2.length && !seen.has(arr2[i].id)) {
			result.push(arr2[i])
			seen.add(arr2[i].id)
		}
	}

	return result
}
