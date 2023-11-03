import _ from 'lodash'
import { byType } from './filter-jsonapi-doc.js'

const missingDoc = ({ id, version }) => {
	return {
		id,
		type: 'missing',
		attributes: {
			name: id,
			version,
		},
	}
}

export default giantDocument => {
	return new Promise(resolve => {
		let nonEmberDocs = giantDocument.data.filter(({ relationships }) => relationships)

		nonEmberDocs.forEach(({ relationships, attributes }) => {
			_.forIn(relationships, ({ data }, relationshipName) => {
				if (Array.isArray(data)) {
					relationships[relationshipName].data = _.map(data, d => {
						return fixEmberRelationship(d, attributes.version)
					})
				} else if (data) {
					relationships[relationshipName].data = fixEmberRelationship(data, attributes.version)
				}
			})
		})

		let missing = nonEmberDocs.map(({ relationships }) => {
			let missing = []

			_.forIn(relationships, ({ data }) => {
				if (Array.isArray(data)) {
					missing = missing
						.concat(data.filter(({ type }) => type === 'missing'))
						.map(m => missingDoc(m))
				} else if (data) {
					if (data.type === 'missing') {
						missing.push(missingDoc(data))
					}
				}
			})

			return missing
		})

		missing = _.flatten(missing)

		giantDocument.data = giantDocument.data.concat(missing)

		function fixEmberRelationship(relationship, version) {
			let type = relationship.type
			let id = relationship.id

			let doc = giantDocument.data.find(model => model.id === id)

			if (doc || type === 'project-version' || type === 'project') {
				return relationship
			} else {
				let nonVersionedID = id.split('-').pop()
				let matchingDocuments = byType(giantDocument, type)

				let latest = _(matchingDocuments)
					.filter(({ name }) => name === nonVersionedID)
					.sortBy(({ relationships }) => relationships['project-version'].data.id)
					.reverse()
					.value()[0]

				if (latest) {
					return {
						id: latest.id,
						type: latest.type,
						version,
					}
				} else {
					return {
						id: id.split('-').pop(),
						type: 'missing',
						version,
					}
				}
			}
		}
		resolve(giantDocument)
	})
}
