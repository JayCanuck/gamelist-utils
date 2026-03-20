// Copies romset directory, with a variety of transformational options.
import path from 'path';
import fs from 'fs-extra';
import type { Opts } from 'minimist';
import PQueue from 'p-queue';
import type { APIOptions } from '../api-types.js';
import type { MediaImage } from '../gamelist-types.js';
import { Filter } from '../utils/filter.js';
import * as gamelist from '../utils/gamelist.js';
import { resolveMediaEnv } from '../utils/media.js';
import { api as setImageType } from './image-type.js';
import { api as unlock } from './unlock.js';
import { api as updateVideo } from './video.js';

export const name = 'copy';

export const options = {
  boolean: ['preserve', 'marquee', 'video', 'quiet', 'help'] as const,
  string: ['image', 'filter'] as const,
  default: {
    preserve: true,
    manual: false,
    marquee: true,
    video: true,
    image: undefined as MediaImage | undefined
  },
  alias: { i: 'image', pdf: 'manual', f: 'filter', m: 'multi', q: 'quiet', h: 'help' }
} satisfies Opts; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} <destination> [options]`);
  console.log();
  console.log('  Arguments');
  console.log('    destination       Path to copy the working directory to');
  console.log();
  console.log('  Options');
  console.log('    -i, --image       Copy a specific image type and update gamelist accordingly');
  console.log('    -pdf, --manual    Copy manual files');
  console.log('    --no-marquee      Skip copying marquee image files');
  console.log('    --no-video        Skip copying snap video files');
  console.log('    --no-preserve     Disable preserving image path');
  console.log('                          All images will be place in media path directly');
  console.log('    -f, --filter      JSON file with preset include/exclude lists for filtering');
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
    image,
    preserve = options.default.preserve,
    manual: pdfs = options.default.manual,
    marquee = options.default.marquee,
    video = options.default.video,
    filter: filterFile,
    quiet
  }: APIOptions<typeof options> & { destination: string }
) => {
  const xml = 'gamelist.xml';
  const { media, marquee: wheel, snap, manual } = resolveMediaEnv();
  const gameFilter = filterFile ? await Filter.load(filterFile) : undefined;

  if (destination && fs.statSync(dir).isDirectory()) {
    destination = destination + ''; // ensure string

    // Ensure destination directory exists
    fs.ensureDirSync(destination);

    // Create updated gamelist.xml with filtered games removed and catalog ignored game files
    // Updated gamelist.xml is saved directly to the destination directory
    const ignoredNames: string[] = [];
    const ignoredROMs: string[] = [];
    const { data, provider } = await gamelist.read(dir);
    if (data && data.gameList && data.gameList.game && Array.isArray(data.gameList.game)) {
      for (let i = 0; i < data.gameList.game.length; i++) {
        const game = data.gameList.game[i];
        if (game && game.path && game.path[0]) {
          if (gameFilter && !gameFilter.test(game, provider)) {
            // Remove from gamelist.xml
            data.gameList.game.splice(i, 1);

            // Add to ignored list
            const rom = game.path[0].replace(/\.\//, '');
            ignoredROMs.push(path.resolve(dir, rom));
            ignoredNames.push(path.basename(rom, path.extname(rom)));

            i--;
          }
        }
      }
      await gamelist.write(path.join(destination, xml), data); // save directly to destination
    }

    // fs-extra `copy` filter function, filtering out the detected games (and their assets)
    const mResolved = path.resolve(dir, media);
    const copyHandler = (src: string) => {
      if (!gameFilter || fs.statSync(src).isDirectory()) return true;
      const sResolved = path.resolve(src);
      if (sResolved.startsWith(mResolved + path.sep)) {
        // skip copying media files for games that were ignored by the filter
        const sName = path.basename(sResolved, path.extname(sResolved));
        return !ignoredNames.includes(sName);
      } else {
        // skip copying rom files that were ignored by the filter
        return !ignoredROMs.includes(sResolved);
      }
    };

    // Detect file/dir targets within the source path, except media
    const targets = fs
      .readdirSync(dir)
      .filter(e => e !== media && e !== xml && path.resolve(destination) !== path.resolve(dir, e));

    // Detect file/dir targets within media path
    const mediaPath = path.join(dir, media);
    const mediaTargets = (fs.existsSync(mediaPath) ? fs.readdirSync(mediaPath) : [])
      .filter(e => {
        switch (e) {
          case image:
            return !image || fs.statSync(path.join(mediaPath, image)).isDirectory();
          case manual:
            return Boolean(pdfs);
          case wheel:
            return Boolean(marquee);
          case snap:
            return Boolean(video);
          default:
            return !image || fs.statSync(path.join(mediaPath, image)).isFile();
        }
      })
      .map(d => path.join(media, d));

    // Copy targets to destination
    const queue = new PQueue({ concurrency: 8 });
    await Promise.all(
      targets
        .concat(mediaTargets)
        .map(e => {
          const entry = path.join(dir, e);
          if (!fs.existsSync(entry)) return;
          if (fs.statSync(entry).isDirectory()) {
            let destinationDir = path.join(destination, e);
            if (image && !preserve && e == path.join(media, image))
              destinationDir = path.join(destination, media);
            fs.ensureDirSync(destinationDir);
            return queue.add(() => fs.copy(entry, destinationDir, { filter: copyHandler }));
          } else {
            return queue.add(() =>
              fs.copy(entry, path.join(destination, e), { filter: copyHandler })
            );
          }
        })
        .filter(Boolean)
    );

    // Post-copy actions
    await unlock(destination, { quiet: true });
    if (image && preserve) await setImageType(destination, { type: image, quiet: true });
    if (!video) await updateVideo(destination, { state: 'disable', quiet: true });
    if (!quiet) console.log('Copied to "' + path.resolve(destination) + '" successfully');
    return destination;
  } else {
    throw new Error('Destination path does not exist');
  }
};
