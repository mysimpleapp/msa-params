const msaParams = module.exports = new Msa.Module("params")

const msaDb = Msa.require("db")
const msaUser = Msa.require("user")

const { ParamsDb } = require("./db")

// admin

require("./admin")

// param desc

msaParams.ParamDef = class extends Msa.ParamDef {
	init() {
		const dbVal = Msa.msaParamsStartDbVals[this.key]
		if(dbVal !== undefined)
			this.set(this.parse(dbVal), { save: false })
		else
			super.init()
	}
}
const ParamDefPt = msaParams.ParamDef.prototype

ParamDefPt.save = function() {
	ParamDefSaveStack = ParamDefSaveStack.then(() => {
		return new Promise(async (ok, ko) => {
			try {
				await ParamsDb.upsert({
					key: this.key,
					value: this.format(this.val)
				})
			} catch(err) { return ko(err) }
			ok()
		})
	})
}
let ParamDefSaveStack = Promise.resolve()

ParamDefPt.format = function(val) {
	return JSON.stringify(val)
}

ParamDefPt.parse = function(val) {
	return JSON.parse(val)
}

