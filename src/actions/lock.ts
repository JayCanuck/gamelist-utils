// Sets gamelist.xml as readonly:true on Windows machines
import path from 'path';
import fs from 'fs-extra';
import fswin from 'fswin';

export const name = 'lock';

export const options = {
  boolean: ['quiet', 'help'],
  alias: { m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} [options]`);
  console.log();
  console.log('  Options');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

interface LockOptions {
  quiet?: boolean;
}

export const api = async (dir: string, { quiet }: LockOptions = {}) => {
  if (process.platform === 'win32') {
    const xml = path.join(dir, 'gamelist.xml');
    if (fs.existsSync(xml)) {
      fswin.setAttributesSync(xml, { IS_READ_ONLY: true });
      if (!quiet) console.log('Locked gamelist.xml by setting readonly');
    }
  } else {
    throw new Error('Lock features only works on Windows currently.');
  }
};
