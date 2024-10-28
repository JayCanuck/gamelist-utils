import path from 'path';
import { config } from 'dotenv';
import fs from 'fs-extra';

let loaded = false;

export const load = function () {
  if (loaded) return;
  [
    path.join(__dirname, '.env'),
    `.env.${process.env.NODE_ENV || 'development'}.local`,
    `.env.${process.env.NODE_ENV || 'development'}`,
    '.env'
  ].forEach(env => fs.existsSync(env) && config({ path: env }));
  loaded = true;
};
