// Create setters for API name to allow lazy loading per-API
const exportAPIs = commands => {
	commands.forEach(name => {
		Object.defineProperty(module.exports, name, {
			configurable: false,
			enumerable: true,
			get: () => {
				require(`./src/utils/env`).load();
				return require(`./src/${name}`).api;
			}
		});
	});
};

exportAPIs([
	// List of commands to export via getters
	// Could be done programmably, but staticly set instead as a signifier of intent
	'backup',
	'collection',
	'convert',
	'copy',
	'duplicates',
	'image-type',
	'image-resize',
	'folder',
	'lock',
	'playlists',
	'thumbnail',
	'marquee',
	'video',
	'retroarch',
	'es-de',
	'simplify',
	'unlock'
]);
