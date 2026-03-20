#!/usr/bin/env node

'use strict';

import path from 'path';
import camelize from 'camelize';
import fs from 'fs-extra';
import minimist, { type ParsedArgs } from 'minimist';
import * as gamelistUtils from './index.js';

interface Action {
  name: string;
  options: minimist.Opts;
  help: (code?: number) => void;
  api: (target: string | string[], opts: Record<string, unknown>) => Promise<unknown>;
}

// Uncaught error handler
process.on('uncaughtException', err => console.error(err.message || err));

// Map available APIs to their action names
const actionMap = (Object.keys(gamelistUtils) as (keyof typeof gamelistUtils)[]).reduce(
  (acc, key) => {
    // eslint-disable-next-line import/namespace
    acc[gamelistUtils[key].name] = gamelistUtils[key] as Action;

    return acc;
  },
  {} as Record<string, Action>
);

// Detect action
const actionArg = process.argv[2];
const action = actionArg ? actionMap[actionArg] : undefined;

// CLI version query
const packageJson = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '../package.json'), { encoding: 'utf8' })
);
if (actionArg === '-v' || actionArg === '--version') {
  console.log('gamelist-utils');
  console.log('    Version ' + packageJson.version);
  process.exit(0);
}

// Invalid/missing action, display CLI help
if (!action) {
  if (actionArg !== '-h' && actionArg !== '--help') {
    console.log('Error: action unknown.');
    console.log();
  }
  console.log('  Usage');
  console.log('    gamelist <action> [...]');
  console.log();
  console.log('  Arguments');
  console.log('    action            One of the following:');
  Object.keys(actionMap).forEach(a => {
    console.log(' '.repeat(26) + a);
  });
  console.log();
  console.log("  Refer to each action's --help for more details.");
  console.log();
  process.exit(0);
}

// Parse arguments
const { _: args, ...parsedOpts } = minimist(process.argv.slice(2), action.options);
const params: ParsedArgs = { _: args, ...camelize(parsedOpts) };

// Resolve target(s)
let targets = [process.cwd()];
if (params.multi) {
  targets = fs
    .readdirSync(targets[0]!)
    .filter(e => [true, 'all'].includes(params.multi) || params.multi.split(',').includes(e))
    .map(e => path.join(targets[0]!, e))
    .filter(e => fs.statSync(e).isDirectory());
}

(async () => {
  // Handle action-specific help
  if (params.help) action.help();

  // Execute action on target(s)
  for (let i = 0; i < targets.length; i++) {
    let target: string | string[] = targets[i]!;
    if (!params.quiet && targets.length > 1 && action.name !== 'collection')
      console.log('Handling:', target);

    // Special cases adding dynamic options
    switch (action.name) {
      case 'muos':
        if (params.multi) delete params.system;
        if (!params.multi) {
          params.destination = params._[1];
        } else {
          const sys = path.basename(target as string);
          params.destination = path.join(params._[1]!, sys);
        }
        break;
      case 'onion':
      case 'copy':
        if (!params.multi) {
          params.destination = params._[1];
        } else {
          const sys = path.basename(target as string);
          params.destination = path.join(params._[1]!, sys);
        }
        break;
      case 'collection':
        // collections uses the multiple targets themselves as a parameter
        target = targets.splice(0, targets.length);
        break;
      case 'retroarch':
        // retroarch linking is global with argument as target
        target = params._[1]!;
        targets = [target as string];
        break;
      case 'folder':
        params.task = params._[1];
        params.folder = params._[2];
        break;
      case 'image-type':
      case 'image-resize':
        params.type = params._[1];
        break;
      case 'thumbnail':
      case 'marquee':
      case 'video':
      default:
        params.state = params._[1];
    }
    // Invoke API
    try {
      await action.api(target, params);
    } catch (e) {
      console.error('ERROR:', (e as Error).message || e);
      console.log(e);
    }

    if (!params.quiet && targets.length > 1) console.log();
  }
})();
