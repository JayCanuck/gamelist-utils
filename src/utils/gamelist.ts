import path from 'path';
import fs from 'fs-extra';
import { Builder, Parser } from 'xml2js';
import { Entry, GameList, GameListEnsured, Provider } from '../gamelist-types';

export const find = function (filepath: string): string | null {
  filepath = path.resolve(filepath);
  if (fs.statSync(filepath).isFile()) {
    return find(path.dirname(filepath));
  } else {
    if (fs.existsSync(path.join(filepath, 'gamelist.xml'))) {
      return filepath;
    } else {
      const parent = path.dirname(filepath);
      return parent === filepath ? null : find(parent);
    }
  }
};

export const read = async (dir: string) => {
  const xml = path.join(dir, 'gamelist.xml');
  if (!fs.existsSync(xml)) return { xml, data: null, provider: null };
  const data: GameList = await new Parser().parseStringPromise(
    fs.readFileSync(xml, { encoding: 'utf8' })
  );
  return { xml, data, provider: getProvider(data) };
};

export const write = async (xml: string, data: GameList) => {
  try {
    await fs.writeFile(xml, new Builder().buildObject(data), { encoding: 'utf8' });
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'EPERM' && process.platform === 'win32') {
      console.error('Permission error accessing gamelist.xml.');
      console.error(
        "If you've previously locked the file as readonly, " + 'unlock it then retry this command.'
      );
    } else {
      throw e;
    }
  }
};

export const getProvider = function (data: GameList) {
  const provider = data?.gameList?.provider?.[0] || ({} as Provider);

  // Caps fix for System
  provider.system = provider.System;
  delete provider.System;

  return provider;
};

export const ensureGames = function (data: GameList = {}) {
  data.gameList = data.gameList || {};
  data.gameList.game = data.gameList.game || [];
  data.gameList.game.forEach(game => {
    game.path = game.path || [''];
    game.path[0] = game.path[0] || '';
  });
  if (data.gameList.folder && data.gameList.folder.length > 0) {
    data.gameList.folder.forEach(folder => {
      folder.path = folder.path || [''];
      folder.path[0] = folder.path[0] || '';
    });
  }
  return data as GameListEnsured;
};

export const forEach = async function (
  dir: string,
  handler: (game: Entry, provider: Provider, index: number, list: Entry[]) => void
) {
  const { data, provider } = await read(dir);
  if (!data || !data.gameList || !Array.isArray(data.gameList.game)) return;
  data.gameList.game.forEach((game, ...rest) => handler(game, provider, ...rest));
};

export const update = async function (
  dir: string,
  handler: (game: Entry, provider: Provider, index: number, list: Entry[]) => void
) {
  const { xml, data, provider } = await read(dir);
  if (!data || !data.gameList || !Array.isArray(data.gameList.game)) return;
  data.gameList.game.forEach((game, index, list) => handler(game, provider, index, list));
  await write(xml, data);
};

export const gameName = function (game: Entry) {
  return (game?.name?.[0] || '')
    .replace(/["\n\r]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};
