const { ParamsDef, globalParams, globalParamDefs, getParam, getParamDef, setParam } = require("./param")
const { ParamsDb, saveGlobalParam } = require("./db")
const msaAdmin = Msa.require("admin")

const assert = require('assert')

const exp = module.exports = {}

exp.MsaParamsAdminModule = class extends Msa.Module {

	constructor(){
		super()
		this.initApp()
	}

	getRootParamDef(){
		return globalParamDefs
	}

	async getRootParam(){
		return globalParams
	}

	async updateParam(req, key, val){
		const rootParam = await this.getRootParam(req)
		const paramDef = getParamDef(this.getRootParamDef(), key)
		setParam(rootParam, key, paramDef.deserialize(val))
		await saveGlobalParam(key)
	}

	syncUrl(){
		return true
	}

	initApp(){
		this.app.get('/_list', (req, res, next) => this.listMdw("", req, res, next))
		this.app.get('/_list/:key', (req, res, next) => this.listMdw(req.params.key, req, res, next))

		this.app.get('*', (req, res, next) => {
			const key = urlToKey(req.params[0])
			res.sendPage({
				wel:'/params/msa-params-admin.js',
				attrs: {
					key,
					"sync-url": this.syncUrl()
				}
			})
		})

		this.app.post('/', async (req, res, next) => {
			try {
				const { key, value } = req.body
				await this.updateParam(req, key, value)
				res.sendStatus(200)
			} catch(err){ next(err) }
		})
	}

	async listMdw(key, req, res, next){
		try {
			const list = []
			const rootParam = await this.getRootParam(req),
				param = getParam(rootParam, key)
			const paramDef = getParamDef(this.getRootParamDef(), key)
			if(paramDef){ 
				const childParamDefs = paramDef.paramDefs
				for(let k in childParamDefs) {
					let value=null, prettyValue=null, isParams=false, editor=null
					const childParamDef = childParamDefs[k]
					isParams = (childParamDef instanceof ParamsDef)
					if(!isParams){
						let childParamVal = param ? param[k] : undefined
						if(childParamVal === undefined)
							childParamVal = childParamDef.defVal
						value = childParamDef.serialize(childParamVal)
						prettyValue = childParamDef.prettySerialize(childParamVal)
						editor = childParamDef.getEditor()
					}
					list.push({ key:k, value, prettyValue, isParams, editable:(!isParams), editor })
				}
			}
			res.json(list)
		} catch(err) { next(err) }
	}
}


const msaAdminParams = new exp.MsaParamsAdminModule()

msaAdmin.register({
	route: '/params',
	app: msaAdminParams.app,
	title: "Params",
	help: "Manage all the website parameters."
})


// local

exp.MsaParamsAdminLocalModule = class extends exp.MsaParamsAdminModule {

	constructor(kwargs){
		super()
		Object.assign(this, kwargs)
		checkVal(this, "paramDef")
		checkVal(this, "db")
		checkVal(this, "dbPkCols")
		defVal(this, "dbParamsCol", "params")
	}

	getRootParamDef(){
		return this.paramDef
	}

	async getRootParam(req){
		const row = (await this.db.findOne({
			attributes: [ this.dbParamsCol ],
			where: toPkWhere(this.dbPkCols, req.msaParamsArgs.dbPkVals)
		}))
		const dbParams = row ? row[this.dbParamsCol] : null
		return dbParams
	}

	async updateParam(req, key, val){
		const rootParamDef = this.getRootParamDef()
		let rootParam = await this.getRootParam(req)
		if(!rootParam) rootParam = {}
		const paramDef = getParamDef(rootParamDef, key)
		setParam(rootParam, key, paramDef.deserialize(val))
		await this.db.update({
			[ this.dbParamsCol ]: rootParam
		}, {
			where: toPkWhere(this.dbPkCols, req.msaParamsArgs.dbPkVals)
		})
	}

	syncUrl(){
		return false
	}
}

// utils

function urlToKey(url){
	return url.replace(/^\//,'')
		.replace(/\/$/,'')
		.replace(/\/+/g,'.')
}

function splitKey(key){
	return key ? key.split('.') : []
}

function checkVal(obj, key){
	if(obj[key] === undefined)
		throw `${obj.constructor.name}.${key} is not defined`
}

function defVal(kwargs, key, dVal){
	if (kwargs[key] === undefined)
		kwargs[key] = dVal
}

function toPkWhere(dbPkCols, dbPkVals){
	assert(dbPkCols.length == dbPkVals.length, "dbPkCols.length == dbPkVals.length")
	const res = {}
	for(let i=0, len=dbPkCols.length; i<len; ++i)
		res[dbPkCols[i]] = dbPkVals[i]
	return res
}

