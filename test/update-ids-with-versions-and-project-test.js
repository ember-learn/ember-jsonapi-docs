import updateWithIDs from '../lib/update-with-versions-and-project.js'
import { assert } from 'chai'

describe('update with versions and project', () => {
	describe('`data` in jsonapi document is an object', () => {
		beforeEach(function () {
			this.document = {
				data: {
					id: 'Ember.CoreView',
					type: 'class',
					attributes: {
						name: 'Ember.CoreView',
					},
					relationships: {
						module: {
							data: {
								id: 'ember',
								type: 'module',
							},
						},
					},
				},
				included: [
					{
						id: 'ember',
						type: 'module',
						attributes: {
							name: 'ember',
						},
						relationships: {
							classes: {
								data: [
									{
										id: 'Ember.CoreView',
										type: 'class',
									},
								],
							},
						},
					},
				],
			}

			this.converted = updateWithIDs(this.document, 'ember', '1.1.0')
		})

		it('adds the project name and version to the IDs', function () {
			assert.equal(this.converted.data.id, 'ember-1.1.0-Ember.CoreView')
			assert.equal(this.converted.included[0].id, 'ember-1.1.0-ember')
			assert.equal(
				this.converted.included[0].relationships.classes.data[0].id,
				'ember-1.1.0-Ember.CoreView',
			)
		})

		it('adds the id to relationships', function () {
			assert.equal(this.converted.data.relationships.module.data.id, 'ember-1.1.0-ember')
		})
	})

	describe('when `data` is an array of objects in the jsonapi doc', () => {
		beforeEach(function () {
			this.document = {
				data: [
					{
						id: 'Ember.CoreView',
						type: 'class',
						attributes: {
							name: 'Ember.CoreView',
						},
						relationships: {
							module: {
								data: {
									id: 'ember',
									type: 'module',
								},
							},
						},
					},
				],
				included: [
					{
						id: 'ember',
						type: 'module',
						attributes: {
							name: 'ember',
						},
						relationships: {
							classes: {
								data: [
									{
										id: 'Ember.CoreView',
										type: 'class',
									},
								],
							},
						},
					},
				],
			}

			this.converted = updateWithIDs(this.document, 'ember', '1.1.0')
		})

		it('adds the project name and version to the IDs', function () {
			assert.equal(this.converted.data[0].id, 'ember-1.1.0-Ember.CoreView')
			assert.equal(this.converted.included[0].id, 'ember-1.1.0-ember')
			assert.equal(
				this.converted.included[0].relationships.classes.data[0].id,
				'ember-1.1.0-Ember.CoreView',
			)
		})

		it('adds the id to relationships', function () {
			assert.equal(this.converted.data[0].relationships.module.data.id, 'ember-1.1.0-ember')
		})
	})
})
