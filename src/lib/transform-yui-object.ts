import addInheritedItems from './add-inherited-items'
import transformModules from './modules-transform'
import normalizeIDs from './normalize-ids'

export default function transformYuiObject(docs, projName) {
	return transformModules(docs)
		.then(d => addInheritedItems(d))
		.then(d => normalizeIDs(d, projName))
}
