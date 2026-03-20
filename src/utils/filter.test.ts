import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Entry, Provider } from '../gamelist-types.js';
import { Filter } from './filter.js';

const tmpDir = path.join(os.tmpdir(), 'gamelist-utils-test-filter');

beforeEach(async () => {
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

const makeGame = (overrides: Record<string, unknown> = {}): Entry =>
  ({
    path: ['./rom.zip'],
    name: ['Test Game'],
    ...overrides
  }) as Entry;

const makeProvider = (system?: string): Provider =>
  system ? { system: [system] } : ({} as Provider);

describe('Filter', () => {
  describe('constructor and test', () => {
    it('passes all games with empty filter', () => {
      const filter = new Filter({});
      const game = makeGame();
      expect(filter.test(game, makeProvider())).toBe(true);
    });

    it('includes games matching include criteria', () => {
      const filter = new Filter({
        include: [{ name: 'Test Game' }]
      });
      expect(filter.test(makeGame(), makeProvider())).toBe(true);
      expect(filter.test(makeGame({ name: ['Other'] }), makeProvider())).toBe(false);
    });

    it('excludes games matching exclude criteria', () => {
      const filter = new Filter({
        exclude: [{ name: 'Bad Game' }]
      });
      expect(filter.test(makeGame(), makeProvider())).toBe(true);
      expect(filter.test(makeGame({ name: ['Bad Game'] }), makeProvider())).toBe(false);
    });

    it('filters by system via provider', () => {
      const filter = new Filter({
        include: [{ system: 'snes' }]
      });
      expect(filter.test(makeGame(), makeProvider('snes'))).toBe(true);
      expect(filter.test(makeGame(), makeProvider('nes'))).toBe(false);
    });

    it('filters by game id attribute', () => {
      const filter = new Filter({
        include: [{ id: '123' }]
      });
      const game = makeGame({ $: { id: '123' } } as Record<string, unknown>);
      expect(filter.test(game, makeProvider())).toBe(true);

      const other = makeGame({ $: { id: '456' } } as Record<string, unknown>);
      expect(filter.test(other, makeProvider())).toBe(false);
    });

    it('filters by path', () => {
      const filter = new Filter({
        include: [{ path: './rom.zip' }]
      });
      expect(filter.test(makeGame(), makeProvider())).toBe(true);
      expect(filter.test(makeGame({ path: ['./other.zip'] }), makeProvider())).toBe(false);
    });

    it('supports nameContains criteria', () => {
      const filter = new Filter({
        include: [{ nameContains: 'test' }]
      });
      expect(filter.test(makeGame(), makeProvider())).toBe(true);
      expect(filter.test(makeGame({ name: ['Other'] }), makeProvider())).toBe(false);
    });

    it('ignores comment keys in criteria', () => {
      const filter = new Filter({
        include: [{ name: 'Test Game', comment: 'this is a note' }]
      });
      expect(filter.test(makeGame(), makeProvider())).toBe(true);
    });

    it('combines include and exclude', () => {
      const filter = new Filter({
        include: [{ name: 'Test Game' }],
        exclude: [{ path: './bad.zip' }]
      });
      expect(filter.test(makeGame(), makeProvider())).toBe(true);
      expect(
        filter.test(makeGame({ name: ['Test Game'], path: ['./bad.zip'] }), makeProvider())
      ).toBe(false);
    });
  });

  describe('Filter.load', () => {
    it('loads filter from JSON5 file', async () => {
      const filterFile = path.join(tmpDir, 'test-filter.json5');
      fs.writeFileSync(filterFile, JSON.stringify({ include: [{ name: 'Test Game' }] }));
      const filter = await Filter.load(filterFile);
      expect(filter.data.include).toHaveLength(1);
    });

    it('throws error for non-existent filter file', async () => {
      await expect(Filter.load(path.join(tmpDir, 'missing.json'))).rejects.toThrow(
        'Filter file not found'
      );
    });

    it('throws error for malformed JSON filter file', async () => {
      const filterFile = path.join(tmpDir, 'bad-filter.json');
      fs.writeFileSync(filterFile, '{ invalid json }');
      await expect(Filter.load(filterFile)).rejects.toThrow('Failed to parse filter file');
    });
  });
});
