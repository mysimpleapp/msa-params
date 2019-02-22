module.exports = async itf => {
	// create table in DB
	const { ParamsDb } = require("./db")
	await ParamsDb.sync()
}
