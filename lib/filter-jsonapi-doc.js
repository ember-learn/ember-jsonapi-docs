'use strict'

let _ = require('lodash')

function byType (document, type) {
  return _.filter(totalData(document), ['type', type])
}

function totalData (document) {
  return document.data.concat(document.included || [])
}

function hasBelongsTo (document, relationshipName, relationshipValue) {
  return _.filter(totalData(document), [`relationships.${relationshipName}.data.id`, relationshipValue])
}

function classWithIncluded (document, klass) {
  let classDocument = _.filter(byType(document, 'class'), ['id', klass])[0]

  let related = hasBelongsTo(document, 'class', klass)

  return {
    data: classDocument,
    included: related
  }
}

exports.byType = byType
exports.classWithIncluded = classWithIncluded
