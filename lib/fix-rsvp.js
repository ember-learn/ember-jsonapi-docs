'use strict'

let _ = require('lodash')
let RSVP = require('rsvp')

function toVersionArray (versionStr) {
  let versionStrArray = versionStr.split('.')
  let result = []
  result.push(parseInt(versionStrArray[0]))
  result.push(parseInt(versionStrArray[1]))
  return result
}

function major (versionArray) {
  return versionArray[0]
}

function minor (versionArray) {
  return versionArray[1]
}

function versionGreaterThanOrEq (current, compareTo) {
  return major(toVersionArray(current)) > major(toVersionArray(compareTo)) ||
    (major(toVersionArray(current)) === major(toVersionArray(compareTo)) &&
     minor(toVersionArray(current)) >= minor(toVersionArray(compareTo))
    )
}

module.exports = function fixRsvp (docs) {
  docs.forEach(doc => {
    if (doc.project === 'ember' &&
        versionGreaterThanOrEq(doc.version, '2.16.0')) {
      delete doc.data.modules['@ember/application'].classes['RSVP']
      delete doc.data.modules['@ember/application'].classes['RSVP.EventTarget']
      delete doc.data.modules['@ember/application'].classes['RSVP.Promise']
      doc.data.modules['rsvp'] = {
        'name': 'rsvp',
        'submodules': {},
        'elements': {},
        'namespaces': {},
        'classes': {
          'rsvp': 1,
          'EventTarget': 1,
          'Promise': 1
        },
        'access': 'public'
      }

      doc.data.classes['rsvp'] = doc.data.classes['RSVP']
      delete doc.data.classes['RSVP']
      doc.data.classes['rsvp'].name = 'rsvp'
      doc.data.classes['rsvp'].module = 'rsvp'
      doc.data.classes['rsvp'].access = 'public'
      doc.data.classes['rsvp'].static = 1

      doc.data.classes['Promise'] = doc.data.classes['RSVP.Promise']
      delete doc.data.classes['RSVP.Promise']
      doc.data.classes['Promise'].name = 'Promise'
      doc.data.classes['Promise'].shortname = 'Promise'
      doc.data.classes['Promise'].module = 'rsvp'
      doc.data.classes['Promise'].access = 'public'

      doc.data.classes['EventTarget'] = doc.data.classes['RSVP.EventTarget']
      delete doc.data.classes['RSVP.EventTarget']
      doc.data.classes['EventTarget'].access = 'public'
      doc.data.classes['EventTarget'].module = 'rsvp'
      doc.data.classes['EventTarget'].name = 'EventTarget'
      doc.data.classes['EventTarget'].shortname = 'EventTarget'

      doc.data.classitems = _.filter(doc.data.classitems, item => item.file.indexOf('/rsvp/promise') < 0 || item.static !== 1)
      doc.data.classitems.forEach(item => {
        if (item.class.startsWith('RSVP')) {
          item.access = 'public'
          item.module = 'rsvp'
          if (item.class === 'RSVP.EventTarget') {
            item.class = 'EventTarget'
          } else if (item.class === 'RSVP.Promise') {
            item.class = 'Promise'
          } else {
            item.class = 'rsvp'
          }
        }
      })
    }
  })
  return RSVP.resolve(docs)
}
