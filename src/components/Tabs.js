import { html, css, LitElement, unsafeCSS } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";
import { customElement, property, eventOptions, query, queryAll, queryAssignedElements, state } from "lit/decorators.js";
import styles from "../styles/tabs.css";

@customElement("tab-list")
export default class TabList extends LitElement {
	static styles = styles;

	@property({ type: String }) accessor addLabel = "+";

	handleAddTab() {
		this.dispatchEvent(new CustomEvent("add", {
			bubbles: true,
			composed: true
		}));
	}

	render() {
		return html`
			<slot></slot>
			<tab-item class="add"
				label=${this.addLabel}
				@click="${this.handleAddTab}"
				.closable=${false}>
			</tab-item>
		`;
	}
}

@customElement("tab-item")
export class TabItem extends LitElement {
	static styles = styles;

	@property({ type: String, reflect: true }) accessor label = "";
	@property({ type: Boolean, reflect: true }) accessor active = false;
	@property({ type: Number, reflect: true }) accessor index = 0;
	@property({ type: Boolean, reflect: true }) accessor closable = true;

	labelInputRef = createRef();

	connectedCallback() {
		super.connectedCallback();
		this.addEventListener("click", this.handleClick.bind(this));
	}

	handleClick() {
		this.dispatchEvent(new CustomEvent("tab-click", {
			detail: { label: this.label, index: this.index },
			bubbles: true,
			composed: true
		}));
	}

	handleClose(event) {
		event.stopPropagation();
		this.dispatchEvent(new CustomEvent("close", {
			detail: { label: this.label, index: this.index },
			bubbles: true,
			composed: true
		}));
	}

	saveLabel() {
		this.label = this.labelInputRef.value.textContent.trim();

		this.dispatchEvent(new CustomEvent("updateLabel", {
			detail: { label: this.label, index: this.index },
			bubbles: true,
			composed: true
		}));
	}

	handleKeyDown(event) {
		if (event.key === "Enter") {
			event.preventDefault();
			this.saveLabel();
		}
	}

	render() {
		return html`
			<span  ${ref(this.labelInputRef)}
				.textContent=${this.label}
				?contentEditable=${this.active}
				@blur=${this.saveLabel}
				@keydown=${this.handleKeyDown}
			></span>
			${this.closable ? html`
				<a class="close" @click="${this.handleClose}">
					<slot name="close">&times;</slot>
				</a>
			` : ''}
		`;
	}
}