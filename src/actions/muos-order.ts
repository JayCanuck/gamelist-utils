// Reorders the muOS system list order by renaming ROM directories, along with
// corresponding folder art and assign.json
import path from 'path';
import fs from 'fs-extra';
import sortableList from 'inquirer-sortable-list';
import type { Opts } from 'minimist';
import type { System } from 'muos';
import type { APIOptions } from '../api-types.js';
import { findCatalogue, systemLookup, updateAssign } from '../utils/muos.js';

export const name = 'muos-order';

export const options = {
  boolean: ['overwrite', 'quiet', 'help'] as const,
  alias: {
    o: 'overwrite',
    m: 'multi',
    q: 'quiet',
    h: 'help'
  }
} satisfies Opts; // multi omitted as it can be string or boolean

export const help = (exitCode = 0) => {
  console.log('  Usage');
  console.log(`    gamelist ${name} [options]`);
  console.log();
  console.log('  Options');
  console.log('    -o, --overwrite   Overwrite any existing files with the new name');
  console.log('    -q, --quiet       Quiet console output');
  console.log('    -v, --version     Display version information');
  console.log('    -h, --help        Display help information');
  console.log();
  process.exit(exitCode);
};

export const api = async (dir: string, { overwrite, quiet }: APIOptions<typeof options> = {}) => {
  dir = path.resolve(dir);

  // System directories within target directory to order
  const systemDirs = fs
    .readdirSync(dir)
    .filter(e => fs.statSync(path.join(dir, e)))
    .sort();
  const dirNames = systemDirs.map(d => d.replace(/^\d+\s*/, ''));

  // Catalogue path
  const catalogue = findCatalogue(dir);
  if (!catalogue) throw new Error(`Failed to resolve MUOS catalogue directory`);

  // Path for assign.json
  const assignFile = path.resolve(catalogue, '../assign.json');

  const ordered = await sortableList({
    message: 'Sort the list of system as you prefer them to show up in muOS',
    choices: dirNames
  });

  if (ordered.every((s, i) => s === dirNames[i]))
    throw Error('Order identical to current directory struct. No reordering needed.');

  for (let i = 0; i < systemDirs.length; i++) {
    const from = systemDirs[i]!;
    const fromDir = path.join(dir, from);
    const dirName = dirNames[i]!;
    const to =
      String(ordered.indexOf(from) + 1).padStart(String(ordered.length).length, '0') +
      ' ' +
      dirName;
    const toDir = path.join(dir, to);

    // System name
    const system = systemLookup(dirName);
    if (!system) throw new Error(`Failed to automatically determine system name: ${dirName}`);

    if (from === to) {
      console.log(`Directory already named "${system}"`);
      return;
    }

    // Rename system ROM directory
    await fs.move(fromDir, toDir, { overwrite });

    // Rename folder catalogue files (boxart, preview, description)
    await Promise.all(
      (
        [
          ['box', '.png'],
          ['preview', '.png'],
          ['text', '.txt']
        ] as [string, string][]
      ).map(([type, ext]) => {
        const folderArtOld = path.join(catalogue, 'Folder', type, from + ext);
        const folderArtNew = path.join(catalogue, 'Folder', type, to + ext);
        if (fs.existsSync(folderArtOld)) {
          return fs.move(folderArtOld, folderArtNew, { overwrite });
        } else {
          return Promise.resolve();
        }
      })
    );

    // update assign.json with system entry
    if (fs.existsSync(assignFile)) {
      await updateAssign(assignFile, { [to.replace(/[\s_]+/g, '')]: system as System });
    } else {
      console.warn('assign.json not found, skipping updating of folder path');
    }

    if (!quiet) console.log(`\tReordered ${dirName} by renaming from "${from}" to "${to}"`);
  }

  if (!quiet) console.log(`Reordering completed`);
};
