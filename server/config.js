var os = require("os");

module.exports = {
	USE_LOCAL_SERVER: !["W-BobchenkovAV2", "EOC"].includes(os.hostname()),
	NAME: process.env.NAME,
	serverParams() {
		return {
			NAME: process.env.NAME,
			MODULES: process.env.MODULES,
			USE_LOCAL_SERVER: !["W-BobchenkovAV2", "EOC"].includes(os.hostname()),
			BASE_URL: process.env.BASE_URL
		}
	}
}