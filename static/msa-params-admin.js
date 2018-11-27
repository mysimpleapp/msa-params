import { Q, importHtml, ajax } from "/msa/msa.js"

importHtml(`<style>
	msa-admin-params {
		padding: 20px;
	}
	msa-admin-params .updated {
		background-color: yellow
	}
</style>`)

const content = `
	<h1><center>Params</center></h1>
	<p><button class="update">Update</button></p>
	<p><table class="params" style="width:100%">
		<thead><tr><th>Key</th><th>Value</th></tr></thead>
		<tbody></tbody>
	</table></p>`

export class HTMLMsaParamsAdminElement extends HTMLElement {

	constructor() {
		super()
		this.Q = Q
		this.params = []
	}

	connectedCallback() {
		this.initContent()
		this.initActions()
		this.listParams()
	}

	initContent() {
		this.innerHTML = content
	}

	initActions() {
		this.Q('button.update').onclick = () => this.updateParams()
	}

	sync() {
		const t = this.Q("table.params tbody")
		for(let param of this.params){
			const r = t.insertRow()
			r.insertCell().textContent = param.key
			const c = r.insertCell()
			c.textContent = param.value
			c.setAttribute('contenteditable', true)
			c.oninput = () => {
				r.classList.add('updated')
			}
		}
	}

	listParams() {
		ajax('GET', '/admin/params/list', params => {
			this.params = params
			this.sync()
		})
	}

	updateParams() {
		const updatedRows = this.querySelectorAll(".updated")
		for(let r of updatedRows){
			const cells = r.cells
			ajax('POST', '/admin/params', { body: {
				key: cells[0].textContent,
				value: cells[1].textContent
			}})
		}
	}
}

// register elem
customElements.define("msa-params-admin", HTMLMsaParamsAdminElement)
