import fs from 'fs-extra'
import lodash from 'lodash'
import semverUtils from 'semver-utils'

const { without } = lodash

const classItemKeys = [
	'access',
	'category',
	'chainable',
	'class',
	'default',
	'deprecated',
	'deprecationMessage',
	'description',
	'file',
	'filetype',
	'final',
	'itemtype',
	'line',
	'module',
	'name',
	'namespace',
	'params',
	'return',
	'see',
	'since',
	'static',
	'tagname',
	'throws',
	'type',
]

const normalizeItem = item => {
	let normalizedItem = {}

	let encounteredDescription = false
	let finishedNormalization = false
	let newDescription = ''

	Object.keys(item).forEach(key => {
		if (key === 'description') {
			encounteredDescription = true
		}

		if (!encounteredDescription || finishedNormalization) {
			normalizedItem[key] = item[key]
		} else {
			if (key === 'description' || !classItemKeys.includes(key)) {
				let content = item[key]

				if (key === 'description') {
					newDescription = content + '\n'

					if (content.endsWith('}')) {
						newDescription += '\n'
					}
					return
				}

				// For cases where we have @decorator(args), other cases are @decorator x
				if (!content.startsWith('(')) {
					content = ' ' + content
				}

				newDescription += '  @' + key + content + '\n'
			} else {
				normalizedItem[key] = item[key]
				finishedNormalization = true
				normalizedItem.description = newDescription
			}
		}
	})

	const keysToNormalize = without(Object.keys(item), ...Object.keys(normalizedItem))

	console.log(
		`File name: ${item.file} | Line number: ${item.line} | Faulty keys: ${keysToNormalize}`
	)

	return normalizedItem
}

/**
 * In ember 3.10 and above we introduced decorators.
 * Unfortunately YUIDoc freaks out when descriptions contain lines
 * starting with decorators. See https://github.com/yui/yuidoc/issues/347
 *
 * Instead of having authors use encoded characters in source code. we're
 * fixing it here
 * @param {*} file
 */
export default async function fixBorkedYuidocFiles(file) {
	if (!file) {
		return
	}

	const version = semverUtils.parse(
		file
			.replace('tmp/s3-docs/v', '')
			.replace('/ember-docs.json', '')
			.replace('/ember-data-docs.json', '')
	)

	if (
		parseInt(version['major']) < 3 ||
		!(parseInt(version['major']) === 3 && parseInt(version['minor']) >= 10)
	) {
		return file
	}
	const originalFileBackup = file.replace('s3-docs', 's3-original-docs')

	if (fs.existsSync(originalFileBackup)) {
		console.log(`${file} was already processed`)
		return file
	}

	console.log(`\n\n\nProcessing ${file}`)

	const doc = await fs.readJson(file)

	let normalizedClassItems = doc.classitems.map(item => {
		let keys = Object.keys(item)
		let locationOfDescriptionField = keys.indexOf('description')

		if (
			locationOfDescriptionField === -1 ||
			classItemKeys.includes(keys[locationOfDescriptionField + 1])
		) {
			return item
		} else {
			return normalizeItem(item)
		}
	})

	let newDoc = {}

	Object.keys(doc).forEach(key => {
		newDoc[key] = key === 'classitems' ? normalizedClassItems : doc[key]
	})

	await fs.move(file, originalFileBackup)
	console.log(`Moved the original file ${file} to ${originalFileBackup}`)
	await fs.writeJson(file, newDoc, { spaces: 2 })
}
