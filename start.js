const { withDb } = Msa.require("db")

module.exports = async function () {
	await withDb(async db => {
		// retrieve params from DB
		const dbParams = await db.get(
			"SELECT id, value FROM msa_params")
		// save param in global var
		Msa.msaParamsStartDbStrs = {}
		for (let p of dbParams) {
			Msa.msaParamsStartDbStrs[p.id] = p.value
			// inform that paramater exists
			// but without initialising it (as this would require param's defnitions)
			//		Msa.setParam(p.id, null, { save: false })
		}
	})
	return new Msa.Module()
}