const exp = module.exports = {}

const noDefaults = { noDefaults: true }

exp.Param = class {
	constructor(val){
		this.value = val
	}
	get(){
		return this.value
	}
	getAsJsonable(kwargs){
		return this.value
	}
	setFromJsonable(val){
		this.value = val
	}
	getAsDbVal(){
		const val = this.getAsJsonable(noDefaults)
		if(val !== undefined)
			return JSON.stringify(val)
	}
	setFromDbVal(val){
		if(val === undefined || val === null)
			val = undefined
		else
			val = JSON.parse(val)
		this.setFromJsonable(val)
	}
	static newFromDbVal(val){
		const res = new this()
		res.setFromDbVal(val)
		return res
	}
	getDescription(){}
	getViewer(){
		return { tag:"msa-params-viewer" }
	}
	getEditor(){
		return { tag:"msa-params-editor" }
	}
}


exp.ParamDict = class {
	getAsJsonable(kwargs){
		const res = {}
		for(let k in this)
			res[k] = this[k].getAsJsonable(kwargs)
		return res
	}
	setFromJsonable(val){
		for(let k in this){
			const v = val ? val[k] : undefined
			this[k].setFromJsonable(v)
		}
	}
	getAsDbVal(){
		const val = this.getAsJsonable(noDefaults)
		if(val !== undefined)
			return JSON.stringify(val)
	}
	setFromDbVal(val){
		if(val === undefined || val === null)
			val = undefined
		else
			val = JSON.parse(val)
		this.setFromJsonable(val)
	}
	static newFromDbVal(val){
		const res = new this()
		res.setFromDbVal(val)
		return res
	}
	getDescription(){}
}


exp.globalParams = {}
exp.globalParamDefs = new exp.ParamDict()


const getParamById = exp.getParamById = function(rootParam, id){
	const keys = splitId(id)
	let param = rootParam
	for(let key of keys)
		param = param[key]
	return param
}

exp.addGlobalParam = function(id, param){
	if(typeof param === "function")
		param = new param()
	const keys = splitId(id)
	const lastKey = keys.pop()
	const globalParams = exp.globalParams
	const parent = getParamById(globalParams, keys)
	parent[lastKey] = param
	const dbVals = Msa.msaParamsStartDbVals
	const applyParamStartDbVal = id => {
		const param = getParamById(globalParams, id)
		const dbVal = dbVals[id]
		param.setFromDbVal(dbVal)
	}
	if(id in dbVals)
		applyParamStartDbVal(id)
	const idd = `${id}.`
	for(let id2 in dbVals)
		if(id2.startsWith(idd))
			applyParamStartDbVal(id2)
}


// ParamStr //////////////////////////////

exp.ParamStr = class extends exp.Param {
	getAsDbVal(){
		return this.getAsJsonable()
	}
	setFromDbVal(val){
		this.setFromJsonable(val)
	}
	getViewer(){
		return { tag:"msa-params-text-viewer" }
	}
	getEditor(){
		return { tag:"msa-params-text-editor" }
	}
}


// utils

const isArr = Array.isArray

function splitId(id){
	if(isArr(id)) return id
	if(!id) return []
	return id.split('.')
}