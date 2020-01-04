module.exports = async () => {
	// retrieve params from DB
	const { ParamsDb } = require("./db")
	const dbParams = await ParamsDb.findAll({
		attributes: ['id', 'value']
	})
	// save param in global var
	Msa.msaParamsStartDbVals = {}
	for(let p of dbParams) {
		Msa.msaParamsStartDbVals[p.id] = p.value
		// inform that paramater exists
		// but without initialising it (as this would require param's defnitions)
//		Msa.setParam(p.id, null, { save: false })
	}
}

