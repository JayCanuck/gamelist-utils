// Adds or removes video tags from game entries and optionally delete video files.
const path = require('path');
const fs = require('fs-extra');
const { update } = require('./utils/gamelist');

const options = {
	boolean: ['delete', 'quiet', 'help'],
	alias: { d: 'delete', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist video <state> [options]');
	console.log();
	console.log('  Arguments');
	console.log('    state             State of whether use <video> tags with games');
	console.log('                          Either "enable" or "disable"');
	console.log();
	console.log('  Options');
	console.log('    -d, --delete      Delete video files when disabling');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { state = 'enable', delete: remove, quiet } = {}) {
	const media = process.env.GAMELIST_MEDIA || 'media';
	const snap = process.env.GAMELIST_SNAP || 'snap';
	const snapDir = path.join(dir, media, snap);
	let logStart = '';
	switch (state) {
		case 'enable':
		case 'enabled': // common misspelling/alternative
			logStart = 'Added all detected video metadata for';
			await update(dir, game => {
				if (game && game.path && game.path[0]) {
					const rom = game.path[0].replace(/^\.\//, '');
					const relVideo =
						'./' +
						path
							.join(media, snap, path.basename(rom, path.extname(rom)) + '.mp4')
							.replace(/[\\/]+/g, '/');
					if (fs.existsSync(path.join(dir, relVideo))) {
						game.video = game.video || [];
						game.video[0] = relVideo;
					}
				}
			});
			break;
		case 'disable':
		case 'disabled': // common misspelling/alternative
			await update(dir, game => {
				delete game.video;
			});
			if (remove && fs.existsSync(snapDir)) {
				fs.removeSync(snapDir);
				logStart = 'Removed videos and video metadata for';
			} else {
				logStart = 'Removed video metadata tags for';
			}
			break;
		default:
			throw new Error('Invalid state. Must be either "enable" or "disable"');
	}
	if (!quiet) console.log(logStart, path.basename(dir), 'successfully');
};

module.exports = { options, api, help };
