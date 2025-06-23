import { html, css, LitElement, unsafeCSS } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";
import { customElement, property, eventOptions, query, queryAll, queryAssignedElements, state } from "lit/decorators.js";
import styles from "../styles/calculator.css";
import katex from "katex";
import katexStyles from "../../node_modules/katex/dist/katex.css";

import { create, all } from "mathjs";

const math = create(all, {});

@customElement("calculator-component")
export default class Calculator extends LitElement {
	static styles = css`
		${styles}
		${katexStyles}
	`;

	#history = [];
	scope = { ans: 0 };
	historyIndex = 0;

	@property({ type: Object })
	set history(value) {
		this.#history = Array.isArray(value) ? value : [value];
		console.log("History updated", this.#history);
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
		window.localStorage.setItem("calc-history", JSON.stringify(this.history, math.replacer));
		window.localStorage.setItem("calc-scope", JSON.stringify(this.scope, math.replacer));
	}

	connectedCallback() {
		super.connectedCallback();
		this.#history = JSON.parse(window.localStorage.getItem("calc-history"), math.reviver) || [];
		this.scope = JSON.parse(window.localStorage.getItem("calc-scope"), math.reviver) || {};
		this.historyIndex = this.#history.length;
	}

	evaluate(expression) {
		let historyItem = {};

		try {
			let node = null;

			try {
				node = math.parse(expression);

				if (node.fn == "unaryPlus" || node.fn == "unaryMinus") {
					// If the expression starts with a unary operator, 
					// treat it as if it was a binary operator with 'ans' as the first operand
					node = math.parse("ans" + expression);
				}
			}
			catch (error) {
				if (error.message.includes("Value expected (char 1)")) { 
					// If the expression produces an error indicating that there is a missing first operand,
					// we assume the user meant to use 'ans' as the first operand
					node = math.parse("ans" + expression);
				}
				else throw error;
			}

			const result = node.evaluate(this.scope);
			this.scope.ans = result;

			historyItem = {
				error: false,
				original: expression,
				tree: node,
				expression: node.toString(),
				TeX: node.toTex(),
				result: result
			};

			this.input.value = "";

		} catch (error) {
			historyItem = {
				error: true,
				original: expression,
				tree: null,
				expression: "",
				TeX: "",
				result: `Error: ${error.message}`
			};
		}

		this.history = [...this.history, historyItem];
		this.historyIndex = this.history.length;
		
		const customEvent = new CustomEvent("calc-evaluate", {
			detail: historyItem,
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

		if (event.key === "Up" || event.key === "ArrowUp") {
			event.preventDefault();
			this.historyIndex = Math.max(0, this.historyIndex - 1);
			this.input.value = this.history[this.historyIndex]?.original || "";
		}

		if (event.key === "Down" || event.key === "ArrowDown") {
			event.preventDefault();
			this.historyIndex = Math.min(this.history.length, this.historyIndex + 1);
			this.input.value = this.history[this.historyIndex]?.original || "";
		}
	}

	handleExpressionClick(item) {
		this.input.value += item.original;
		this.input.focus();
	}
	
	handleResultClick(item) {
		if (item.error) return;
		this.input.value += item.result;
		this.input.focus();
	}

	clearHistory() {
		this.history = [];
		this.scope = { ans: 0 };
	}

	firstUpdated() {
		this.input.focus();
	}

	updated() {
		this.output.scrollTop = this.output.scrollHeight;
	}

	render() {
		return html`
			<menu>
				<a @click=${this.clearHistory}>Clear</a>
			</menu>
			<output ${ref(this.outputRef)}>
				<ul class="history">
					${this.history.map(item => html`
						<li class=${classMap({ "history-item": true, "error": item.error })}>
							<span class="expression" @click=${() => this.handleExpressionClick(item)}>
								${item.TeX 
									? unsafeHTML(katex.renderToString(item.TeX, { throwOnError: false })) 
									: item.expression || item.original }
							</span>
							<span class="result" @click=${() => this.handleResultClick(item)}>
								${item.result}
							</span>
						</li>
					`)}
				</ul>
			</output>
			<input type="text" 
				${ref(this.inputRef)}
				name="calc-input"
				placeholder=">"
				@input="${this.handleInput}"
				@keydown="${this.handleKeydown}"
			>
			<div class="controls">
				<button @click="${this.handleEnter}">=</button>
			</div>
		`;
	}
}