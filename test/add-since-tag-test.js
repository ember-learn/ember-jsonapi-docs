let addSinceTags = require('../lib/add-since-tags')
let assert = require('chai').assert
let _ = require('lodash')

describe('addSinceTags', function() {
	beforeEach(function() {
		this.yuiDocSets = _.range(3).map(i => {
			return {
				version: 'v1.0.' + i,
				data: {
					classitems: [
						{
							itemtype: 'method',
							name: 'foo',
							class: 'Foo',
						},
						{
							itemtype: 'method',
							name: 'bar',
							class: 'Foo',
						},
					],
				},
			}
		})
		addSinceTags(this.yuiDocSets)
	})

	it('adds a since tag to classitems', function() {
		this.yuiDocSets.forEach(docSet => {
			docSet.data.classitems.forEach(classItem => assert.equal(classItem.since, '1.0.0'))
		})
	})
})
