// Symlinks gamelist.xml files to EmulationStation-DE gameslist locations
// May require admin/special privileges to symlink
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import type { Opts } from 'minimist';
import type { APIOptions } from '../api-types.js';
import { resolveMediaEnv } from '../utils/media.js';

export const name = 'es-de';

type ESDEAction = 'link' | 'move' | 'copy';

export const options = {
  boolean: ['quiet', 'help'] as const,
  string: ['action', 'config'] as const,
  default: { action: 'link' as ESDEAction, config: path.join(os.homedir(), '.emulationstation') },
  alias: { a: 'action', c: 'config', m: 'multi', q: 'quiet', h: 'help' }
} satisfies Opts; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} [options]`);
  console.log();
  console.log('  Options');
  console.log('    -a, --action      Action to apply to gamelist.xml and assets');
  console.log('                          One of: link, move, copy');
  console.log('                          Default to "link"');
  console.log('    -c, --config      ES-DE config directory path');
  console.log('                          Default to "~/.emulationstation"');
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
    action = options.default.action,
    config = options.default.config,
    quiet
  }: APIOptions<typeof options> = {}
) => {
  const esConfigDir = path.resolve(config);
  const esConfigName = path.basename(config);
  const esMedia = process.env.ESDE_MEDIA || 'downloaded_media';
  const env = resolveMediaEnv();
  const { media } = env;
  const mediaPairs: [string, string][] = [
    ['covers', env.box2d],
    ['3dboxes', env.box3d],
    ['miximages', env.mixed],
    ['screenshots', env.screenshot],
    ['videos', env.snap],
    ['titlescreens', env.title],
    ['marquees', env.marquee],
    ['manuals', env.manual]
  ];

  fs.ensureDirSync(esConfigDir);
  const xml = path.join(dir, 'gamelist.xml');
  const system = path.basename(dir);
  const mediaDir = path.join(dir, media);

  switch (action) {
    case 'link':
      if (!quiet) console.log(`Linking ${system} metadata`);
      break;
    case 'move':
      if (!quiet) console.log(`Moving ${system} metadata`);
      break;
    case 'copy':
      if (!quiet) console.log(`Copying ${system} metadata`);
      break;
    default:
      console.error('Invalid action type\n');
      help(1);
  }

  // handle gamelist.xml
  if (fs.existsSync(xml)) {
    const esGamelistDir = path.join(esConfigDir, 'gamelists', system);
    const linkXml = path.join(esGamelistDir, 'gamelist.xml');

    fs.ensureDirSync(esGamelistDir);

    fs.removeSync(linkXml);
    switch (action) {
      case 'link':
        fs.symlinkSync(xml, linkXml);
        if (!quiet)
          console.log(
            `\t${system}/gamelist.xml <==> ${esConfigName}/gamelists/${system}/gamelist.xml`
          );
        break;
      case 'move':
        fs.renameSync(xml, linkXml);
        if (!quiet)
          console.log(
            `\t${system}/gamelist.xml > ${esConfigName}/gamelists/${system}/gamelist.xml`
          );
        break;
      case 'copy':
        fs.copySync(xml, linkXml);
        if (!quiet)
          console.log(
            `\t${system}/gamelist.xml >> ${esConfigName}/gamelists/${system}/gamelist.xml`
          );
    }
  }

  // handle media files
  if (fs.existsSync(mediaDir)) {
    const esDownloadedMediaDir = path.join(esConfigDir, esMedia, system);
    fs.ensureDirSync(esDownloadedMediaDir);
    mediaPairs.forEach(([esMediaTypeDir, mediaTypeDir]) => {
      const resolvedEsMediaTypeDir = path.join(esDownloadedMediaDir, esMediaTypeDir);
      const resolvedMediaTypeDir = path.join(mediaDir, mediaTypeDir);

      // handle media type
      if (fs.existsSync(resolvedMediaTypeDir)) {
        fs.removeSync(resolvedEsMediaTypeDir);
        switch (action) {
          case 'link':
            fs.symlinkSync(resolvedMediaTypeDir, resolvedEsMediaTypeDir);
            if (!quiet)
              console.log(
                `\t${system}/media/${mediaTypeDir} <==> ${esConfigName}/${esMedia}/${system}/${esMediaTypeDir}`
              );
            break;
          case 'move':
            fs.renameSync(resolvedMediaTypeDir, resolvedEsMediaTypeDir);
            if (!quiet)
              console.log(
                `\t${system}/media/${mediaTypeDir} > ${esConfigName}/${esMedia}/${system}/${esMediaTypeDir}`
              );
            break;
          case 'copy':
            fs.ensureDirSync(resolvedEsMediaTypeDir);
            fs.copySync(resolvedMediaTypeDir, resolvedEsMediaTypeDir);
            if (!quiet)
              console.log(
                `\t${system}/media/${mediaTypeDir} >> ${esConfigName}/${esMedia}/${system}/${esMediaTypeDir}`
              );
        }
      }
    });

    if (fs.readdirSync(mediaDir).length === 0) {
      fs.removeSync(mediaDir);
    }
  }
};
