import path from 'node:path';
import fs from 'fs-extra';
import { Builder } from 'xml2js';
import type { GameList, GameListEnsured } from '../gamelist-types.js';

interface MiyooGameList {
  gameList: {
    game: {
      path: [string];
      name?: [string];
      image?: [string];
    }[];
  };
}

export const convertToMiyooGamelist = (dir: string, data: GameList | GameListEnsured) => {
  const files: string[] = [];
  const converted: MiyooGameList = {
    gameList: {
      game: []
    }
  };

  data.gameList?.game?.forEach(game => {
    if (game.path?.[0]) {
      const fullPath = path.resolve(dir, game.path[0]);
      if (!fs.existsSync(fullPath)) return;

      const image = game.image?.[0] && path.resolve(dir, game.image?.[0]);

      converted.gameList.game.push({
        path: [game.path[0]] as const,
        ...(game.name?.[0] && { name: [game.name![0]] as const }),
        ...(image && fs.existsSync(image) && { image: [game.image![0]] as const })
      });

      files.push(fullPath);
      if (image) files.push(image);

      if (game.path[0].endsWith('.m3u')) {
        const m3uDir = path.dirname(game.path[0]);
        const m3uFiles = fs
          .readFileSync(game.path[0], { encoding: 'utf8' })
          .split(/[\n\r]+/)
          .map(line => line.trim())
          .filter(Boolean)
          .map(m3uFile => path.join(dir, m3uDir, m3uFile))
          .filter(m3uFile => fs.existsSync(m3uFile));

        files.push(...m3uFiles);
      }
    }
  });

  return {
    data: converted,
    files
  };
};

export const write = async (xml: string, data: MiyooGameList) =>
  fs.writeFile(xml, new Builder().buildObject(data), { encoding: 'utf8' });
