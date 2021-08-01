module.exports = {
	root: true,
	env: {
		node: true,
		es2021: true
	},
	extends: ['eslint:recommended', 'plugin:prettier/recommended'],
	plugins: ['import'],
	rules: {
		'import/no-unresolved': ['error', { commonjs: true, caseSensitive: true }],
		'import/named': 'error',
		'import/first': 'warn',
		'import/no-duplicates': 'error',
		'import/extensions': ['warn', 'always', { js: 'never', json: 'always' }],
		'import/newline-after-import': 'warn',
		'import/order': [
			'warn',
			{
				'newlines-between': 'never',
				groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
			}
		]
	}
};
