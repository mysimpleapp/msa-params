const { db } = Msa.require("db")

module.exports = async function () {
	Msa.msaParamsStartDbVals = {}
	// retrieve params from DB
	await db.collection("msa_params").find({}).forEach(doc => {
		Msa.msaParamsStartDbVals[doc._id] = doc.value
	})
	return new Msa.Module()
}
