import moduleData from 'ember-rfc176-data'
import keyfinder from 'keyfinder'
import { uniq } from 'lodash'

export const emberKnownEntityNames = uniq(keyfinder(moduleData, 'export'))
