const { ParamsDb } = require("./db")
const msaAdmin = Msa.require("admin")

const msaAdminParams = module.exports = Msa.module()

msaAdminParams.app.get('/', (req, res) => res.sendPage({ wel:'/params/msa-params-admin.js' }))

msaAdminParams.app.get('/list', async (req, res, next) => {
	try {
		const users = await ParamsDb.findAll()
		res.json(users.map(p => ({ key:p.key, value:p.value })))
	} catch(err) { next(err) }
})

msaAdminParams.app.post('/', (req, res, next) => {
	const { key, value } = req.body
	Msa.setParam(key, value)
	res.sendStatus(200)
})

msaAdmin.register({
	route: '/params',
	app: msaAdminParams.app,
	title: "Params",
	help: "Manage all the website parameters."
})

