'use strict'

let transformModules = require('../lib/modules-transform')
let assert = require('chai').assert
let _ = require('lodash')

describe('transformModules', function () {
  beforeEach(function () {
    this.yuiDocSets = _.range(3).map(i => {
      return {
        version: 'v1.0.' + i,
        data: {
          modules: [
            {
              is_submodule: 1,
              module: 'foo',
              classes: {
                'Testing.class.private-1': 1,
                'Testing.class.public-2': 1,
                'Testing.class.private-3': 1,
                'Testing.class.public-4': 1,
                'Testing.class.deprecated-3': 1
              }
            },
            {
              is_submodule: 1,
              module: 'foo',
              classes: {
                'Testing.class.private-1': 1
              }
            },
            {
              is_submodule: 0,
              module: 'bar',
              classes: {
                'Testing.class.private-1': 1,
                'Testing.class.public-2': 1
              }
            }
          ],
          classes: {
            'Testing.class.private-1': {
              access: 'private',
              deprecated: false
            },
            'Testing.class.public-2': {
              access: 'public',
              deprecated: false
            },
            'Testing.class.private-3': {
              access: 'private',
              deprecated: false
            },
            'Testing.class.public-4': {
              access: 'public',
              deprecated: false
            },
            'Testing.class.deprecated-3': {
              access: 'public',
              deprecated: true
            }
          }
        }
      }
    })
    transformModules(this.yuiDocSets)
  })

  it('adds a parent attribute to sub modules', function () {
    this.yuiDocSets.forEach(docSet => {
      let subModules = _.filter(docSet.data.modules, (mod) => (mod.is_submodule))
      subModules.forEach((moduleItem) => {
        assert.equal(moduleItem.parent, 'foo')
      })
    })
  })

  it('publicclasses/privateclasses attributes are set correctly', function () {
    this.yuiDocSets.forEach(docSet => {
      let modules = docSet.data.modules
      assert.deepEqual(modules[0].publicclasses, ['Testing.class.public-2', 'Testing.class.public-4'])
      assert.deepEqual(modules[0].privateclasses, ['Testing.class.private-1', 'Testing.class.private-3', 'Testing.class.deprecated-3'])
      assert.isUndefined(modules[0].classes)

      assert.deepEqual(modules[1].publicclasses, [])
      assert.deepEqual(modules[1].privateclasses, ['Testing.class.private-1'])
      assert.isUndefined(modules[1].classes)

      assert.deepEqual(modules[2].publicclasses, ['Testing.class.public-2'])
      assert.deepEqual(modules[2].privateclasses, ['Testing.class.private-1'])
      assert.isUndefined(modules[2].classes)
    })
  })
})
