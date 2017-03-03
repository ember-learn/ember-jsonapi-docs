let RSVP = require('rsvp')

module.exports = function getNewDocsToIndex (docs) {
  return RSVP.resolve(docs)
}
