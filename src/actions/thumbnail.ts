// Adds or removes thumbnail tags from game entries and optionally generates/deletes thumbnail image files.
// Able to generate resized copies of assets for fast loading.
import path from 'path';
import fs from 'fs-extra';
import type { Opts } from 'minimist';
import type { FitEnum } from 'sharp';
import sharp from 'sharp';
import type { APIOptions } from '../api-types.js';
import { update } from '../utils/gamelist.js';
import { relativeMediaPath, resolveMediaEnv, romBasename } from '../utils/media.js';

export const name = 'thumbnail';

export const options = {
  boolean: ['delete', 'quiet', 'help'] as const,
  string: ['source', 'width', 'height', 'fit'] as const,
  default: { width: '320', height: '320', 'fit': 'contain' as keyof FitEnum },
  alias: {
    s: 'source',
    tw: 'width',
    th: 'height',
    d: 'delete',
    m: 'multi',
    q: 'quiet',
    h: 'help'
  }
} satisfies Opts; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} <state> [options]`);
  console.log();
  console.log('  Arguments');
  console.log('    state             State of whether use <thumbnail> tags with games');
  console.log('                          Either "enable" or "disable"');
  console.log();
  console.log('  Options');
  console.log('    -s, --source      Update source gamelist.xml with thumbnail values');
  console.log('    -tw, --width      Thumbnail width when generating from a source');
  console.log('                          Defaults to 320');
  console.log('    -th, --height     Thumbnail height when generating from a source');
  console.log('                          Defaults to 320');
  console.log('    -f, --fit         Object fit strategy type to apply when resizing');
  console.log('                          "cover", "contain", "fill", "inside" or "outside"');
  console.log('                          Defaults to "contain"');
  console.log('    -d, --delete      Delete thumbnail files when disabling');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

type ThumbnailState = 'enable' | 'enabled' | 'disable' | 'disabled';

export const api = async (
  dir: string,
  {
    state = 'enable',
    source,
    width = options.default.width,
    height = options.default.height,
    fit = options.default.fit,
    delete: remove,
    quiet
  }: APIOptions<typeof options> & { state: ThumbnailState }
) => {
  const { media } = resolveMediaEnv();
  const thumb = process.env.GAMELIST_THUMBNAIL || 'thumbnail';
  const thumbDir = path.join(dir, media, thumb);
  const generate: Record<'src' | 'dest', string>[] = [];
  let logStart = '';
  fs.ensureDirSync(thumbDir);
  switch (state) {
    case 'enable':
    case 'enabled': // common misspelling/alternative
      logStart = 'Added all detected thumbnail metadata for';
      await update(dir, game => {
        if (game && game.path && game.path[0]) {
          const relThumb = relativeMediaPath(media, thumb, romBasename(game.path[0]));
          const resolvedThumb = path.join(dir, relThumb);
          if (source) {
            const src = path.join(dir, media, source, path.basename(relThumb));
            if (fs.existsSync(src)) {
              generate.push({ src, dest: resolvedThumb });
              game.thumbnail = [relThumb];
            }
          }
          if (fs.existsSync(resolvedThumb)) game.thumbnail = [relThumb];
        }
      });
      for (let i = 0; i < generate.length; i++) {
        const { src, dest } = generate[i]!;
        console.log(src, dest);
        await sharp(src)
          .resize({
            width: parseInt(width.replace(/px$/, '')),
            height: parseInt(height.replace(/px$/, '')),
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            fit
          })
          .toFile(dest);
      }
      break;
    case 'disable':
    case 'disabled': // common misspelling/alternative
      await update(dir, game => {
        delete game.video;
      });
      if (remove && fs.existsSync(thumbDir)) {
        fs.removeSync(thumbDir);
        logStart = 'Removed thumbnails and thumbnail metadata for';
      } else {
        logStart = 'Removed thumbnail metadata tags for';
      }
      break;
    default:
      throw new Error('Invalid state. Must be either "enable" or "disable"');
  }
  if (!quiet) console.log(logStart, path.basename(dir), 'successfully');
};
