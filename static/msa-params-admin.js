import { Q, importHtml, importOnCall, ajax } from "/utils/msa-utils.js"

const popupSrc = "/utils/msa-utils-popup.js"


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

	initAttrs() {
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

	async sync() {
		const t = this.Q("table.params tbody")
		t.innerHTML = ""
		for (let param of this.params) {
			const r = t.insertRow()
			r.param = param
			r.insertCell().textContent = param.key
			const valTd = r.insertCell()
			if (param.viewer) {
				const viewer = (await importHtml(param.viewer, valTd))[0]
				viewer.classList.add("viewer")
				viewer.setValue(param.value)
			}
			const buttonsCell = r.insertCell()
			if (param.editable) this.makeParamEditable(r, buttonsCell)
			if (param.isParams) this.makeParamsListable(r, buttonsCell)
		}
	}

	makeParamEditable(row, cell) {
		const btn = document.createElement("button")
		btn.textContent = "Edit"
		cell.appendChild(btn)
		btn.onclick = async () => {
			const param = row.param
			let editor = param.editor
			if (!editor) editor = "text"
			const editorEl = (await importHtml(editor, true))[0]
			const { addInputPopup } = await import(popupSrc)
			const popup = addInputPopup(this, editorEl)
			setElValue(editorEl, param.value)
			popup.then(val => {
				row.querySelector(".viewer").setValue(val)
				this.updatedParams.push({ param, value: val })
				row.classList.add('updated')
			})
		}
	}

	makeParamsListable(row, cell) {
		const btn = document.createElement("button")
		btn.textContent = "List"
		cell.appendChild(btn)
		btn.onclick = () => {
			const paramKey = row.param.key
			if (this.syncUrl)
				window.location += '/' + paramKey
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
		const data = {}
		for (let u of this.updatedParams) {
			const paramKey = u.param.key
			const paramId = this.paramsId ? `${this.paramsId}.${paramKey}` : paramKey
			data[paramId] = u.value
		}
		ajax('POST', this.baseUrl, {
			body: { data }
		})
			.then(() => location.reload())
	}
}


// utils

function defAttr(el, key, defVal) {
	return el.hasAttribute(key) ? el.getAttribute(key) : defVal
}

function defAttrAsBool(el, key, defVal) {
	const val = defAttr(el, key, defVal)
	return val == "true"
}

function setElValue(el, val) {
	if (el.setValue) el.setValue(val)
	else el.value = val
}
/*
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
*/

customElements.define("msa-params-admin", HTMLMsaParamsAdminElement)


// msa-params-viewer

importHtml(`<style>
	msa-params-viewer, msa-params-str-viewer {
		display: block;
	}
</style>`)


export class HTMLMsaParamsViewerElement extends HTMLElement {
	setValue(val) {
		this.textContent = JSON.stringify(val)
	}
}
customElements.define("msa-params-viewer", HTMLMsaParamsViewerElement)


export class HTMLMsaParamsBoolViewerElement extends HTMLElement {
	setValue(val) {
		this.textContent = val ? "yes" : "no"
	}
}
customElements.define("msa-params-bool-viewer", HTMLMsaParamsBoolViewerElement)


export class HTMLMsaParamsStrViewerElement extends HTMLElement {
	setValue(val) {
		this.textContent = val
	}
}
customElements.define("msa-params-str-viewer", HTMLMsaParamsStrViewerElement)


// msa-params-editor

const editorTemplate = `
	<input type="text">`

export class HTMLMsaParamsEditorElement extends HTMLElement {
	getTemplate() {
		return editorTemplate
	}
	connectedCallback() {
		this.innerHTML = this.getTemplate()
	}
	getValue() {
		return JSON.parse(this.querySelector("input").value)
	}
	setValue(val) {
		this.querySelector("input").value = JSON.stringify(val)
	}
}
customElements.define("msa-params-editor", HTMLMsaParamsEditorElement)


export class HTMLMsaParamsStrEditorElement extends HTMLMsaParamsEditorElement {
	getValue() {
		return this.querySelector("input").value
	}
	setValue(val) {
		this.querySelector("input").value = val
	}
}
customElements.define("msa-params-str-editor", HTMLMsaParamsStrEditorElement)


const editorBoolTemplate = `
	<input type="checkbox">`

export class HTMLMsaParamsBoolEditorElement extends HTMLMsaParamsEditorElement {
	getTemplate() {
		return editorBoolTemplate
	}
	getValue() {
		return this.querySelector("input").checked
	}
	setValue(val) {
		this.querySelector("input").checked = val
	}
}
customElements.define("msa-params-bool-editor", HTMLMsaParamsBoolEditorElement)