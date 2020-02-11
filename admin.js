const { ParamDict, globalParams, getParamById } = require("./param")
const { withDb } = Msa.require("db")
const msaAdmin = Msa.require("admin")

const exp = module.exports = {}

exp.MsaParamsAdminModule = class extends Msa.Module {

	constructor() {
		super()
		this.initApp()
	}

	async getRootParam(ctx) {
		return globalParams
	}

	async updateParam(ctx, rootParam, id, val) {
		const param = getParamById(rootParam, id)
		param.setFromJsonable(val)
		await this.updateParamInDb(ctx, rootParam, id, param)
	}

	async updateParamInDb(ctx, rootParam, id, param) {
		const fields = { id, value: param.getAsDbVal() }
		const res = await ctx.db.run("UPDATE msa_params SET value=:value WHERE id=:id", fields)
		if (res.nbChanges === 0)
			await ctx.db.run("INSERT INTO msa_params (id, value) VALUES (:id,:value)", fields)
	}

	syncUrl() {
		return true
	}

	initApp() {
		this.app.get('/_list', (req, res, next) => this.listMdw("", req, res, next))
		this.app.get('/_list/:id', (req, res, next) => this.listMdw(req.params.id, req, res, next))

		this.app.get('*', (req, res, next) => {
			const id = urlToId(req.params[0])
			res.sendPage({
				wel: '/params/msa-params-admin.js',
				attrs: {
					"params-id": id,
					"sync-url": this.syncUrl()
				}
			})
		})

		this.app.post('/', (req, res, next) => {
			withDb(async db => {
				const { id, value } = req.body
				const ctx = newCtx(req, { db })
				const rootParam = await this.getRootParam(ctx)
				await this.updateParam(ctx, rootParam, id, value)
				res.sendStatus(200)
			}).catch(next)
		})
	}

	listMdw(id, req, res, next) {
		withDb(async db => {
			const ctx = newCtx(req, { db })
			const rootParam = await this.getRootParam(ctx)
			const param = getParamById(rootParam, id)
			const list = []
			for (let key in param) {
				let value = null, isParams = false, viewer = null, editor = null
				const childParam = param[key]
				const isChildParamDict = (childParam instanceof ParamDict)
				if (!isChildParamDict) {
					value = childParam.getAsJsonable()
					viewer = childParam.getViewer()
					editor = childParam.getEditor()
				}
				list.push({ key, value, isParams: isChildParamDict, editable: (!isChildParamDict), viewer, editor })
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

function newCtx(req, kwargs) {
	const ctx = Object.create(req)
	Object.assign(ctx, kwargs)
	return ctx
}

function urlToId(url) {
	return url.replace(/^\//, '')
		.replace(/\/$/, '')
		.replace(/\/+/g, '.')
}
