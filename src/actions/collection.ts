// Creates a rom collection
import path from 'path';
import fs from 'fs-extra';
import { Filter } from '../utils/filter';
import * as gamelist from '../utils/gamelist';
import * as system from '../utils/system';

export const name = 'collection';

export const options = {
  boolean: ['quiet', 'help'],
  string: ['filter', 'output', 'path'],
  alias: { f: 'filter', o: 'output', p: 'prefix', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} [options]`);
  console.log();
  console.log('  Options');
  console.log('    -f, --filter      Filter JSON file to use with the collection');
  console.log('    -o, --output      Output directory for the collection cfg file');
  console.log('                          (Defaults to cwd)');
  console.log('    -p, --prefix      ROM system root path containing the system directory');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

interface CollectionOptions {
  filter?: string;
  output?: string;
  prefix?: string;
  quiet?: boolean;
}

export const api = async (
  dirs: string[],
  { output, filter: filterFile, prefix, quiet }: CollectionOptions = {}
) => {
  const gameFilter = filterFile ? await Filter.load(filterFile) : undefined;
  const roms: string[] = [];

  await Promise.all(
    dirs.map(dir =>
      gamelist.forEach(dir, (game, provider) => {
        if (!gameFilter || (gameFilter && gameFilter.test(game, provider))) {
          if (game.path && game.path[0]) {
            let romFile = game.path[0];
            if (prefix) {
              romFile =
                prefix.replace(/[\\/]+/g, '/').replace(/\/$/, '') +
                '/' +
                path.basename(dir) +
                '/' +
                romFile.replace(/^\.\//, '');
            }
            roms.push(romFile);
          }
        }
      })
    )
  );

  let collectionName = filterFile
    ? 'custom-' + system.getName(path.basename(filterFile, path.extname(filterFile))) + '.cfg'
    : 'My ' + system.getName(path.basename(process.cwd())) + ' Collection';
  let outputPath = '';
  if (output && fs.existsSync(output) && fs.statSync(output).isDirectory()) {
    outputPath = output;
  } else if (output) {
    collectionName = output;
  }
  const cfgFile = path.join(outputPath, collectionName);
  fs.writeFileSync(cfgFile, roms.join('\n') + '\n', { encoding: 'utf8' });

  if (!quiet) console.log(`Wrote collection configuration file to: "${cfgFile}"`);
};
