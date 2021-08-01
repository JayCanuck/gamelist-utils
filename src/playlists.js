// Scans named subdirectories containing multiple disks and creates an appriate m3u playlist.
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs-extra');

const options = {
	boolean: ['extract', 'keep', 'quiet', 'help'],
	alias: { e: 'extract', k: 'keep', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist playlists [options]');
	console.log();
	console.log('  Options');
	console.log('    -e, --extract     Extract disk files from zip files');
	console.log('                          Only works with archives containing single files');
	console.log('    -k, --keep        Keep zip files even if files were extracted');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { extract, keep, quiet } = {}) {
	const ignore = (process.env.GAMELIST_PLAYLIST_IGNORE || 'media;hacks').split(';');
	if (!quiet) console.log('Generating playlists for', path.basename(dir));
	fs.readdirSync(dir)
		.filter(e => fs.statSync(e).isDirectory() && !ignore.includes(e))
		.forEach(game => {
			const gameDir = path.join(dir, game);
			const gameFiles = fs.readdirSync(gameDir).map(f => {
				let fullPath = path.join(gameDir, f);
				if (fullPath.endsWith('.zip') && extract) {
					const zip = new AdmZip(fullPath);
					const entry = zip.getEntries()[0];
					zip.extractEntryTo(entry.entryName, gameDir, false, true);
					if (!keep) fs.removeSync(fullPath);
					fullPath = path.join(gameDir, path.basename(entry.entryName));
				}
				return fullPath;
			});
			const m3u =
				gameFiles.map(f => path.relative(dir, f).replace(/[\\]+/g, '/')).join('\n') + '\n';
			fs.writeFileSync(path.join(dir, game + '.m3u'), m3u, { encoding: 'utf8' });
			if (!quiet) console.log('\t' + game + '.m3u');
		});
};

module.exports = { options, api, help };
