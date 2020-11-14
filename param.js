class Param {
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
	static newFromDbVal(dbVal) {
		const res = new this()
		res.setFromDbVal(dbVal)
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


class ParamDict {
	getAsDbVal() {
		const res = {}
		let hasVal = false
		for (let k in this) {
			const v = this[k].getAsDbVal()
			if (v === undefined || v === null)
				continue
			res[k] = v
			hasVal = true
		}
		return hasVal ? res : null
	}
	setFromDbVal(dbVal) {
		for (let k in this) {
			const v = dbVal ? dbVal[k] : undefined
			this[k].setFromDbVal(v)
		}
	}
	static newFromDbVal(dbVal) {
		const res = new this()
		res.setFromDbVal(dbVal)
		return res
	}
	getAsAdminVal() {
		const res = {}
		for (let k in this)
			res[k] = this[k].getAsAdminVal()
		return res
	}
	getDescription() { }
}


const globalParams = {}
const globalParamDefs = new ParamDict()


function getParamById(rootParam, id) {
	const keys = splitId(id)
	let param = rootParam
	for (let key of keys)
		param = param[key]
	return param
}


function addGlobalParam(id, param) {
	if (typeof param === "function")
		param = new param()
	const keys = splitId(id)
	const lastKey = keys.pop()
	const parent = getParamById(globalParams, keys)
	parent[lastKey] = param
	const dbVals = Msa.msaParamsStartDbVals
	const applyParamStartDbVal = id => {
		const param = getParamById(globalParams, id)
		const dbVal = dbVals[id]
		param.setFromDbVal(dbVal)
	}
	if (id in dbVals)
		applyParamStartDbVal(id)
	const idd = `${id}.`
	for (let id2 in dbVals)
		if (id2.startsWith(idd))
			applyParamStartDbVal(id2)
}


// ParamBool //////////////////////////////

class ParamBool extends Param {
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

class ParamStr extends Param {
	constructor(defVal) {
		super(defVal ? defVal : "")
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

// export

module.exports = {
	Param,
	ParamDict,
	globalParams,
	globalParamDefs,
	getParamById,
	addGlobalParam,
	ParamBool,
	ParamStr
}