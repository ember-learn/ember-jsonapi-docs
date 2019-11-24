import * as lodash from 'lodash'

const { values, flatten, merge, omit } = lodash

export default function toJsonAPI(document: any) {
	let classes = values(document.classes)
	classes = classes.map(klass => extractClass(document, klass))

	let modules = values(document.modules).map(mod => extractModule(mod))

	let data = flatten([classes, modules])

	return { data }
}

function extractClass(document: any, klass: any) {
	let classes = values(document.classes)

	return {
		id: klass.name,
		type: 'class',
		attributes: attributes(document, klass),
		relationships: relationships(klass, classes),
	}
}

function attributes(document: any, klass: any) {
	let attrs = omit(klass, ['class', 'itemtype'])
	let methods = classItems(klass, 'method', document)
	let events = classItems(klass, 'event', document)
	let properties = classItems(klass, 'property', document)

	return merge(attrs, { methods, events, properties })
}

function descendants(klass: any, classes: any) {
	return classes
		.filter((c: any) => c.extends === klass.name)
		.map((c: any) => ({ type: 'class', id: c.name }))
}

function belongsTo(object: any, field: any, modelName: string) {
	if (object[field]) {
		return {
			id: object[field],
			type: modelName,
		}
	}
	return null
}

function classItems(klass: any, itemType: any, document: any) {
	return document.classitems.filter(
		(item: any) => item.itemtype === itemType && item.class === klass.name
	)
}

function relationships(klass: any, classes: any) {
	return {
		'parent-class': { data: belongsTo(klass, 'extends', 'class') },
		descendants: { data: descendants(klass, classes) },
		module: { data: belongsTo(klass, 'module', 'module') },
	}
}

function extractModule(module: any) {
	let classes = Object.keys(module.classes || {})

	return {
		id: module.name,
		type: 'module',
		attributes: omit(module, ['class', 'module']),

		relationships: {
			classes: {
				data: classes.map(klass => ({ type: 'class', id: klass })),
			},
		},
	}
}
