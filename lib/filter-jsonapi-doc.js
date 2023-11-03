import { filter } from 'lodash-es';

function byType(document, type) {
  return filter(totalData(document), ['type', type]);
}

function totalData({ data, included }) {
  return data.concat(included || []);
}

function hasBelongsTo(document, relationshipName, relationshipValue) {
  return filter(totalData(document), [
    `relationships.${relationshipName}.data.id`,
    relationshipValue,
  ]);
}

function classWithIncluded(document, klass) {
  let classDocument = filter(byType(document, 'class'), ['id', klass])[0];

  let related = hasBelongsTo(document, 'class', klass);

  return {
    data: classDocument,
    included: related,
  };
}

export { byType };
export { classWithIncluded };
