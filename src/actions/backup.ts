// Backs up gamelist.xml files
import path from 'path';
import fs from 'fs-extra';

export const name = 'backup';

export const options = {
  boolean: ['quiet', 'help'],
  string: ['ext'],
  default: { ext: '.bak' },
  alias: { e: 'ext', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} [options]`);
  console.log();
  console.log('  Options');
  console.log('    -e, --ext         Use custom file extension for backups');
  console.log('                          Defaults to ".bak"');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -m, --multi       Target subdirectories instead of working directory');
  console.log('                          Comma-separated list or "all" for all');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

interface BackupOptions {
  ext?: string;
  quiet?: boolean;
}

export const api = async (
  dir: string,
  { ext = options.default.ext, quiet }: BackupOptions = { ext: options.default.ext }
) => {
  const xml = path.join(dir, 'gamelist.xml');
  if (fs.existsSync(xml)) {
    fs.copySync(xml, xml + ext);
    if (!quiet) console.log(`Backed up gamelist to "${xml + ext}"`);
  }
};
