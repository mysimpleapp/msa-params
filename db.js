// DB model
const { orm, Orm } = Msa.require("db")
const ParamsDb = orm.define('msa_params', {
	key: { type: Orm.STRING, primaryKey: true },
	value: Orm.STRING
})

module.exports = { ParamsDb }
