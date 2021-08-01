// Sets gamelist.xml as readonly:false on Windows machines
const path = require('path');
const fs = require('fs-extra');
const fswin = require('fswin');

const options = {
	boolean: ['quiet', 'help'],
	alias: { m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist unlock [options]');
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
	if (process.platform === 'win32') {
		const xml = path.join(dir, 'gamelist.xml');
		if (fs.existsSync(xml)) {
			fswin.setAttributesSync(xml, { IS_READ_ONLY: false });
			if (!quiet) console.log('Unlocked gamelist.xml by removing readonly');
		}
	} else {
		throw new Error('Lock features only works on Windows currently.');
	}
};

module.exports = { options, api, help };
