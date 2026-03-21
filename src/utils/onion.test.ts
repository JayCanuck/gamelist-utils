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

  it('processes m3u playlist files and includes referenced files', () => {
    const dir = tmpDir;
    const m3uDir = path.join(dir, 'playlists');
    fs.ensureDirSync(m3uDir);

    const disc1 = path.join(m3uDir, 'game-disc1.bin');
    const disc2 = path.join(m3uDir, 'game-disc2.bin');
    const m3uFile = path.join(m3uDir, 'game.m3u');

    fs.writeFileSync(disc1, '');
    fs.writeFileSync(disc2, '');
    fs.writeFileSync(m3uFile, 'game-disc1.bin\ngame-disc2.bin\n');

    const result = convertToMiyooGamelist(dir, {
      gameList: {
        game: [
          {
            path: ['./playlists/game.m3u'],
            name: ['Multi-Disc Game']
          }
        ]
      }
    });

    expect(result.data.gameList.game).toHaveLength(1);
    expect(result.files).toContain(m3uFile);
    expect(result.files).toContain(disc1);
    expect(result.files).toContain(disc2);
  });

  it('handles m3u files with empty lines and whitespace', () => {
    const dir = tmpDir;
    const m3uDir = path.join(dir, 'playlists');
    fs.ensureDirSync(m3uDir);

    const disc1 = path.join(m3uDir, 'disc1.bin');
    const m3uFile = path.join(m3uDir, 'game.m3u');

    fs.writeFileSync(disc1, '');
    fs.writeFileSync(m3uFile, '\n  disc1.bin  \n\n  \n');

    const result = convertToMiyooGamelist(dir, {
      gameList: {
        game: [
          {
            path: ['./playlists/game.m3u'],
            name: ['Game']
          }
        ]
      }
    });

    expect(result.files).toContain(disc1);
  });

  it('skips m3u processing when file cannot be read', () => {
    const dir = tmpDir;
    const m3uFile = path.join(dir, 'unreadable.m3u');

    fs.writeFileSync(m3uFile, '');

    const result = convertToMiyooGamelist(dir, {
      gameList: {
        game: [
          {
            path: ['./unreadable.m3u'],
            name: ['Game']
          }
        ]
      }
    });

    expect(result.data.gameList.game).toHaveLength(1);
    expect(result.files).toContain(m3uFile);
  });

  it('skips non-existent files referenced in m3u', () => {
    const dir = tmpDir;
    const m3uFile = path.join(dir, 'game.m3u');

    fs.writeFileSync(m3uFile, 'nonexistent-disc1.bin\nnonexistent-disc2.bin\n');

    const result = convertToMiyooGamelist(dir, {
      gameList: {
        game: [
          {
            path: ['./game.m3u'],
            name: ['Game']
          }
        ]
      }
    });

    expect(result.data.gameList.game).toHaveLength(1);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toBe(m3uFile);
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
