const msaParams = module.exports = new Msa.Module()

// Param

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

let ParamsDb
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

// other dependencies (at the end to avoid cycling deps)

ParamsDb = require("./db").ParamsDb
require("./admin")

