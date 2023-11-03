module.exports = {
	env: {
		es6: true,
		node: true,
	},
	extends: ['eslint:recommended', 'plugin:prettier/recommended', 'plugin:n/recommended'],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	rules: {
		'n/no-process-exit': 0,
	},
	overrides: [
		{
			files: 'test/**/*',
			env: {
				mocha: true,
			},
			rules: {
				'n/no-unpublished-import': 0,
			},
		},
	],
}
