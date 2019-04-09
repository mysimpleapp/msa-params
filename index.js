const msaParams = module.exports = new Msa.Module()

// Param

msaParams.Param = class extends Msa.Param {
	init() {
console.warn(`[DEPRECATED] msaParams.Param: "${this.key}"`)
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
	ParamSaveStack = ParamSaveStack.then(async () => {
		await ParamsDb.upsert({
			key: this.key,
			value: this.format(this.val)
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


// Msa.ParamDef

msaParams.globalParams = {}
msaParams.globalParamDefs = {}

msaParams.ParamDef = class {
	constructor(kwargs){
		Object.assign(this, kwargs)
	}
	deserialize(val){
		return this.parse(JSON.parse(val))
	}
	serialize(val){
		return JSON.stringify(this.format(val))
	}
	parse(val){
		return val
	}
	format(val){
		return val
	}
	getStartVal(key){
		let val = Msa.msaParamsStartDbVals[key]
		if(val !== undefined) return this.parse(val)
		return this.defVal
	}
}

msaParams.ParamsDef = class {
	constructor(kwargs){
		this.paramDefs = {}
		Object.assign(this, kwargs)
	}
	get(key){
		return this.paramDefs[key]
	}
	add(key, paramDef){
		this.paramDefs[key] = paramDef
	}
	deserialize(val){
		return this.parse(JSON.parse(val))
	}
	serialize(val){
		return JSON.stringify(this.format(val))
	}
	parse(val){
		const res = {}, paramDefs = this.paramDefs
		if(!val) return res
		for(let key in paramDefs){
			const val2 = val[key]
			if(val2 !== undefined)
				res[key] = paramDefs[key].parse(val2)
		}
		return res
	}
	format(val){
		const res = {}, paramDefs = this.paramDefs
		for(let key in paramDefs){
			const val2 = val[key]
			if(val2 !== undefined)
				res[key] = paramDefs[key].format(val2)
		}
		return res
	}
	getStartVal(key){
		const res = {}, paramDefs = this.paramDefs
		for(let key2 in paramDefs){
			const val2 = paramDefs[key2].getStartVal(`${key}.${key2}`)
			if(val2 !== undefined)
				res[key2] = val2
		}
		return res
	}
}

msaParams.addGlobalParam = function(key, paramDef){
	if(msaParams.globalParamDefs[key] !== undefined){
		console.warning(`Params with key "${key}" already registered !`)
		return
	}
	msaParams.globalParamDefs[key] = paramDef
	msaParams.globalParams[key] = paramDef.getStartVal(key)
}

msaParams.getGlobalParam = function(key) {
	let param = msaParams.globalParams
	const keySplit = key.split('.')
	for(let s in keySplit){
		param = param[s]
		if(param === undefined) return
	}
	return param
}

msaParams.saveGlobalParam = async function(key) {
	const val = msaParams.getGlobalParam(key)
	const def = msaParams.globalParamDefs[key]
	await ParamsDb.upsert({
		key,
		value: def.format(val)
	})
}


// other dependencies (at the end to avoid cycling deps)

ParamsDb = require("./db").ParamsDb
require("./admin")

