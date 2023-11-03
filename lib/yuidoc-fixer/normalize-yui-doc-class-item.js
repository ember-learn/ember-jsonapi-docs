import { toLower } from 'lodash'
import { yuiDocClassItemKeys } from './yui-doc-class-item-keys.js'
import { emberKnownEntityNames } from './emberKnownEntityNames.js'

export const normalizeYuiDocClassItem = item => {
	let normalizedItem = {}

	let encounteredDescription = false
	let finishedNormalization = false
	let newDescription = ''
	let faultyKeys = []

	Object.keys(item).forEach(key => {
		if (key === 'description') {
			encounteredDescription = true
		}

		if (!encounteredDescription || finishedNormalization) {
			normalizedItem[key] = item[key]
		} else {
			if (key === 'description' || !yuiDocClassItemKeys.includes(key)) {
				let content = item[key]

				if (key === 'description') {
					newDescription = content + '\n'

					if (content.endsWith('}')) {
						newDescription += '\n'
					}
					return
				}

				// For cases where we have @decorator(args), other cases are @decorator x
				if (typeof content === 'string' && !content.startsWith('(')) {
					content = ' ' + content
				}

				let transformedKey = key

				if (emberKnownEntityNames.map(toLower).includes(key)) {
					transformedKey = emberKnownEntityNames.find(
						name => name.toLowerCase() === key.toLowerCase()
					)
				}

				newDescription += '  @' + transformedKey + content + '\n'

				faultyKeys.push(transformedKey)
			} else {
				normalizedItem[key] = item[key]
				finishedNormalization = true
				normalizedItem.description = newDescription
			}
		}
	})

	console.log(`File name: ${item.file} | Line number: ${item.line} | Faulty keys: ${faultyKeys}`)

	return normalizedItem
}
