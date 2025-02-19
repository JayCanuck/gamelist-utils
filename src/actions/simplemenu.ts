// Converts an EmulationStation/ScreenScraper rom directory into one for SimpleMenu.
// https://github.com/fgl82/simplemenu
import path from 'path';
import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import { MediaImage } from '../gamelist-types';
import { api as copy } from './copy';

export const name = 'simplemenu';

export const options = {
  boolean: ['extract', 'quiet', 'help'],
  string: ['copy', 'image', 'filter'],
  default: { image: 'screenshot' as MediaImage },
  alias: { c: 'copy', e: 'extract', i: 'image', f: 'filter', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} [options]`);
  console.log();
  console.log('  Options');
  console.log('    -c, --copy        Copy resulting files to this destination path');
  console.log('    -e, --extract     Extract roms from zip files');
  console.log('                          Only works with single-file rom types');
  console.log('    -i, --image       Use specific image type');
  console.log('                          Defaults to "screenshot"');
  console.log('    -f, --filter      JSON file with preset include/exclude lists for filtering');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

interface SimpleMenuOptions {
  copy?: string;
  extract?: boolean;
  image?: MediaImage;
  filter?: string;
  quiet?: boolean;
}

export const api = async (
  dir: string,
  {
    copy: destination,
    extract,
    image = options.default.image,
    filter,
    quiet
  }: SimpleMenuOptions = {}
) => {
  if (destination)
    dir = await copy(dir, {
      destination,
      image,
      preserve: false,
      marquee: false,
      video: false,
      filter,
      quiet: true
    });

  // Remove unneeded image files; relocate desired images as appropriate
  const mediaPath = path.join(path.resolve(dir), process.env.GAMELIST_MEDIA || 'media');
  if (fs.existsSync(mediaPath) && fs.statSync(mediaPath).isDirectory()) {
    fs.readdirSync(mediaPath).forEach(e => {
      const entry = path.join(mediaPath, e);
      if (e === image) {
        fs.copySync(entry, mediaPath, { dereference: true });
        fs.removeSync(entry);
      } else if (fs.statSync(entry).isDirectory()) {
        fs.removeSync(entry);
      }
    });
  }

  // Extract roms if desired
  if (extract) {
    fs.readdirSync(dir)
      .map(e => path.join(dir, e))
      .filter(e => fs.statSync(e).isFile() && e.endsWith('.zip'))
      .forEach(f => {
        const zip = new AdmZip(f);
        const entries = zip.getEntries();
        if (entries.length === 1) {
          const ext = path.extname(entries[0].entryName);
          const base = path.basename(f, '.zip');
          zip.extractEntryTo(entries[0].entryName, dir, false, true, false, base + ext);
          fs.removeSync(f);
        }
      });
  }

  // Remove unneeded
  const xml = path.join(dir, 'gamelist.xml');
  if (fs.existsSync(xml)) fs.removeSync(xml);

  // Notify successful operation.
  if (!quiet) {
    console.log('Converted directory "' + path.resolve(dir) + '" for SimpleMenu file layout.');
  }
};
