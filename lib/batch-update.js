'use strict';

let _ = require('lodash')
let RSVP = require('rsvp')
let path = require('path')
let Queue = require('promise-queue')
let promiseRetry = require('promise-retry')

module.exports = function(db, docs) {
  let queue = new Queue(10);
  let chunks = _.chunk(docs, 20);

  return RSVP.map(chunks, chunk => {
    return promiseRetry((retry, number) => {
      let docs = chunk.map(doc => {
        let document = require(path.join(__dirname, '..', doc))
        document._id = `${document.data.type}-${document.data.id}`

        return document
      })

      let keys = docs.map(doc => doc._id)

      if (number > 0) {
        let timesLeft = 10 - number
        console.log('syncing for chunk failed, retrying ' + timesLeft + ' more times.', keys)
      }

      return db.allDocs({keys: keys}).catch(retry).then(results => {
        docs.forEach(document => {
          let fromServer = results.rows.find(r => !r.error && r.id === document._id)
          if (fromServer) {
            document._rev = fromServer.value.rev
          }
        })

        return queue.add(() => {
          return db.bulkDocs(docs).catch(() => {
            return new RSVP.Promise((resolve, reject) => {
              setTimeout(() => {
                return db.bulkDocs(docs).then(resolve, reject)
              }, 1000)
            })
          }).then(() => {
          }).catch(err => {
            console.log('keys failed', keys);
            console.log('keys failed error', err)
            process.exit(1)
          })
        })
      })
    })

  })
}
