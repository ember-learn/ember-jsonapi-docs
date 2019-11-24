import * as SafePromise from 'bluebird'
import * as _ from 'lodash'

export default function addInheritedItems(doc: any) {
	// docSets.forEach(versionData => {
	let { data } = doc
	let classes = _.values(data.classes).filter(klass => klass && klass.name)
	classes = classes.filter(removeLongDocsBecauseEmber1HasWeirdDocs)
	let classItems = data.classitems.filter(({ itemtype }: any) => itemtype)

	classes.forEach(klass => {
		let parents = getParents(klass, classes)

		for (let parent of parents) {
			parents = parents.concat(getParents(parent, classes))
		}

		parents.forEach(parent => {
			if (!parent) return
			let parentItems = classItems.filter((item: any) => item.class === parent.name)
			parentItems = parentItems.map((item: any) => {
				item = _.clone(item)
				item.inherited = true
				item.inheritedFrom = item.class
				item.class = klass.name
				return item
			})
			data.classitems = data.classitems.concat(parentItems)
		})
	})
	// })

	return SafePromise.resolve(doc)
}

function getParents(klass: any, classes: any) {
	let parents: any[] = []
	if (klass.extends) {
		parents = parents.concat([klass.extends])
	}
	if (klass.uses && klass.uses.length) {
		parents = parents.concat(klass.uses.reverse())
	}
	return parents
		.map(parent => _.find(classes, ({ name }) => name === parent))
		.filter(parent => parent)
}

function removeLongDocsBecauseEmber1HasWeirdDocs({ name }: { name: string }) {
	return !name.includes('A Suite can')
}
