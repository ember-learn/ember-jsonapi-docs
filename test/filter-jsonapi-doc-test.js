import { assert } from 'chai'
import _ from 'lodash'
import { classWithIncluded } from '../lib/filter-jsonapi-doc.js'

describe('filter json api docs', () => {
	describe('#classWithIncluded', () => {
		beforeEach(function() {
			this.document = {
				data: [
					{
						id: 'Ember.Butt',
						type: 'class',
						relationships: {
							methods: [{ id: 'Ember.Butt#Foo', type: 'method' }],
						},
					},
					{
						id: 'NotAClass',
						type: 'yoloswag',
					},
				],
				included: [
					{
						id: 'Ember.Butt#foo',
						type: 'method',
						relationships: {
							class: {
								data: { id: 'Ember.Butt', type: 'class' },
							},
						},
					},
				],
			}

			this.response = classWithIncluded(this.document, 'Ember.Butt')
		})

		it('returns the class in the result', function() {
			assert.typeOf(this.response.data, 'object')
			assert.deepEqual(this.response.data, {
				id: 'Ember.Butt',
				type: 'class',
				relationships: {
					methods: [{ id: 'Ember.Butt#Foo', type: 'method' }],
				},
			})
		})

		it('returns associated methods', function() {
			assert.deepEqual(this.response.included, [
				{
					id: 'Ember.Butt#foo',
					type: 'method',
					relationships: {
						class: {
							data: { id: 'Ember.Butt', type: 'class' },
						},
					},
				},
			])
		})

		it('does not return unassociated models', function() {
			let unassociated = _.filter(this.response.included, ['type', 'yoloswag'])
			assert.equal(unassociated.length, 0)
		})
	})
})
