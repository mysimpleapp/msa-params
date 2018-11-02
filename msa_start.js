module.exports = async function(next){
	try {
		// fill params from DB
		const { ParamsDb } = require("./db")
		const dbParams = await ParamsDb.findAll({
			attributes: ['key', 'value']
		})
		for(var p of dbParams)
			Msa.setParamCore(Msa.params, p.key, p.value)
		next()
	} catch(err) { next(err) }
}

