#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs-extra');
const minimist = require('minimist');
const gamelistUtils = require('..');

// Uncaught error handler
process.on('uncaughtException', err => console.error(err.message || err));

// Detect action string
const action = process.argv[2];

// Invalid/missing action, display CLI help
if (!action || action.startsWith('-') || !gamelistUtils[action]) {
	console.log('Error: action unknown.');
	console.log();
	console.log('  Usage');
	console.log('    gamelist <action> [...]');
	console.log();
	console.log('  Arguments');
	console.log('    action            One of the following:');
	Object.keys(gamelistUtils).forEach(a => {
		console.log(' '.repeat(26) + a);
	});
	console.log();
	console.log("  Refer to each action's --help for more details.");
	console.log();
	process.exit(0);
}

// Parse arguments
const args = minimist(process.argv.slice(2), require(`../src/${action}`).options);

// CLI version query
if (args.vesion) {
	console.log('gamelist-utils');
	console.log('    Version ' + require('../package.json').version);
	process.exit(0);
}

// Resolve target(s)
let targets = [process.cwd()];
if (args.multi) {
	targets = fs
		.readdirSync(targets[0])
		.filter(e => [true, 'all'].includes(args.multi) || args.multi.split(',').includes(e))
		.map(e => path.join(targets[0], e))
		.filter(e => fs.statSync(e).isDirectory());
}

(async () => {
	// Handle action-specific help
	if (args.help) require(`../src/${action}`).help();

	// Execute action on target(s)
	for (let i = 0; i < targets.length; i++) {
		let target = targets[i];
		if (!args.quiet && targets.length > 1 && action !== 'collection')
			console.log('Handling:', target);

		// Special cases adding dynamic options
		switch (action) {
			case 'copy':
				if (targets.length === 1) {
					args.destination = args._[1];
				} else {
					const sys = path.basename(target);
					args.destination = path.join(args._[1], sys);
				}
				break;
			case 'collection':
				// collections uses the multiple targets themselves as a parameter
				target = targets.splice(0, targets.length);
				break;
			case 'retroarch':
				// retroarch linking is global with argument as target
				target = args._[1];
				targets = [target];
				break;
			case 'folder':
				args.task = args._[1];
				args.folder = args._[2];
				break;
			case 'image-type':
			case 'image-resize':
				args.type = args._[1];
				break;
			case 'thumbnail':
			case 'marquee':
			case 'video':
			default:
				args.state = args._[1];
		}
		// Invoke API
		try {
			await gamelistUtils[action](target, args);
		} catch (e) {
			console.error('ERROR:', e.message || e);
		}

		if (!args.quiet && targets.length > 1) console.log();
	}
})();
