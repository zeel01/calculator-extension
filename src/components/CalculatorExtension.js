import { html, css, LitElement, unsafeCSS } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";
import { customElement, property, eventOptions, query, queryAll, queryAssignedElements, state } from "lit/decorators.js";

import { create, all } from "mathjs";
import defaultData from "../scripts/defaultData.js";

const math = create(all, {});

@customElement("calculator-extension")
export default class CalculatorExtension extends LitElement {
	data = structuredClone(defaultData);
	#history = [];

	get activeTab() {
		return this.data.activeTab;
	}

	set activeTab(index) {
		if (index < 0 || index >= this.data.tabs.length) throw new Error("Invalid tab index");

		this.data.activeTab = index;
		this.history = this.currentTab.history;
		this.scheduleStore();
	}

	get currentTab() {
		return this.data.tabs[this.activeTab];
	}

	get history() {
		return this.#history;
	}

	@property({ type: Array })
	set history(value) {
		if (!Array.isArray(value)) {
			throw new Error("History must be an array");
		}

		this.currentTab.history = value;
		this.#history = value;
		this.scheduleStore();
	}

	get scope() {
		return this.currentTab.scope;
	}

	set scope(value) {
		if (typeof value !== "object") {
			throw new Error("Scope must be an object");
		}

		this.currentTab.scope = value;
		this.scheduleStore();
	}

	scheduleStore() {
		setTimeout(() => this.storeData(), 0);
	}
	
	storeData() {
		window.localStorage.setItem("calculator", JSON.stringify(this.data, math.replacer));
	}

	loadData() {
		this.data = JSON.parse(window.localStorage.getItem("calculator"), math.reviver);
		this.history = this.currentTab.history;
	}

	createRenderRoot() {
		return this;
	}

	connectedCallback() {
		super.connectedCallback();
		this.loadData();
	}

	evaluated(event) {
		const historyItem = event.detail;
		this.scope.ans = historyItem.result;
		this.history = [...this.history, historyItem];

		console.log("Expression:", historyItem.original, "\n    Result:", historyItem.result.toString());
	}

	createTab() {
		const newTab = structuredClone(defaultData.tabs[0]);
		const labels = this.data.tabs.map(tab => tab.label);

		let i = 1;
		while (labels.includes(newTab.label)) {
			newTab.label = `Tab ${i++}`;
		}

		console.log(`Creating new tab '${newTab.label}'`);

		this.data.tabs.push(newTab);
		this.activeTab = this.data.tabs.length - 1;
		this.requestUpdate();
	}

	deleteTab(event) {
		const { label, index } = event.detail;
		console.log(`Deleting tab ${index} '${label}'`);

		if (this.data.tabs.length > 1) {
			this.data.tabs.splice(index, 1);

			if (this.activeTab >= this.data.tabs.length) {
				this.activeTab = this.data.tabs.length - 1;
			}
		} else {
			this.data.tabs[0] = structuredClone(defaultData.tabs[0]);
			this.activeTab = 0;
		}

		this.requestUpdate();
	}

	updateTabLabel(event) {
		const { label, index } = event.detail;
		this.data.tabs[index].label = label;
		this.activeTab = index;
	}

	render() {
		return html`
			<tab-list @add=${this.createTab}>
				${this.data.tabs.map((tab, index) => html`
					<tab-item
						label=${tab.label}
						.active=${index === this.activeTab}
						.index=${index}
						@click=${() => this.activeTab = index}
						@close=${this.deleteTab}
						@updateLabel=${this.updateTabLabel}
					></tab-item>
				`)}
			</tab-list>
			</div>
			<calculator-component
				.history=${this.history}
				.scope=${this.scope}
				@evaluate=${this.evaluated}
			></calculator-component>
		`;
	}
}