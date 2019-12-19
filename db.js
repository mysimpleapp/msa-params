const { getGlobalParam, getGlobalParamDef } = require("./param")
const { orm, Orm } = Msa.require("db")

const ParamsDb = orm.define('msa_params', {
	id: { type: Orm.STRING, primaryKey: true },
	value: Orm.STRING
})

async function saveGlobalParam(id) {
	const val = getGlobalParam(id)
	const def = getGlobalParamDef(id)
	await ParamsDb.upsert({
		id,
		value: def.serialize(val)
	})
}

module.exports = { ParamsDb, saveGlobalParam }
