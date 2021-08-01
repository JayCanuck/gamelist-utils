// Removes video tags from game entries and optionally delete video files.
const path = require('path');
const fs = require('fs-extra');
const { update } = require('./utils/gamelist');

const options = {
	boolean: ['extract', 'quiet', 'help'],
	string: ['copy', 'image'],
	alias: { c: 'copy', e: 'extract', i: 'image', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist remove-video [options]');
	console.log();
	console.log('  Options');
	console.log("    -k, --keep        Don't delete video files");
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { keep, quiet } = {}) {
	const media = process.env.GAMELIST_MEDIA || 'media';
	const snap = process.env.GAMELIST_SNAP || 'snap';
	const snapDir = path.join(dir, media, snap);
	await update(dir, game => {
		delete game.video;
	});
	if (!keep && fs.existsSync(snapDir)) fs.removeSync(snapDir);
	if (!quiet)
		console.log('Removed videos and video metadata for', path.basename(dir), 'successfully');
};

module.exports = { options, api, help };
