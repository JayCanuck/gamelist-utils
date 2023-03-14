// Links RetroArch playlist rom images to scraped image directories
// Assumes ROMs have media images with identical names
// Follows the conventions from https://github.com/libretro/libretro-thumbnails
// May require admin/special privileges to symlink
const path = require('path');
const fs = require('fs-extra');
const { find: findXml, forEach: forEachGame } = require('./utils/gamelist');

const options = {
	boolean: ['quiet', 'help'],
	alias: { u: 'update', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist retroarch <path> [options]');
	console.log();
	console.log('  Arguments');
	console.log('    path              Path to RetroArch installation');
	console.log();
	console.log('  Options');
	console.log('    -u, --update      Update playlist ROM names from gamelist.xml');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const uniq = arr => [...new Set(arr)];

const api = async function (dir, { update, quiet } = {}) {
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
		await Promise.all(
			fs
				.readdirSync(playlistsDir)
				.filter(e => e.endsWith('.lpl'))
				.map(async lpl => {
					const base = path.basename(lpl, '.lpl');
					try {
						const lplFile = path.join(playlistsDir, lpl);
						const data = JSON.parse(fs.readFileSync(lplFile));
						data.items = data.items || [];
						if (update) {
							const gameNames = {};
							const sysDirs = uniq(
								uniq(data.items.map(item => path.dirname(item.path)))
									.map(dir => findXml(dir))
									.filter(Boolean)
							);
							await Promise.all(
								sysDirs.map(async sysDir =>
									forEachGame(sysDir, game => {
										gameNames[path.resolve(path.join(sysDir, game.path[0]))] =
											game.name[0]
												.replace(/["\n\r]/g, '')
												.replace(/\s+/g, ' ')
												.trim();
									})
								)
							);
							data.items = data.items.map(item => {
								item.label = gameNames[path.resolve(item.path)] || item.label;
								return item;
							});
							fs.writeFileSync(lplFile, JSON.stringify(data, null, '  '), {
								encoding: 'utf8'
							});
						}
						plData[base] = data.items.map(({ path, label }) => {
							return {
								rom: path,
								label
							};
						});
					} catch (e) {
						throw new Error(`Failed to read playlist "${lpl}"\n${e.stack}`);
					}
				})
		);
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
			const romName = path.basename(rom, path.extname(rom));
			const sanitizedLabel = sanitize(label);
			if (!quiet) console.log(`\t${romName}:`);
			mediaPair.forEach(([ra, local]) => {
				const raMediaDir = path.join(thumbnailsDir, plName, ra);
				const raMedia = path.join(raMediaDir, sanitizedLabel + '.png');
				const localMedia = path.join(romDir, media, local, romName + '.png');

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
