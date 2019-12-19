import { Q, importHtml, importOnCall, ajax } from "/utils/msa-utils.js"

// dynamic imports
const popupSrc = "/utils/msa-utils-popup.js"
const importAsPopup = importOnCall(popupSrc, "importAsPopup")
const addInputPopup = importOnCall(popupSrc, "addInputPopup")


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
		<thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
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
		this.initAttrs()
		this.initContent()
		this.initActions()
		this.listParams(this.paramsId)
	}

	initAttrs(){
		this.paramsId = defAttr(this, "params-id", "")
		this.baseUrl = defAttr(this, "base-url", "/admin/params")
		this.syncUrl = defAttrAsBool(this, "sync-url", "false")
	}

	initContent() {
		this.innerHTML = content
	}

	initActions() {
		this.Q('button.update').onclick = () => this.updateParams()
	}

	sync() {
		const t = this.Q("table.params tbody")
		t.innerHTML = ""
		for(let param of this.params){
			const r = t.insertRow()
			r.param = param
			r.insertCell().textContent = param.key
			r.insertCell().textContent = param.prettyValue
			const buttonsCell = r.insertCell()
			if(param.editable) this.makeParamEditable(r, buttonsCell)
			if(param.isParams) this.makeParamsListable(r, buttonsCell)
		}
	}

	makeParamEditable(row, cell) {
		const btn = document.createElement("button")
		btn.textContent = "Edit"
		cell.appendChild(btn)
		btn.onclick = () => {
			const onValidate = res => {
				this.updatedParams.push({ param, value:res.value })
				row.cells[1].textContent = res.prettyValue
				row.classList.add('updated')
			}
			const param = row.param
			let editor = param.editor
			if(!editor) editor = "text"
			if(typeof editor === "string") {
				addInputPopup(this, "Update param value",
					{ type: editor, value: param.value })
				.then(onValidate)
			} else {
				addInputPopup(this,
					deepMerge({ attrs: { value: param.value }}, editor))
				.then(onValidate)
			}
		}
	}

	makeParamsListable(row, cell) {
		const btn = document.createElement("button")
		btn.textContent = "List"
		cell.appendChild(btn)
		btn.onclick = () => {
			const paramKey = row.param.key
			if(this.syncUrl)
				window.location += '/'+paramKey
			else {
				const newParamsId = this.paramsId ? `${this.paramsId}.${paramKey}` : paramKey
				this.listParams(newParamsId)
			}
		}
	}

	listParams(id) {
		ajax('GET', `${this.baseUrl}/_list/${id}`)
		.then(params => {
			this.paramsId = id
			this.params = params
			this.sync()
		})
	}

	updateParams() {
		for(let u of this.updatedParams){
			const paramKey = u.param.key
			const paramId = this.paramsId ? `${this.paramsId}.${paramKey}` : paramKey
			ajax('POST', this.baseUrl, { body: {
				id: paramId,
				value: u.newVal
			}})
			.then(() => location.reload())
		}
	}
}


// utils

function defAttr(el, key, defVal){
	return el.hasAttribute(key) ? el.getAttribute(key) : defVal
}

function defAttrAsBool(el, key, defVal){
	const val = defAttr(el, key, defVal)
	return val == "true"
}

function deepMerge(obj, obj2){
	for(let k in obj2){
		const val = obj[k], val2 = obj2[k]
		if(typeof val === "object" && typeof val2 === "object")
			deepMerge(val, val2)
		else
			obj[k] = val2
	}
	return obj
}

// register elem
customElements.define("msa-params-admin", HTMLMsaParamsAdminElement)
