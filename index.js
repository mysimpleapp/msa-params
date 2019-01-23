const msaParams = module.exports = new Msa.Module("params")

const msaDb = Msa.require("db")
const msaUser = Msa.require("user")

const { ParamsDb } = require("./db")

// admin

require("./admin")

// param desc

msaParams.Param = class extends Msa.Param {
	init() {
		const dbVal = Msa.msaParamsStartDbVals[this.key]
		if(dbVal !== undefined)
			this.set(this.parse(dbVal), { save: false })
		else
			super.init()
	}
}
const ParamPt = msaParams.Param.prototype

ParamPt.save = function() {
	ParamSaveStack = ParamSaveStack.then(() => {
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
let ParamSaveStack = Promise.resolve()

ParamPt.format = function(val) {
	return JSON.stringify(val)
}

ParamPt.parse = function(val) {
	return JSON.parse(val)
}


// ParamStr //////////////////////////////

msaParams.ParamStr = class extends msaParams.Param {
	format(val) {
		return val
	}
	parse(val) {
		return val
	}
}
