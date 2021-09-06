// Creates a rom collection
const path = require('path');
const fs = require('fs-extra');
const Filter = require('./utils/filter');
const gamelist = require('./utils/gamelist');

const options = {
	boolean: ['quiet', 'help'],
	string: ['filter', 'output', 'path'],
	alias: { f: 'filter', o: 'output', p: 'prefix', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist collection [options]');
	console.log();
	console.log('  Options');
	console.log('    -f, --filter      Filter JSON file to use with the collection');
	console.log('    -o, --output      Output directory for the collection cfg file');
	console.log('                          (Defaults to cwd)');
	console.log('    -p, --prefix      ROM system root path containing the system directory');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { output, filter: filterFile, prefix, quiet } = {}) {
	const gameFilter = filterFile ? new Filter(filterFile) : undefined;
	const roms = [];

	await gamelist.forEach(dir, (game, provider) => {
		if (!gameFilter || (gameFilter && gameFilter.test(game, provider))) {
			if (game.path && game.path[0]) {
				let romFile = game.path[0];
				if (prefix) {
					romFile =
						prefix.replace(/[\\/]+/g, '/').replace(/\/$/, '') +
						'/' +
						path.basename(process.cwd()) +
						'/' +
						romFile.replace(/^\.\//, '');
				}
				roms.push(romFile);
			}
		}
	});

	let collectionName = filterFile
		? 'custom-' + path.basename(filterFile, '.json') + '.cfg'
		: 'My ' + path.basename(process.cwd()).toLocaleUpperCase() + ' Collection';
	let outputPath = '';
	if (fs.existsSync(output) && fs.statSync(output).isDirectory()) {
		outputPath = output;
	} else {
		collectionName = output;
	}
	const cfgFile = path.join(outputPath, collectionName);
	fs.writeFileSync(cfgFile, roms.join('\n') + '\n', { encoding: 'utf8' });

	if (!quiet) console.log(`Wrote collection configuration file to: "${cfgFile}"`);
};

module.exports = { options, api, help };
