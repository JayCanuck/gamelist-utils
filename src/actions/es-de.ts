// Symlinks gamelist.xml files to EmulationStation-DE gameslist locations
// May require admin/special privileges to symlink
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

export const name = 'es-de';

export const options = {
  boolean: ['quiet', 'help'],
  string: ['action', 'config'],
  default: { action: 'link' as const, config: path.join(os.homedir(), '.emulationstation') },
  alias: { a: 'action', c: 'config', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

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

interface ESDEOptions {
  action?: 'link' | 'move' | 'copy';
  config?: string;
  quiet?: boolean;
}

export const api = async (
  dir: string,
  { action = options.default.action, config = options.default.config, quiet }: ESDEOptions = {}
) => {
  const esConfigDir = path.resolve(config);
  const esConfigName = path.basename(config);
  const esMedia = process.env.ESDE_MEDIA || 'downloaded_media';
  const media = process.env.GAMELIST_MEDIA || 'media';
  const mediaPairs = [
    ['covers', process.env.GAMELIST_BOX2D || 'box2d'],
    ['3dboxes', process.env.GAMELIST_BOX3D || 'box3d'],
    ['miximages', process.env.GAMELIST_MIXED || 'mixed'],
    ['screenshots', process.env.GAMELIST_SCREENSHOT || 'screenshot'],
    ['videos', process.env.GAMELIST_SNAP || 'snap'],
    ['titlescreens', process.env.GAMELIST_TITLE || 'title'],
    ['marquees', process.env.GAMELIST_MARQUEE || 'wheel'],
    ['manuals', process.env.GAMELIST_MANUAL || 'manual']
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
