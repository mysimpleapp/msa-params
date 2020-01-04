const { orm, Orm } = Msa.require("db")

const ParamsDb = orm.define('msa_params', {
	id: { type: Orm.STRING, primaryKey: true },
	value: Orm.STRING
})

module.exports = { ParamsDb }
