import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureGames,
  fileSafeGameName,
  find,
  getProvider,
  jsonSafeGameName,
  read,
  write
} from './gamelist.js';

const tmpDir = path.join(os.tmpdir(), 'gamelist-utils-test-gamelist');

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<gameList>
  <provider>
    <System>snes</System>
    <software>Skraper</software>
  </provider>
  <game id="123" source="ScreenScraper">
    <path>./Super Mario World.zip</path>
    <name>Super Mario World</name>
    <desc>A classic platformer.</desc>
    <image>./media/box2d/Super Mario World.png</image>
  </game>
  <game id="456" source="ScreenScraper">
    <path>./Donkey Kong Country.zip</path>
    <name>Donkey Kong Country</name>
  </game>
</gameList>`;

beforeEach(async () => {
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('gamelist.find', () => {
  it('returns directory containing gamelist.xml', () => {
    const dir = path.join(tmpDir, 'system');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'gamelist.xml'), sampleXml);
    expect(find(dir)).toBe(dir);
  });

  it('searches parent directories', () => {
    const dir = path.join(tmpDir, 'system');
    const child = path.join(dir, 'subdir');
    fs.ensureDirSync(child);
    fs.writeFileSync(path.join(dir, 'gamelist.xml'), sampleXml);
    expect(find(child)).toBe(dir);
  });

  it('returns null when no gamelist.xml exists', () => {
    const dir = path.join(tmpDir, 'empty');
    fs.ensureDirSync(dir);
    // walk up will hit root and return null
    expect(find(dir)).toBeNull();
  });

  it('handles file path by checking parent directory', () => {
    const dir = path.join(tmpDir, 'system');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'gamelist.xml'), sampleXml);
    fs.writeFileSync(path.join(dir, 'rom.zip'), '');
    expect(find(path.join(dir, 'rom.zip'))).toBe(dir);
  });

  it('returns null for non-existent path', () => {
    expect(find(path.join(tmpDir, 'does-not-exist'))).toBeNull();
  });
});

describe('gamelist.read', () => {
  it('reads and parses gamelist.xml', async () => {
    fs.writeFileSync(path.join(tmpDir, 'gamelist.xml'), sampleXml);
    const result = await read(tmpDir);
    expect(result.data).not.toBeNull();
    expect(result.data?.gameList?.game).toHaveLength(2);
    expect(result.data?.gameList?.game?.[0]?.name?.[0]).toBe('Super Mario World');
  });

  it('returns null data when gamelist.xml does not exist', async () => {
    const result = await read(tmpDir);
    expect(result.data).toBeNull();
    expect(result.provider).toBeNull();
  });

  it('extracts provider info', async () => {
    fs.writeFileSync(path.join(tmpDir, 'gamelist.xml'), sampleXml);
    const result = await read(tmpDir);
    expect(result.provider).toBeDefined();
    expect(result.provider?.system?.[0]).toBe('snes');
    expect(result.provider?.software?.[0]).toBe('Skraper');
  });
});

describe('gamelist.write', () => {
  it('writes valid XML that can be re-read', async () => {
    fs.writeFileSync(path.join(tmpDir, 'gamelist.xml'), sampleXml);
    const { xml, data } = await read(tmpDir);
    expect(data).not.toBeNull();
    await write(xml, data!);
    const reread = await read(tmpDir);
    expect(reread.data?.gameList?.game).toHaveLength(2);
  });

  it('handles EPERM error on win32 gracefully', async () => {
    const xml = path.join(tmpDir, 'gamelist.xml');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const origPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'win32' });

    // Mock writeFile to throw EPERM
    vi.spyOn(fs, 'writeFile').mockRejectedValueOnce(
      Object.assign(new Error('EPERM'), { code: 'EPERM' })
    );

    await write(xml, { gameList: { game: [] } });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    if (origPlatform) Object.defineProperty(process, 'platform', origPlatform);
  });

  it('re-throws non-EPERM errors', async () => {
    const xml = path.join(tmpDir, 'gamelist.xml');
    vi.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('EACCES'));

    await expect(write(xml, { gameList: { game: [] } })).rejects.toThrow('EACCES');
  });
});

describe('gamelist.getProvider', () => {
  it('normalizes System to system (lowercase key)', () => {
    const provider = getProvider({
      gameList: {
        provider: [{ System: ['snes'] }]
      }
    });
    expect(provider.system?.[0]).toBe('snes');
    expect(provider.System).toBeUndefined();
  });

  it('returns empty provider-like object when no provider exists', () => {
    const provider = getProvider({});
    expect(provider).toBeDefined();
  });
});

describe('gamelist.ensureGames', () => {
  it('initializes missing gameList and game array', () => {
    const result = ensureGames({});
    expect(result.gameList).toBeDefined();
    expect(result.gameList.game).toEqual([]);
  });

  it('ensures path exists on each game', () => {
    const result = ensureGames({
      gameList: {
        game: [{ name: ['Test'] }]
      }
    });
    expect(result.gameList.game[0]!.path[0]).toBe('');
  });

  it('ensures path on folders when present', () => {
    const result = ensureGames({
      gameList: {
        game: [],
        folder: [{ name: ['Folder'] }]
      }
    });
    expect(result.gameList.folder?.[0]?.path[0]).toBe('');
  });

  it('preserves existing data', () => {
    const result = ensureGames({
      gameList: {
        game: [{ path: ['./rom.zip'], name: ['ROM'] }]
      }
    });
    expect(result.gameList.game[0]!.path[0]).toBe('./rom.zip');
    expect(result.gameList.game[0]!.name?.[0]).toBe('ROM');
  });
});

describe('gamelist.forEach', () => {
  it('iterates over each game entry', async () => {
    fs.writeFileSync(path.join(tmpDir, 'gamelist.xml'), sampleXml);
    const names: string[] = [];
    const { forEach } = await import('./gamelist.js');
    await forEach(tmpDir, game => {
      if (game.name?.[0]) names.push(game.name[0]);
    });
    expect(names).toEqual(['Super Mario World', 'Donkey Kong Country']);
  });

  it('does nothing when gamelist.xml does not exist', async () => {
    const { forEach } = await import('./gamelist.js');
    const handler = vi.fn();
    await forEach(tmpDir, handler);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('gamelist.update', () => {
  it('modifies games and writes back to xml', async () => {
    fs.writeFileSync(path.join(tmpDir, 'gamelist.xml'), sampleXml);
    const { update, read: readGamelist } = await import('./gamelist.js');
    await update(tmpDir, game => {
      if (game.name?.[0] === 'Super Mario World') {
        game.name = ['SMW'];
      }
    });
    const result = await readGamelist(tmpDir);
    expect(result.data?.gameList?.game?.[0]?.name?.[0]).toBe('SMW');
  });

  it('does nothing when gamelist.xml does not exist', async () => {
    const { update } = await import('./gamelist.js');
    const handler = vi.fn();
    await update(tmpDir, handler);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('gamelist.jsonSafeGameName', () => {
  it('returns the game name stripped of unsafe JSON characters', () => {
    expect(jsonSafeGameName({ name: ['Super Mario World'] })).toBe('Super Mario World');
  });

  it('removes quotes and newlines', () => {
    expect(jsonSafeGameName({ name: ['Game "Name"\nHere'] })).toBe('Game NameHere');
  });

  it('collapses whitespace', () => {
    expect(jsonSafeGameName({ name: ['  Multiple   Spaces  '] })).toBe('Multiple Spaces');
  });

  it('returns empty string for missing name', () => {
    expect(jsonSafeGameName({})).toBe('');
  });
});

describe('gamelist.fileSafeGameName', () => {
  it('returns the game name stripped of filesystem-unsafe characters', () => {
    expect(fileSafeGameName({ name: ['Super Mario World'] })).toBe('Super Mario World');
  });

  it('removes wildcard and path characters', () => {
    expect(fileSafeGameName({ name: ['Game*Name<>|?'] })).toBe('GameName');
  });

  it('converts colons to dashes', () => {
    expect(fileSafeGameName({ name: ['Title: Subtitle'] })).toBe('Title - Subtitle');
  });

  it('returns empty string for missing name', () => {
    expect(fileSafeGameName({})).toBe('');
  });
});
