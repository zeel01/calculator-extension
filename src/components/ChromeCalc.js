import { html, css, LitElement, unsafeCSS } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";
import { customElement, property, eventOptions, query, queryAll, queryAssignedElements, state } from "lit/decorators.js";
import styles from "../styles/calculator.css";

import { create, all } from "mathjs";

const math = create(all, {});

@customElement("chrome-calc")
export default class ChromeCalc extends LitElement {
	static styles = styles;

	#history = [];

	@property({ type: Object })
	set history(value) {
		this.#history = Array.isArray(value) ? value : [value];
		setTimeout(() => this.storeHistory(), 0);
	}

	get history() {
		return this.#history;
	}

	inputRef = createRef();
	outputRef = createRef();

	get input() {
		return this.inputRef.value;
	}

	get output() {
		return this.outputRef.value;
	}

	storeHistory() {
		window.localStorage.setItem("calc-history", JSON.stringify(this.history));
	}

	connectedCallback() {
		super.connectedCallback();
		this.#history = JSON.parse(window.localStorage.getItem("calc-history")) || [];
	}

	evaluate(expression) {
		try {
			const result = math.evaluate(expression);

			this.history = [...this.history, {
				expression: expression,
				result: result
			}];

			this.input.value = "";
		} catch (error) {
			this.history = [...this.history, {
				expression: expression,
				result: `Error: ${error.message}`
			}];
		}

		const customEvent = new CustomEvent("calc-evaluate", {
			detail: {
				expression: expression,
				result: this.history[this.history.length - 1].result
			},
			bubbles: true,
			composed: true
		});

		this.dispatchEvent(customEvent);
	}

	handleEnter(event) {
		const value = this.input.value.trim();

		if (value === "") return;

		this.evaluate(value);
	}

	handleKeydown(event) {
		if (event.key === "Enter") {
			event.preventDefault();
			this.handleEnter(event);
		}
	}

	handleExpressionClick(item) {
		this.input.value += item.expression;
		this.input.focus();
	}
	
	handleResultClick(item) {
		this.input.value += item.result;
		this.input.focus();
	}

	clearHistory() {
		this.history = [];
	}

	updated() {
		this.output.scrollTop = this.output.scrollHeight;
	}

	render() {
		return html`
			<menu>
				<button @click=${this.clearHistory}>Clear</button>
			</menu>
			<output ${ref(this.outputRef)}>
				<ul class="history">
					${this.history.map(item => html`
						<li class="history-item">
							<span class="expression" @click=${() => this.handleExpressionClick(item)}>${item.expression}</span>
							<span class="result" @click=${() => this.handleResultClick(item)}>${item.result}</span>
						</li>
					`)}
				</ul>
			</output>
			<input type="text" 
				${ref(this.inputRef)}
				name="calc-input"
				placeholder=">_"
				@input="${this.handleInput}"
				@keydown="${this.handleKeydown}"
			>
			<div class="controls">
				<button @click="${this.handleEnter}">=</button>
			</div>
		`;
	}
}