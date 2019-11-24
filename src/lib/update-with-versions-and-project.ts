import * as _ from 'lodash'

function generateID(type: string, projectName: string, version: string, id: string) {
	if (!projectName) {
		throw new Error(
			`no project ! type: ${type} project name: ${projectName}  version: ${version}, id: ${id}`
		)
	}
	return `${projectName}-${version}-${id}`
}

function updateDocument(doc: any, projectName: string, version: any) {
	let dup = _.cloneDeep(doc)

	dup.id = generateID(doc.type, projectName, version, dup.id)

	dup.relationships = dup.relationships || {}

	Object.keys(dup.relationships).forEach(relationshipKey => {
		let relationship = dup.relationships[relationshipKey]

		if (relationship && relationship.data) {
			if (Array.isArray(relationship.data)) {
				relationship.data.forEach((data: any) => {
					data.id = generateID(data.type, projectName, version, data.id)
				})
			} else {
				relationship.data.id = generateID(
					relationship.data.type,
					projectName,
					version,
					relationship.data.id
				)
			}
		}
	})

	dup.relationships['project-version'] = {
		data: {
			id: `${projectName}-${version}`,
			type: 'project-version',
		},
	}

	return dup
}

export default function updateWithIDs(document: any, projectName: string, version: any) {
	let dup = _.cloneDeep(document)

	if (Array.isArray(dup.data)) {
		dup.data = dup.data.map((data: any) => {
			return updateDocument(data, projectName, version)
		})
	} else {
		dup.data = updateDocument(dup.data, projectName, version)
	}

	dup.included = (dup.included || []).map((included: any) => {
		return updateDocument(included, projectName, version)
	})

	return dup
}
