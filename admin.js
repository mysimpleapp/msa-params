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

	async updateParam(req, id, val){
		const rootParam = await this.getRootParam(req)
		const paramDef = getParamDef(this.getRootParamDef(), id)
		setParam(rootParam, id, paramDef.deserialize(val))
		await saveGlobalParam(id)
	}

	syncUrl(){
		return true
	}

	initApp(){
		this.app.get('/_list', (req, res, next) => this.listMdw("", req, res, next))
		this.app.get('/_list/:id', (req, res, next) => this.listMdw(req.params.id, req, res, next))

		this.app.get('*', (req, res, next) => {
			const id = urlToId(req.params[0])
			res.sendPage({
				wel:'/params/msa-params-admin.js',
				attrs: {
					"params-id": id,
					"sync-url": this.syncUrl()
				}
			})
		})

		this.app.post('/', async (req, res, next) => {
			try {
				const { id, value } = req.body
				await this.updateParam(req, id, value)
				res.sendStatus(200)
			} catch(err){ next(err) }
		})
	}

	async listMdw(id, req, res, next){
		try {
			const list = []
			const rootParam = await this.getRootParam(req),
				param = getParam(rootParam, id)
			const paramDef = getParamDef(this.getRootParamDef(), id)
			if(paramDef){ 
				const childParamDefs = paramDef.paramDefs
				for(let key in childParamDefs) {
					let value=null, prettyValue=null, isParams=false, editor=null
					const childParamDef = childParamDefs[key]
					isParams = (childParamDef instanceof ParamsDef)
					if(!isParams){
						let childParamVal = param ? param[key] : undefined
						if(childParamVal === undefined)
							childParamVal = childParamDef.defVal
						value = childParamDef.serialize(childParamVal)
						prettyValue = childParamDef.prettySerialize(childParamVal)
						editor = childParamDef.getEditor()
					}
					list.push({ key, value, prettyValue, isParams, editable:(!isParams), editor })
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

	async updateParam(req, id, val){
		const rootParamDef = this.getRootParamDef()
		let rootParam = await this.getRootParam(req)
		if(!rootParam) rootParam = {}
		const paramDef = getParamDef(rootParamDef, id)
		setParam(rootParam, id, paramDef.deserialize(val))
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

function urlToId(url){
	return url.replace(/^\//,'')
		.replace(/\/$/,'')
		.replace(/\/+/g,'.')
}
/*
function splitKey(key){
	return key ? key.split('.') : []
}
*/
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

