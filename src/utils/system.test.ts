import { describe, expect, it } from 'vitest';
import { getName } from './system.js';

describe('system.getName', () => {
  it('capitalizes simple system names', () => {
    expect(getName('saturn')).toBe('Saturn');
    expect(getName('dreamcast')).toBe('Dreamcast');
  });

  it('uppercases known all-upper abbreviations', () => {
    expect(getName('nes')).toBe('NES');
    expect(getName('snes')).toBe('SNES');
    expect(getName('gba')).toBe('GBA');
    expect(getName('gb')).toBe('GB');
    expect(getName('gbc')).toBe('GBC');
    expect(getName('nds')).toBe('NDS');
    expect(getName('3ds')).toBe('3DS');
    expect(getName('psp')).toBe('PSP');
    expect(getName('psx')).toBe('PSX');
    expect(getName('fds')).toBe('FDS');
    expect(getName('gc')).toBe('GC');
    expect(getName('msx')).toBe('MSX');
    expect(getName('tg16')).toBe('TG16');
    expect(getName('pc')).toBe('PC');
    expect(getName('zx81')).toBe('ZX81');
  });

  it('returns known mixed-case system names', () => {
    expect(getName('megadrive')).toBe('MegaDrive');
    expect(getName('neogeo')).toBe('Neo Geo');
    expect(getName('neogeocd')).toBe('Neo Geo CD');
    expect(getName('gamegear')).toBe('Game Gear');
    expect(getName('gameandwatch')).toBe('Game & Watch');
    expect(getName('colecovision')).toBe('ColecoVision');
    expect(getName('virtualboy')).toBe('Virtual Boy');
    expect(getName('wonderswan')).toBe('WonderSwan');
    expect(getName('wonderswancolor')).toBe('WonderSwan Color');
    expect(getName('scummvm')).toBe('ScummVM');
    expect(getName('atarist')).toBe('AtariST');
    expect(getName('atarijaguar')).toBe('Atari Jaguar');
    expect(getName('atarilynx')).toBe('Atari Lynx');
    expect(getName('amstradcpc')).toBe('Amstrad CPC');
    expect(getName('zxspectrum')).toBe('ZXSpectrum');
    expect(getName('pokemini')).toBe('Pokemon Mini');
    expect(getName('pspminis')).toBe('PSP Mini');
    expect(getName('segacd')).toBe('SegaCD');
    expect(getName('supergrafx')).toBe('SuperGrafx');
    expect(getName('amigacd32')).toBe('AmigaCD32');
    expect(getName('cdimono1')).toBe('Philips CD-i');
    expect(getName('bestof')).toBe('Best-Of');
  });

  it('handles hyphenated multi-word names', () => {
    expect(getName('neo-geo')).toBe('Neo Geo');
    expect(getName('game-gear')).toBe('Game Gear');
  });

  it('handles unknown names with simple capitalization', () => {
    expect(getName('unknown')).toBe('Unknown');
    expect(getName('custom')).toBe('Custom');
  });
});
