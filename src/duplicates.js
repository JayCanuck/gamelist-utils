// Scans the gamelist.xml to attempt to find duplicate game entries.
// Relies on game ID values being assigned by Skraper (http://skraper.net/)
const path = require('path');
const fs = require('fs-extra');
const { forEach } = require('./utils/gamelist');

const options = {
	boolean: ['quiet', 'help'],
	alias: { m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist duplicates [options]');
	console.log();
	console.log('  Options');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { quiet } = {}) {
	const missingFile = path.join(dir, 'gamelist.Missing.Serial.txt');
	const missing = [];
	const possibly = [];
	const found = {};
	await forEach(dir, game => {
		if (game?.$?.id) {
			found[game.$.id] = (found[game.$.id] || []).concat(game.path[0]);
		}
	});
	Object.keys(found).forEach(key => {
		if (key !== '0' && found[key].length > 1) {
			missing.push({ id: key, duplicates: found[key] });
			if (!quiet) console.log('Duplicates for game id', key);
			if (!quiet) console.log('\t' + found[key].join('\n\t'));
		}
	});

	// Attempt to scan any gamelist.Missing.Serial.txt and find duplicate candidates
	if (fs.existsSync(missingFile)) {
		const list = fs
			.readFileSync(missingFile, { encoding: 'utf8' })
			.split(/[\n\r]+/)
			.map(l => l.split('|')[0])
			.filter(l => Boolean(l));
		const missing = list.reduce((acc, game) => {
			const key = game
				.replace(/^[./\\]*([^[/\\]*).*$/, '$1')
				.replace(/\s*(?:[([].*[)\]])*\s*\.[^\s]*$/, '');
			return { ...acc, [key]: (acc[key] || []).concat(game) };
		}, {});
		Object.keys(missing).forEach(name => {
			if (missing[name].length > 1) {
				possibly.push({ name, duplicates: missing[name] });
				if (!quiet) console.log('Potential duplicates for game "' + name + '"');
				if (!quiet) console.log('\t' + missing[name].join('\n\t'));
			}
		});
	}

	return { missing, possibly };
};

module.exports = { options, api, help };
