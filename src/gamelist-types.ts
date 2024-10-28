// Image types for media files
export type MediaImage =
  | 'box2d'
  | 'box3d'
  | 'mixed'
  | 'screenshot'
  | 'title'
  | 'wheel'
  | 'thumbnail';

/*
  Known gamelist.xml fields
  
  There have been official documentation in the past:
      https://github.com/retropie/EmulationStation/blob/master/GAMELISTS.md
      https://github.com/batocera-linux/batocera-emulationstation/blob/master/GAMELISTS.md

  However the reality is that most are undocumented. Best to reference MetaData.cpp source directly:
      https://github.com/RetroPie/EmulationStation/blob/master/es-app/src/MetaData.cpp
      https://github.com/batocera-linux/batocera-emulationstation/blob/master/es-app/src/MetaData.cpp
  
  Main differences between RetroPie vs Batocera's implementations
    - RetroPie supports `sortname` field
    - Batocera support many other new fields to handle additional features
  
  Note:
    While there are many different fields, in reality, most fields are not used by themes.
    Most themes will only use image/video/marquee for its media assets.
*/

export enum Field {
  Path = 'path',
  Name = 'name',
  SortName = 'sortname',
  Description = 'desc',
  Emulator = 'emulator',
  Core = 'core',
  Image = 'image',
  Video = 'video',
  Marquee = 'marquee',
  Thumbnail = 'thumbnail',
  FanArt = 'fanart',
  TitleShot = 'titleshot',
  Manual = 'manual',
  Magazine = 'magazine',
  Map = 'map',
  Bezel = 'bezel',
  Cartridge = 'cartridge',
  BoxArt = 'boxart',
  BoxBack = 'boxback',
  Wheel = 'wheel',
  Mix = 'mix',
  Rating = 'rating',
  ReleaseDate = 'releasedate',
  Developer = 'developer',
  Publisher = 'publisher',
  Genre = 'genre',
  Family = 'family',
  GenreIds = 'genres',
  ArcadeSystemName = 'arcadesystemname',
  Players = 'players',
  Favorite = 'favorite',
  Hidden = 'hidden',
  KidGame = 'kidgame',
  PlayCount = 'playcount',
  LastPlayed = 'lastplayed',
  Crc32 = 'crc32',
  Md5 = 'md5',
  GameTime = 'gametime',
  Language = 'lang',
  Region = 'region',
  CheevosHash = 'cheevosHash',
  CheevosId = 'cheevosId',
  ScraperId = 'id'
}

// Game object after parsed from XML

type GameAttributes = {
  // Game attributes attached by ScreenScraper
  $?: {
    id?: string;
    source?: string;
    [key: string]: string | undefined;
  };
};
type GameChildren = {
  // Known game children nodes
  [key in Field]?: [string];
};
type OtherChildren = {
  // Any other game children nodes
  [key: string]: [string] | undefined;
};

export type Entry = GameAttributes & GameChildren & OtherChildren;

// Provider object after parsed from XML
export interface Provider {
  System?: [string];
  software?: [string];
  database?: [string];
  web?: [string];
  [key: string]: [string] | undefined;
}

// Gamelist object after parsed from XML
export interface GameList {
  gameList?: {
    provider?: [Provider];
    game?: Entry[];
    folder?: Entry[];
  };
}

export type EntryEnsured = Entry & { path: [string] };

export interface GameListEnsured {
  gameList: {
    provider?: [Provider];
    game: EntryEnsured[];
    folder?: EntryEnsured[];
  };
}
