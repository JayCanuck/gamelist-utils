# gamelist-utils  [![NPM](https://img.shields.io/npm/v/gamelist-utils.svg)](https://www.npmjs.com/package/gamelist-utils)
> A toolbox for EmulationStation gamelist.xml romsets.

These are main a collection of my own personal utilities when working with and manipulation gamelist.xml-based romsets.

## Installation

This package, `gamelist-utils`, can be installed globally for CLI usage:
```
npm install -g gamelist-utils
```
This is the most common usage and all the average user would need.


Alternatively, it can be invoked directly via `npx` without installing:
```
npx gamelist [...]
```

For programmic API-based usage, `gamelist-utils` can be installed locally in projects like any other library
```
npm install --save gamelist-utils
```

> Note: Node 14 LTS or greater required.

## RomSet Structure

This tools expects a particular romset directory structure.  Usually, I've relied on [Skraper](http://skraper.net/) to generate the initial `gamelist.xml` as well as scrape the metadata/media files.

Media is stored collectively in a `./media` directory, with subdirectories within for each type of asset (image types, video snaps, manuals, etc.). Each asset is named identical to the rom name (withoyut file extension).

Example:
```
system
├───media
│   ├───box2d
│   ├───box3d
│   ├───manual
│   ├───mixed
│   ├───screenshot
│   ├───snap
│   ├───title
│   └───wheel
└───[rom files (usually single files or zip per rom)]
```

Within the `./skraper` subdirectory of this repo, I've inclused 2 of my favourite custom Skraper mixes whcich use my preferred fallbacks. Feel free to use them if you desire.

## Configuration overrides

Environment variable and `.env` files can be used to customize the expected metadata directory layout. See the built-in `.env` as an example.

## CLI actions

This utility contains a number of actions that can be executed on gamelist.xml romsets.

* `copy` : Copies romset to a destination with optional transformations applied in the process. Minimal extra data transfer overhead to ensure fastest copying (useful for slow microSD cards).
* `duplicates` : Scans `gamelist.xml` looking for repeat occurrances of game `id` values (set by [Skraper](http://skraper.net/)). For any games listed in a `gamelist.Missing.Serial.txt`, it will also attempt to detect possible duplicate names after removing region and token identifiers.
* `playlists` : Scans non-media subdirectories of the romset and will generate `.m3u` playlists for contained files, assuming each are disk files. Uses the subdirectory names as the game names.  Best to run the before any scaping occurs, if needed.
* `image-type` : Updates game entries in `gamelist.xml` to use an alternate image type (eg. box2d, screenshot, etc.), with support for optional fallback types.
* `remove-video` : Removes video snap entries from games in `gamelist.xml`, along with optionally deleting the video snap files. Romsets without snaps are significantly smaller memory and its best to avoid video on low-end systems, like Raspberry Pi Zero.
* `lock` : On Windows systems, sets the `gamelist.xml` as readonly. This is handly to prevent unexpected changes.
* `unlock` : On Windows systems, removes readonly attribute from the `gamelist.xml` file.
* `simplify` : Simplifies a `gamelist.xml`.  Removes description values (usually significantly reducing the `gamelist.xml` memory size and load time), along with options to copy the simplified output and remove unused media asset files.
* `convert` : Converts a romset into a basic undecorated format common in minimal system and third party frontends. Specifically, this can optionally unzip roms, removes `gamelist.xml` and ensures only the desired assets are included, and are included flatly within `./media` under the same name as the roms. This is ideal for [SimpleMenu](https://github.com/fgl82/simplemenu/) on OpenDingux.


Refer to each action's `--help` for more details on each.

## Handling multiple romsets at once

The CLI for `gamelist-utils` has special support for a `-m`/`--multi` option. It specifies the action should be run on a number of subdirectories repeatedly, rather than once on the working directory.

It can be used as a standalong flag to handle all subdirectories:
```
gamelist lock --multi
```

Or can be a comma-separated string value for target subdirectories:
```
gamelist lock --multi=gb,gbc,gba
```

## API usage

All actions supported by `gamelist-utils` can be programmatically invoked via commonjs usage. Each action is lazy-loaded, so minimal code is parsed/executed. Every API is currently setup to return a promise, so `async`/`await` can be used to streamline execution. Options supported in CLI will work in APIs as well.

Example:
```
const { simplify } = require('gamelist-utils');

await simplify(process.cwd(), { quiet: true });
```
Note: `quiet:true` is used to prevent console logging.


## License Information

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
