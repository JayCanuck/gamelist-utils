import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { relativeMediaPath, resolveMediaEnv, romBasename } from './media.js';

describe('media.resolveMediaEnv', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns defaults when no env vars are set', () => {
    const env = resolveMediaEnv();
    expect(env.media).toBe('media');
    expect(env.box2d).toBe('box2d');
    expect(env.box3d).toBe('box3d');
    expect(env.mixed).toBe('mixed');
    expect(env.screenshot).toBe('screenshot');
    expect(env.snap).toBe('snap');
    expect(env.title).toBe('title');
    expect(env.marquee).toBe('wheel');
    expect(env.manual).toBe('manual');
  });

  it('respects environment variable overrides', () => {
    vi.stubEnv('GAMELIST_MEDIA', 'custom-media');
    vi.stubEnv('GAMELIST_BOX2D', 'covers');
    vi.stubEnv('GAMELIST_SNAP', 'videos');

    const env = resolveMediaEnv();
    expect(env.media).toBe('custom-media');
    expect(env.box2d).toBe('covers');
    expect(env.snap).toBe('videos');
    // Unset vars still return defaults
    expect(env.marquee).toBe('wheel');
  });
});

describe('media.relativeMediaPath', () => {
  it('builds a forward-slash normalized relative path', () => {
    expect(relativeMediaPath('media', 'box2d', 'game')).toBe('./media/box2d/game.png');
  });

  it('supports custom extension', () => {
    expect(relativeMediaPath('media', 'snap', 'game', '.mp4')).toBe('./media/snap/game.mp4');
  });

  it('handles names with spaces', () => {
    expect(relativeMediaPath('media', 'wheel', 'Super Mario World')).toBe(
      './media/wheel/Super Mario World.png'
    );
  });
});

describe('media.romBasename', () => {
  it('extracts basename without extension from relative path', () => {
    expect(romBasename('./Super Mario World.zip')).toBe('Super Mario World');
  });

  it('handles bare filenames', () => {
    expect(romBasename('game.7z')).toBe('game');
  });

  it('handles paths with subdirectories', () => {
    expect(romBasename('./subdir/rom.zip')).toBe('rom');
  });
});
