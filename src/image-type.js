// Sets game entry on a gamelist.xml to use a specific type of image.
// Types are subdirectories within the media subdirectory
// (eg. box2d, box3d, screenshot, etc.)
const path = require('path');
const fs = require('fs-extra');
const { update } = require('./utils/gamelist');

const options = {
	boolean: ['quiet', 'help'],
	string: ['fallback'],
	alias: { f: 'fallback', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist image-type <type> [options]');
	console.log();
	console.log('  Arguments');
	console.log('    type              Type of image to set in gamelist entries');
	console.log();
	console.log('  Options');
	console.log('    -f, --fallback    Fallback image type');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { type = 'screenshot', fallback, quiet } = {}) {
	if (!quiet) console.log('Updating image gamelist.xml values for', path.basename(dir));
	let usingFallback = false;
	await update(dir, game => {
		let name = game.path[0].replace(/\.\/([^/]+).*/, '$1');
		if (!fs.statSync(path.join(dir, game.path[0])).isDirectory()) {
			name = name.replace(/(.*)(?:\.[^.]+$)/, '$1');
		}
		const newImg = './media/' + (type ? type + '/' : '') + name + '.png';
		if (game.image) delete game.image;
		if (fs.existsSync(path.join(dir, newImg))) {
			if (!quiet) console.log('\t' + newImg);
			game.image = [newImg];
		} else if (fallback && typeof fallback === 'string') {
			const fallImg = './media/' + fallback + '/' + name + '.png';
			if (fs.existsSync(path.join(dir, fallImg))) {
				usingFallback = true;
				if (!quiet) console.log('*\t' + fallImg);
				game.image = [fallImg];
			}
		}
	});
	if (!quiet && usingFallback) console.log('\n* Uses fallback type of', fallback);
};

module.exports = { options, api, help };
