// Symlinks gamelist.xml files to EmulationStation-DE gameslist locations
// May require admin/special privileges to symlink
const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const options = {
	boolean: ['quiet', 'help'],
	alias: { m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist es-de [options]');
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
	const esUserDir = path.resolve(
		process.env.ESDE_USERDIR || path.join(os.homedir(), '.emulationstation')
	);
	const esMedia = process.env.ESDE_MEDIA || 'downloaded_media';
	const media = process.env.GAMELIST_MEDIA || 'media';
	const mediaPairs = [
		['covers', process.env.GAMELIST_BOX2D || 'box2d'],
		['3dboxes', process.env.GAMELIST_BOX3D || 'box3d'],
		['miximages', process.env.GAMELIST_MIXED || 'mixed'],
		['screenshots', process.env.GAMELIST_SCREENSHOT || 'screenshot'],
		['videos', process.env.GAMELIST_SNAP || 'snap'],
		['titlescreens', process.env.GAMELIST_TITLE || 'title'],
		['marquees', process.env.GAMELIST_MARQUEE || 'wheel']
	];
	if (fs.existsSync(esUserDir)) {
		const xml = path.join(dir, 'gamelist.xml');
		if (fs.existsSync(xml)) {
			const system = path.basename(dir);
			const esGamelistDir = path.join(esUserDir, 'gamelists', system);
			const linkXml = path.join(esGamelistDir, 'gamelist.xml');
			const mediaDir = path.join(dir, media);

			if (!quiet) console.log(`Linking ${system} metadata`);
			fs.ensureDirSync(esGamelistDir);
			fs.removeSync(linkXml);
			fs.symlinkSync(xml, linkXml);
			if (!quiet)
				console.log(
					`\t${system}/gamelist.xml <==> ~/.emulationstation/gamelists/${system}/gamelist.xml`
				);
			if (fs.existsSync(mediaDir)) {
				const esDownloadedMediaDir = path.join(esUserDir, esMedia, system);
				fs.ensureDirSync(esDownloadedMediaDir);
				mediaPairs.forEach(([esMediaTypeDir, mediaTypeDir]) => {
					const resolvedEsMediaTypeDir = path.join(esDownloadedMediaDir, esMediaTypeDir);
					const resolvedMediaTypeDir = path.join(mediaDir, mediaTypeDir);
					fs.removeSync(resolvedEsMediaTypeDir);
					fs.symlinkSync(resolvedMediaTypeDir, resolvedEsMediaTypeDir);
					if (!quiet)
						console.log(
							`\t${system}/media/${mediaTypeDir} <==> ~/.emulationstation/${esMedia}/${system}/${esMediaTypeDir}`
						);
				});
			}
		}
	} else {
		throw new Error(`EmulationStation-DE home config directory not found: ${esUserDir}`);
	}
};

module.exports = { options, api, help };
