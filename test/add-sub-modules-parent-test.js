'use strict'

let addSubModulesParent = require('../lib/add-sub-modules-parent')
let assert = require('chai').assert
let range = require('lodash/range')

describe('addSubModulesParent', function () {
  beforeEach(function () {
    this.yuiDocSets = range(3).map(i => {
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
      let subModules = docSet.data.modules.filter((mod) => (mod.is_submodule))
      subModules.forEach((moduleItem) => {
        assert.equal(moduleItem.parent, 'foo')
      })
    })
  })
})
