import _ from 'lodash'

function byType(document, type) {
  return _.filter(totalData(document), ['type', type])
}

function totalData({ data, included }) {
  return data.concat(included || [])
}

function hasBelongsTo(document, relationshipName, relationshipValue) {
  return _.filter(totalData(document), [
    `relationships.${relationshipName}.data.id`,
    relationshipValue,
  ])
}

function classWithIncluded(document, klass) {
  let classDocument = _.filter(byType(document, 'class'), ['id', klass])[0]

  let related = hasBelongsTo(document, 'class', klass)

  return {
    data: classDocument,
    included: related,
  }
}

export { byType }
export { classWithIncluded }
