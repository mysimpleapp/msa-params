const { ParamDict, globalParams, getParamById } = require("./param")
const { withDb } = Msa.require("db")
const msaAdmin = Msa.require("admin")

const exp = module.exports = {}

exp.MsaParamsAdminModule = class extends Msa.Module {

	constructor(){
		super()
		this.initApp()
	}

	async getCtxRootParam(ctx){
		const res = ctx.rootParam
		if(!res) res = ctx.rootParam = await this.getRootParam(ctx)
		return res
	}

	async getRootParam(ctx){
		return globalParams
	}

	async getCtxParam(ctx){
		const res = ctx.param
		if(!res){
			const rootParam = await this.getCtxRootParam(ctx)
			res = ctx.param = getParamById(rootParam, ctx.id)
		}
		return res
	}

	async updateParam(ctx, val){
		const param = await this.getCtxParam(ctx)
		param.setFromJsonable(val)
		await this.updateParamInDb(ctx)
	}

	async updateParamInDb(ctx){
		const fields = { id:ctx.id, value:ctx.param.getAsDbVal() }
		const res = await ctx.db.run("UPDATE msa_params SET value=:value WHERE id=:id", fields)
		if(res.nbChanges === 0)
			await ctx.db.run("INSERT INTO msa_params (id, value) VALUES (:id,:value)", fields)
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

		this.app.post('/', (req, res, next) => {
			withDb(async db => {
				const { id, value } = req.body
				const ctx = { req, db, id }
				await this.updateParam(ctx, value)
				res.sendStatus(200)
			}).catch(next)
		})
	}

	async listMdw(id, req, res, next){
		withDb(db => {
			const ctx = { req, db, id }
			const param = this.getCtxParam(ctx)
			const list = []
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
		}).catch(next)
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
