import path from 'path';
import { pathToFileURL } from 'url';
import fs from 'fs-extra';
import JSON5 from 'json5';
import type { Entry, Field, Provider } from '../gamelist-types.js';

const getValue = (game: Entry, field: Field | string) =>
  Array.isArray(game[field]) ? game[field][0] : game[field];
const getMeta = (game: Entry, field: Field | string) => game.$?.[field];
const normalizePath = (file: string) => file.replace(/^\.\//, '');
const testcase = (
  game: Entry,
  provider: Provider,
  criteria: Record<string, string>,
  polarity: boolean
) =>
  Object.keys(criteria).every(key => {
    if (['comment', 'comments'].includes(key)) return true; // ignore comments
    if (key === 'system') {
      return !provider || (criteria[key] === provider.system?.[0]) === polarity;
    } else if (key === 'id') {
      const gameID = getMeta(game, 'id');
      return gameID && (criteria[key] === gameID) === polarity;
    } else if (key === 'path' || key === 'file') {
      const value = getValue(game, 'path');
      return (
        value &&
        (normalizePath((criteria?.path || '').toLowerCase()) ===
          normalizePath(value.toLowerCase())) ===
          polarity
      );
    } else if (key.endsWith('Contains')) {
      const value = (getValue(game, key.replace('Contains', '')) || '').toLowerCase();
      return value && value.includes(criteria[key]!.toLowerCase()) === polarity;
    } else {
      const value = getValue(game, key);
      return value && (criteria[key]!.toLowerCase() === value.toLowerCase()) === polarity;
    }
  });

interface FilterData {
  include?: Record<string, string>[];
  exclude?: Record<string, string>[];
}

export class Filter {
  data: FilterData;

  constructor(value: FilterData) {
    this.data = value;
  }

  test(game: Entry, provider: Provider) {
    if (
      this.data.include &&
      !this.data.include.some(criteria => testcase(game, provider, criteria, true))
    )
      return false;
    if (
      this.data.exclude &&
      !this.data.exclude.every(criteria => testcase(game, provider, criteria, false))
    )
      return false;
    return true;
  }

  static async load(file: string) {
    const resolvedPath = path.resolve(file);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Filter file not found: ${file}`);
    }

    let value: FilterData;

    if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs')) {
      const script = await import(pathToFileURL(resolvedPath).href);
      value = script.default || script;
    } else {
      try {
        value = JSON5.parse(fs.readFileSync(resolvedPath, { encoding: 'utf8' }));
      } catch (e) {
        throw new Error(`Failed to parse filter file: ${file}`, { cause: e });
      }
    }

    return new Filter(value);
  }
}
