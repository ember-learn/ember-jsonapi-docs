let _ = require('lodash')
let RSVP = require('rsvp')

module.exports = function addSinceTags(docSets) {
	let versionIndex = Object.create(null)

	docSets.forEach(function(versionData) {
		let data = versionData.data
		let version = (versionData.version = versionData.version.replace('v', ''))
		let classItems = data.classitems.filter(item => item.itemtype)

		classItems.forEach(function(classItem) {
			let classItemName = classItem.class + '#' + classItem.name
			classItem.version = version
			createMethodEntry(versionIndex, classItemName, classItem.itemtype, version)
		})

		let classes = _.values(data.classes)

		classes.forEach(klass => {
			klass.version = version
			createMethodEntry(versionIndex, klass.name, 'class', version)
		})
	})

	sortVersionIndex(versionIndex)

	let classItems = classItemsWithItemType(docSets)

	classItems.forEach(classItem => {
		let classItemName = classItem.class + '#' + classItem.name
		let version = versionIndex[classItem.itemtype][classItemName][0]

		classItem.since = version
	})

	let classes = _.chain(docSets)
		.map('data')
		.map('classes')
		.flatten()
		.map(klassSet => _.values(klassSet))
		.flatten()
		.value()

	classes.forEach(klass => {
		klass.since = versionIndex['class'][klass.name][0]
	})

	return RSVP.resolve(docSets)
}

function sortVersionIndex(versionIndex) {
	let keys = Object.keys(versionIndex)

	keys.forEach(function(key) {
		Object.keys(versionIndex[key]).forEach(function(item) {
			versionIndex[key][item].sort()
		})
	})
}

function createMethodEntry(versionIndex, method, itemType, version) {
	versionIndex[itemType] = versionIndex[itemType] || Object.create(null)
	versionIndex[itemType][method] = versionIndex[itemType][method] || []
	versionIndex[itemType][method].push(version)
}

function classItemsWithItemType(versions) {
	return versions.reduce((memo, versionData) => {
		return memo.concat(versionData.data.classitems.filter(item => item.itemtype))
	}, [])
}
