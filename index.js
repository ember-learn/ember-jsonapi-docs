let RSVP = require('rsvp')

let readDocs = require('./lib/read-docs')
let fetchYuiDocs = require('./lib/fetch-yui-docs')
let transformYuiObject = require('./lib/transform-yui-object')

// let projects = ['ember', 'ember-data']
let projects = [ 'ember-data']
let specificDocsVersion = process.argv[2] ? process.argv[2] : ''
let docsVersionMsg = specificDocsVersion !== '' ? '. For version ' + specificDocsVersion : ''

console.log(`Downloading docs for ${projects.join(' & ')} ${docsVersionMsg}`)

// fetchYuiDocs(specificDocsVersion)
RSVP.resolve()
.then(() => {
  return RSVP.map(projects, (proj) => transformYuiObject(readDocs(proj)) )
})


RSVP.on('error', function(reason) {
  console.log( reason);
});
