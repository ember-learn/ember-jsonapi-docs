import transformModules from './modules-transform'
import addInheritedItems from './add-inherited-items'
import normalizeIDs from './normalize-ids'

export default function transformYuiObject(docs, projName) {
	console.log('Preparing Modules')
	return transformModules(docs)
		.then(d => {
			console.log('Adding inherited items')
			return addInheritedItems(d)
		})
		.then(d => {
			console.log('Normalizing dependencies')
			return normalizeIDs(d, projName)
		})
}
