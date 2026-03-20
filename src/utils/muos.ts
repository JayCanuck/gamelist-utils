import path from 'node:path';
import fs from 'fs-extra';
import { defaultAssign, System } from 'muos';

// common folder-to-system mapping
const defaultSystems = defaultAssign();

const gamelistSystems: Record<string, System> = {
  ...defaultSystems,
  /*
    Additional mappings for RetroPie/Batocera/etc. common system folder names

    Based on system names in default Batocera:
    https://github.com/batocera-linux/batocera-emulationstation/blob/master/es-app/src/PlatformId.cpp

    As well as the default RetroPie Carbon theme and the Batocera/ES-DE EpicNoir (revisited) theme:
    https://github.com/RetroPie/es-theme-carbon
    https://github.com/anthonycaccese/epic-noir-revisited-es-de

    Limited to systems supported by muOS.
    May be incomplete; open to PRs adding additional common aliases.
  */
  '3do': System.The3DOCompany3DO,
  'atarijaguarcd': System.AtariJaguar, // virtualjaguar_libretro supports this
  'msx2': System.MicrosoftMSX, // fmsx_libretro supports this
  'msx2+': System.MicrosoftMSX, // fmsx_libretro supports this
  'sg-1000': System.SegaSG1000,
  'zxspectrum': System.SinclairZXSpectrum,
  'amigacd32': System.CommodoreAmiga, // puae_libretro supports this
  'amigacdtv': System.CommodoreAmiga, // puae_libretro supports this
  'sufami': System.NintendoSNESSFC, // multiple snes/sfc cores support this
  'gb2players': System.NintendoGameBoy,
  'gbc2players': System.NintendoGameBoyColor,
  'tyrquake': System.Quake,
  'multivision': System.SegaSG1000,
  'mame-advmame': System.Arcade,
  'mame-libretro': System.Arcade,
  'mame-mame4all': System.Arcade,
  'mess': System.Arcade,
  'pce-cd': System.NECPCEngineCD,
  'tg16': System.NECPCEngine,
  'tgcd': System.NECPCEngineCD,
  'tg-cd': System.NECPCEngineCD,
  'mega32x': System.Sega32X,
  'megadrivejp': System.SegaMegaDriveGenesis,
  'snesna': System.NintendoSNESSFC
};

const gamelistSystemsValues = Object.values<string>(gamelistSystems);

export const systemLookup = (dirName: string): System | undefined =>
  gamelistSystemsValues.includes(dirName) ? (dirName as System) : gamelistSystems[dirName];

export const findCatalogue = (romBasedDir: string): string | undefined => {
  romBasedDir = path.resolve(romBasedDir);

  const parent = path.dirname(romBasedDir);
  if (!parent || parent === romBasedDir) return;

  if (path.basename(romBasedDir) === 'ROMS') {
    return path.resolve(romBasedDir, '../MUOS/info/catalogue');
  } else {
    return findCatalogue(parent);
  }
};

export const updateAssign = async (file: string, values: Record<string, System>) => {
  const assign: Record<string, string> = JSON.parse(await fs.readFile(file, { encoding: 'utf8' }));
  const updated = {
    ...assign,
    ...Object.entries(values).reduce(
      (acc, [key, value]) => Object.assign(acc, { [key]: value.toLocaleLowerCase() + '.ini' }),
      {} as Record<string, string>
    )
  };
  await fs.writeFile(file, JSON.stringify(updated, null, '    '), { encoding: 'utf8' });
};

export const updateFolder = async (file: string, values: Record<string, System | string>) => {
  const folder: Record<string, string> = JSON.parse(await fs.readFile(file, { encoding: 'utf8' }));
  const updated = {
    ...folder,
    ...values
  };
  await fs.writeFile(file, JSON.stringify(updated, null, '    '), { encoding: 'utf8' });
};
