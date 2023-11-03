import { normalizeYuiDocClassItem } from './normalize-yui-doc-class-item.js'
import { yuiDocClassItemKeys } from './yui-doc-class-item-keys.js'

export const normalizeYuiDocClass = klass => {
	if (!klass.description) {
		return klass
	}

	let keys = Object.keys(klass)
	let locationOfDescriptionField = keys.indexOf('description')

	if (
		locationOfDescriptionField === -1 ||
		yuiDocClassItemKeys.includes(keys[locationOfDescriptionField + 1])
	) {
		return klass
	}

	return normalizeYuiDocClassItem(klass)
}
