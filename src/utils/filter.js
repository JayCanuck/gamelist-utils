const path = require('path');
const fs = require('fs-extra');
const JSON5 = require('json5');

const getValue = (game, field) => (Array.isArray(game[field]) ? game[field][0] : game[field]);
const getMeta = (game, field) => (game.$ ? getValue(game.$, field) : undefined);
const normalizePath = file => file.replace(/^\.\//, '');
const testcase = (game, provider, criteria, polarity) =>
	Object.keys(criteria).every(key => {
		if (['comment', 'comments'].includes(key)) return true; // ignore comments
		if (key === 'system') {
			return !provider || (criteria[key] === provider.system) === polarity;
		} else if (key === 'id') {
			const gameID = getMeta(game, 'id');
			return gameID && (criteria[key] === gameID) === polarity;
		} else if (key === 'path' || key === 'file') {
			const value = getValue(game, 'path');
			return (
				value &&
				(normalizePath(criteria.path.toLowerCase()) ===
					normalizePath(value.toLowerCase())) ===
					polarity
			);
		} else if (key.endsWith('Contains')) {
			const value = getValue(game, key.replace('Contains', '')).toLowerCase();
			return value && value.toLowerCase().includes(criteria[key]) === polarity;
		} else {
			const value = getValue(game, key);
			return value && (criteria[key].toLowerCase() === value.toLowerCase()) === polarity;
		}
	});

class Filter {
	constructor(file) {
		if (file.endsWith('.js')) {
			this.data = require(path.resolve(file));
		} else {
			this.data = JSON5.parse(fs.readFileSync(file, { encoding: 'utf8' }));
		}
	}

	test(game, provider) {
		if (
			this.data.include &&
			!this.data.include.some(criteria => testcase(game, provider, criteria, true))
		)
			return false;
		if (
			this.data.exclude &&
			!this.data.exclude.every(criteria => testcase(game, provider, criteria, false))
		)
			return false;
		return true;
	}
}

module.exports = Filter;
