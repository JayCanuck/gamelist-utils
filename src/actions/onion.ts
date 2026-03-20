// Converts a gamelist-based system to muOS format
import path from 'path';
import fs from 'fs-extra';
import type { Opts } from 'minimist';
import PQueue from 'p-queue';
import sharp from 'sharp';
import type { APIOptions } from '../api-types.js';
import type { GameList, MediaImage } from '../gamelist-types.js';
import { read as readGamelist } from '../utils/gamelist.js';
import { convertToMiyooGamelist, write as writeMiyooGamelist } from '../utils/onion.js';

export const name = 'onion';

export const options = {
  boolean: ['quiet', 'help'] as const,
  string: ['image'] as const,
  default: {
    image: (process.env.GAMELIST_BOX2D || 'box2d') as MediaImage
  },
  alias: {
    i: 'image',
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
  console.log('    -i, --image       Image type to use for preview');
  console.log('                          Defaults to "box2d"');
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
    image = options.default.image,
    quiet
  }: APIOptions<typeof options> & { destination: string }
) => {
  dir = path.resolve(dir);
  destination = path.resolve(destination);
  const media = process.env.GAMELIST_MEDIA || 'media';

  // Validate gamelist.xml exists
  if (!fs.existsSync(path.join(dir, 'gamelist.xml'))) throw new Error('No gamelist.xml found');

  // Read GameList
  const data = (await readGamelist(dir)).data as GameList;

  // update gamelist image type
  data.gameList?.game?.forEach(game => {
    if (game?.path?.[0]) {
      const name = path.basename(game.path[0], path.extname(game.path[0]));
      const imageRel = path.join(media, image, name + '.png');
      if (fs.existsSync(path.resolve(dir, imageRel))) {
        game.image = [`./${media}/${image}/${name}.png`];
      } else {
        delete game?.image;
      }
    }
  });

  // Convert to OnionOS-style and determine files to copy and their destinations
  const converted = convertToMiyooGamelist(dir, data);

  // update image path to OnionOS style destination paths
  converted.data.gameList.game.forEach(game => {
    if (game?.image?.[0]) {
      game.image[0] = game?.image?.[0].replace(`${media}/${image}`, 'Imgs');
    }
  });

  const imageDir = path.resolve(dir, media, image);
  const from = converted.files.filter(file => !file.startsWith(imageDir));
  const to = from.map(file => file.replace(dir, destination));
  const imgFilesFrom = converted.files.filter(file => file.startsWith(imageDir));
  const imgFilesTo = imgFilesFrom.map(file =>
    path.resolve(destination, 'Imgs', path.basename(file))
  );

  // console log details
  if (!quiet) {
    const dirName = path.basename(dir);
    console.log(`Copying system ${dirName} in OnionOS format to ${destination}"`);
  }

  // copy non-image targets to destination
  const queue = new PQueue({ concurrency: 8 });
  await Promise.all(
    from.map((entry, i) =>
      queue.add(async () => {
        await fs.ensureDir(path.dirname(to[i]!));
        await fs.copy(entry, to[i]!);
      })
    )
  );

  // copy resized images for optimum OnionOS display/speed
  await Promise.all(
    imgFilesFrom.map((entry, i) =>
      queue.add(async () => {
        await fs.ensureDir(path.dirname(imgFilesTo[i]!));
        await sharp(entry).resize(250, 360, { fit: 'inside' }).toFile(imgFilesTo[i]!);
      })
    )
  );

  // write miyoogamelist.xml
  if (!quiet) console.log('Writing miyoogamelist.xml');
  writeMiyooGamelist(path.join(destination, 'miyoogamelist.xml'), converted.data);

  if (!quiet) console.log('Copied successfully');
};
