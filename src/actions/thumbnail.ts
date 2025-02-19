// Adds or removes thumbnail tags from game entries and optionally generates/deletes thumbnail image files.
// Able to generate resized copies of assets for fast loading.
import path from 'path';
import fs from 'fs-extra';
import sharp, { FitEnum } from 'sharp';
import { update } from '../utils/gamelist';

export const name = 'thumbnail';

export const options = {
  boolean: ['delete', 'quiet', 'help'],
  string: ['source', 'width', 'height', 'fit'],
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
}; // multi omitted as it can be string or boolean

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

interface ThumbnailOptions {
  state: 'enable' | 'enabled' | 'disable' | 'disabled';
  source?: string;
  width?: string;
  height?: string;
  fit?: keyof FitEnum;
  delete?: boolean;
  quiet?: boolean;
}

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
  }: ThumbnailOptions
) => {
  const media = process.env.GAMELIST_MEDIA || 'media';
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
          const rom = game.path[0].replace(/^\.\//, '');
          const relThumb =
            './' +
            path
              .join(media, thumb, path.basename(rom, path.extname(rom)) + '.png')
              .replace(/[\\/]+/g, '/');
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
        const { src, dest } = generate[i];
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
