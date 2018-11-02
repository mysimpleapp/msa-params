const msaParams = module.exports = Msa.module("params")

const msaDb = Msa.require("db")
const msaUser = Msa.require("user")

const { ParamsDb } = require("./db")

// admin

require("./admin")

// param desc

msaParams.ParamDesc = class extends Msa.ParamDesc {}
const ParamDescPt = msaParams.ParamDesc.prototype

ParamDescPt.save = function() {
	ParamDescSaveStack = ParamDescSaveStack.then(() => {
		return new Promise( async (ok, ko) => {
			try {
				await ParamsDb.upsert({
					key: this.key,
					value: Msa.getParam(this.key)
				})
			} catch(err) { return ko(err) }
			ok()
		})
	})
}
var ParamDescSaveStack = Promise.resolve()


// register ///////////

msaParams.registerParam  = function(arg1, arg2){
	const targ1 = typeof arg1
	if(targ1 == "string")
		_registerParam(arg1, arg2)
	else if(targ1 == "object")
		for(let key in arg1)
			_registerParam(key, arg1[key])
}
const _registerParam = function(key, desc){
	Msa.paramsDescs[key] = new msaParams.ParamDesc(key, desc)
	const val = Msa.getParam(key)
	if(val === undefined && desc.defVal !== undefined)
		Msa.setParam(key, desc.defVal)
}

