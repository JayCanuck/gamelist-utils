import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findCatalogue, systemLookup, updateAssign, updateFolder } from './muos.js';

const tmpDir = path.join(os.tmpdir(), 'gamelist-utils-test-muos');

beforeEach(async () => {
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('muos.systemLookup', () => {
  it('returns System enum value for known directory names', () => {
    expect(systemLookup('snes')).toBeDefined();
    expect(systemLookup('nes')).toBeDefined();
    expect(systemLookup('gba')).toBeDefined();
  });

  it('returns the value as-is when it matches a known System value', () => {
    // e.g. "Nintendo Game Boy Advance" is already a System value
    const result = systemLookup('Nintendo Game Boy Advance');
    expect(result).toBe('Nintendo Game Boy Advance');
  });

  it('returns undefined for unknown directory names', () => {
    expect(systemLookup('totally_unknown_system_xyz')).toBeUndefined();
  });

  it('resolves additional gamelist-specific aliases', () => {
    expect(systemLookup('3do')).toBeDefined();
    expect(systemLookup('zxspectrum')).toBeDefined();
    expect(systemLookup('tg16')).toBeDefined();
    expect(systemLookup('segacd')).toBeDefined(); // in the default muos assign mapping
  });
});

describe('muos.findCatalogue', () => {
  it('returns catalogue path when ROMS directory is found', () => {
    const romsDir = path.join(tmpDir, 'ROMS');
    const systemDir = path.join(romsDir, 'snes');
    fs.ensureDirSync(systemDir);

    const result = findCatalogue(systemDir);
    expect(result).toBe(path.resolve(romsDir, '../MUOS/info/catalogue'));
  });

  it('returns undefined when no ROMS directory is in path', () => {
    const dir = path.join(tmpDir, 'some', 'other', 'dir');
    fs.ensureDirSync(dir);

    const result = findCatalogue(dir);
    expect(result).toBeUndefined();
  });
});

describe('muos.updateAssign', () => {
  it('writes updated assign.json with system entries', async () => {
    const assignFile = path.join(tmpDir, 'assign.json');
    fs.writeFileSync(assignFile, JSON.stringify({ existing: 'value.ini' }), 'utf8');

    await updateAssign(assignFile, { snes: 'Nintendo SNES/SFC' as never });

    const result = JSON.parse(fs.readFileSync(assignFile, 'utf8'));
    expect(result.existing).toBe('value.ini');
    expect(result.snes).toBe('nintendo snes/sfc.ini');
  });

  it('throws error when assign file does not exist', async () => {
    const assignFile = path.join(tmpDir, 'nonexistent.json');

    await expect(updateAssign(assignFile, { snes: 'Nintendo SNES/SFC' as never })).rejects.toThrow(
      'Failed to read or parse assign file'
    );
  });

  it('throws error when assign file contains invalid JSON', async () => {
    const assignFile = path.join(tmpDir, 'invalid.json');
    fs.writeFileSync(assignFile, '{ invalid json }', 'utf8');

    await expect(updateAssign(assignFile, { snes: 'Nintendo SNES/SFC' as never })).rejects.toThrow(
      'Failed to read or parse assign file'
    );
  });
});

describe('muos.updateFolder', () => {
  it('writes updated folder.json with system entries', async () => {
    const folderFile = path.join(tmpDir, 'folder.json');
    fs.writeFileSync(folderFile, JSON.stringify({ existing: 'Old System' }), 'utf8');

    await updateFolder(folderFile, { snes: 'SNES' });

    const result = JSON.parse(fs.readFileSync(folderFile, 'utf8'));
    expect(result.existing).toBe('Old System');
    expect(result.snes).toBe('SNES');
  });

  it('throws error when folder file does not exist', async () => {
    const folderFile = path.join(tmpDir, 'nonexistent.json');

    await expect(updateFolder(folderFile, { snes: 'SNES' })).rejects.toThrow(
      'Failed to read or parse folder file'
    );
  });

  it('throws error when folder file contains invalid JSON', async () => {
    const folderFile = path.join(tmpDir, 'invalid.json');
    fs.writeFileSync(folderFile, '{ invalid json }', 'utf8');

    await expect(updateFolder(folderFile, { snes: 'SNES' })).rejects.toThrow(
      'Failed to read or parse folder file'
    );
  });
});
