# gamelist-utils  [![NPM](https://img.shields.io/npm/v/gamelist-utils.svg?logo=npm)](https://www.npmjs.com/package/gamelist-utils) [![GitHub Actions](https://github.com/jaycanuck/gamelist-utils/actions/workflows/lint.yml/badge.svg)](https://github.com/JayCanuck/gamelist-utils/actions/workflows/lint.yml)
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
npx gamelist-utils [...]
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

Within the `./skraper` [subdirectory of this repo](https://github.com/JayCanuck/gamelist-utils/tree/main/skraper), I've inclused 2 of my favourite custom Skraper mixes whcich use my preferred fallbacks. Feel free to use them if you desire.

## Configuration overrides

Environment variable and `.env` files can be used to customize the expected metadata directory layout. See the [included default `.env`](https://github.com/JayCanuck/gamelist-utils/blob/main/.env) as an example.

## CLI actions

This utility contains a number of actions that can be executed on gamelist.xml romsets.

* `backup` : Creates a backup copy of `gamelist.xml` as `gamelist.xml.bak`.
* `copy` : Copies romset to a destination with optional transformations applied in the process. Minimal extra data transfer overhead to ensure fastest copying (useful for slow microSD cards).
* `duplicates` : Scans `gamelist.xml` looking for repeat occurrances of game `id` values (set by [Skraper](http://skraper.net/)). For any games listed in a `gamelist.Missing.Serial.txt`, it will also attempt to detect possible duplicate names after removing region and token identifiers.
* `collection` : Creates a rom list collection `.cfg` file that can be used with EmulationStation. Supports filters for quick game list mapping.
* `playlists` : Scans non-media subdirectories of the romset and will generate `.m3u` playlists for contained files, assuming each are disk files. Uses the subdirectory names as the game names.  Best to run the before any scaping occurs, if needed.
* `image-type` : Updates game entries in `gamelist.xml` to use an alternate image type (eg. box2d, screenshot, etc.), with support for optional fallback types.
* `image-type` : Resizes images of a particular type (eg. box2d, screenshot, etc.) to desired dimensions with a variety of object-fit strategies.
* `thumbnail` : Adds or removes thumbnail image entries from games in `gamelist.xml`, along with optionally generating/deleting thumbnail image files. Only some themes support `<thumbnail>` tag, but for those that do, a small scaled down version of a game asset will help improve loading performance of large themes with thumbnail grids.
* `marquee` : Adds or removes marquee image entries from games in `gamelist.xml`, along with optionally deleting the marquee image files. Not all themes support marquee tags, so removing them when not needed can result in a smaller `gamelist.xml` (and thus quicker initial load time).
* `video` : Adds or removes video snap entries from games in `gamelist.xml`, along with optionally deleting the video snap files. Romsets without snaps are significantly smaller memory and its best to avoid video on low-end systems, like Raspberry Pi Zero.
* `lock` : On Windows systems, sets the `gamelist.xml` as readonly. This is handly to prevent unexpected changes.
* `unlock` : On Windows systems, removes readonly attribute from the `gamelist.xml` file.
* `simplify` : Simplifies a `gamelist.xml`.  Removes description values (usually significantly reducing the `gamelist.xml` memory size and load time), along with options to copy the simplified output and remove unused media asset files.
* `simplement` : Converts a romset into a basic un-decorated format ideal for [SimpleMenu](https://github.com/fgl82/simplemenu/) on OpenDingux. Specifically, this command optionally unzips roms, removes `gamelist.xml` and ensures only the desired assets are included, and are included flatly within `./media` under the same name as the roms.
* `retroarch` : Scans a RetroArch location's playlist files and symlinks in any associated media files. Supports updating game names in playlist from `gamelist.xml`.
* `es-de` : Symlinks `gamelist.xml` file and associated scraped media directories to the EmulationStation-DE downloaded media location.


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

## Rom List Filters

Various actions in this utility support a `-f`/`--filter` option, to specify a filter JSON file.  Filter files support 2 root array values `"include"` and `"exclude"`. Each item in these arrays can match the various game metadata tags and includes or excludes games accordingly. This is highly valuable with generationg collection files and copying a subset of rom files (via the `collection` and `copy` actions respectively).  Metadata values must match 100% or can have a `Contains` suffix for a loose match containing the value referenced.

For example, a filter that detects `"Duck Hunt"` specifically and any game rom containing `"Mario"`:
```
{
    "include": [
        { "name": "Duck Hunt"},
        { "nameContains": "Mario"}
    ]
}
```

There are also 2 specific properties, `id` and `system`, which can be matched directly. The `"id"` value corresponds to the `id` attribute on the `<game>` tag (aka the ScreenScraper game ID number). The `"system"` value corresponds to the `<System>` tag within the xml file's `<provider>` (aka the system name text for the game).  The combination allows for multi-system filters and filters that match roms without needing specific filenames.

For example, this filter will only include these 5 specific games, 3 on PCEngine/Turbografx, 1 on SuperGrafx and 1 on PCEngine-CD/Turbografx-CD, refardless of the rom filenames:
```
{
	"include": [
		{ "id": "14526", "system": "NEC PC Engine" },
		{ "id": "59382", "system": "NEC PC Engine SuperGrafx" },
		{ "id": "14543", "system": "NEC PC Engine" },
		{ "id": "103574", "system": "NEC PC Engine CD-Rom" },
		{ "id": "59796", "system": "NEC PC Engine" }
    ]
}
```
One obvious caveat, however, is that the `gamelist.xml` must have been generated as expected, with ScreenScaper metadata.

A set of premade "Top 35" filters, based off Wikipedia game sales statistics, can be found in the `./filters` directory of this repository.

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
