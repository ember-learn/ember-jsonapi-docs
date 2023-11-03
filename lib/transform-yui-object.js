import transformModules from './modules-transform.js'
import addInheritedItems from './add-inherited-items.js'
import normalizeIDs from './normalize-ids.js'

export default async function transformYuiObject(docs, projName) {
  let d = await transformModules(docs)
  console.log('\ttransformed yui object')
  d = await addInheritedItems(d)
  console.log('\tadded inherited')

  d = await normalizeIDs(d, projName)
  console.log('\tnormalized ids')

  return d
}
