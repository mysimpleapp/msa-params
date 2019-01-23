import { Q, importHtml, importOnCall, ajax } from "/msa/msa.js"

// dynamic imports
const popupDeps = `
	<script type="module" src="/utils/msa-utils-popup.js"></script>`
const createInputPopup = importOnCall(popupDeps, "MsaUtils.createInputPopup")

importHtml(`<style>
	msa-params-admin {
		padding: 20px;
	}
	msa-params-admin .updated {
		background-color: yellow;
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
		this.updatedParams = []
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
			r.param = param
			r.insertCell().textContent = param.key
			const c = r.insertCell()
			c.textContent = param.value
			if(param.editable) this.makeParamEditable(r)
		}
	}

	makeParamEditable(r) {
		const c = r.insertCell()
		const b = document.createElement("button")
		b.textContent = "Edit"
		c.appendChild(b)
		b.onclick = () => {
			const param = r.param
			let editor = param.editor
			if(!editor) editor = "text"
			if(typeof editor === "string") {
				createInputPopup("Update param value",
					{ type: editor, value: param.value },
					newVal => {
						this.updatedParams.push({ param: param, newVal: newVal })
						r.cells[1].textContent = newVal
						r.classList.add('updated')
					})
			}
			param.editor
		}
	}

	listParams() {
		ajax('GET', '/admin/params/list', params => {
			this.params = params
			this.sync()
		})
	}

	updateParams() {
		for(let u of this.updatedParams){
			const param = u.param
			ajax('POST', '/admin/params',
				{ body: {
					key: param.key,
					value: u.newVal
				}},
				() => location.reload())
		}
	}
}

// register elem
customElements.define("msa-params-admin", HTMLMsaParamsAdminElement)
