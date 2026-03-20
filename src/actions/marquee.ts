// Adds or removes marquee tags from game entries and optionally delete marquee image files.
import path from 'path';
import fs from 'fs-extra';
import type { Opts } from 'minimist';
import type { APIOptions } from '../api-types.js';
import { update } from '../utils/gamelist.js';
import { relativeMediaPath, resolveMediaEnv, romBasename } from '../utils/media.js';

export const name = 'marquee';

export const options = {
  boolean: ['delete', 'quiet', 'help'] as const,
  alias: { d: 'delete', m: 'multi', q: 'quiet', h: 'help' }
} satisfies Opts; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} <state> [options]`);
  console.log();
  console.log('  Arguments');
  console.log('    state             State of whether use <marquee> tags with games');
  console.log('                          Either "enable" or "disable"');
  console.log();
  console.log('  Options');
  console.log('    -d, --delete      Delete marquee files when disabling');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

type MarqueeState = 'enable' | 'enabled' | 'disable' | 'disabled';

export const api = async (
  dir: string,
  { state = 'enable', delete: remove, quiet }: APIOptions<typeof options> & { state: MarqueeState }
) => {
  const { media, marquee } = resolveMediaEnv();
  const marqueeDir = path.join(dir, media, marquee);
  let logStart = '';
  switch (state) {
    case 'enable':
    case 'enabled': // common misspelling/alternative
      logStart = 'Added all detected marquee image metadata for';
      await update(dir, game => {
        if (game && game.path && game.path[0]) {
          const relMarquee = relativeMediaPath(media, marquee, romBasename(game.path[0]));
          if (fs.existsSync(path.join(dir, relMarquee))) game.marquee = [relMarquee];
        }
      });
      break;
    case 'disable':
    case 'disabled': // common misspelling/alternative
      await update(dir, game => {
        delete game.marquee;
      });
      if (remove && fs.existsSync(marqueeDir)) {
        fs.removeSync(marqueeDir);
        logStart = 'Removed marquee images and marquee metadata for';
      } else {
        logStart = 'Removed marquee metadata tags for';
      }
      break;
    default:
      throw new Error('Error: Invalid state. Must be either "enable" or "disable"');
  }
  if (!quiet) console.log(logStart, path.basename(dir), 'successfully');
};
