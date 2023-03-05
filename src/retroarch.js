// Links RetroArch playlist rom images to scraped image directories
// Assumes ROMs have media images with identical names
// Follows the conventions from https://github.com/libretro/libretro-thumbnails
const path = require('path');
const fs = require('fs-extra');

const options = {
	boolean: ['quiet', 'help'],
	alias: { q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist retroarch <path> [options]');
	console.log();
	console.log('  Arguments');
	console.log('    path              Path to RetroArch installation');
	console.log();
	console.log('  Options');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { quiet } = {}) {
	if (!dir) throw new Error('No RetroArch directory specified');

	// Env var override support
	const media = process.env.GAMELIST_MEDIA || 'media';
	const box2d = process.env.GAMELIST_BOX2D || 'box2d';
	const ss = process.env.GAMELIST_SCREENSHOT || 'screenshot';
	const title = process.env.GAMELIST_TILE || 'title';

	// Read playlists
	const playlistsDir = path.join(dir, 'playlists');
	const plData = {};
	if (fs.existsSync(playlistsDir)) {
		fs.readdirSync(playlistsDir)
			.filter(e => e.endsWith('.lpl'))
			.forEach(lpl => {
				const base = path.basename(lpl, '.lpl');
				try {
					const data = JSON.parse(fs.readFileSync(path.join(playlistsDir, lpl)));
					plData[base] = (data?.items || []).map(({ path, label }) => ({
						rom: path,
						label
					}));
				} catch (e) {
					throw new Error(`Failed to read playlist "${lpl}"`);
				}
			});
	}

	const sanitize = label => label.replace(/[&*/:`<>?\\|]/g, '_');

	// Generate thumbnail symlinks
	const thumbnailsDir = path.join(dir, 'thumbnails');
	Object.keys(plData).forEach(plName => {
		const mediaPair = [
			['Named_Boxarts', box2d],
			['Named_Snaps', ss],
			['Named_Titles', title]
		];

		if (!quiet) console.log(`Handling playlist ${plName}`);
		plData[plName].forEach(({ rom, label }) => {
			const romDir = path.dirname(rom);
			const sanitizedLabel = sanitize(label);
			if (!quiet) console.log(`\t${label}:`);
			mediaPair.forEach(([ra, local]) => {
				const raMediaDir = path.join(thumbnailsDir, plName, ra);
				const raMedia = path.join(raMediaDir, sanitizedLabel + '.png');
				const localMedia = path.join(romDir, media, local, label + '.png');

				fs.ensureDirSync(raMediaDir);
				if (fs.existsSync(localMedia)) {
					fs.removeSync(raMedia);
					fs.symlinkSync(localMedia, raMedia);
					if (!quiet) console.log(`\t\t${ra}: ${localMedia}`);
				}
			});
		});
	});
};

module.exports = { options, api, help };
