import * as SafePromise from 'bluebird'
import * as _ from 'lodash'

export default function addSinceTags(docSets: any[]) {
	let versionIndex = Object.create(null)

	docSets.forEach(versionData => {
		let data = versionData.data
		let version = (versionData.version = versionData.version.replace('v', ''))
		let classItems = data.classitems.filter(({ itemtype }: any) => itemtype)

		classItems.forEach((classItem: any) => {
			let classItemName = `${classItem.class}#${classItem.name}`
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

	classItems.forEach((classItem: any) => {
		let classItemName = `${classItem.class}#${classItem.name}`
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

	classes.forEach(klass => (klass.since = versionIndex.class[klass.name][0]))

	return SafePromise.resolve(docSets)
}

function sortVersionIndex(versionIndex: any) {
	let keys = Object.keys(versionIndex)

	keys.forEach(key =>
		Object.keys(versionIndex[key]).forEach(item => versionIndex[key][item].sort())
	)
}

const createMethodEntry = (
	versionIndex: any,
	method: string,
	itemType: string,
	version: string
) => {
	versionIndex[itemType] = versionIndex[itemType] || Object.create(null)
	versionIndex[itemType][method] = versionIndex[itemType][method] || []
	versionIndex[itemType][method].push(version)
}

const classItemsWithItemType = (versions: string[]) =>
	versions.reduce(
		(memo, { data }: any) => memo.concat(data.classitems.filter(({ itemtype }: any) => itemtype)),
		[]
	)
