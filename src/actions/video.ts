// Adds or removes video tags from game entries and optionally delete video files.
import path from 'path';
import fs from 'fs-extra';
import type { Opts } from 'minimist';
import type { APIOptions } from '../api-types.js';
import { update } from '../utils/gamelist.js';
import { relativeMediaPath, resolveMediaEnv, romBasename } from '../utils/media.js';

export const name = 'video';

export const options = {
  boolean: ['delete', 'quiet', 'help'] as const,
  alias: { d: 'delete', m: 'multi', q: 'quiet', h: 'help' }
} satisfies Opts; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} <state> [options]`);
  console.log();
  console.log('  Arguments');
  console.log('    state             State of whether use <video> tags with games');
  console.log('                          Either "enable" or "disable"');
  console.log();
  console.log('  Options');
  console.log('    -d, --delete      Delete video files when disabling');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

type VideoState = 'enable' | 'enabled' | 'disable' | 'disabled';

export const api = async (
  dir: string,
  { state = 'enable', delete: remove, quiet }: APIOptions<typeof options> & { state: VideoState }
) => {
  const { media, snap } = resolveMediaEnv();
  const snapDir = path.join(dir, media, snap);
  let logStart = '';
  switch (state) {
    case 'enable':
    case 'enabled': // common misspelling/alternative
      logStart = 'Added all detected video metadata for';
      await update(dir, game => {
        if (game && game.path && game.path[0]) {
          const relVideo = relativeMediaPath(media, snap, romBasename(game.path[0]), '.mp4');
          if (fs.existsSync(path.join(dir, relVideo))) game.video = [relVideo];
        }
      });
      break;
    case 'disable':
    case 'disabled': // common misspelling/alternative
      await update(dir, game => {
        delete game.video;
      });
      if (remove && fs.existsSync(snapDir)) {
        fs.removeSync(snapDir);
        logStart = 'Removed videos and video metadata for';
      } else {
        logStart = 'Removed video metadata tags for';
      }
      break;
    default:
      throw new Error('Invalid state. Must be either "enable" or "disable"');
  }
  if (!quiet) console.log(logStart, path.basename(dir), 'successfully');
};
