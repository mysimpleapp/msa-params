const { getGlobalParam, getGlobalParamDef } = require("./param")
const { orm, Orm } = Msa.require("db")

const ParamsDb = orm.define('msa_params', {
	key: { type: Orm.STRING, primaryKey: true },
	value: Orm.STRING
})

async function saveGlobalParam(key) {
	const val = getGlobalParam(key)
	const def = getGlobalParamDef(key)
	await ParamsDb.upsert({
		key,
		value: def.serialize(val)
	})
}

module.exports = { ParamsDb, saveGlobalParam }
