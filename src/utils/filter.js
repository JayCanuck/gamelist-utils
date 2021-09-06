const fs = require('fs-extra');

const getValue = (game, field) => (Array.isArray(game[field]) ? game[field][0] : game[field]);
const getMeta = (game, field) => (game.$ ? getValue(game.$, field) : undefined);
const testcase = (game, provider, criteria, polarity) =>
	Object.keys(criteria).every(key => {
		if (key === 'system') {
			return !provider || (criteria[key] === provider.system) === polarity;
		} else if (key === 'id') {
			const gameID = getMeta(game, 'id');
			return gameID && (criteria[key] === gameID) === polarity;
		} else if (key.endsWith('Contains')) {
			const value = getValue(game, key.replace('Contains', ''));
			return value && value.includes(criteria[key]) === polarity;
		} else {
			const value = getValue(game, key);
			return value && (criteria[key] === value) === polarity;
		}
	});

class Filter {
	constructor(file) {
		this.data = JSON.parse(fs.readFileSync(file, { encoding: 'utf8' }));
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
