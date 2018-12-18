module.exports = async function(next){
	try {
		// retrieve params from DB
		const { ParamsDb } = require("./db")
		const dbParams = await ParamsDb.findAll({
			attributes: ['key', 'value']
		})
		// save param in global var
		Msa.msaParamsStartDbVals = {}
		for(let p of dbParams) {
			Msa.msaParamsStartDbVals[p.key] = p.value
			// inform that paramater exists
			// but without initialising it (as this would require param's defnitions)
			Msa.setParam(p.key, null, { save: false })
		}
		next()
	} catch(err) { next(err) }
}

