// Simplifies a gamelist.xml for minimal or low-powered systems
// Helps remove bulky, unneeded, and unused metadata and files.
import path from 'path';
import fs from 'fs-extra';
import { update } from '../utils/gamelist';

export const name = 'simplify';

export const options = {
  boolean: ['keep-desc', 'quiet', 'help'],
  string: ['copy', 'image'],
  default: { unused: true, video: true },
  alias: { k: 'keep-desc', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} [options]`);
  console.log();
  console.log('  Options');
  console.log('    -k, --keep-desc   Keep description value, which is normally removed');
  console.log('    --no-unused       Delete any unused media asset files');
  console.log('    --no-video        Remove video values in xml and delete video files');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

interface SimplifyOptions {
  'keep-desc'?: boolean;
  unused?: boolean;
  video?: boolean;
  quiet?: boolean;
}

export const api = async (
  dir: string,
  { 'keep-desc': keepDesc, unused, video, quiet }: SimplifyOptions = {}
) => {
  const media = process.env.GAMELIST_MEDIA || 'media';
  const snap = process.env.GAMELIST_SNAP || 'snap';
  const mediaPath = path.join(dir, media);
  const snapDir = path.join(dir, media, snap);
  const usedMedia: string[] = [];
  await update(dir, game => {
    if (!keepDesc) delete game.desc;
    if (game.image && game.image[0]) {
      usedMedia.push(path.join(dir, game.image[0]));
    }
    if (game.marquee && game.marquee[0]) {
      usedMedia.push(path.join(dir, game.marquee[0]));
    }
    if (video === false) {
      delete game.video;
    } else if (game.video && game.video[0]) {
      usedMedia.push(path.join(dir, game.video[0]));
    }
  });
  if (unused === false) {
    fs.readdirSync(mediaPath)
      .filter(e => fs.statSync(path.join(mediaPath, e)).isDirectory())
      .forEach(cat => {
        const remaining = fs.readdirSync(path.join(mediaPath, cat)).filter(f => {
          const file = path.join(mediaPath, cat, f);
          if (!usedMedia.includes(file)) {
            fs.removeSync(file);
            return false;
          }
          return true;
        });
        if (remaining.length === 0) fs.removeSync(path.join(mediaPath, cat));
      });
  }
  if (video === false && fs.existsSync(snapDir)) fs.removeSync(snapDir);
  if (!quiet) console.log('Simplified metadata for', path.basename(dir), 'successfully');
};
