const { ParamsDb } = require("./db")
const msaAdmin = Msa.require("admin")

const msaAdminParams = module.exports = new Msa.Module()

msaAdminParams.app.get('/', (req, res) => res.sendPage({ wel:'/params/msa-params-admin.js' }))

msaAdminParams.app.get('/list', (req, res, next) => {
  try {
    const list = []
    const defs = Msa.paramDefs
    for(let k in defs) {
      let val = null
      try {
        const def = defs[k]
        val = def.format ? def.format(def.val) : JSON.stringify(Msa.getParam(k))
      } catch(err) {}
      list.push({ key:k, value:val, editable: true })
    }
    res.json(list)
  } catch(err) { next(err) }
})

msaAdminParams.app.post('/', (req, res, next) => {
	const { key, value } = req.body
	const def = Msa.paramDefs[key]
	Msa.setParam(key, def.parse(value))
	res.sendStatus(200)
})

msaAdmin.register({
	route: '/params',
	app: msaAdminParams.app,
	title: "Params",
	help: "Manage all the website parameters."
})

