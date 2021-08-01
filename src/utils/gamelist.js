const path = require('path');
const fs = require('fs-extra');
const { Parser, Builder } = require('xml2js');

const update = async function (dir, handler) {
	const xml = path.join(dir, 'gamelist.xml');
	if (fs.existsSync(xml)) {
		const data = await new Parser().parseStringPromise(
			fs.readFileSync(xml, { encoding: 'utf8' })
		);
		data.gameList.game.forEach(handler);
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
	}
};

module.exports = { update };
