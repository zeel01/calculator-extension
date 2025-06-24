import { html, css, LitElement, unsafeCSS } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";
import { customElement, property, eventOptions, query, queryAll, queryAssignedElements, state } from "lit/decorators.js";
import katex from "katex";
import styles from "../../node_modules/katex/dist/katex.css";

@customElement("katex-component")
export default class Katex extends LitElement {
	static styles = styles;

	#expression = "";

	@property({ type: String })
	set expression(value) {
		this.#expression = value;
	}

	get expression() {
		return this.textContent || this.#expression;
	}

	render() {
		return unsafeHTML(katex.renderToString(this.expression, {
			throwOnError: false
		}));
	}
}