// Utilities related to systems themselves.

// Can just be switched to an all-upercase naming
const isAllUpper = (name: string) =>
  /^(3do|gb|gbc|gba|nds|3ds|nes|fds|snes|gc|ngp|ngpc|sg|tg16|tg|cd|msx|msx1|msx2|psp|psx|pc|zx81)$/i.test(
    name
  );
// mixed casing or alternate text
const mixedCase = (name: string) =>
  ({
    bestof: 'Best-Of',
    amigacd32: 'AmigaCD32',
    amstradcpc: 'Amstrad CPC',
    atarijaguar: 'Atari Jaguar',
    atarilynx: 'Atari Lynx',
    atarist: 'AtariST',
    cdimono1: 'Philips CD-i',
    colecovision: 'ColecoVision',
    gameandwatch: 'Game & Watch',
    gamegear: 'Game Gear',
    megadrive: 'MegaDrive',
    neogeo: 'Neo Geo',
    neogeocd: 'Neo Geo CD',
    pokemini: 'Pokemon Mini',
    pspminis: 'PSP Mini',
    scummvm: 'ScummVM',
    segacd: 'SegaCD',
    supergrafx: 'SuperGrafx',
    virtualboy: 'Virtual Boy',
    wonderswan: 'WonderSwan',
    wonderswancolor: 'WonderSwan Color',
    zxspectrum: 'ZXSpectrum'
  })[name.toLowerCase()];

// Simple first-letter capitalization
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Convert a RetroPie/EmulationStation system name and return a plain english name.
export const getName = (system: string) =>
  system
    .split(/[\s-]+/)
    .map(e => mixedCase(e) || (isAllUpper(e) ? e.toUpperCase() : capitalize(e)))
    .join(' ');

module.exports = { getName };
