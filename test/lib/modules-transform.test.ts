import { assert } from 'chai'
import * as _ from 'lodash'
import transformModules from '../../src/lib/modules-transform'

describe('transformModules', () => {
	beforeEach(async function () {
		this.yuiDocSets = _.range(3).map(i => {
			return {
				version: `v1.0.${i}`,
				data: {
					modules: [
						{
							is_submodule: 1,
							module: 'foo',
							submodules: {},
							classes: {
								'Testing.class.private-1': 1,
								'Testing.class.public-2': 1,
								'Testing.class.private-3': 1,
								'Testing.class.public-4': 1,
								'Testing.class.deprecated-3': 1,
							},
						},
						{
							is_submodule: 1,
							module: 'foo',
							submodules: {},
							classes: {
								'Testing.class.private-1': 1,
							},
						},
						{
							is_submodule: 0,
							module: 'bar',
							submodules: {},
							classes: {
								'Testing.class.private-1': 1,
								'Testing.class.public-2': 1,
							},
						},
					],
					classes: {
						'Testing.class.private-1': {
							file: 'testing/class/private/1.js',
							access: 'private',
							deprecated: false,
						},
						'Testing.class.public-2': {
							file: 'testing/class/public/2.js',
							access: 'public',
							deprecated: false,
						},
						'Testing.class.private-3': {
							file: 'testing/class/private/3.js',
							access: 'private',
							deprecated: false,
						},
						'Testing.class.public-4': {
							file: 'testing/class/public/4.js',
							access: 'public',
							deprecated: false,
						},
						'Testing.class.deprecated-3': {
							file: 'testing/class/deprecated/3.js',
							access: 'public',
							deprecated: true,
						},
					},
				},
			}
		})
		this.yuiDocSets = await Promise.all(this.yuiDocSets.map(transformModules))
	})

	it('adds a parent attribute to sub modules', async function () {
		for (let doc of this.yuiDocSets) {
			let subModules = _.filter(doc.data.modules, ({ is_submodule }) => is_submodule)

			subModules.forEach(({ parent }) => {
				assert.equal(parent, 'foo')
			})
		}
	})

	it('publicclasses/privateclasses attributes are set correctly', function () {
		this.yuiDocSets.forEach(({ data }: any) => {
			let modules = data.modules
			assert.deepEqual(modules[0].publicclasses, [
				'Testing.class.public-2',
				'Testing.class.public-4',
			])
			assert.deepEqual(modules[0].privateclasses, [
				'Testing.class.private-1',
				'Testing.class.private-3',
				'Testing.class.deprecated-3',
			])
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
