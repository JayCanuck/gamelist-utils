// Converts a gamelist-based system to muOS format
import os from 'os';
import path from 'path';
import fs, { ensureDir } from 'fs-extra';
import type { Opts } from 'minimist';
import type { System } from 'muos';
import PQueue from 'p-queue';
import type { ResizeOptions } from 'sharp';
import sharp from 'sharp';
import type { APIOptions } from '../api-types.js';
import type { MediaImage } from '../gamelist-types.js';
import { fileSafeGameName, forEach as forEachGame } from '../utils/gamelist.js';
import { findCatalogue, systemLookup, updateAssign, updateFolder } from '../utils/muos.js';

export const name = 'muos';

export const options = {
  boolean: ['resize', 'composite', 'keep-name', 'assign', 'folder', 'quiet', 'help'] as const,
  string: ['boxart', 'preview', 'device', 'system', 'catalogue'] as const,
  default: {
    boxart: (process.env.GAMELIST_BOX3D || 'box3d') as MediaImage,
    preview: (process.env.GAMELIST_SCREENSHOT || 'screenshot') as MediaImage,
    device: '640x480'
  },
  alias: {
    b: 'boxart',
    p: 'preview',
    r: 'resize',
    d: 'device',
    x: 'composite',
    s: 'system',
    k: 'keep-name',
    c: 'catalogue',
    a: 'assign',
    f: 'folder',
    m: 'multi',
    q: 'quiet',
    h: 'help'
  }
} satisfies Opts; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} <destination> [options]`);
  console.log();
  console.log('  Arguments');
  console.log('    destination       Destination ROM directory for the target system');
  console.log('                      or root ROM directory when "multi" option is used');
  console.log();
  console.log('  Options');
  console.log('    -b, --boxart      Image type to use for box art');
  console.log('                          Defaults to "box3d"');
  console.log('    -p, --preview     Image type to use for preview');
  console.log('                          Defaults to "screenshot"');
  console.log('    -r, --resize      Resize images to optimal size for muOS device');
  console.log('    -d, --device      Device resolution to target for resizing');
  console.log('                          Defaults to "640x480" when omitted');
  console.log('    -x, --composite   Combine the box and preview images into a fullscreen');
  console.log('                          composite image for use as muOS boxart');
  console.log('    -k, -keep-name    Retain original filename rather that renaming');
  console.log('    -s, --system      Manually specify system name (ignored with "multi" option)');
  console.log('                          By default, when omitted, will attempt to resolve');
  console.log('                          automatically against commonly-known directory names');
  console.log('    -c, --catalogue   Manually specify muOS catalogue directory path');
  console.log('                          By default, when omitted, will attempt to resolve');
  console.log('                          automatically, relative to destination directory');
  console.log('    -a, --assign      Update muOS assign.json to include copied system(s)');
  console.log('    -f, --folder      Update muOS folder.json to include copied system(s)');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

export const api = async (
  dir: string,
  {
    destination,
    boxart = options.default.boxart,
    preview = options.default.preview,
    device = options.default.device,
    resize,
    composite,
    keepName,
    system,
    catalogue,
    assign,
    folder,
    quiet
  }: APIOptions<typeof options> & { destination: string }
) => {
  dir = path.resolve(dir);
  destination = path.resolve(destination);

  const [dWidth, dHeight] = device.split('x').map(d => parseInt(d));

  // System name validation
  const dirName = path.basename(destination);
  if (!system) system = systemLookup(dirName);
  if (!system) throw new Error(`Failed to automatically determine system name: ${dirName}`);

  // Catalogue path validation
  if (catalogue) catalogue = path.resolve(catalogue);
  else catalogue = findCatalogue(destination);
  if (!catalogue) throw new Error(`Failed to resolve MUOS catalogue directory`);

  // Validate gamelist.xml exists
  if (!fs.existsSync(path.join(dir, 'gamelist.xml'))) throw new Error('No gamelist.xml found');

  // Directories of importance
  const media = process.env.GAMELIST_MEDIA || 'media';
  const artworkSrcDirs = [path.join(dir, media, boxart), path.join(dir, media, preview)];
  const artworkTempDirs = [
    path.join(os.tmpdir(), 'gamelist-muos-img', 'box'),
    path.join(os.tmpdir(), 'gamelist-muos-img', 'preview')
  ];
  const artworkDestDirs = [
    path.join(catalogue, system, 'box'),
    path.join(catalogue, system, 'preview')
  ];
  const textSrcDir = path.join(os.tmpdir(), 'gamelist-muos-text');
  const textDestDir = path.join(catalogue, system, 'text');

  // Ensure relevant directories
  await ensureDir(destination);
  await ensureDir(textSrcDir);
  await Promise.all(artworkTempDirs.map(d => ensureDir(d)));
  await Promise.all(artworkDestDirs.map(d => ensureDir(d)));

  // preload boxart mask if composite is true
  let mask: Buffer;
  if (composite) {
    mask = await sharp(path.join(import.meta.dirname, '../../assets/muos-mask.png'))
      .resize({ width: dWidth, height: dHeight, fit: 'cover' })
      .ensureAlpha() // Ensure the mask has an alpha channel
      .toBuffer();
  }

  // Determine files to copy and their destinations
  const from: string[] = [];
  const to: string[] = [];
  await forEachGame(dir, async game => {
    const rom = game.path?.[0];

    if (rom) {
      const ext = path.extname(rom);
      const base = path.basename(rom, ext);
      const name = keepName ? base : fileSafeGameName(game) || base;
      const romFile = path.join(dir, rom);

      // add rom file to copy list
      from.push(romFile);
      if (/[/\\]/.test(rom)) fs.ensureDirSync(path.dirname(romFile));
      to.push(path.join(destination, name + ext));

      // add playlist files to copy list
      if (rom.endsWith('.m3u')) {
        const hidden = path.join(destination, '.hidden');
        fs.ensureDirSync(hidden);

        const playlist = fs
          .readFileSync(romFile, { encoding: 'utf8' })
          .split(/[\n\r]+/)
          .map(line => line.trim())
          .filter(Boolean);

        playlist.forEach(entry => {
          const playlistFile = path.join(dir, entry);
          if (!fs.existsSync(playlistFile)) throw new Error(`Invalid playlist entry in ${rom}`);
          fs.ensureDirSync(path.dirname(playlistFile));
          from.push(playlistFile);
          to.push(path.join(destination, entry));
        });
      }

      // add description text files to copy list
      const desc = game.desc?.[0];
      if (desc) {
        const descFile = path.join(textSrcDir, base + '.txt');
        // write to temp file so any playlist or other staging-level exceptions occur before
        // anything is written to the muOS device
        fs.writeFileSync(descFile, desc, { encoding: 'utf8' });
        from.push(descFile);
        to.push(path.join(textDestDir, name + '.txt'));
      }

      // add artwork files to copy list
      const ssFile = path.join(artworkSrcDirs[1]!, base + '.png');
      for (let i = 0; i < artworkSrcDirs.length; i++) {
        const artDir = artworkSrcDirs[i]!;
        const imgFile = path.join(artDir, base + '.png');
        if (fs.existsSync(imgFile)) {
          if (i === 0 && composite && fs.existsSync(ssFile)) {
            // Composite boxart made from a faded-opacity fullscreen preview and overlayed boxart
            const compositeFile = path.join(artworkTempDirs[i]!, name + '.png');
            await sharp(path.join(artworkSrcDirs[1]!, base + '.png'))
              .trim({ background: '#00000000', threshold: 0 })
              .resize({ width: dWidth!, height: dHeight!, fit: 'cover' })
              .composite([
                {
                  input: mask,
                  blend: 'dest-in' // Applies the alpha from the mask
                },
                {
                  input: await sharp(imgFile)
                    .trim({ background: '#00000000', threshold: 0 })
                    .resize({
                      position: 'center',
                      background: { r: 0, g: 0, b: 0, alpha: 0 },
                      fit: 'inside',
                      width: 280,
                      height: 260
                    })
                    .extend({
                      top: 40,
                      left: 20,
                      bottom: 40,
                      right: 20,
                      background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .toBuffer(),
                  gravity: 'southeast'
                }
              ])
              .toFile(compositeFile);
            from.push(compositeFile);
          } else if (resize) {
            const resizedFile = path.join(artworkTempDirs[i]!, name + '.png');
            const resizeParams: ResizeOptions = {
              position: 'center',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
              fit: 'inside'
            };
            let sharpImage = sharp(imgFile).trim({ background: '#00000000', threshold: 0 });
            if (i === 0) {
              // roughly half screen width, square, with padding
              sharpImage = sharpImage
                .resize({
                  ...resizeParams,
                  width: 280,
                  height: 260
                })
                .extend({
                  top: 40,
                  left: 20,
                  bottom: 40,
                  right: 20,
                  background: { r: 0, g: 0, b: 0, alpha: 0 }
                });
            } else {
              // maximum size of the muOS preview pane
              sharpImage = sharpImage.resize({
                ...resizeParams,
                width: 495,
                height: 255
              });
            }
            await sharpImage.toFile(resizedFile);
            from.push(resizedFile);
          } else {
            from.push(imgFile);
          }
          to.push(path.join(artworkDestDirs[i]!, name + '.png'));
        }
      }
    }
  });

  // sanity checks on lists
  if (from.length === 0) throw new Error('No files detected for copying');
  const duplicates = [...new Set(to.filter((item, i) => to.indexOf(item) !== i))];
  if (duplicates.length > 0) {
    throw new Error(
      'Duplicate file destinations, aborting. Check gamelist.xml for entries with duplicate ' +
        'names or use --keep-name flag.  Duplicates:\n' +
        duplicates.join('\n')
    );
  }

  // console log details
  if (!quiet) {
    console.log(`Copying directory ${dirName} in muOS format as system "${system}"`);
    console.log(`\tGame files: ${destination}`);
    console.log(`\tBoxart: ${artworkDestDirs[0]}`);
    console.log(`\tPreview: ${artworkDestDirs[1]}`);
    console.log(`\tDescriptions: ${textDestDir}`);
  }

  // copy targets to destination
  const queue = new PQueue({ concurrency: 8 });
  await Promise.all(from.map((entry, i) => queue.add(() => fs.copy(entry, to[i]!))));

  // update assign.json with system entry
  if (assign) {
    const assignFile = path.resolve(catalogue, '../assign.json');
    await updateAssign(assignFile, { [dirName]: system as System });
  }

  // update folder.json with system entry
  if (folder) {
    const folderFile = path.resolve(catalogue, '../name/folder.json');
    await updateFolder(folderFile, { [dirName]: system });
  }

  if (!quiet) console.log('Copied successfully');
};
