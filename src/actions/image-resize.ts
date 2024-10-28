// Resizes image assets
import path from 'path';
import fs from 'fs-extra';
import sharp, { FitEnum } from 'sharp';
import { MediaImage } from '../gamelist-types';

export const name = 'image-resize';

export const options = {
  boolean: ['delete', 'quiet', 'help'],
  string: ['source', 'width', 'height', 'fit'],
  default: { width: '320', height: '320', 'fit': 'contain' as keyof FitEnum },
  alias: {
    iw: 'width',
    ih: 'height',
    m: 'multi',
    q: 'quiet',
    h: 'help'
  }
}; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} <type> [options]`);
  console.log();
  console.log('  Arguments');
  console.log('    type              Type of image to resize permanently');
  console.log();
  console.log('  Options');
  console.log('    -iw, --width      Image width to resize to');
  console.log('                          Defaults to 320');
  console.log('    -ih, --height    Image height to resize to');
  console.log('                          Defaults to 320');
  console.log('    -f, --fit         Object fit strategy type to apply when resizing');
  console.log('                          "cover", "contain", "fill", "inside" or "outside"');
  console.log('                          Defaults to "contain"');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

interface ImageResizeOptions {
  type: MediaImage;
  width?: string;
  height?: string;
  fit?: keyof FitEnum;
  quiet?: boolean;
}

export const api = async (
  dir: string,
  {
    type = 'box3d',
    width = options.default.width,
    height = options.default.height,
    fit = options.default.fit,
    quiet
  }: ImageResizeOptions
) => {
  const media = process.env.GAMELIST_MEDIA || 'media';
  const imageDir = path.join(dir, media, type);

  if (fs.existsSync(imageDir) && fs.statSync(imageDir).isDirectory()) {
    if (!quiet)
      console.log('Resizing image files within', path.join(path.basename(dir), media, type));

    const list = fs.readdirSync(imageDir).filter(f => f.endsWith('.png'));
    await Promise.allSettled(
      list.map(file => {
        const img = path.join(imageDir, file);
        return sharp(img)
          .resize({
            width: parseInt(width.replace(/px$/, '')),
            height: parseInt(height.replace(/px$/, '')),
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            fit
          })
          .toBuffer()
          .then(buff => {
            fs.writeFileSync(img, buff);
          })
          .catch(e => {
            console.log(`Failed to resize ./media/${type}/${file}`);
            console.log(e);
          });
      })
    );
    if (!quiet) console.log('\t...resized', list.length, 'images');
  } else {
    if (!quiet) console.log(`Nothing to resize: ./media/${type} not found`);
  }
};
