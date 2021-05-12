import transformModules from './modules-transform'
import addInheritedItems from './add-inherited-items'
import normalizeIDs from './normalize-ids'

export default function transformYuiObject(docs, projName) {
	return transformModules(docs)
		.then(d => {
			console.log('transformed', d)
			let doc = addInheritedItems(d)
			console.log('added inherited')
			return doc
		})
		.then(d => {
			let doc = normalizeIDs(d, projName)
			console.log('normalized ids')
			return doc
		})
		.catch(e => {
			console.error(e)
			throw e
		})
}
