const exp = module.exports = {}

// Param [DEPRECATED]

exp.Param = class extends Msa.Param {
	init() {
console.warn(`[DEPRECATED] msaParams.Param: "${this.key}"`)
		const dbVal = Msa.msaParamsStartDbVals[this.key]
		if(dbVal !== undefined)
			this.set(this.parse(dbVal), { save: false })
		else
			super.init()
	}
}
const ParamPt = exp.Param.prototype

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


// ParamStr [DEPRECATED] //////////////////////////////

exp.ParamStr = class extends exp.Param {
	format(val) {
		return val
	}
	parse(val) {
		return val
	}
}


// Msa.ParamDef //////////////////////////////////

exp.ParamDef = class {
	constructor(kwargs){
		Object.assign(this, kwargs)
	}
	deserialize(val){
		return isDef(val) ? this.parse(JSON.parse(val)) : val
	}
	serialize(val){
		return isDef(val) ? JSON.stringify(this.format(val)) : val
	}
	prettySerialize(val){
		return this.serialize(val)
	}
	parse(val){
		return val
	}
	format(val){
		return val
	}
	getStartVal(id){
		let val
		if(Msa.msaParamsStartDbVals) val = Msa.msaParamsStartDbVals[id]
		if(val !== undefined) return this.deserialize(val)
		return this.defVal
	}
	getEditor(){
		return null
	}
}

exp.ParamsDef = class {
	constructor(kwargs){
		this.paramDefs = {}
		Object.assign(this, kwargs)
	}
	get(key){
		return this.paramDefs[key]
	}
	deepGet(key, ...subKeys){
		const childParamDef = this.get(key)
		return subKeys.length ? childParamDef.get(...subKeys) : childParamDef
	}
	add(key, paramDef){
		this.paramDefs[key] = paramDef
	}
	deserialize(val){
		return isDef(val) ? this.parse(JSON.parse(val)) : val
	}
	serialize(val){
		return isDef(val) ? JSON.stringify(this.format(val)) : val
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
	getStartVal(id){
		const res = {}, paramDefs = this.paramDefs
		for(let key in paramDefs){
			const val = paramDefs[key].getStartVal(`${id}.${key}`)
			if(val !== undefined)
				res[key] = val
		}
		return res
	}
}

exp.globalParams = {}
exp.globalParamDefs = new exp.ParamsDef()

exp.addGlobalParam = function(id, paramDef){
	if(exp.globalParamDefs[id] !== undefined){
		console.warning(`Params with id "${id}" already registered !`)
		return
	}
	exp.globalParamDefs.add(id, paramDef)
	exp.globalParams[id] = paramDef.getStartVal(id)
}
/*
exp.getGlobalParam = function(key) {
	let param = exp.globalParams
	const keySplit = key ? key.split('.') : []
	for(let s of keySplit){
		param = param[s]
		if(param === undefined) return
	}
	return param
}

exp.getGlobalParamDef = function(key) {
	let paramDef = exp.globalParamDefs
	const keySplit = key ? key.split('.') : []
	for(let s of keySplit){
		const paramDefs = paramDef.paramDefs
		if(paramDefs === undefined) return
		paramDef = paramDefs[s]
		if(paramDef === undefined) return
	}
	return paramDef
}

exp.setGlobalParam = function(key, val) {
	let param = exp.globalParams
	const keySplit = key ? key.split('.') : []
	const keySplitLength = keySplit.length
	for(let i=0; i<keySplitLength-1; ++i){
		param = param[keySplit[i]]
	}
	param[keySplit[keySplitLength-1]] = val
}

exp.saveGlobalParam = async function(key) {
	const val = exp.getGlobalParam(key)
	const def = exp.getGlobalParamDef(key)
	await ParamsDb.upsert({
		key,
		value: def.serialize(val)
	})
}
*/
exp.getParam = function(param, key){
	const keySplit = splitKeyPath(key)
	for(let k of keySplit)
		if(param === undefined)
			return undefined
		else
			param = param[k]
	return param
}

exp.getParamDef = function(paramDef, keyPath){
	const keys = splitKeyPath(keyPath)
	for(let k of keys)
		if(paramDef === undefined)
			return undefined
		else
			paramDef = paramDef.paramDefs[k]
	return paramDef
}

exp.setParam = function(param, keyPath, val){
	const keys = splitKeyPath(keyPath),
		keysLen = keys.length
	for(let i=0; i<keysLen-1; ++i){
		const k = keys[i]
		let childParam = param[k]
		if(childParam === undefined)
			childParam = param[k] = {}
		param = childParam
	}
	param[keys[keysLen-1]] = val
}

exp.getGlobalParam = function(id) {
	return exp.getParam(exp.globalParams, id)
}

exp.getGlobalParamDef = function(id) {
	return exp.getParamDef(exp.globalParamDefs, id)
}

exp.setGlobalParam = function(id, val){
	exp.setParam(exp.globalParams, id, val)
}

// TO DEPRECATE
function deepGetParam(params, key, ...subKeys){
	const param = params[key]
	return subKeys.length ? deepGetParam(param, ...subKeys) : param
}
exp.deepGetParam = deepGetParam

// TO DEPRECATE
function deepSetParam(params, key, arg, ...subArgs){
	if(subArgs.length)
		deepSetParam(params[key], arg, ...subArgs)
	else
		params[key] = arg
}
exp.deepSetParam = deepSetParam



// ParamStr //////////////////////////////

exp.ParamStrDef = class extends exp.ParamDef {
	deserialize(val){
		return val
	}
	serialize(val){
		return val
	}
}


// utils

function isDef(val){
	return val!==undefined && val!==null
}

function splitKeyPath(key){
	if(!key) return []
	return key.split('.')
}
