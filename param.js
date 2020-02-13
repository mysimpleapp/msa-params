const exp = module.exports = {}

exp.Param = class {
	constructor(defVal) {
		this.defaultValue = defVal
	}
	get() {
		let val = this.value
		if (val === undefined) val = this.defaultValue
		return val
	}
	getAsDbVal() {
		return this.value
	}
	setFromDbVal(dbVal) {
		this.value = dbVal
	}
	static parseDbStr(dbStr) {
		if (dbStr === undefined || dbStr === null)
			return undefined
		return JSON.parse(dbStr)
	}
	static formatDbVal(dbVal) {
		if (dbVal === undefined || dbVal === null)
			return undefined
		return JSON.stringify(dbVal)
	}
	getAsDbStr() {
		const dbVal = this.getAsDbVal()
		return this.constructor.formatDbVal(dbVal)
	}
	setFromDbStr(dbStr) {
		const dbVal = this.constructor.parseDbStr(dbStr)
		this.setFromDbVal(dbVal)
	}
	static newFromDbStr(dbStr) {
		const res = new this()
		res.setFromDbStr(dbStr)
		return res
	}
	getAsAdminVal() {
		return this.get()
	}
	setFromAdminVal(val) {
		this.value = val
	}
	getDescription() { }
	getViewer() {
		return { tag: "msa-params-viewer" }
	}
	getEditor() {
		return { tag: "msa-params-editor" }
	}
}


exp.ParamDict = class {
	getAsAdminVal() {
		const res = {}
		for (let k in this)
			res[k] = this[k].getAsAdminVal()
		return res
	}
	static updateDbVal(obj, id, val) {
		const keys = splitId(id)
		const lastKey = keys.pop()
		const lastParamsObj = initObjsById(obj, keys)
		lastParamsObj[lastKey] = val
	}
	static parseDbStr(dbStr) {
		if (dbStr === undefined || dbStr === null)
			return undefined
		return JSON.parse(dbStr)
	}
	static formatDbVal(dbVal) {
		if (dbVal === undefined || dbVal === null)
			return undefined
		return JSON.stringify(dbVal)
	}
	setFromDbVal(dbVal) {
		for (let k in this) {
			const v = dbVal ? dbVal[k] : undefined
			this[k].setFromDbVal(v)
		}
	}
	setFromDbStr(dbStr) {
		const dbVal = this.constructor.parseDbStr(dbStr)
		this.setFromDbVal(dbVal)
	}
	static newFromDbStr(dbStr) {
		const res = new this()
		res.setFromDbStr(dbStr)
		return res
	}
	getDescription() { }
}


exp.globalParams = {}
exp.globalParamDefs = new exp.ParamDict()


const getParamById = exp.getParamById = function (rootParam, id) {
	const keys = splitId(id)
	let param = rootParam
	for (let key of keys)
		param = param[key]
	return param
}


function initObjsById(obj, id) {
	const keys = splitId(id)
	for (let key of keys) {
		const p = obj[key]
		if (p === undefined)
			p = obj[key] = {}
		obj = p
	}
	return obj
}


exp.addGlobalParam = function (id, param) {
	if (typeof param === "function")
		param = new param()
	const keys = splitId(id)
	const lastKey = keys.pop()
	const globalParams = exp.globalParams
	const parent = getParamById(globalParams, keys)
	parent[lastKey] = param
	const dbStrs = Msa.msaParamsStartDbStrs
	const applyParamStartDbStr = id => {
		const param = getParamById(globalParams, id)
		const dbStr = dbStrs[id]
		param.setFromDbStr(dbStr)
	}
	if (id in dbStrs)
		applyParamStartDbStr(id)
	const idd = `${id}.`
	for (let id2 in dbStrs)
		if (id2.startsWith(idd))
			applyParamStartDbStr(id2)
}


// ParamBool //////////////////////////////

exp.ParamBool = class extends exp.Param {
	constructor(defVal) {
		super(defVal === true)
	}
	getViewer() {
		return { tag: "msa-params-bool-viewer" }
	}
	getEditor() {
		return { tag: "msa-params-bool-editor" }
	}
}


// ParamStr //////////////////////////////

exp.ParamStr = class extends exp.Param {
	constructor(defVal) {
		super(defVal ? defVal : "")
	}
	static parseDbStr(dbStr) {
		return dbStr
	}
	static formatDbVal(dbVal) {
		return dbVal
	}
	getViewer() {
		return { tag: "msa-params-str-viewer" }
	}
	getEditor() {
		return { tag: "msa-params-str-editor" }
	}
}


// utils

const isArr = Array.isArray

function splitId(id) {
	if (isArr(id)) return id
	if (!id) return []
	return id.split('.')
}