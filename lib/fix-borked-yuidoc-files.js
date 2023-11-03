import fs from 'fs-extra'
import semverCompare from 'semver-compare'
import { normalizeYuiDocClassItem } from './yuidoc-fixer/normalize-yui-doc-class-item.js'
import { yuiDocClassItemKeys } from './yuidoc-fixer/yui-doc-class-item-keys.js'
import { normalizeYuiDocClass } from './yuidoc-fixer/normalize-yui-doc-class.js'

/**
 * In ember 3.10 and above we introduced decorators.
 * Unfortunately YUIDoc freaks out when descriptions contain lines
 * starting with decorators. See https://github.com/yui/yuidoc/issues/347
 *
 * Instead of having authors use encoded characters in source code. we're
 * fixing it here
 * @param {*} file
 */

const docsPath = '../ember-api-docs-data'

export default async function fixBorkedYuidocFiles(file) {
  if (!file) {
    return
  }

  const version = file
    .replace(`${docsPath}/s3-docs/v`, '')
    .replace('/ember-docs.json', '')
    .replace('/ember-data-docs.json', '')

  if (semverCompare(version, '3.10.0') === -1) {
    return file
  }

  console.log(`\n\n\nProcessing ${file} for broken decorators usage in code samples`)

  const doc = await fs.readJson(file)

  let normalizedClasses = Object.keys(doc.classes).reduce((result, klass) => {
    result[klass] = normalizeYuiDocClass(doc.classes[klass])
    return result
  }, {})

  let normalizedClassItems = doc.classitems.map(item => {
    let keys = Object.keys(item)
    let locationOfDescriptionField = keys.indexOf('description')

    if (
      locationOfDescriptionField === -1 ||
      yuiDocClassItemKeys.includes(keys[locationOfDescriptionField + 1])
    ) {
      return item
    }

    return normalizeYuiDocClassItem(item)
  })

  let newDoc = {}

  Object.keys(doc).forEach(key => {
    if (key === 'classitems') {
      newDoc[key] = normalizedClassItems
    } else if (key === 'classes') {
      newDoc[key] = normalizedClasses
    } else {
      newDoc[key] = doc[key]
    }
  })

  await fs.writeJson(file, newDoc, { spaces: 2 })
}
