const path = require('path');
const fs = require('fs-extra');
const { Parser, Builder } = require('xml2js');

const read = async function (dir) {
	const xml = path.join(dir, 'gamelist.xml');
	if (!fs.existsSync(xml)) return { xml, data: null, provider: null };
	const data = await new Parser().parseStringPromise(fs.readFileSync(xml, { encoding: 'utf8' }));
	return { xml, data, provider: getProvider(data) };
};

const write = function (xml, data) {
	try {
		fs.writeFileSync(xml, new Builder().buildObject(data), { encoding: 'utf8' });
	} catch (e) {
		if (e?.code === 'EPERM' && process.platform === 'win32') {
			console.error('Permission error accessing gamelist.xml.');
			console.error(
				"If you've previously locked the file as readonly, " +
					'unlock it then retry this command.'
			);
		} else {
			throw e;
		}
	}
};

const getProvider = function (data) {
	const provider =
		data.gameList.provider && data.gameList.provider.length > 0
			? { ...(data.gameList.provider[0] || {}) }
			: {};
	Object.keys(provider).forEach(key => {
		if (Array.isArray(provider[key])) provider[key] = provider[key][0];
	});

	// Caps fix for System
	provider.system = provider.System;
	delete provider.System;

	return provider;
};

const ensureGames = function (data = {}) {
	data.gameList = data.gameList || {};
	data.gameList.game = data.gameList.game || [];
	data.gameList.game.forEach(game => {
		game.path = game.path || [];
		game.path[0] = game.path[0] || '';
	});
	if (data.gameList.folder && data.gameList.folder.length > 0) {
		data.gameList.folder.forEach(folder => {
			folder.path = folder.path || [];
			folder.path[0] = folder.path[0] || '';
		});
	}
	return data;
};

const forEach = async function (dir, handler) {
	const { data, provider } = await read(dir);
	if (!data || !data.gameList || !Array.isArray(data.gameList.game)) return;
	data.gameList.game.forEach((game, ...rest) => handler(game, provider, ...rest));
};

const update = async function (dir, handler) {
	const { xml, data, provider } = await read(dir);
	if (!data || !data.gameList || !Array.isArray(data.gameList.game)) return;
	data.gameList.game.forEach((game, index, list) => handler(game, provider, index, list));
	write(xml, data);
};

module.exports = { read, write, ensureGames, forEach, update };
