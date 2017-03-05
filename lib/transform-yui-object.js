let addSubModulesParent = require('./add-sub-modules-parent')
let addSinceTags = require('./add-since-tags')
let addInheritedItems  = require('./add-inherited-items')
let normalizeIDs = require('./normalize-ids')

module.exports = function transformYuiObject(docs) {
  return addSubModulesParent(docs)
        .then(d=> {
          return addSinceTags(d)
        })
        .then(d=>{
          return addInheritedItems(d)
        })
        .then(d => {
          return normalizeIDs(d)
        })
        .then(d => {
          console.log(d)
        })
}
