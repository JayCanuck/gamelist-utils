// Resizes image assets
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

const options = {
	boolean: ['delete', 'quiet', 'help'],
	string: ['source', 'width', 'height', 'fit'],
	default: { width: '320', height: '320', 'fit': 'contain' },
	alias: {
		iw: 'width',
		ih: 'height',
		m: 'multi',
		q: 'quiet',
		h: 'help'
	}
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist image-resize <type> [options]');
	console.log();
	console.log('  Arguments');
	console.log('    type              Type of image to resize permanently');
	console.log();
	console.log('  Options');
	console.log('    -iw, --width      Image width to resize to');
	console.log('                          Defaults to 320');
	console.log('    -ih, --height    Image height to resize to');
	console.log('                          Defaults to 320');
	console.log('    -f, --fit         Object fit strategy type to apply when resizing');
	console.log('                          "cover", "contain", "fill", "inside" or "outside"');
	console.log('                          Defaults to "contain"');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (dir, { type = 'box3d', width, height, fit, quiet } = {}) {
	const media = process.env.GAMELIST_MEDIA || 'media';
	const imageDir = path.join(dir, media, type);

	if (fs.existsSync(imageDir) && fs.statSync(imageDir).isDirectory()) {
		if (!quiet)
			console.log('Resizing image files within', path.join(path.basename(dir), media, type));

		const list = fs.readdirSync(imageDir).filter(f => f.endsWith('.png'));
		await Promise.allSettled(
			list.map(file => {
				const img = path.join(imageDir, file);
				return sharp(img)
					.resize({
						width: width.replace(/px$/, '') * 1,
						height: height.replace(/px$/, '') * 1,
						background: { r: 0, g: 0, b: 0, alpha: 0 },
						fit
					})
					.toBuffer()
					.then(buff => {
						fs.writeFileSync(img, buff);
					})
					.catch(e => {
						console.log(`Failed to resize ./media/${type}/${file}`);
						console.log(e);
					});
			})
		);
		if (!quiet) console.log('\t...resized', list.length, 'images');
	} else {
		if (!quiet) console.log(`Nothing to resize: ./media/${type} not found`);
	}
};

module.exports = { options, api, help };
