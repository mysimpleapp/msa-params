const { ParamDict, globalParams, getParamById } = require("./param")

class MsaParamsAdminModule extends Msa.Module {

	constructor() {
		super()
		this.initApp()
	}

	async getRootParam(ctx) {
		return globalParams
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
				const ctx = newCtx(req, { db })
				await this.updateParams(ctx, req.body.data)
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
					value = childParam.getAsAdminVal()
					viewer = childParam.getViewer()
					editor = childParam.getEditor()
				}
				list.push({ key, value, isParams: isChildParamDict, editable: (!isChildParamDict), viewer, editor })
			}
			res.json(list)
		}).catch(next)
	}

	async updateParams(ctx, data) {
		const rootParam = await this.getRootParam(ctx)
		for (let id in data) {
			const param = getParamById(rootParam, id)
			param.setFromAdminVal(data[id])
			await this.updateParamInDb(ctx, id, param.getAsDbStr())
		}
	}

	async updateParamInDb(ctx, id, dbStr) {
		const fields = { id, value: dbStr }
		const res = await ctx.db.run("UPDATE msa_params SET value=:value WHERE id=:id", fields)
		if (res.nbChanges === 0)
			await ctx.db.run("INSERT INTO msa_params (id, value) VALUES (:id,:value)", fields)
	}
}

// MsaParamsLocalAdminModule

class MsaParamsLocalAdminModule extends MsaParamsAdminModule {

	constructor() {
		super()
		this.ParamDict = this.getParamDictClass()
	}

	getParamDictClass() {
		return ParamDict
	}

	async updateParams(ctx, data) {
		const rootParam = await this.getRootParam(ctx)
		for (let id in data) {
			const param = getParamById(rootParam, id)
			param.setFromAdminVal(data[id])
		}
		await this.updateRootParam(ctx, rootParam)
	}

	async getRootParam(ctx) {
		throw Error("Not implemented")
	}

	async updateRootParam(ctx, rootParam) {
		throw Error("Not implemented")
	}

	updateParamInDb() { }
}

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

// exports

module.exports = {
	MsaParamsAdminModule,
	MsaParamsLocalAdminModule
}

// imports

const { withDb } = Msa.require("db")
const { registerAdminPanel } = Msa.require("admin")

// register admin panel

const msaAdminParams = new MsaParamsAdminModule()

registerAdminPanel({
	route: '/params',
	app: msaAdminParams.app,
	title: "Params",
	help: "Manage all the website parameters."
})