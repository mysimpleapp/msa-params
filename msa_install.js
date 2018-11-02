module.exports = async (itf, next) => {
	try {
		// create table in DB
		await itf.installMsaMod("db", "msa-db")
		const { ParamsDb } = require("./db")
		await ParamsDb.sync()
		// other deps
		await itf.installMsaMod("user", "msa-user")
	} catch(err) { return next(err) }
	next()
}
