import * as _ from 'lodash'

function byType(document: any, type: string) {
	return _.filter(totalData(document), ['type', type])
}

function totalData({ data, included }: any) {
	return data.concat(included || [])
}

function hasBelongsTo(document: any, relationshipName: string, relationshipValue: any) {
	return _.filter(totalData(document), [
		`relationships.${relationshipName}.data.id`,
		relationshipValue,
	])
}

function classWithIncluded(document: any, klass: any) {
	let classDocument = _.filter(byType(document, 'class'), ['id', klass])[0]

	let related = hasBelongsTo(document, 'class', klass)

	return {
		data: classDocument,
		included: related,
	}
}

export { byType }
export { classWithIncluded }
