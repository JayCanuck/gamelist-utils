const path = require('path');
const fs = require('fs-extra');

let loaded = false;

const load = function () {
	if (loaded) return;
	[
		path.join(__dirname, '.env'),
		`.env.${process.env.NODE_ENV || 'development'}.local`,
		`.env.${process.env.NODE_ENV || 'development'}`,
		'.env'
	].forEach(env => fs.existsSync(env) && require('dotenv').config({ path: env }));
	loaded = true;
};

module.exports = { load };
