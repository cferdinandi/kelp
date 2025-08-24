export function isSupported() {
	return (
		typeof HTMLButtonElement !== "undefined" &&
		"command" in HTMLButtonElement.prototype &&
		"source" in ((globalThis.CommandEvent || {}).prototype || {})
	);
}

export function isPolyfilled() {
	return !/native code/i.test((globalThis.CommandEvent || {}).toString());
}

export function apply() {
	// XXX: Invoker Buttons used to dispatch 'invoke' events instead of
	// 'command' events. We should ensure to prevent 'invoke' events being
	// fired in those browsers.
	// XXX: https://bugs.chromium.org/p/chromium/issues/detail?id=1523183
	// Chrome will dispatch invoke events even with the flag disabled; so
	// we need to capture those to prevent duplicate events.
	document.addEventListener(
		"invoke",
		(e) => {
			if (e.type == "invoke" && e.isTrusted) {
				e.stopImmediatePropagation();
				e.preventDefault();
			}
		},
		true,
	);
	document.addEventListener(
		"command",
		(e) => {
			if (e.type == "command" && e.isTrusted) {
				e.stopImmediatePropagation();
				e.preventDefault();
			}
		},
		true,
	);

	function enumerate(obj, key, enumerable = true) {
		Object.defineProperty(obj, key, {
			...Object.getOwnPropertyDescriptor(obj, key),
			enumerable,
		});
	}

	function getRootNode(node) {
		if (node && typeof node.getRootNode === "function") {
			return node.getRootNode();
		}
		if (node && node.parentNode) return getRootNode(node.parentNode);
		return node;
	}

	const commandEventSourceElements = new WeakMap();
	const commandEventActions = new WeakMap();

	class CommandEvent extends Event {
		constructor(type, invokeEventInit = {}) {
			super(type, invokeEventInit);
			const { source, command } = invokeEventInit;
			if (source != null && !(source instanceof Element)) {
				throw new TypeError(`source must be an element`);
			}
			commandEventSourceElements.set(this, source || null);
			commandEventActions.set(
				this,
				command !== undefined ? String(command) : "",
			);
		}

		get [Symbol.toStringTag]() {
			return "CommandEvent";
		}

		get source() {
			if (!commandEventSourceElements.has(this)) {
				throw new TypeError("illegal invocation");
			}
			const source = commandEventSourceElements.get(this);
			if (!(source instanceof Element)) return null;
			const invokerRoot = getRootNode(source);
			if (invokerRoot !== getRootNode(this.target || document)) {
				return invokerRoot.host;
			}
			return source;
		}

		get command() {
			if (!commandEventActions.has(this)) {
				throw new TypeError("illegal invocation");
			}
			return commandEventActions.get(this);
		}

		get action() {
			throw new Error(
				"CommandEvent#action was renamed to CommandEvent#command",
			);
		}

		get invoker() {
			throw new Error(
				"CommandEvent#invoker was renamed to CommandEvent#source",
			);
		}
	}
	enumerate(CommandEvent.prototype, "source");
	enumerate(CommandEvent.prototype, "command");

	class InvokeEvent extends Event {
		constructor(type, invokeEventInit = {}) {
			super(type, invokeEventInit);
			throw new Error(
				"InvokeEvent has been deprecated, it has been renamed to `CommandEvent`",
			);
		}
	}

	const invokerAssociatedElements = new WeakMap();

	function applyInvokerMixin(ElementClass) {
		Object.defineProperties(ElementClass.prototype, {
			commandForElement: {
				enumerable: true,
				configurable: true,
				set(targetElement) {
					if (this.hasAttribute("invokeaction")) {
						throw new TypeError(
							"Element has deprecated `invokeaction` attribute, replace with `command`",
						);
					} else if (this.hasAttribute("invoketarget")) {
						throw new TypeError(
							"Element has deprecated `invoketarget` attribute, replace with `commandfor`",
						);
					} else if (targetElement === null) {
						this.removeAttribute("commandfor");
						invokerAssociatedElements.delete(this);
					} else if (!(targetElement instanceof Element)) {
						throw new TypeError(`commandForElement must be an element or null`);
					} else {
						this.setAttribute("commandfor", "");
						const targetRootNode = getRootNode(targetElement);
						const thisRootNode = getRootNode(this);
						if (
							thisRootNode === targetRootNode ||
							targetRootNode === this.ownerDocument
						) {
							invokerAssociatedElements.set(this, targetElement);
						} else {
							invokerAssociatedElements.delete(this);
						}
					}
				},
				get() {
					if (this.localName !== "button") {
						return null;
					}
					if (
						this.hasAttribute("invokeaction") ||
						this.hasAttribute("invoketarget")
					) {
						console.warn(
							"Element has deprecated `invoketarget` or `invokeaction` attribute, use `commandfor` and `command` instead",
						);
						return null;
					}
					if (this.disabled) {
						return null;
					}
					if (this.form && this.getAttribute("type") !== "button") {
						console.warn(
							"Element with `commandFor` is a form participant. " +
								"It should explicitly set `type=button` in order for `commandFor` to work",
						);
						return null;
					}
					const targetElement = invokerAssociatedElements.get(this);
					if (targetElement) {
						if (targetElement.isConnected) {
							return targetElement;
						} else {
							invokerAssociatedElements.delete(this);
							return null;
						}
					}
					const root = getRootNode(this);
					const idref = this.getAttribute("commandfor");
					if (
						(root instanceof Document || root instanceof ShadowRoot) &&
						idref
					) {
						return root.getElementById(idref) || null;
					}
					return null;
				},
			},
			command: {
				enumerable: true,
				configurable: true,
				get() {
					const value = this.getAttribute("command") || "";
					if (value.startsWith("--")) return value;
					const valueLower = value.toLowerCase();
					switch (valueLower) {
						case "show-modal":
						case "close":
						case "toggle-popover":
						case "hide-popover":
						case "show-popover":
							return valueLower;
					}
					return "";
				},
				set(value) {
					this.setAttribute("command", value);
				},
			},

			invokeAction: {
				enumerable: false,
				configurable: true,
				get() {
					throw new Error(
						`invokeAction is deprecated. It has been renamed to command`,
					);
				},
				set(value) {
					throw new Error(
						`invokeAction is deprecated. It has been renamed to command`,
					);
				},
			},

			invokeTargetElement: {
				enumerable: false,
				configurable: true,
				get() {
					throw new Error(
						`invokeTargetElement is deprecated. It has been renamed to command`,
					);
				},
				set(value) {
					throw new Error(
						`invokeTargetElement is deprecated. It has been renamed to command`,
					);
				},
			},
		});
	}

	const onHandlers = new WeakMap();
	Object.defineProperties(HTMLElement.prototype, {
		oncommand: {
			enumerable: true,
			configurable: true,
			get() {
				oncommandObserver.takeRecords();
				return onHandlers.get(this) || null;
			},
			set(handler) {
				const existing = onHandlers.get(this) || null;
				if (existing) {
					this.removeEventListener("command", existing);
				}
				onHandlers.set(
					this,
					typeof handler === "object" || typeof handler === "function"
						? handler
						: null,
				);
				if (typeof handler == "function") {
					this.addEventListener("command", handler);
				}
			},
		},
	});
	function applyOnCommandHandler(els) {
		for (const el of els) {
			el.oncommand = new Function("event", el.getAttribute("oncommand"));
		}
	}
	const oncommandObserver = new MutationObserver((records) => {
		for (const record of records) {
			const { target } = record;
			if (record.type === "childList") {
				applyOnCommandHandler(target.querySelectorAll("[oncommand]"));
			} else {
				applyOnCommandHandler([target]);
			}
		}
	});
	oncommandObserver.observe(document, {
		subtree: true,
		childList: true,
		attributeFilter: ["oncommand"],
	});
	applyOnCommandHandler(document.querySelectorAll("[oncommand]"));

	function handleInvokerActivation(event) {
		if (event.defaultPrevented) return;
		if (event.type !== "click") return;
		const oldInvoker = event.target.closest(
			"button[invoketarget], button[invokeaction], input[invoketarget], input[invokeaction]",
		);
		if (oldInvoker) {
			console.warn(
				"Elements with `invoketarget` or `invokeaction` are deprecated and should be renamed to use `commandfor` and `command` respectively",
			);
			if (oldInvoker.matches("input")) {
				throw new Error("Input elements no longer support `commandfor`");
			}
		}

		const source = event.target.closest("button[commandfor], button[command]");
		if (!source) return;

		if (source.form && source.getAttribute("type") !== "button") {
			event.preventDefault();
			throw new Error(
				"Element with `commandFor` is a form participant. " +
					"It should explicitly set `type=button` in order for `commandFor` to work. " +
					"In order for it to act as a Submit button, it must not have command or commandfor attributes",
			);
		}

		if (source.hasAttribute("command") !== source.hasAttribute("commandfor")) {
			const attr = source.hasAttribute("command") ? "command" : "commandfor";
			const missing = source.hasAttribute("command") ? "commandfor" : "command";
			throw new Error(
				`Element with ${attr} attribute must also have a ${missing} attribute to function.`,
			);
		}

		if (
			source.command !== "show-popover" &&
			source.command !== "hide-popover" &&
			source.command !== "toggle-popover" &&
			source.command !== "show-modal" &&
			source.command !== "close" &&
			!source.command.startsWith("--")
		) {
			console.warn(
				`"${source.command}" is not a valid command value. Custom commands must begin with --`,
			);
			return;
		}

		const invokee = source.commandForElement;
		if (!invokee) return;
		const invokeEvent = new CommandEvent("command", {
			command: source.command,
			source,
			cancelable: true,
		});
		invokee.dispatchEvent(invokeEvent);
		if (invokeEvent.defaultPrevented)
			return;

		const command = invokeEvent.command.toLowerCase();

		if (invokee.popover) {
			const canShow = !invokee.matches(":popover-open");
			const shouldShow =
				canShow && (command === "toggle-popover" || command === "show-popover");
			const shouldHide = !canShow && command === "hide-popover";

			if (shouldShow) {
				invokee.showPopover({ source });
			} else if (shouldHide) {
				invokee.hidePopover();
			}
		} else if (invokee.localName === "dialog") {
			const canShow = !invokee.hasAttribute("open");
			const shouldShow = canShow && command === "show-modal";
			const shouldHide = !canShow && command === "close";

			function setCollapsedState () {
				source.setAttribute('aria-expanded', 'false');
				invokee.removeEventListener('close', setCollapsedState);
				invokee.removeEventListener('cancel', setCollapsedState);
			}

			if (shouldShow) {
				invokee.showModal();
				source.setAttribute('aria-expanded', 'true');
				source.setAttribute('aria-controls', invokee.id);
				invokee.addEventListener('close', setCollapsedState);
				invokee.addEventListener('cancel', setCollapsedState);
			} else if (shouldHide) {
				invokee.close();
			}
		}
	}

	function setupInvokeListeners(target) {
		target.addEventListener("click", handleInvokerActivation, true);
	}

	function observeShadowRoots(ElementClass, callback) {
		const attachShadow = ElementClass.prototype.attachShadow;
		ElementClass.prototype.attachShadow = function (init) {
			const shadow = attachShadow.call(this, init);
			callback(shadow);
			return shadow;
		};
		const attachInternals = ElementClass.prototype.attachInternals;
		ElementClass.prototype.attachInternals = function () {
			const internals = attachInternals.call(this);
			if (internals.shadowRoot) callback(internals.shadowRoot);
			return internals;
		};
	}

	applyInvokerMixin(HTMLButtonElement);

	observeShadowRoots(HTMLElement, (shadow) => {
		setupInvokeListeners(shadow);
		oncommandObserver.observe(shadow, { attributeFilter: ["oncommand"] });
		applyOnCommandHandler(shadow.querySelectorAll("[oncommand]"));
	});

	setupInvokeListeners(document);

	Object.assign(globalThis, { CommandEvent, InvokeEvent });
}

if (!isSupported()) {
	apply();
}