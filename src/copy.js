// Copies romset directory, with a variety of transformational options.
const path = require('path');
const fs = require('fs-extra');
const { api: setImageType } = require('./image-type');
const { api: removeVideo } = require('./remove-video');
const { api: unlock } = require('./unlock');

const options = {
	boolean: ['preserve', 'video', 'quiet', 'help'],
	string: ['image'],
	default: { preserve: true, video: true },
	alias: { i: 'image', pdf: 'manual', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist copy <destination> [options]');
	console.log();
	console.log('  Arguments');
	console.log('    destination       Path to copy the working directory to');
	console.log();
	console.log('  Options');
	console.log('    -i, --image       Copy a specific image type and update gamelist accordingly');
	console.log('    -pdf, --manual    Copy manual files');
	console.log('    --no-video        Skip copying snap video files');
	console.log('    --no-preserve     Disable preserving image path');
	console.log('                          All images will be place in media path directly');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const api = async function (
	dir,
	{ destination, image, preserve = true, manual: pdfs = false, video = true, quiet } = {}
) {
	const media = process.env.GAMELIST_MEDIA || 'media';
	const snap = process.env.GAMELIST_SNAP || 'snap';
	const manual = process.env.GAMELIST_MANUAL || 'manual';

	if (destination && fs.statSync(dir).isDirectory()) {
		destination = destination + ''; // ensure string
		const targets = fs
			.readdirSync(dir)
			.filter(
				e => (!image || e !== media) && path.resolve(destination) !== path.resolve(dir, e)
			);
		const mediaTypeTargets = [image, image && pdfs && manual, image && video && snap]
			.filter(Boolean)
			.map(d => path.join(media, d));
		fs.ensureDirSync(destination);
		targets
			.filter(e => !image || e !== media)
			.concat(mediaTypeTargets)
			.forEach(e => {
				let entry = path.join(dir, e);
				if (!fs.existsSync(entry)) return;
				if (fs.statSync(entry).isDirectory()) {
					let destinationDir = path.join(destination, e);
					if (image && !preserve && e == path.join(media, image))
						destinationDir = path.join(destination, media);
					fs.ensureDirSync(destinationDir);
					fs.copySync(entry, destinationDir);
				} else {
					fs.copySync(entry, path.join(destination, e));
				}
			});
		await unlock(destination, { quiet: true });
		if (image) await setImageType(destination, { type: preserve && image, quiet: true });
		if (!video) await removeVideo(destination, { quiet: true });
		if (!quiet) console.log('Copied to "' + path.resolve(destination) + '" successfully');
		return destination;
	}
};

module.exports = { options, api, help };
