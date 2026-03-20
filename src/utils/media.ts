// Shared media environment resolution and path utilities.
import path from 'path';

// Resolves media-related environment variables with defaults.
// Used by most actions that handle media directories.
export const resolveMediaEnv = () => ({
  media: process.env.GAMELIST_MEDIA || 'media',
  box2d: process.env.GAMELIST_BOX2D || 'box2d',
  box3d: process.env.GAMELIST_BOX3D || 'box3d',
  mixed: process.env.GAMELIST_MIXED || 'mixed',
  screenshot: process.env.GAMELIST_SCREENSHOT || 'screenshot',
  snap: process.env.GAMELIST_SNAP || 'snap',
  title: process.env.GAMELIST_TITLE || 'title',
  marquee: process.env.GAMELIST_MARQUEE || 'wheel',
  manual: process.env.GAMELIST_MANUAL || 'manual'
});

// Builds a gamelist-relative media path with forward-slash normalization.
// Example: relativeMediaPath('media', 'box2d', 'game') => './media/box2d/game.png'
export const relativeMediaPath = (
  media: string,
  subdir: string,
  romBasename: string,
  ext = '.png'
) => './' + path.join(media, subdir, romBasename + ext).replace(/[\\/]+/g, '/');

// Extracts the rom basename (no extension) from a gamelist-relative path.
// Example: romBasename('./Super Mario World.zip') => 'Super Mario World'
export const romBasename = (romPath: string) =>
  path.basename(romPath.replace(/^\.\//, ''), path.extname(romPath));
