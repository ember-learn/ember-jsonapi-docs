'use strict'

let addSubModulesParent = require('../lib/add-sub-modules-parent')
let assert = require('chai').assert
let _ = require('lodash')

describe('addSubModulesParent', function () {
  beforeEach(function () {
    this.yuiDocSets = _.range(3).map(i => {
      return {
        version: 'v1.0.' + i,
        data: {
          modules: [
            {
              is_submodule: 1,
              module: 'foo'
            },
            {
              is_submodule: 1,
              module: 'foo'
            },
            {
              is_submodule: 0,
              module: 'bar'
            }
          ]
        }
      }
    })
    addSubModulesParent(this.yuiDocSets)
  })

  it('adds a parent attribute to sub modules', function () {
    this.yuiDocSets.forEach(docSet => {
      let subModules = _.filter(docSet.data.modules, (mod) => (mod.is_submodule))
      subModules.forEach((moduleItem) => {
        assert.equal(moduleItem.parent, 'foo')
      })
    })
  })
})
