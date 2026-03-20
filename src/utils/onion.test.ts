import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { convertToMiyooGamelist, write } from './onion.js';

const tmpDir = path.join(os.tmpdir(), 'gamelist-utils-test-onion');

beforeEach(async () => {
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('onion.convertToMiyooGamelist', () => {
  it('converts gamelist data to MiyooGameList format', () => {
    const dir = tmpDir;
    // Create rom files so existsSync checks pass
    fs.writeFileSync(path.join(dir, 'rom1.zip'), '');
    fs.writeFileSync(path.join(dir, 'rom2.zip'), '');
    fs.ensureDirSync(path.join(dir, 'media', 'box2d'));
    fs.writeFileSync(path.join(dir, 'media', 'box2d', 'rom1.png'), '');

    const result = convertToMiyooGamelist(dir, {
      gameList: {
        game: [
          {
            path: ['./rom1.zip'],
            name: ['ROM 1'],
            image: ['./media/box2d/rom1.png']
          },
          {
            path: ['./rom2.zip'],
            name: ['ROM 2']
          }
        ]
      }
    });

    expect(result.data.gameList.game).toHaveLength(2);
    expect(result.data.gameList.game[0]!.path[0]).toBe('./rom1.zip');
    expect(result.data.gameList.game[0]!.name?.[0]).toBe('ROM 1');
    expect(result.data.gameList.game[0]!.image?.[0]).toBe('./media/box2d/rom1.png');
    expect(result.data.gameList.game[1]!.image).toBeUndefined();
    expect(result.files.length).toBeGreaterThanOrEqual(2);
  });

  it('skips games with non-existent rom files', () => {
    const result = convertToMiyooGamelist(tmpDir, {
      gameList: {
        game: [
          {
            path: ['./nonexistent.zip'],
            name: ['Missing ROM']
          }
        ]
      }
    });

    expect(result.data.gameList.game).toHaveLength(0);
    expect(result.files).toHaveLength(0);
  });

  it('handles empty gamelist', () => {
    const result = convertToMiyooGamelist(tmpDir, {});
    expect(result.data.gameList.game).toHaveLength(0);
    expect(result.files).toHaveLength(0);
  });
});

describe('onion.write', () => {
  it('writes miyoogamelist.xml file', async () => {
    const xmlPath = path.join(tmpDir, 'miyoogamelist.xml');
    await write(xmlPath, {
      gameList: {
        game: [{ path: ['./rom.zip'] }]
      }
    });
    expect(fs.existsSync(xmlPath)).toBe(true);
    const content = fs.readFileSync(xmlPath, 'utf8');
    expect(content).toContain('<gameList>');
    expect(content).toContain('./rom.zip');
  });
});
