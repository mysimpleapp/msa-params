const { ParamDict, globalParams, getParamById } = require("./param")
const { ParamsDb } = require("./db")
const msaAdmin = Msa.require("admin")

const assert = require('assert')

const exp = module.exports = {}

exp.MsaParamsAdminModule = class extends Msa.Module {

	constructor(){
		super()
		this.initApp()
	}

	async getRootParam(req){
		return globalParams
	}

	async updateParam(req, id, val){
		const rootParam = await this.getRootParam(req)
		const param = getParamById(rootParam, id)
		param.setFromJsonable(val)
		await this.updateParamInDb(req, id, rootParam, param)
	}

	async updateParamInDb(req, id, rootParam, param){
		await ParamsDb.upsert({
			id,
			value: param.getAsDbVal()
		})
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
				param = getParamById(rootParam, id)
			for(let key in param) {
				let value=null, isParams=false, viewer=null, editor=null
				const childParam = param[key]
				const isChildParamDict = (childParam instanceof ParamDict)
				if(!isChildParamDict){
					value = childParam.getAsJsonable()
					viewer = childParam.getViewer()
					editor = childParam.getEditor()
				}
				list.push({ key, value, isParams:isChildParamDict, editable:(!isChildParamDict), viewer, editor })
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

// utils

function urlToId(url){
	return url.replace(/^\//,'')
		.replace(/\/$/,'')
		.replace(/\/+/g,'.')
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

