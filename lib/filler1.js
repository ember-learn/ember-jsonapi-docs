import fs from 'fs-extra'
import saveDoc from './save-document'

export async function filler1(projectName, docs) {
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
}
