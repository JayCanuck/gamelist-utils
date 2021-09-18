// Adds or removes folder entries and their corresponding games
const path = require('path');
const fs = require('fs-extra');
const gamelist = require('./utils/gamelist');

const options = {
	boolean: ['desc', 'quiet', 'help'],
	string: ['name', 'desc', 'icon'],
	alias: { n: 'name', d: 'desc', i: 'icon', m: 'multi', q: 'quiet', h: 'help' }
}; // multi omitted as it can be string or boolean

const help = function () {
	console.log('  Usage');
	console.log('    gamelist folder <task> <path> [options]');
	console.log();
	console.log('  Arguments');
	console.log('    task              Task to perform on the named folder and its games');
	console.log('                          Either "add" or "remove"');
	console.log('    path              Directory path of the folder');
	console.log();
	console.log('  Options');
	console.log('    -n, --name        Name for the folder entry in the gamelist');
	console.log('                          Defaults to capitalized directory path name');
	console.log('    -d, --desc        Description for the folder entry in the gamelist');
	console.log('    -i, --icon        Icon source file to copy in as the folder entry icon');
	console.log('    -q, --quiet       Quiet console output');
	console.log('    -m, --multi       Target subdirectories instead of working directory');
	console.log('                          Comma-separated list or "all" for all');
	console.log('    -v, --version     Display version information');
	console.log('    -h, --help        Display help information');
	console.log();
	process.exit(0);
};

const normalize = p => (/^\.{1,2}[\\/]/.test(p) ? p : './' + p).replace(/[\\/]+/g, '/');
const cap = name => name.charAt(0).toUpperCase() + name.slice(1);
const getTitle = name =>
	name
		.split(/\s+/)
		.filter(n => !/^[<[(]/.test(n))
		.map(n => cap(n))
		.join(' ');

const api = async function (dir, { task, folder, name, desc, icon, quiet } = {}) {
	if (icon && !fs.existsSync(icon)) throw new Error('Invalid icon. File not found');
	const media = process.env.GAMELIST_MEDIA || 'media';
	const folderMedia = media + '/' + (process.env.GAMELIST_FOLDERS || 'folders');
	const folderDir = path.resolve(folder);
	const folderBase = path.basename(folder);
	const folderRel = normalize(path.relative(dir, folderDir));
	const { xml, data = {} } = await gamelist.read(dir);
	gamelist.ensureGames(data);

	switch (task) {
		case 'add':
		case 'install': // common alternative
			if (folder && fs.existsSync(folderDir)) {
				let { data: folderData } = await gamelist.read(folderDir);
				if (!folderData) {
					// generate barebones list of children roms from root level files
					folderData = {
						gameList: {
							game: fs
								.readdirSync(folderDir)
								.filter(e => fs.statSync(path.join(folderDir, e)).isFile())
								.map(e => ({
									path: ['./' + e],
									name: [getTitle(e)]
								}))
						}
					};
				}
				gamelist.ensureGames(folderData);
				folderData.gameList.game.forEach(folderGame => {
					// update any of the filepaths to be relative to the root directory
					// rather than the folder directory
					['path', 'image', 'thumbnail', 'marquee', 'video'].forEach(asset => {
						if (folderGame[asset] && folderGame[asset][0]) {
							folderGame[asset][0] = normalize(
								path.relative(dir, path.join(folderDir, folderGame[asset][0]))
							);
						}
					});
					// look for existing entries
					const existing = data.gameList.game.find(
						e => normalize(e.path[0]) === folderGame.path[0]
					);
					if (existing) {
						// update existing (overrides)
						Object.assign(existing, folderGame);
					} else {
						// new game entry for folder game
						data.gameList.game.push(folderGame);
					}
				});

				// add folder entry itself
				data.gameList.folder = data.gameList.folder || [];
				let fIndex = data.gameList.folder.findIndex(
					e => normalize(e.path[0]) === folderRel
				);
				if (fIndex === -1) {
					// create base path/name object for folder entry
					data.gameList.folder.push({
						path: [folderRel],
						name: [getTitle(path.basename(folderRel))]
					});
					fIndex = data.gameList.folder.length - 1;
					// use default icon
					icon = path.join(__dirname, 'assets', 'folder.png');
				}
				// Apply optional metadata/customizations
				if (name) data.gameList.folder[fIndex].name = [name];
				if (desc) data.gameList.folder[fIndex].desc = [desc];
				if (icon) {
					const folderIcon = path.join(dir, folderMedia, folderBase + '.png');
					fs.copySync(icon, folderIcon);
					data.gameList.folder[fIndex].image = [
						'./' + folderMedia + '/' + folderBase + '.png'
					];
				}
				// save xml data
				gamelist.write(xml, data);
				if (!quiet) console.log(`Folder "${folder}" added to "${path.basename(dir)}"`);
			} else {
				throw new Error('Invalid folder path. Directory not found');
			}
			break;
		case 'remove':
		case 'delete': // common alternative
		case 'uninstall': // common alternative
			if (data.gameList.folder && data.gameList.folder.length > 0) {
				const index = data.gameList.folder.findIndex(
					e => normalize(e.path[0]) === folderRel
				);
				// folder found
				if (index >= 0) {
					// remove games from within folder
					data.gameList.game = data.gameList.game.filter(
						e => !normalize(e.path[0]).startsWith(folderRel + '/')
					);
					// remove folder assets
					['image', 'thumbnail'].forEach(asset => {
						if (
							data.gameList.folder[index][asset] &&
							data.gameList.folder[index][asset].length > 0
						) {
							fs.removeSync(path.join(dir, data.gameList.folder[index][asset][0]));
						}
					});
					// delete <system>/media/folders if empty
					const folderMediaDir = path.join(dir, folderMedia);
					if (
						fs.existsSync(folderMediaDir) &&
						fs.statSync(folderMediaDir) &&
						fs.readdirSync(folderMediaDir).length === 0
					) {
						fs.removeSync(folderMediaDir);
					}
					// remove folder metadata
					data.gameList.folder.splice(index, 1);
					// save xml data
					gamelist.write(xml, data);
				}
			}
			if (!quiet) console.log(`Folder "${folder}" removed from "${path.basename(dir)}"`);
			break;
		default:
			throw new Error('Invalid folder task. Must be either "add" or "remove"');
	}
};

module.exports = { options, api, help };
