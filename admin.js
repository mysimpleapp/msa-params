const { ParamDict, globalParams, getParamById } = require("./param")

class MsaParamsAdminModule extends Msa.Module {

	constructor() {
		super()
		this.initApp()
	}

	async getRootParam(req) {
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
				wel: '/msa/params/msa-params-admin.js',
				attrs: {
					"params-id": id,
					"sync-url": this.syncUrl()
				}
			})
		})

		this.app.post('/', async (req, res, next) => {
			try {
				await this.updateParams(req, req.body.data)
				res.sendStatus(200)
			} catch(err) { next(err) }
		})
	}

	async listMdw(id, req, res, next) {
		try {
			const rootParam = await this.getRootParam(req)
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
		} catch(err) { next(err) }
	}

	async updateParams(req, data) {
		const rootParam = await this.getRootParam(req)
		for (let id in data) {
			const param = getParamById(rootParam, id)
			param.setFromAdminVal(data[id])
			await this.updateParamInDb(id, param.getAsDbVal())
		}
	}

	async updateParamInDb(id, dbVal) {
		await db.collection("msa_params").updateOne({ _id:id }, { $set: { value: dbVal }}, { upsert:true })
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

	async updateParams(req, data) {
		const rootParam = await this.getRootParam(req)
		for (let id in data) {
			const param = getParamById(rootParam, id)
			param.setFromAdminVal(data[id])
		}
		await this.updateRootParam(req, rootParam)
	}

	async getRootParam(req) {
		throw Error("Not implemented")
	}

	async updateRootParam(req, rootParam) {
		throw Error("Not implemented")
	}

	updateParamInDb() { }
}

// utils

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

const { db } = Msa.require("db")
const { registerAdminPanel } = Msa.require("admin")

// register admin panel

const msaAdminParams = new MsaParamsAdminModule()

registerAdminPanel({
	route: '/params',
	app: msaAdminParams.app,
	title: "Params",
	help: "Manage all the website parameters."
})