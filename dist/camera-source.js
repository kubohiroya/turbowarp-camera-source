// Name: Camera Source
// ID: kubohiroyacamerasource
// Description: Share one MediaDevices camera stream between TurboWarp extensions.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esmMin = (fn, res, err) => () => {
  	if (err) throw err[0];
  	try {
  		return fn && (res = fn(fn = 0)), res;
  	} catch (e) {
  		throw err = [e], e;
  	}
  };
  var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
  var __exportAll = (all, no_symbols) => {
  	let target = {};
  	for (var name in all) __defProp(target, name, {
  		get: all[name],
  		enumerable: true
  	});
  	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
  	return target;
  };
  var __copyProps = (to, from, except, desc) => {
  	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
  		key = keys[i];
  		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
  			get: ((k) => from[k]).bind(null, key),
  			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
  		});
  	}
  	return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
  	value: mod,
  	enumerable: true
  }) : target, mod));
  var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var extensionConfig = {
  	id: "kubohiroyacamerasource",
  	slug: "camera-source",
  	name: "Camera Source",
  	description: "Share one MediaDevices camera stream between TurboWarp extensions.",
  	author: "Hiroya Kubo",
  	license: "MPL-2.0",
  	unsandboxed: true
  };
  var block_editor_fixed_inputs_schema_default = {
  	$schema: "https://json-schema.org/draft/2020-12/schema",
  	$id: "https://kubohiroya.github.io/turbowarp-camera-source/schemas/block-editor-fixed-inputs.schema.json",
  	$defs: { "showCameraPreview": {
  		"type": "object",
  		"properties": { "PREVIEW_FLIP": {
  			"type": "string",
  			"enum": [
  				"none",
  				"horizontal",
  				"vertical",
  				"both"
  			]
  		} },
  		"additionalProperties": false
  	} }
  };
  /** Canonical fixed field fragments; URI is identity only, never fetched. */
  function fixedInputBundle(opcode, argument) {
  	const source = {
  		repository: "turbowarp-camera-source",
  		path: "schemas/block-editor-fixed-inputs.schema.json",
  		symbol: `#/$defs/${opcode}/properties/${argument}`
  	};
  	const definitions = block_editor_fixed_inputs_schema_default.$defs;
  	return {
  		identity: {
  			ownerId: "turbowarp-camera-source",
  			contractId: "fixed-inputs",
  			revision: "1",
  			variantId: opcode + "." + argument
  		},
  		dialect: "2020-12",
  		root: {
  			retrievalUri: block_editor_fixed_inputs_schema_default.$id,
  			document: definitions[opcode].properties[argument],
  			artifact: {
  				role: "canonical-schema",
  				source
  			}
  		},
  		resources: [],
  		provenance: {
  			canonicalSources: [source, ...[{
  				"repository": "turbowarp-camera-source",
  				"path": "src/flip.ts",
  				"symbol": "FLIPS / isFlip / toFlip"
  			}]],
  			generatedFiles: [{
  				repository: "turbowarp-camera-source",
  				path: "docs/schemas/block-editor-fixed-inputs.schema.json"
  			}],
  			generationSources: [{
  				repository: "turbowarp-camera-source",
  				path: "scripts/generate-fixed-input-docs.mjs"
  			}],
  			referenceSchemas: []
  		}
  	};
  }
  var invalid = () => [{ message: "Invalid fixed input." }];
  function enumBinding(opcode, argument, choices, normalization) {
  	const project = (value) => {
  		if (typeof value !== "string") return value;
  		const normalized = normalization === "none" ? value : normalization === "trim" ? value.trim() : value.trim().toLowerCase();
  		return choices.includes(normalized) ? normalized : value;
  	};
  	return {
  		argument,
  		schemaBundle: fixedInputBundle(opcode, argument),
  		control: {
  			label: argument,
  			kind: "enum",
  			choices: choices.map((value) => ({ value }))
  		},
  		read: project,
  		encode(value) {
  			if (typeof value !== "string" || !choices.includes(value)) throw new TypeError("Choose a known value.");
  			return value;
  		},
  		validateCandidate(candidate, _context, finalSnapshot) {
  			try {
  				return typeof candidate === "string" && choices.includes(candidate) && ownerCheck(opcode, argument, candidate, finalSnapshot) ? [] : invalid();
  			} catch {
  				return invalid();
  			}
  		}
  	};
  }
  function ownerCheck(_opcode, _argument, _candidate, _snapshot) {
  	return true;
  }
  var extensionId = "kubohiroyacamerasource";
  var validationContext = () => ({
  	consumerId: "turbowarp-camera-source",
  	nowMs: 0,
  	settings: null
  });
  var fixedInputEditors = [{
  	apiVersion: 1,
  	extensionId,
  	editorId: "showCameraPreview-fixed",
  	opcodes: [`${extensionId}_showCameraPreview`],
  	contractId: "turbowarp-camera-source/showCameraPreview",
  	contractRevision: "1",
  	validationContext,
  	readOnlyArguments: [],
  	bindings: [enumBinding("showCameraPreview", "PREVIEW_FLIP", [
  		"none",
  		"horizontal",
  		"vertical",
  		"both"
  	], "none")]
  }];
  /** Register metadata only; the GUI startup capability owns editor activation. */
  function registerFixedInputEditors(scratch, definitions, runtimeOverride) {
  	const host = scratch;
  	const api = host.gui?.blockEditors;
  	if (!definitions.length || api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== "function") return () => {};
  	const runtime = runtimeOverride ?? host.vm?.runtime;
  	const removers = [];
  	let active = true;
  	const dispose = () => {
  		if (!active) return;
  		active = false;
  		runtime?.off?.("RUNTIME_DISPOSED", dispose);
  		for (const remove of removers.splice(0).reverse()) remove();
  	};
  	try {
  		for (const definition of definitions) {
  			const remove = api.registerFixedInputEditor.call(api, definition);
  			if (typeof remove !== "function") throw new TypeError("Invalid fixed input registration disposer.");
  			removers.push(remove);
  		}
  		runtime?.on?.("RUNTIME_DISPOSED", dispose);
  	} catch (error) {
  		dispose();
  		throw error;
  	}
  	return dispose;
  }
  var require_code$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
  	var _CodeOrName = class {};
  	exports._CodeOrName = _CodeOrName;
  	exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  	var Name = class extends _CodeOrName {
  		constructor(s) {
  			super();
  			if (!exports.IDENTIFIER.test(s)) throw new Error("CodeGen: name must be a valid identifier");
  			this.str = s;
  		}
  		toString() {
  			return this.str;
  		}
  		emptyStr() {
  			return false;
  		}
  		get names() {
  			return { [this.str]: 1 };
  		}
  	};
  	exports.Name = Name;
  	var _Code = class extends _CodeOrName {
  		constructor(code) {
  			super();
  			this._items = typeof code === "string" ? [code] : code;
  		}
  		toString() {
  			return this.str;
  		}
  		emptyStr() {
  			if (this._items.length > 1) return false;
  			const item = this._items[0];
  			return item === "" || item === "\"\"";
  		}
  		get str() {
  			var _a;
  			return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
  		}
  		get names() {
  			var _a;
  			return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => {
  				if (c instanceof Name) names[c.str] = (names[c.str] || 0) + 1;
  				return names;
  			}, {});
  		}
  	};
  	exports._Code = _Code;
  	exports.nil = new _Code("");
  	function _(strs, ...args) {
  		const code = [strs[0]];
  		let i = 0;
  		while (i < args.length) {
  			addCodeArg(code, args[i]);
  			code.push(strs[++i]);
  		}
  		return new _Code(code);
  	}
  	exports._ = _;
  	var plus = new _Code("+");
  	function str(strs, ...args) {
  		const expr = [safeStringify(strs[0])];
  		let i = 0;
  		while (i < args.length) {
  			expr.push(plus);
  			addCodeArg(expr, args[i]);
  			expr.push(plus, safeStringify(strs[++i]));
  		}
  		optimize(expr);
  		return new _Code(expr);
  	}
  	exports.str = str;
  	function addCodeArg(code, arg) {
  		if (arg instanceof _Code) code.push(...arg._items);
  		else if (arg instanceof Name) code.push(arg);
  		else code.push(interpolate(arg));
  	}
  	exports.addCodeArg = addCodeArg;
  	function optimize(expr) {
  		let i = 1;
  		while (i < expr.length - 1) {
  			if (expr[i] === plus) {
  				const res = mergeExprItems(expr[i - 1], expr[i + 1]);
  				if (res !== void 0) {
  					expr.splice(i - 1, 3, res);
  					continue;
  				}
  				expr[i++] = "+";
  			}
  			i++;
  		}
  	}
  	function mergeExprItems(a, b) {
  		if (b === "\"\"") return a;
  		if (a === "\"\"") return b;
  		if (typeof a == "string") {
  			if (b instanceof Name || a[a.length - 1] !== "\"") return;
  			if (typeof b != "string") return `${a.slice(0, -1)}${b}"`;
  			if (b[0] === "\"") return a.slice(0, -1) + b.slice(1);
  			return;
  		}
  		if (typeof b == "string" && b[0] === "\"" && !(a instanceof Name)) return `"${a}${b.slice(1)}`;
  	}
  	function strConcat(c1, c2) {
  		return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
  	}
  	exports.strConcat = strConcat;
  	function interpolate(x) {
  		return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  	}
  	function stringify(x) {
  		return new _Code(safeStringify(x));
  	}
  	exports.stringify = stringify;
  	function safeStringify(x) {
  		return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  	}
  	exports.safeStringify = safeStringify;
  	function getProperty(key) {
  		return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  	}
  	exports.getProperty = getProperty;
  	function getEsmExportName(key) {
  		if (typeof key == "string" && exports.IDENTIFIER.test(key)) return new _Code(`${key}`);
  		throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  	}
  	exports.getEsmExportName = getEsmExportName;
  	function regexpCode(rx) {
  		return new _Code(rx.toString());
  	}
  	exports.regexpCode = regexpCode;
  }));
  var require_scope = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
  	var code_1 = require_code$1();
  	var ValueError = class extends Error {
  		constructor(name) {
  			super(`CodeGen: "code" for ${name} not defined`);
  			this.value = name.value;
  		}
  	};
  	var UsedValueState;
  	(function(UsedValueState) {
  		UsedValueState[UsedValueState["Started"] = 0] = "Started";
  		UsedValueState[UsedValueState["Completed"] = 1] = "Completed";
  	})(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
  	exports.varKinds = {
  		const: new code_1.Name("const"),
  		let: new code_1.Name("let"),
  		var: new code_1.Name("var")
  	};
  	var Scope = class {
  		constructor({ prefixes, parent } = {}) {
  			this._names = {};
  			this._prefixes = prefixes;
  			this._parent = parent;
  		}
  		toName(nameOrPrefix) {
  			return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
  		}
  		name(prefix) {
  			return new code_1.Name(this._newName(prefix));
  		}
  		_newName(prefix) {
  			const ng = this._names[prefix] || this._nameGroup(prefix);
  			return `${prefix}${ng.index++}`;
  		}
  		_nameGroup(prefix) {
  			var _a, _b;
  			if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
  			return this._names[prefix] = {
  				prefix,
  				index: 0
  			};
  		}
  	};
  	exports.Scope = Scope;
  	var ValueScopeName = class extends code_1.Name {
  		constructor(prefix, nameStr) {
  			super(nameStr);
  			this.prefix = prefix;
  		}
  		setValue(value, { property, itemIndex }) {
  			this.value = value;
  			this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
  		}
  	};
  	exports.ValueScopeName = ValueScopeName;
  	var line = (0, code_1._)`\n`;
  	var ValueScope = class extends Scope {
  		constructor(opts) {
  			super(opts);
  			this._values = {};
  			this._scope = opts.scope;
  			this.opts = {
  				...opts,
  				_n: opts.lines ? line : code_1.nil
  			};
  		}
  		get() {
  			return this._scope;
  		}
  		name(prefix) {
  			return new ValueScopeName(prefix, this._newName(prefix));
  		}
  		value(nameOrPrefix, value) {
  			var _a;
  			if (value.ref === void 0) throw new Error("CodeGen: ref must be passed in value");
  			const name = this.toName(nameOrPrefix);
  			const { prefix } = name;
  			const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
  			let vs = this._values[prefix];
  			if (vs) {
  				const _name = vs.get(valueKey);
  				if (_name) return _name;
  			} else vs = this._values[prefix] = /* @__PURE__ */ new Map();
  			vs.set(valueKey, name);
  			const s = this._scope[prefix] || (this._scope[prefix] = []);
  			const itemIndex = s.length;
  			s[itemIndex] = value.ref;
  			name.setValue(value, {
  				property: prefix,
  				itemIndex
  			});
  			return name;
  		}
  		getValue(prefix, keyOrRef) {
  			const vs = this._values[prefix];
  			if (!vs) return;
  			return vs.get(keyOrRef);
  		}
  		scopeRefs(scopeName, values = this._values) {
  			return this._reduceValues(values, (name) => {
  				if (name.scopePath === void 0) throw new Error(`CodeGen: name "${name}" has no value`);
  				return (0, code_1._)`${scopeName}${name.scopePath}`;
  			});
  		}
  		scopeCode(values = this._values, usedValues, getCode) {
  			return this._reduceValues(values, (name) => {
  				if (name.value === void 0) throw new Error(`CodeGen: name "${name}" has no value`);
  				return name.value.code;
  			}, usedValues, getCode);
  		}
  		_reduceValues(values, valueCode, usedValues = {}, getCode) {
  			let code = code_1.nil;
  			for (const prefix in values) {
  				const vs = values[prefix];
  				if (!vs) continue;
  				const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
  				vs.forEach((name) => {
  					if (nameSet.has(name)) return;
  					nameSet.set(name, UsedValueState.Started);
  					let c = valueCode(name);
  					if (c) {
  						const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
  						code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
  					} else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) code = (0, code_1._)`${code}${c}${this.opts._n}`;
  					else throw new ValueError(name);
  					nameSet.set(name, UsedValueState.Completed);
  				});
  			}
  			return code;
  		}
  	};
  	exports.ValueScope = ValueScope;
  }));
  var require_codegen = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
  	var code_1 = require_code$1();
  	var scope_1 = require_scope();
  	var code_2 = require_code$1();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return code_2._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return code_2.str;
  		}
  	});
  	Object.defineProperty(exports, "strConcat", {
  		enumerable: true,
  		get: function() {
  			return code_2.strConcat;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return code_2.nil;
  		}
  	});
  	Object.defineProperty(exports, "getProperty", {
  		enumerable: true,
  		get: function() {
  			return code_2.getProperty;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return code_2.stringify;
  		}
  	});
  	Object.defineProperty(exports, "regexpCode", {
  		enumerable: true,
  		get: function() {
  			return code_2.regexpCode;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return code_2.Name;
  		}
  	});
  	var scope_2 = require_scope();
  	Object.defineProperty(exports, "Scope", {
  		enumerable: true,
  		get: function() {
  			return scope_2.Scope;
  		}
  	});
  	Object.defineProperty(exports, "ValueScope", {
  		enumerable: true,
  		get: function() {
  			return scope_2.ValueScope;
  		}
  	});
  	Object.defineProperty(exports, "ValueScopeName", {
  		enumerable: true,
  		get: function() {
  			return scope_2.ValueScopeName;
  		}
  	});
  	Object.defineProperty(exports, "varKinds", {
  		enumerable: true,
  		get: function() {
  			return scope_2.varKinds;
  		}
  	});
  	exports.operators = {
  		GT: new code_1._Code(">"),
  		GTE: new code_1._Code(">="),
  		LT: new code_1._Code("<"),
  		LTE: new code_1._Code("<="),
  		EQ: new code_1._Code("==="),
  		NEQ: new code_1._Code("!=="),
  		NOT: new code_1._Code("!"),
  		OR: new code_1._Code("||"),
  		AND: new code_1._Code("&&"),
  		ADD: new code_1._Code("+")
  	};
  	var Node = class {
  		optimizeNodes() {
  			return this;
  		}
  		optimizeNames(_names, _constants) {
  			return this;
  		}
  	};
  	var Def = class extends Node {
  		constructor(varKind, name, rhs) {
  			super();
  			this.varKind = varKind;
  			this.name = name;
  			this.rhs = rhs;
  		}
  		render({ es5, _n }) {
  			const varKind = es5 ? scope_1.varKinds.var : this.varKind;
  			const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
  			return `${varKind} ${this.name}${rhs};` + _n;
  		}
  		optimizeNames(names, constants) {
  			if (!names[this.name.str]) return;
  			if (this.rhs) this.rhs = optimizeExpr(this.rhs, names, constants);
  			return this;
  		}
  		get names() {
  			return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
  		}
  	};
  	var Assign = class extends Node {
  		constructor(lhs, rhs, sideEffects) {
  			super();
  			this.lhs = lhs;
  			this.rhs = rhs;
  			this.sideEffects = sideEffects;
  		}
  		render({ _n }) {
  			return `${this.lhs} = ${this.rhs};` + _n;
  		}
  		optimizeNames(names, constants) {
  			if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects) return;
  			this.rhs = optimizeExpr(this.rhs, names, constants);
  			return this;
  		}
  		get names() {
  			return addExprNames(this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names }, this.rhs);
  		}
  	};
  	var AssignOp = class extends Assign {
  		constructor(lhs, op, rhs, sideEffects) {
  			super(lhs, rhs, sideEffects);
  			this.op = op;
  		}
  		render({ _n }) {
  			return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
  		}
  	};
  	var Label = class extends Node {
  		constructor(label) {
  			super();
  			this.label = label;
  			this.names = {};
  		}
  		render({ _n }) {
  			return `${this.label}:` + _n;
  		}
  	};
  	var Break = class extends Node {
  		constructor(label) {
  			super();
  			this.label = label;
  			this.names = {};
  		}
  		render({ _n }) {
  			return `break${this.label ? ` ${this.label}` : ""};` + _n;
  		}
  	};
  	var Throw = class extends Node {
  		constructor(error) {
  			super();
  			this.error = error;
  		}
  		render({ _n }) {
  			return `throw ${this.error};` + _n;
  		}
  		get names() {
  			return this.error.names;
  		}
  	};
  	var AnyCode = class extends Node {
  		constructor(code) {
  			super();
  			this.code = code;
  		}
  		render({ _n }) {
  			return `${this.code};` + _n;
  		}
  		optimizeNodes() {
  			return `${this.code}` ? this : void 0;
  		}
  		optimizeNames(names, constants) {
  			this.code = optimizeExpr(this.code, names, constants);
  			return this;
  		}
  		get names() {
  			return this.code instanceof code_1._CodeOrName ? this.code.names : {};
  		}
  	};
  	var ParentNode = class extends Node {
  		constructor(nodes = []) {
  			super();
  			this.nodes = nodes;
  		}
  		render(opts) {
  			return this.nodes.reduce((code, n) => code + n.render(opts), "");
  		}
  		optimizeNodes() {
  			const { nodes } = this;
  			let i = nodes.length;
  			while (i--) {
  				const n = nodes[i].optimizeNodes();
  				if (Array.isArray(n)) nodes.splice(i, 1, ...n);
  				else if (n) nodes[i] = n;
  				else nodes.splice(i, 1);
  			}
  			return nodes.length > 0 ? this : void 0;
  		}
  		optimizeNames(names, constants) {
  			const { nodes } = this;
  			let i = nodes.length;
  			while (i--) {
  				const n = nodes[i];
  				if (n.optimizeNames(names, constants)) continue;
  				subtractNames(names, n.names);
  				nodes.splice(i, 1);
  			}
  			return nodes.length > 0 ? this : void 0;
  		}
  		get names() {
  			return this.nodes.reduce((names, n) => addNames(names, n.names), {});
  		}
  	};
  	var BlockNode = class extends ParentNode {
  		render(opts) {
  			return "{" + opts._n + super.render(opts) + "}" + opts._n;
  		}
  	};
  	var Root = class extends ParentNode {};
  	var Else = class extends BlockNode {};
  	Else.kind = "else";
  	var If = class If extends BlockNode {
  		constructor(condition, nodes) {
  			super(nodes);
  			this.condition = condition;
  		}
  		render(opts) {
  			let code = `if(${this.condition})` + super.render(opts);
  			if (this.else) code += "else " + this.else.render(opts);
  			return code;
  		}
  		optimizeNodes() {
  			super.optimizeNodes();
  			const cond = this.condition;
  			if (cond === true) return this.nodes;
  			let e = this.else;
  			if (e) {
  				const ns = e.optimizeNodes();
  				e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
  			}
  			if (e) {
  				if (cond === false) return e instanceof If ? e : e.nodes;
  				if (this.nodes.length) return this;
  				return new If(not(cond), e instanceof If ? [e] : e.nodes);
  			}
  			if (cond === false || !this.nodes.length) return void 0;
  			return this;
  		}
  		optimizeNames(names, constants) {
  			var _a;
  			this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
  			if (!(super.optimizeNames(names, constants) || this.else)) return;
  			this.condition = optimizeExpr(this.condition, names, constants);
  			return this;
  		}
  		get names() {
  			const names = super.names;
  			addExprNames(names, this.condition);
  			if (this.else) addNames(names, this.else.names);
  			return names;
  		}
  	};
  	If.kind = "if";
  	var For = class extends BlockNode {};
  	For.kind = "for";
  	var ForLoop = class extends For {
  		constructor(iteration) {
  			super();
  			this.iteration = iteration;
  		}
  		render(opts) {
  			return `for(${this.iteration})` + super.render(opts);
  		}
  		optimizeNames(names, constants) {
  			if (!super.optimizeNames(names, constants)) return;
  			this.iteration = optimizeExpr(this.iteration, names, constants);
  			return this;
  		}
  		get names() {
  			return addNames(super.names, this.iteration.names);
  		}
  	};
  	var ForRange = class extends For {
  		constructor(varKind, name, from, to) {
  			super();
  			this.varKind = varKind;
  			this.name = name;
  			this.from = from;
  			this.to = to;
  		}
  		render(opts) {
  			const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
  			const { name, from, to } = this;
  			return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
  		}
  		get names() {
  			return addExprNames(addExprNames(super.names, this.from), this.to);
  		}
  	};
  	var ForIter = class extends For {
  		constructor(loop, varKind, name, iterable) {
  			super();
  			this.loop = loop;
  			this.varKind = varKind;
  			this.name = name;
  			this.iterable = iterable;
  		}
  		render(opts) {
  			return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
  		}
  		optimizeNames(names, constants) {
  			if (!super.optimizeNames(names, constants)) return;
  			this.iterable = optimizeExpr(this.iterable, names, constants);
  			return this;
  		}
  		get names() {
  			return addNames(super.names, this.iterable.names);
  		}
  	};
  	var Func = class extends BlockNode {
  		constructor(name, args, async) {
  			super();
  			this.name = name;
  			this.args = args;
  			this.async = async;
  		}
  		render(opts) {
  			return `${this.async ? "async " : ""}function ${this.name}(${this.args})` + super.render(opts);
  		}
  	};
  	Func.kind = "func";
  	var Return = class extends ParentNode {
  		render(opts) {
  			return "return " + super.render(opts);
  		}
  	};
  	Return.kind = "return";
  	var Try = class extends BlockNode {
  		render(opts) {
  			let code = "try" + super.render(opts);
  			if (this.catch) code += this.catch.render(opts);
  			if (this.finally) code += this.finally.render(opts);
  			return code;
  		}
  		optimizeNodes() {
  			var _a, _b;
  			super.optimizeNodes();
  			(_a = this.catch) === null || _a === void 0 || _a.optimizeNodes();
  			(_b = this.finally) === null || _b === void 0 || _b.optimizeNodes();
  			return this;
  		}
  		optimizeNames(names, constants) {
  			var _a, _b;
  			super.optimizeNames(names, constants);
  			(_a = this.catch) === null || _a === void 0 || _a.optimizeNames(names, constants);
  			(_b = this.finally) === null || _b === void 0 || _b.optimizeNames(names, constants);
  			return this;
  		}
  		get names() {
  			const names = super.names;
  			if (this.catch) addNames(names, this.catch.names);
  			if (this.finally) addNames(names, this.finally.names);
  			return names;
  		}
  	};
  	var Catch = class extends BlockNode {
  		constructor(error) {
  			super();
  			this.error = error;
  		}
  		render(opts) {
  			return `catch(${this.error})` + super.render(opts);
  		}
  	};
  	Catch.kind = "catch";
  	var Finally = class extends BlockNode {
  		render(opts) {
  			return "finally" + super.render(opts);
  		}
  	};
  	Finally.kind = "finally";
  	var CodeGen = class {
  		constructor(extScope, opts = {}) {
  			this._values = {};
  			this._blockStarts = [];
  			this._constants = {};
  			this.opts = {
  				...opts,
  				_n: opts.lines ? "\n" : ""
  			};
  			this._extScope = extScope;
  			this._scope = new scope_1.Scope({ parent: extScope });
  			this._nodes = [new Root()];
  		}
  		toString() {
  			return this._root.render(this.opts);
  		}
  		name(prefix) {
  			return this._scope.name(prefix);
  		}
  		scopeName(prefix) {
  			return this._extScope.name(prefix);
  		}
  		scopeValue(prefixOrName, value) {
  			const name = this._extScope.value(prefixOrName, value);
  			(this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set())).add(name);
  			return name;
  		}
  		getScopeValue(prefix, keyOrRef) {
  			return this._extScope.getValue(prefix, keyOrRef);
  		}
  		scopeRefs(scopeName) {
  			return this._extScope.scopeRefs(scopeName, this._values);
  		}
  		scopeCode() {
  			return this._extScope.scopeCode(this._values);
  		}
  		_def(varKind, nameOrPrefix, rhs, constant) {
  			const name = this._scope.toName(nameOrPrefix);
  			if (rhs !== void 0 && constant) this._constants[name.str] = rhs;
  			this._leafNode(new Def(varKind, name, rhs));
  			return name;
  		}
  		const(nameOrPrefix, rhs, _constant) {
  			return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
  		}
  		let(nameOrPrefix, rhs, _constant) {
  			return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
  		}
  		var(nameOrPrefix, rhs, _constant) {
  			return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
  		}
  		assign(lhs, rhs, sideEffects) {
  			return this._leafNode(new Assign(lhs, rhs, sideEffects));
  		}
  		add(lhs, rhs) {
  			return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
  		}
  		code(c) {
  			if (typeof c == "function") c();
  			else if (c !== code_1.nil) this._leafNode(new AnyCode(c));
  			return this;
  		}
  		object(...keyValues) {
  			const code = ["{"];
  			for (const [key, value] of keyValues) {
  				if (code.length > 1) code.push(",");
  				code.push(key);
  				if (key !== value || this.opts.es5) {
  					code.push(":");
  					(0, code_1.addCodeArg)(code, value);
  				}
  			}
  			code.push("}");
  			return new code_1._Code(code);
  		}
  		if(condition, thenBody, elseBody) {
  			this._blockNode(new If(condition));
  			if (thenBody && elseBody) this.code(thenBody).else().code(elseBody).endIf();
  			else if (thenBody) this.code(thenBody).endIf();
  			else if (elseBody) throw new Error("CodeGen: \"else\" body without \"then\" body");
  			return this;
  		}
  		elseIf(condition) {
  			return this._elseNode(new If(condition));
  		}
  		else() {
  			return this._elseNode(new Else());
  		}
  		endIf() {
  			return this._endBlockNode(If, Else);
  		}
  		_for(node, forBody) {
  			this._blockNode(node);
  			if (forBody) this.code(forBody).endFor();
  			return this;
  		}
  		for(iteration, forBody) {
  			return this._for(new ForLoop(iteration), forBody);
  		}
  		forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
  			const name = this._scope.toName(nameOrPrefix);
  			return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
  		}
  		forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
  			const name = this._scope.toName(nameOrPrefix);
  			if (this.opts.es5) {
  				const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
  				return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
  					this.var(name, (0, code_1._)`${arr}[${i}]`);
  					forBody(name);
  				});
  			}
  			return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
  		}
  		forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
  			if (this.opts.ownProperties) return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
  			const name = this._scope.toName(nameOrPrefix);
  			return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
  		}
  		endFor() {
  			return this._endBlockNode(For);
  		}
  		label(label) {
  			return this._leafNode(new Label(label));
  		}
  		break(label) {
  			return this._leafNode(new Break(label));
  		}
  		return(value) {
  			const node = new Return();
  			this._blockNode(node);
  			this.code(value);
  			if (node.nodes.length !== 1) throw new Error("CodeGen: \"return\" should have one node");
  			return this._endBlockNode(Return);
  		}
  		try(tryBody, catchCode, finallyCode) {
  			if (!catchCode && !finallyCode) throw new Error("CodeGen: \"try\" without \"catch\" and \"finally\"");
  			const node = new Try();
  			this._blockNode(node);
  			this.code(tryBody);
  			if (catchCode) {
  				const error = this.name("e");
  				this._currNode = node.catch = new Catch(error);
  				catchCode(error);
  			}
  			if (finallyCode) {
  				this._currNode = node.finally = new Finally();
  				this.code(finallyCode);
  			}
  			return this._endBlockNode(Catch, Finally);
  		}
  		throw(error) {
  			return this._leafNode(new Throw(error));
  		}
  		block(body, nodeCount) {
  			this._blockStarts.push(this._nodes.length);
  			if (body) this.code(body).endBlock(nodeCount);
  			return this;
  		}
  		endBlock(nodeCount) {
  			const len = this._blockStarts.pop();
  			if (len === void 0) throw new Error("CodeGen: not in self-balancing block");
  			const toClose = this._nodes.length - len;
  			if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
  			this._nodes.length = len;
  			return this;
  		}
  		func(name, args = code_1.nil, async, funcBody) {
  			this._blockNode(new Func(name, args, async));
  			if (funcBody) this.code(funcBody).endFunc();
  			return this;
  		}
  		endFunc() {
  			return this._endBlockNode(Func);
  		}
  		optimize(n = 1) {
  			while (n-- > 0) {
  				this._root.optimizeNodes();
  				this._root.optimizeNames(this._root.names, this._constants);
  			}
  		}
  		_leafNode(node) {
  			this._currNode.nodes.push(node);
  			return this;
  		}
  		_blockNode(node) {
  			this._currNode.nodes.push(node);
  			this._nodes.push(node);
  		}
  		_endBlockNode(N1, N2) {
  			const n = this._currNode;
  			if (n instanceof N1 || N2 && n instanceof N2) {
  				this._nodes.pop();
  				return this;
  			}
  			throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
  		}
  		_elseNode(node) {
  			const n = this._currNode;
  			if (!(n instanceof If)) throw new Error("CodeGen: \"else\" without \"if\"");
  			this._currNode = n.else = node;
  			return this;
  		}
  		get _root() {
  			return this._nodes[0];
  		}
  		get _currNode() {
  			const ns = this._nodes;
  			return ns[ns.length - 1];
  		}
  		set _currNode(node) {
  			const ns = this._nodes;
  			ns[ns.length - 1] = node;
  		}
  	};
  	exports.CodeGen = CodeGen;
  	function addNames(names, from) {
  		for (const n in from) names[n] = (names[n] || 0) + (from[n] || 0);
  		return names;
  	}
  	function addExprNames(names, from) {
  		return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
  	}
  	function optimizeExpr(expr, names, constants) {
  		if (expr instanceof code_1.Name) return replaceName(expr);
  		if (!canOptimize(expr)) return expr;
  		return new code_1._Code(expr._items.reduce((items, c) => {
  			if (c instanceof code_1.Name) c = replaceName(c);
  			if (c instanceof code_1._Code) items.push(...c._items);
  			else items.push(c);
  			return items;
  		}, []));
  		function replaceName(n) {
  			const c = constants[n.str];
  			if (c === void 0 || names[n.str] !== 1) return n;
  			delete names[n.str];
  			return c;
  		}
  		function canOptimize(e) {
  			return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
  		}
  	}
  	function subtractNames(names, from) {
  		for (const n in from) names[n] = (names[n] || 0) - (from[n] || 0);
  	}
  	function not(x) {
  		return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
  	}
  	exports.not = not;
  	var andCode = mappend(exports.operators.AND);
  	function and(...args) {
  		return args.reduce(andCode);
  	}
  	exports.and = and;
  	var orCode = mappend(exports.operators.OR);
  	function or(...args) {
  		return args.reduce(orCode);
  	}
  	exports.or = or;
  	function mappend(op) {
  		return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
  	}
  	function par(x) {
  		return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
  	}
  }));
  var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
  	var codegen_1 = require_codegen();
  	var code_1 = require_code$1();
  	function toHash(arr) {
  		const hash = {};
  		for (const item of arr) hash[item] = true;
  		return hash;
  	}
  	exports.toHash = toHash;
  	function alwaysValidSchema(it, schema) {
  		if (typeof schema == "boolean") return schema;
  		if (Object.keys(schema).length === 0) return true;
  		checkUnknownRules(it, schema);
  		return !schemaHasRules(schema, it.self.RULES.all);
  	}
  	exports.alwaysValidSchema = alwaysValidSchema;
  	function checkUnknownRules(it, schema = it.schema) {
  		const { opts, self } = it;
  		if (!opts.strictSchema) return;
  		if (typeof schema === "boolean") return;
  		const rules = self.RULES.keywords;
  		for (const key in schema) if (!rules[key]) checkStrictMode(it, `unknown keyword: "${key}"`);
  	}
  	exports.checkUnknownRules = checkUnknownRules;
  	function schemaHasRules(schema, rules) {
  		if (typeof schema == "boolean") return !schema;
  		for (const key in schema) if (rules[key]) return true;
  		return false;
  	}
  	exports.schemaHasRules = schemaHasRules;
  	function schemaHasRulesButRef(schema, RULES) {
  		if (typeof schema == "boolean") return !schema;
  		for (const key in schema) if (key !== "$ref" && RULES.all[key]) return true;
  		return false;
  	}
  	exports.schemaHasRulesButRef = schemaHasRulesButRef;
  	function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
  		if (!$data) {
  			if (typeof schema == "number" || typeof schema == "boolean") return schema;
  			if (typeof schema == "string") return (0, codegen_1._)`${schema}`;
  		}
  		return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
  	}
  	exports.schemaRefOrVal = schemaRefOrVal;
  	function unescapeFragment(str) {
  		return unescapeJsonPointer(decodeURIComponent(str));
  	}
  	exports.unescapeFragment = unescapeFragment;
  	function escapeFragment(str) {
  		return encodeURIComponent(escapeJsonPointer(str));
  	}
  	exports.escapeFragment = escapeFragment;
  	function escapeJsonPointer(str) {
  		if (typeof str == "number") return `${str}`;
  		return str.replace(/~/g, "~0").replace(/\//g, "~1");
  	}
  	exports.escapeJsonPointer = escapeJsonPointer;
  	function unescapeJsonPointer(str) {
  		return str.replace(/~1/g, "/").replace(/~0/g, "~");
  	}
  	exports.unescapeJsonPointer = unescapeJsonPointer;
  	function eachItem(xs, f) {
  		if (Array.isArray(xs)) for (const x of xs) f(x);
  		else f(xs);
  	}
  	exports.eachItem = eachItem;
  	function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
  		return (gen, from, to, toName) => {
  			const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
  			return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
  		};
  	}
  	exports.mergeEvaluated = {
  		props: makeMergeEvaluated({
  			mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
  				gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
  			}),
  			mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
  				if (from === true) gen.assign(to, true);
  				else {
  					gen.assign(to, (0, codegen_1._)`${to} || {}`);
  					setEvaluated(gen, to, from);
  				}
  			}),
  			mergeValues: (from, to) => from === true ? true : {
  				...from,
  				...to
  			},
  			resultToName: evaluatedPropsToName
  		}),
  		items: makeMergeEvaluated({
  			mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
  			mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
  			mergeValues: (from, to) => from === true ? true : Math.max(from, to),
  			resultToName: (gen, items) => gen.var("items", items)
  		})
  	};
  	function evaluatedPropsToName(gen, ps) {
  		if (ps === true) return gen.var("props", true);
  		const props = gen.var("props", (0, codegen_1._)`{}`);
  		if (ps !== void 0) setEvaluated(gen, props, ps);
  		return props;
  	}
  	exports.evaluatedPropsToName = evaluatedPropsToName;
  	function setEvaluated(gen, props, ps) {
  		Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
  	}
  	exports.setEvaluated = setEvaluated;
  	var snippets = {};
  	function useFunc(gen, f) {
  		return gen.scopeValue("func", {
  			ref: f,
  			code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
  		});
  	}
  	exports.useFunc = useFunc;
  	var Type;
  	(function(Type) {
  		Type[Type["Num"] = 0] = "Num";
  		Type[Type["Str"] = 1] = "Str";
  	})(Type || (exports.Type = Type = {}));
  	function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
  		if (dataProp instanceof codegen_1.Name) {
  			const isNumber = dataPropType === Type.Num;
  			return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  		}
  		return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
  	}
  	exports.getErrorPath = getErrorPath;
  	function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
  		if (!mode) return;
  		msg = `strict mode: ${msg}`;
  		if (mode === true) throw new Error(msg);
  		it.self.logger.warn(msg);
  	}
  	exports.checkStrictMode = checkStrictMode;
  }));
  var require_names = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		data: new codegen_1.Name("data"),
  		valCxt: new codegen_1.Name("valCxt"),
  		instancePath: new codegen_1.Name("instancePath"),
  		parentData: new codegen_1.Name("parentData"),
  		parentDataProperty: new codegen_1.Name("parentDataProperty"),
  		rootData: new codegen_1.Name("rootData"),
  		dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
  		vErrors: new codegen_1.Name("vErrors"),
  		errors: new codegen_1.Name("errors"),
  		this: new codegen_1.Name("this"),
  		self: new codegen_1.Name("self"),
  		scope: new codegen_1.Name("scope"),
  		json: new codegen_1.Name("json"),
  		jsonPos: new codegen_1.Name("jsonPos"),
  		jsonLen: new codegen_1.Name("jsonLen"),
  		jsonPart: new codegen_1.Name("jsonPart")
  	};
  }));
  var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var names_1 = require_names();
  	exports.keywordError = { message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation` };
  	exports.keyword$DataError = { message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)` };
  	function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
  		const { it } = cxt;
  		const { gen, compositeRule, allErrors } = it;
  		const errObj = errorObjectCode(cxt, error, errorPaths);
  		if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) addError(gen, errObj);
  		else returnErrors(it, (0, codegen_1._)`[${errObj}]`);
  	}
  	exports.reportError = reportError;
  	function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
  		const { it } = cxt;
  		const { gen, compositeRule, allErrors } = it;
  		addError(gen, errorObjectCode(cxt, error, errorPaths));
  		if (!(compositeRule || allErrors)) returnErrors(it, names_1.default.vErrors);
  	}
  	exports.reportExtraError = reportExtraError;
  	function resetErrorsCount(gen, errsCount) {
  		gen.assign(names_1.default.errors, errsCount);
  		gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
  	}
  	exports.resetErrorsCount = resetErrorsCount;
  	function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
  		/* istanbul ignore if */
  		if (errsCount === void 0) throw new Error("ajv implementation error");
  		const err = gen.name("err");
  		gen.forRange("i", errsCount, names_1.default.errors, (i) => {
  			gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
  			gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
  			gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
  			if (it.opts.verbose) {
  				gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
  				gen.assign((0, codegen_1._)`${err}.data`, data);
  			}
  		});
  	}
  	exports.extendErrors = extendErrors;
  	function addError(gen, errObj) {
  		const err = gen.const("err", errObj);
  		gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
  		gen.code((0, codegen_1._)`${names_1.default.errors}++`);
  	}
  	function returnErrors(it, errs) {
  		const { gen, validateName, schemaEnv } = it;
  		if (schemaEnv.$async) gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
  		else {
  			gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
  			gen.return(false);
  		}
  	}
  	var E = {
  		keyword: new codegen_1.Name("keyword"),
  		schemaPath: new codegen_1.Name("schemaPath"),
  		params: new codegen_1.Name("params"),
  		propertyName: new codegen_1.Name("propertyName"),
  		message: new codegen_1.Name("message"),
  		schema: new codegen_1.Name("schema"),
  		parentSchema: new codegen_1.Name("parentSchema")
  	};
  	function errorObjectCode(cxt, error, errorPaths) {
  		const { createErrors } = cxt.it;
  		if (createErrors === false) return (0, codegen_1._)`{}`;
  		return errorObject(cxt, error, errorPaths);
  	}
  	function errorObject(cxt, error, errorPaths = {}) {
  		const { gen, it } = cxt;
  		const keyValues = [errorInstancePath(it, errorPaths), errorSchemaPath(cxt, errorPaths)];
  		extraErrorProps(cxt, error, keyValues);
  		return gen.object(...keyValues);
  	}
  	function errorInstancePath({ errorPath }, { instancePath }) {
  		const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
  		return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
  	}
  	function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
  		let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
  		if (schemaPath) schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
  		return [E.schemaPath, schPath];
  	}
  	function extraErrorProps(cxt, { params, message }, keyValues) {
  		const { keyword, data, schemaValue, it } = cxt;
  		const { opts, propertyName, topSchemaRef, schemaPath } = it;
  		keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
  		if (opts.messages) keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
  		if (opts.verbose) keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
  		if (propertyName) keyValues.push([E.propertyName, propertyName]);
  	}
  }));
  var require_boolSchema = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
  	var errors_1 = require_errors();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var boolError = { message: "boolean schema is false" };
  	function topBoolOrEmptySchema(it) {
  		const { gen, schema, validateName } = it;
  		if (schema === false) falseSchemaError(it, false);
  		else if (typeof schema == "object" && schema.$async === true) gen.return(names_1.default.data);
  		else {
  			gen.assign((0, codegen_1._)`${validateName}.errors`, null);
  			gen.return(true);
  		}
  	}
  	exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
  	function boolOrEmptySchema(it, valid) {
  		const { gen, schema } = it;
  		if (schema === false) {
  			gen.var(valid, false);
  			falseSchemaError(it);
  		} else gen.var(valid, true);
  	}
  	exports.boolOrEmptySchema = boolOrEmptySchema;
  	function falseSchemaError(it, overrideAllErrors) {
  		const { gen, data } = it;
  		const cxt = {
  			gen,
  			keyword: "false schema",
  			data,
  			schema: false,
  			schemaCode: false,
  			schemaValue: false,
  			params: {},
  			it
  		};
  		(0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
  	}
  }));
  var require_rules = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.getRules = exports.isJSONType = void 0;
  	var jsonTypes = /* @__PURE__ */ new Set([
  		"string",
  		"number",
  		"integer",
  		"boolean",
  		"null",
  		"object",
  		"array"
  	]);
  	function isJSONType(x) {
  		return typeof x == "string" && jsonTypes.has(x);
  	}
  	exports.isJSONType = isJSONType;
  	function getRules() {
  		const groups = {
  			number: {
  				type: "number",
  				rules: []
  			},
  			string: {
  				type: "string",
  				rules: []
  			},
  			array: {
  				type: "array",
  				rules: []
  			},
  			object: {
  				type: "object",
  				rules: []
  			}
  		};
  		return {
  			types: {
  				...groups,
  				integer: true,
  				boolean: true,
  				null: true
  			},
  			rules: [
  				{ rules: [] },
  				groups.number,
  				groups.string,
  				groups.array,
  				groups.object
  			],
  			post: { rules: [] },
  			all: {},
  			keywords: {}
  		};
  	}
  	exports.getRules = getRules;
  }));
  var require_applicability = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
  	function schemaHasRulesForType({ schema, self }, type) {
  		const group = self.RULES.types[type];
  		return group && group !== true && shouldUseGroup(schema, group);
  	}
  	exports.schemaHasRulesForType = schemaHasRulesForType;
  	function shouldUseGroup(schema, group) {
  		return group.rules.some((rule) => shouldUseRule(schema, rule));
  	}
  	exports.shouldUseGroup = shouldUseGroup;
  	function shouldUseRule(schema, rule) {
  		var _a;
  		return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
  	}
  	exports.shouldUseRule = shouldUseRule;
  }));
  var require_dataType = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
  	var rules_1 = require_rules();
  	var applicability_1 = require_applicability();
  	var errors_1 = require_errors();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var DataType;
  	(function(DataType) {
  		DataType[DataType["Correct"] = 0] = "Correct";
  		DataType[DataType["Wrong"] = 1] = "Wrong";
  	})(DataType || (exports.DataType = DataType = {}));
  	function getSchemaTypes(schema) {
  		const types = getJSONTypes(schema.type);
  		if (types.includes("null")) {
  			if (schema.nullable === false) throw new Error("type: null contradicts nullable: false");
  		} else {
  			if (!types.length && schema.nullable !== void 0) throw new Error("\"nullable\" cannot be used without \"type\"");
  			if (schema.nullable === true) types.push("null");
  		}
  		return types;
  	}
  	exports.getSchemaTypes = getSchemaTypes;
  	function getJSONTypes(ts) {
  		const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
  		if (types.every(rules_1.isJSONType)) return types;
  		throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
  	}
  	exports.getJSONTypes = getJSONTypes;
  	function coerceAndCheckDataType(it, types) {
  		const { gen, data, opts } = it;
  		const coerceTo = coerceToTypes(types, opts.coerceTypes);
  		const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
  		if (checkTypes) {
  			const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
  			gen.if(wrongType, () => {
  				if (coerceTo.length) coerceData(it, types, coerceTo);
  				else reportTypeError(it);
  			});
  		}
  		return checkTypes;
  	}
  	exports.coerceAndCheckDataType = coerceAndCheckDataType;
  	var COERCIBLE = /* @__PURE__ */ new Set([
  		"string",
  		"number",
  		"integer",
  		"boolean",
  		"null"
  	]);
  	function coerceToTypes(types, coerceTypes) {
  		return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
  	}
  	function coerceData(it, types, coerceTo) {
  		const { gen, data, opts } = it;
  		const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
  		const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
  		if (opts.coerceTypes === "array") gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
  		gen.if((0, codegen_1._)`${coerced} !== undefined`);
  		for (const t of coerceTo) if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") coerceSpecificType(t);
  		gen.else();
  		reportTypeError(it);
  		gen.endIf();
  		gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
  			gen.assign(data, coerced);
  			assignParentData(it, coerced);
  		});
  		function coerceSpecificType(t) {
  			switch (t) {
  				case "string":
  					gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
  					return;
  				case "number":
  					gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
                || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
  					return;
  				case "integer":
  					gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
                || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
  					return;
  				case "boolean":
  					gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
  					return;
  				case "null":
  					gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
  					gen.assign(coerced, null);
  					return;
  				case "array": gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
                || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
  			}
  		}
  	}
  	function assignParentData({ gen, parentData, parentDataProperty }, expr) {
  		gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
  	}
  	function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
  		const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
  		let cond;
  		switch (dataType) {
  			case "null": return (0, codegen_1._)`${data} ${EQ} null`;
  			case "array":
  				cond = (0, codegen_1._)`Array.isArray(${data})`;
  				break;
  			case "object":
  				cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
  				break;
  			case "integer":
  				cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
  				break;
  			case "number":
  				cond = numCond();
  				break;
  			default: return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
  		}
  		return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
  		function numCond(_cond = codegen_1.nil) {
  			return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
  		}
  	}
  	exports.checkDataType = checkDataType;
  	function checkDataTypes(dataTypes, data, strictNums, correct) {
  		if (dataTypes.length === 1) return checkDataType(dataTypes[0], data, strictNums, correct);
  		let cond;
  		const types = (0, util_1.toHash)(dataTypes);
  		if (types.array && types.object) {
  			const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
  			cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
  			delete types.null;
  			delete types.array;
  			delete types.object;
  		} else cond = codegen_1.nil;
  		if (types.number) delete types.integer;
  		for (const t in types) cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
  		return cond;
  	}
  	exports.checkDataTypes = checkDataTypes;
  	var typeError = {
  		message: ({ schema }) => `must be ${schema}`,
  		params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
  	};
  	function reportTypeError(it) {
  		const cxt = getTypeErrorContext(it);
  		(0, errors_1.reportError)(cxt, typeError);
  	}
  	exports.reportTypeError = reportTypeError;
  	function getTypeErrorContext(it) {
  		const { gen, data, schema } = it;
  		const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
  		return {
  			gen,
  			keyword: "type",
  			data,
  			schema: schema.type,
  			schemaCode,
  			schemaValue: schemaCode,
  			parentSchema: schema,
  			params: {},
  			it
  		};
  	}
  }));
  var require_defaults = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.assignDefaults = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	function assignDefaults(it, ty) {
  		const { properties, items } = it.schema;
  		if (ty === "object" && properties) for (const key in properties) assignDefault(it, key, properties[key].default);
  		else if (ty === "array" && Array.isArray(items)) items.forEach((sch, i) => assignDefault(it, i, sch.default));
  	}
  	exports.assignDefaults = assignDefaults;
  	function assignDefault(it, prop, defaultValue) {
  		const { gen, compositeRule, data, opts } = it;
  		if (defaultValue === void 0) return;
  		const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
  		if (compositeRule) {
  			(0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
  			return;
  		}
  		let condition = (0, codegen_1._)`${childData} === undefined`;
  		if (opts.useDefaults === "empty") condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
  		gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
  	}
  }));
  var require_code = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var names_1 = require_names();
  	var util_2 = require_util();
  	function checkReportMissingProp(cxt, prop) {
  		const { gen, data, it } = cxt;
  		gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
  			cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
  			cxt.error();
  		});
  	}
  	exports.checkReportMissingProp = checkReportMissingProp;
  	function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
  		return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
  	}
  	exports.checkMissingProp = checkMissingProp;
  	function reportMissingProp(cxt, missing) {
  		cxt.setParams({ missingProperty: missing }, true);
  		cxt.error();
  	}
  	exports.reportMissingProp = reportMissingProp;
  	function hasPropFunc(gen) {
  		return gen.scopeValue("func", {
  			ref: Object.prototype.hasOwnProperty,
  			code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
  		});
  	}
  	exports.hasPropFunc = hasPropFunc;
  	function isOwnProperty(gen, data, property) {
  		return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
  	}
  	exports.isOwnProperty = isOwnProperty;
  	function propertyInData(gen, data, property, ownProperties) {
  		const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
  		return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
  	}
  	exports.propertyInData = propertyInData;
  	function noPropertyInData(gen, data, property, ownProperties) {
  		const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
  		return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
  	}
  	exports.noPropertyInData = noPropertyInData;
  	function allSchemaProperties(schemaMap) {
  		return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
  	}
  	exports.allSchemaProperties = allSchemaProperties;
  	function schemaProperties(it, schemaMap) {
  		return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
  	}
  	exports.schemaProperties = schemaProperties;
  	function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
  		const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
  		const valCxt = [
  			[names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
  			[names_1.default.parentData, it.parentData],
  			[names_1.default.parentDataProperty, it.parentDataProperty],
  			[names_1.default.rootData, names_1.default.rootData]
  		];
  		if (it.opts.dynamicRef) valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
  		const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
  		return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
  	}
  	exports.callValidateCode = callValidateCode;
  	var newRegExp = (0, codegen_1._)`new RegExp`;
  	function usePattern({ gen, it: { opts } }, pattern) {
  		const u = opts.unicodeRegExp ? "u" : "";
  		const { regExp } = opts.code;
  		const rx = regExp(pattern, u);
  		return gen.scopeValue("pattern", {
  			key: rx.toString(),
  			ref: rx,
  			code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
  		});
  	}
  	exports.usePattern = usePattern;
  	function validateArray(cxt) {
  		const { gen, data, keyword, it } = cxt;
  		const valid = gen.name("valid");
  		if (it.allErrors) {
  			const validArr = gen.let("valid", true);
  			validateItems(() => gen.assign(validArr, false));
  			return validArr;
  		}
  		gen.var(valid, true);
  		validateItems(() => gen.break());
  		return valid;
  		function validateItems(notValid) {
  			const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  			gen.forRange("i", 0, len, (i) => {
  				cxt.subschema({
  					keyword,
  					dataProp: i,
  					dataPropType: util_1.Type.Num
  				}, valid);
  				gen.if((0, codegen_1.not)(valid), notValid);
  			});
  		}
  	}
  	exports.validateArray = validateArray;
  	function validateUnion(cxt) {
  		const { gen, schema, keyword, it } = cxt;
  		/* istanbul ignore if */
  		if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  		if (schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch)) && !it.opts.unevaluated) return;
  		const valid = gen.let("valid", false);
  		const schValid = gen.name("_valid");
  		gen.block(() => schema.forEach((_sch, i) => {
  			const schCxt = cxt.subschema({
  				keyword,
  				schemaProp: i,
  				compositeRule: true
  			}, schValid);
  			gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
  			if (!cxt.mergeValidEvaluated(schCxt, schValid)) gen.if((0, codegen_1.not)(valid));
  		}));
  		cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  	}
  	exports.validateUnion = validateUnion;
  }));
  var require_keyword = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var code_1 = require_code();
  	var errors_1 = require_errors();
  	function macroKeywordCode(cxt, def) {
  		const { gen, keyword, schema, parentSchema, it } = cxt;
  		const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
  		const schemaRef = useKeyword(gen, keyword, macroSchema);
  		if (it.opts.validateSchema !== false) it.self.validateSchema(macroSchema, true);
  		const valid = gen.name("valid");
  		cxt.subschema({
  			schema: macroSchema,
  			schemaPath: codegen_1.nil,
  			errSchemaPath: `${it.errSchemaPath}/${keyword}`,
  			topSchemaRef: schemaRef,
  			compositeRule: true
  		}, valid);
  		cxt.pass(valid, () => cxt.error(true));
  	}
  	exports.macroKeywordCode = macroKeywordCode;
  	function funcKeywordCode(cxt, def) {
  		var _a;
  		const { gen, keyword, schema, parentSchema, $data, it } = cxt;
  		checkAsyncKeyword(it, def);
  		const validateRef = useKeyword(gen, keyword, !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate);
  		const valid = gen.let("valid");
  		cxt.block$data(valid, validateKeyword);
  		cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
  		function validateKeyword() {
  			if (def.errors === false) {
  				assignValid();
  				if (def.modifying) modifyData(cxt);
  				reportErrs(() => cxt.error());
  			} else {
  				const ruleErrs = def.async ? validateAsync() : validateSync();
  				if (def.modifying) modifyData(cxt);
  				reportErrs(() => addErrs(cxt, ruleErrs));
  			}
  		}
  		function validateAsync() {
  			const ruleErrs = gen.let("ruleErrs", null);
  			gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
  			return ruleErrs;
  		}
  		function validateSync() {
  			const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
  			gen.assign(validateErrs, null);
  			assignValid(codegen_1.nil);
  			return validateErrs;
  		}
  		function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
  			const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
  			const passSchema = !("compile" in def && !$data || def.schema === false);
  			gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
  		}
  		function reportErrs(errors) {
  			var _a;
  			gen.if((0, codegen_1.not)((_a = def.valid) !== null && _a !== void 0 ? _a : valid), errors);
  		}
  	}
  	exports.funcKeywordCode = funcKeywordCode;
  	function modifyData(cxt) {
  		const { gen, data, it } = cxt;
  		gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
  	}
  	function addErrs(cxt, errs) {
  		const { gen } = cxt;
  		gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
  			gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
  			(0, errors_1.extendErrors)(cxt);
  		}, () => cxt.error());
  	}
  	function checkAsyncKeyword({ schemaEnv }, def) {
  		if (def.async && !schemaEnv.$async) throw new Error("async keyword in sync schema");
  	}
  	function useKeyword(gen, keyword, result) {
  		if (result === void 0) throw new Error(`keyword "${keyword}" failed to compile`);
  		return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : {
  			ref: result,
  			code: (0, codegen_1.stringify)(result)
  		});
  	}
  	function validSchemaType(schema, schemaType, allowUndefined = false) {
  		return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
  	}
  	exports.validSchemaType = validSchemaType;
  	function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
  		/* istanbul ignore if */
  		if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) throw new Error("ajv implementation error");
  		const deps = def.dependencies;
  		if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
  		if (def.validateSchema) {
  			if (!def.validateSchema(schema[keyword])) {
  				const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
  				if (opts.validateSchema === "log") self.logger.error(msg);
  				else throw new Error(msg);
  			}
  		}
  	}
  	exports.validateKeywordUsage = validateKeywordUsage;
  }));
  var require_subschema = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
  		if (keyword !== void 0 && schema !== void 0) throw new Error("both \"keyword\" and \"schema\" passed, only one allowed");
  		if (keyword !== void 0) {
  			const sch = it.schema[keyword];
  			return schemaProp === void 0 ? {
  				schema: sch,
  				schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
  				errSchemaPath: `${it.errSchemaPath}/${keyword}`
  			} : {
  				schema: sch[schemaProp],
  				schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
  				errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
  			};
  		}
  		if (schema !== void 0) {
  			if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) throw new Error("\"schemaPath\", \"errSchemaPath\" and \"topSchemaRef\" are required with \"schema\"");
  			return {
  				schema,
  				schemaPath,
  				topSchemaRef,
  				errSchemaPath
  			};
  		}
  		throw new Error("either \"keyword\" or \"schema\" must be passed");
  	}
  	exports.getSubschema = getSubschema;
  	function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
  		if (data !== void 0 && dataProp !== void 0) throw new Error("both \"data\" and \"dataProp\" passed, only one allowed");
  		const { gen } = it;
  		if (dataProp !== void 0) {
  			const { errorPath, dataPathArr, opts } = it;
  			dataContextProps(gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true));
  			subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
  			subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
  			subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
  		}
  		if (data !== void 0) {
  			dataContextProps(data instanceof codegen_1.Name ? data : gen.let("data", data, true));
  			if (propertyName !== void 0) subschema.propertyName = propertyName;
  		}
  		if (dataTypes) subschema.dataTypes = dataTypes;
  		function dataContextProps(_nextData) {
  			subschema.data = _nextData;
  			subschema.dataLevel = it.dataLevel + 1;
  			subschema.dataTypes = [];
  			it.definedProperties = /* @__PURE__ */ new Set();
  			subschema.parentData = it.data;
  			subschema.dataNames = [...it.dataNames, _nextData];
  		}
  	}
  	exports.extendSubschemaData = extendSubschemaData;
  	function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
  		if (compositeRule !== void 0) subschema.compositeRule = compositeRule;
  		if (createErrors !== void 0) subschema.createErrors = createErrors;
  		if (allErrors !== void 0) subschema.allErrors = allErrors;
  		subschema.jtdDiscriminator = jtdDiscriminator;
  		subschema.jtdMetadata = jtdMetadata;
  	}
  	exports.extendSubschemaMode = extendSubschemaMode;
  }));
  var require_fast_deep_equal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	module.exports = function equal(a, b) {
  		if (a === b) return true;
  		if (a && b && typeof a == "object" && typeof b == "object") {
  			if (a.constructor !== b.constructor) return false;
  			var length, i, keys;
  			if (Array.isArray(a)) {
  				length = a.length;
  				if (length != b.length) return false;
  				for (i = length; i-- !== 0;) if (!equal(a[i], b[i])) return false;
  				return true;
  			}
  			if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
  			if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
  			if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
  			keys = Object.keys(a);
  			length = keys.length;
  			if (length !== Object.keys(b).length) return false;
  			for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
  			for (i = length; i-- !== 0;) {
  				var key = keys[i];
  				if (!equal(a[key], b[key])) return false;
  			}
  			return true;
  		}
  		return a !== a && b !== b;
  	};
  }));
  var require_json_schema_traverse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	var traverse = module.exports = function(schema, opts, cb) {
  		if (typeof opts == "function") {
  			cb = opts;
  			opts = {};
  		}
  		cb = opts.cb || cb;
  		var pre = typeof cb == "function" ? cb : cb.pre || function() {};
  		var post = cb.post || function() {};
  		_traverse(opts, pre, post, schema, "", schema);
  	};
  	traverse.keywords = {
  		additionalItems: true,
  		items: true,
  		contains: true,
  		additionalProperties: true,
  		propertyNames: true,
  		not: true,
  		if: true,
  		then: true,
  		else: true
  	};
  	traverse.arrayKeywords = {
  		items: true,
  		allOf: true,
  		anyOf: true,
  		oneOf: true
  	};
  	traverse.propsKeywords = {
  		$defs: true,
  		definitions: true,
  		properties: true,
  		patternProperties: true,
  		dependencies: true
  	};
  	traverse.skipKeywords = {
  		default: true,
  		enum: true,
  		const: true,
  		required: true,
  		maximum: true,
  		minimum: true,
  		exclusiveMaximum: true,
  		exclusiveMinimum: true,
  		multipleOf: true,
  		maxLength: true,
  		minLength: true,
  		pattern: true,
  		format: true,
  		maxItems: true,
  		minItems: true,
  		uniqueItems: true,
  		maxProperties: true,
  		minProperties: true
  	};
  	function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
  		if (schema && typeof schema == "object" && !Array.isArray(schema)) {
  			pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  			for (var key in schema) {
  				var sch = schema[key];
  				if (Array.isArray(sch)) {
  					if (key in traverse.arrayKeywords) for (var i = 0; i < sch.length; i++) _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
  				} else if (key in traverse.propsKeywords) {
  					if (sch && typeof sch == "object") for (var prop in sch) _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
  				} else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
  			}
  			post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  		}
  	}
  	function escapeJsonPtr(str) {
  		return str.replace(/~/g, "~0").replace(/\//g, "~1");
  	}
  }));
  var require_resolve = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
  	var util_1 = require_util();
  	var equal = require_fast_deep_equal();
  	var traverse = require_json_schema_traverse();
  	var SIMPLE_INLINED = /* @__PURE__ */ new Set([
  		"type",
  		"format",
  		"pattern",
  		"maxLength",
  		"minLength",
  		"maxProperties",
  		"minProperties",
  		"maxItems",
  		"minItems",
  		"maximum",
  		"minimum",
  		"uniqueItems",
  		"multipleOf",
  		"required",
  		"enum",
  		"const"
  	]);
  	function inlineRef(schema, limit = true) {
  		if (typeof schema == "boolean") return true;
  		if (limit === true) return !hasRef(schema);
  		if (!limit) return false;
  		return countKeys(schema) <= limit;
  	}
  	exports.inlineRef = inlineRef;
  	var REF_KEYWORDS = /* @__PURE__ */ new Set([
  		"$ref",
  		"$recursiveRef",
  		"$recursiveAnchor",
  		"$dynamicRef",
  		"$dynamicAnchor"
  	]);
  	function hasRef(schema) {
  		for (const key in schema) {
  			if (REF_KEYWORDS.has(key)) return true;
  			const sch = schema[key];
  			if (Array.isArray(sch) && sch.some(hasRef)) return true;
  			if (typeof sch == "object" && hasRef(sch)) return true;
  		}
  		return false;
  	}
  	function countKeys(schema) {
  		let count = 0;
  		for (const key in schema) {
  			if (key === "$ref") return Infinity;
  			count++;
  			if (SIMPLE_INLINED.has(key)) continue;
  			if (typeof schema[key] == "object") (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
  			if (count === Infinity) return Infinity;
  		}
  		return count;
  	}
  	function getFullPath(resolver, id = "", normalize) {
  		if (normalize !== false) id = normalizeId(id);
  		return _getFullPath(resolver, resolver.parse(id));
  	}
  	exports.getFullPath = getFullPath;
  	function _getFullPath(resolver, p) {
  		return resolver.serialize(p).split("#")[0] + "#";
  	}
  	exports._getFullPath = _getFullPath;
  	var TRAILING_SLASH_HASH = /#\/?$/;
  	function normalizeId(id) {
  		return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
  	}
  	exports.normalizeId = normalizeId;
  	function resolveUrl(resolver, baseId, id) {
  		id = normalizeId(id);
  		return resolver.resolve(baseId, id);
  	}
  	exports.resolveUrl = resolveUrl;
  	var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
  	function getSchemaRefs(schema, baseId) {
  		if (typeof schema == "boolean") return {};
  		const { schemaId, uriResolver } = this.opts;
  		const schId = normalizeId(schema[schemaId] || baseId);
  		const baseIds = { "": schId };
  		const pathPrefix = getFullPath(uriResolver, schId, false);
  		const localRefs = {};
  		const schemaRefs = /* @__PURE__ */ new Set();
  		traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
  			if (parentJsonPtr === void 0) return;
  			const fullPath = pathPrefix + jsonPtr;
  			let innerBaseId = baseIds[parentJsonPtr];
  			if (typeof sch[schemaId] == "string") innerBaseId = addRef.call(this, sch[schemaId]);
  			addAnchor.call(this, sch.$anchor);
  			addAnchor.call(this, sch.$dynamicAnchor);
  			baseIds[jsonPtr] = innerBaseId;
  			function addRef(ref) {
  				const _resolve = this.opts.uriResolver.resolve;
  				ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
  				if (schemaRefs.has(ref)) throw ambiguos(ref);
  				schemaRefs.add(ref);
  				let schOrRef = this.refs[ref];
  				if (typeof schOrRef == "string") schOrRef = this.refs[schOrRef];
  				if (typeof schOrRef == "object") checkAmbiguosRef(sch, schOrRef.schema, ref);
  				else if (ref !== normalizeId(fullPath)) {
  					if (ref[0] === "#") {
  						checkAmbiguosRef(sch, localRefs[ref], ref);
  						localRefs[ref] = sch;
  					} else this.refs[ref] = fullPath;
  				}
  				return ref;
  			}
  			function addAnchor(anchor) {
  				if (typeof anchor == "string") {
  					if (!ANCHOR.test(anchor)) throw new Error(`invalid anchor "${anchor}"`);
  					addRef.call(this, `#${anchor}`);
  				}
  			}
  		});
  		return localRefs;
  		function checkAmbiguosRef(sch1, sch2, ref) {
  			if (sch2 !== void 0 && !equal(sch1, sch2)) throw ambiguos(ref);
  		}
  		function ambiguos(ref) {
  			return /* @__PURE__ */ new Error(`reference "${ref}" resolves to more than one schema`);
  		}
  	}
  	exports.getSchemaRefs = getSchemaRefs;
  }));
  var require_validate = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
  	var boolSchema_1 = require_boolSchema();
  	var dataType_1 = require_dataType();
  	var applicability_1 = require_applicability();
  	var dataType_2 = require_dataType();
  	var defaults_1 = require_defaults();
  	var keyword_1 = require_keyword();
  	var subschema_1 = require_subschema();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var resolve_1 = require_resolve();
  	var util_1 = require_util();
  	var errors_1 = require_errors();
  	function validateFunctionCode(it) {
  		if (isSchemaObj(it)) {
  			checkKeywords(it);
  			if (schemaCxtHasRules(it)) {
  				topSchemaObjCode(it);
  				return;
  			}
  		}
  		validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
  	}
  	exports.validateFunctionCode = validateFunctionCode;
  	function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
  		if (opts.code.es5) gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
  			gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
  			destructureValCxtES5(gen, opts);
  			gen.code(body);
  		});
  		else gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
  	}
  	function destructureValCxt(opts) {
  		return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
  	}
  	function destructureValCxtES5(gen, opts) {
  		gen.if(names_1.default.valCxt, () => {
  			gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
  			gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
  			gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
  			gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
  			if (opts.dynamicRef) gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
  		}, () => {
  			gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
  			gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
  			gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
  			gen.var(names_1.default.rootData, names_1.default.data);
  			if (opts.dynamicRef) gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
  		});
  	}
  	function topSchemaObjCode(it) {
  		const { schema, opts, gen } = it;
  		validateFunction(it, () => {
  			if (opts.$comment && schema.$comment) commentKeyword(it);
  			checkNoDefault(it);
  			gen.let(names_1.default.vErrors, null);
  			gen.let(names_1.default.errors, 0);
  			if (opts.unevaluated) resetEvaluated(it);
  			typeAndKeywords(it);
  			returnResults(it);
  		});
  	}
  	function resetEvaluated(it) {
  		const { gen, validateName } = it;
  		it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
  		gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
  		gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
  	}
  	function funcSourceUrl(schema, opts) {
  		const schId = typeof schema == "object" && schema[opts.schemaId];
  		return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
  	}
  	function subschemaCode(it, valid) {
  		if (isSchemaObj(it)) {
  			checkKeywords(it);
  			if (schemaCxtHasRules(it)) {
  				subSchemaObjCode(it, valid);
  				return;
  			}
  		}
  		(0, boolSchema_1.boolOrEmptySchema)(it, valid);
  	}
  	function schemaCxtHasRules({ schema, self }) {
  		if (typeof schema == "boolean") return !schema;
  		for (const key in schema) if (self.RULES.all[key]) return true;
  		return false;
  	}
  	function isSchemaObj(it) {
  		return typeof it.schema != "boolean";
  	}
  	function subSchemaObjCode(it, valid) {
  		const { schema, gen, opts } = it;
  		if (opts.$comment && schema.$comment) commentKeyword(it);
  		updateContext(it);
  		checkAsyncSchema(it);
  		const errsCount = gen.const("_errs", names_1.default.errors);
  		typeAndKeywords(it, errsCount);
  		gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  	}
  	function checkKeywords(it) {
  		(0, util_1.checkUnknownRules)(it);
  		checkRefsAndKeywords(it);
  	}
  	function typeAndKeywords(it, errsCount) {
  		if (it.opts.jtd) return schemaKeywords(it, [], false, errsCount);
  		const types = (0, dataType_1.getSchemaTypes)(it.schema);
  		schemaKeywords(it, types, !(0, dataType_1.coerceAndCheckDataType)(it, types), errsCount);
  	}
  	function checkRefsAndKeywords(it) {
  		const { schema, errSchemaPath, opts, self } = it;
  		if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
  	}
  	function checkNoDefault(it) {
  		const { schema, opts } = it;
  		if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
  	}
  	function updateContext(it) {
  		const schId = it.schema[it.opts.schemaId];
  		if (schId) it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
  	}
  	function checkAsyncSchema(it) {
  		if (it.schema.$async && !it.schemaEnv.$async) throw new Error("async schema in sync schema");
  	}
  	function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
  		const msg = schema.$comment;
  		if (opts.$comment === true) gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
  		else if (typeof opts.$comment == "function") {
  			const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
  			const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
  			gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
  		}
  	}
  	function returnResults(it) {
  		const { gen, schemaEnv, validateName, ValidationError, opts } = it;
  		if (schemaEnv.$async) gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
  		else {
  			gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
  			if (opts.unevaluated) assignEvaluated(it);
  			gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
  		}
  	}
  	function assignEvaluated({ gen, evaluated, props, items }) {
  		if (props instanceof codegen_1.Name) gen.assign((0, codegen_1._)`${evaluated}.props`, props);
  		if (items instanceof codegen_1.Name) gen.assign((0, codegen_1._)`${evaluated}.items`, items);
  	}
  	function schemaKeywords(it, types, typeErrors, errsCount) {
  		const { gen, schema, data, allErrors, opts, self } = it;
  		const { RULES } = self;
  		if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
  			gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
  			return;
  		}
  		if (!opts.jtd) checkStrictTypes(it, types);
  		gen.block(() => {
  			for (const group of RULES.rules) groupKeywords(group);
  			groupKeywords(RULES.post);
  		});
  		function groupKeywords(group) {
  			if (!(0, applicability_1.shouldUseGroup)(schema, group)) return;
  			if (group.type) {
  				gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
  				iterateKeywords(it, group);
  				if (types.length === 1 && types[0] === group.type && typeErrors) {
  					gen.else();
  					(0, dataType_2.reportTypeError)(it);
  				}
  				gen.endIf();
  			} else iterateKeywords(it, group);
  			if (!allErrors) gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
  		}
  	}
  	function iterateKeywords(it, group) {
  		const { gen, schema, opts: { useDefaults } } = it;
  		if (useDefaults) (0, defaults_1.assignDefaults)(it, group.type);
  		gen.block(() => {
  			for (const rule of group.rules) if ((0, applicability_1.shouldUseRule)(schema, rule)) keywordCode(it, rule.keyword, rule.definition, group.type);
  		});
  	}
  	function checkStrictTypes(it, types) {
  		if (it.schemaEnv.meta || !it.opts.strictTypes) return;
  		checkContextTypes(it, types);
  		if (!it.opts.allowUnionTypes) checkMultipleTypes(it, types);
  		checkKeywordTypes(it, it.dataTypes);
  	}
  	function checkContextTypes(it, types) {
  		if (!types.length) return;
  		if (!it.dataTypes.length) {
  			it.dataTypes = types;
  			return;
  		}
  		types.forEach((t) => {
  			if (!includesType(it.dataTypes, t)) strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
  		});
  		narrowSchemaTypes(it, types);
  	}
  	function checkMultipleTypes(it, ts) {
  		if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) strictTypesError(it, "use allowUnionTypes to allow union type keyword");
  	}
  	function checkKeywordTypes(it, ts) {
  		const rules = it.self.RULES.all;
  		for (const keyword in rules) {
  			const rule = rules[keyword];
  			if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
  				const { type } = rule.definition;
  				if (type.length && !type.some((t) => hasApplicableType(ts, t))) strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
  			}
  		}
  	}
  	function hasApplicableType(schTs, kwdT) {
  		return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
  	}
  	function includesType(ts, t) {
  		return ts.includes(t) || t === "integer" && ts.includes("number");
  	}
  	function narrowSchemaTypes(it, withTypes) {
  		const ts = [];
  		for (const t of it.dataTypes) if (includesType(withTypes, t)) ts.push(t);
  		else if (withTypes.includes("integer") && t === "number") ts.push("integer");
  		it.dataTypes = ts;
  	}
  	function strictTypesError(it, msg) {
  		const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
  		msg += ` at "${schemaPath}" (strictTypes)`;
  		(0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
  	}
  	var KeywordCxt = class {
  		constructor(it, def, keyword) {
  			(0, keyword_1.validateKeywordUsage)(it, def, keyword);
  			this.gen = it.gen;
  			this.allErrors = it.allErrors;
  			this.keyword = keyword;
  			this.data = it.data;
  			this.schema = it.schema[keyword];
  			this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
  			this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
  			this.schemaType = def.schemaType;
  			this.parentSchema = it.schema;
  			this.params = {};
  			this.it = it;
  			this.def = def;
  			if (this.$data) this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
  			else {
  				this.schemaCode = this.schemaValue;
  				if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
  			}
  			if ("code" in def ? def.trackErrors : def.errors !== false) this.errsCount = it.gen.const("_errs", names_1.default.errors);
  		}
  		result(condition, successAction, failAction) {
  			this.failResult((0, codegen_1.not)(condition), successAction, failAction);
  		}
  		failResult(condition, successAction, failAction) {
  			this.gen.if(condition);
  			if (failAction) failAction();
  			else this.error();
  			if (successAction) {
  				this.gen.else();
  				successAction();
  				if (this.allErrors) this.gen.endIf();
  			} else if (this.allErrors) this.gen.endIf();
  			else this.gen.else();
  		}
  		pass(condition, failAction) {
  			this.failResult((0, codegen_1.not)(condition), void 0, failAction);
  		}
  		fail(condition) {
  			if (condition === void 0) {
  				this.error();
  				if (!this.allErrors) this.gen.if(false);
  				return;
  			}
  			this.gen.if(condition);
  			this.error();
  			if (this.allErrors) this.gen.endIf();
  			else this.gen.else();
  		}
  		fail$data(condition) {
  			if (!this.$data) return this.fail(condition);
  			const { schemaCode } = this;
  			this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
  		}
  		error(append, errorParams, errorPaths) {
  			if (errorParams) {
  				this.setParams(errorParams);
  				this._error(append, errorPaths);
  				this.setParams({});
  				return;
  			}
  			this._error(append, errorPaths);
  		}
  		_error(append, errorPaths) {
  			(append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
  		}
  		$dataError() {
  			(0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
  		}
  		reset() {
  			if (this.errsCount === void 0) throw new Error("add \"trackErrors\" to keyword definition");
  			(0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
  		}
  		ok(cond) {
  			if (!this.allErrors) this.gen.if(cond);
  		}
  		setParams(obj, assign) {
  			if (assign) Object.assign(this.params, obj);
  			else this.params = obj;
  		}
  		block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
  			this.gen.block(() => {
  				this.check$data(valid, $dataValid);
  				codeBlock();
  			});
  		}
  		check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
  			if (!this.$data) return;
  			const { gen, schemaCode, schemaType, def } = this;
  			gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
  			if (valid !== codegen_1.nil) gen.assign(valid, true);
  			if (schemaType.length || def.validateSchema) {
  				gen.elseIf(this.invalid$data());
  				this.$dataError();
  				if (valid !== codegen_1.nil) gen.assign(valid, false);
  			}
  			gen.else();
  		}
  		invalid$data() {
  			const { gen, schemaCode, schemaType, def, it } = this;
  			return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
  			function wrong$DataType() {
  				if (schemaType.length) {
  					/* istanbul ignore if */
  					if (!(schemaCode instanceof codegen_1.Name)) throw new Error("ajv implementation error");
  					const st = Array.isArray(schemaType) ? schemaType : [schemaType];
  					return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
  				}
  				return codegen_1.nil;
  			}
  			function invalid$DataSchema() {
  				if (def.validateSchema) {
  					const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
  					return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
  				}
  				return codegen_1.nil;
  			}
  		}
  		subschema(appl, valid) {
  			const subschema = (0, subschema_1.getSubschema)(this.it, appl);
  			(0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
  			(0, subschema_1.extendSubschemaMode)(subschema, appl);
  			const nextContext = {
  				...this.it,
  				...subschema,
  				items: void 0,
  				props: void 0
  			};
  			subschemaCode(nextContext, valid);
  			return nextContext;
  		}
  		mergeEvaluated(schemaCxt, toName) {
  			const { it, gen } = this;
  			if (!it.opts.unevaluated) return;
  			if (it.props !== true && schemaCxt.props !== void 0) it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
  			if (it.items !== true && schemaCxt.items !== void 0) it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
  		}
  		mergeValidEvaluated(schemaCxt, valid) {
  			const { it, gen } = this;
  			if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
  				gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
  				return true;
  			}
  		}
  	};
  	exports.KeywordCxt = KeywordCxt;
  	function keywordCode(it, keyword, def, ruleType) {
  		const cxt = new KeywordCxt(it, def, keyword);
  		if ("code" in def) def.code(cxt, ruleType);
  		else if (cxt.$data && def.validate) (0, keyword_1.funcKeywordCode)(cxt, def);
  		else if ("macro" in def) (0, keyword_1.macroKeywordCode)(cxt, def);
  		else if (def.compile || def.validate) (0, keyword_1.funcKeywordCode)(cxt, def);
  	}
  	var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
  	var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  	function getData($data, { dataLevel, dataNames, dataPathArr }) {
  		let jsonPointer;
  		let data;
  		if ($data === "") return names_1.default.rootData;
  		if ($data[0] === "/") {
  			if (!JSON_POINTER.test($data)) throw new Error(`Invalid JSON-pointer: ${$data}`);
  			jsonPointer = $data;
  			data = names_1.default.rootData;
  		} else {
  			const matches = RELATIVE_JSON_POINTER.exec($data);
  			if (!matches) throw new Error(`Invalid JSON-pointer: ${$data}`);
  			const up = +matches[1];
  			jsonPointer = matches[2];
  			if (jsonPointer === "#") {
  				if (up >= dataLevel) throw new Error(errorMsg("property/index", up));
  				return dataPathArr[dataLevel - up];
  			}
  			if (up > dataLevel) throw new Error(errorMsg("data", up));
  			data = dataNames[dataLevel - up];
  			if (!jsonPointer) return data;
  		}
  		let expr = data;
  		const segments = jsonPointer.split("/");
  		for (const segment of segments) if (segment) {
  			data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
  			expr = (0, codegen_1._)`${expr} && ${data}`;
  		}
  		return expr;
  		function errorMsg(pointerType, up) {
  			return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
  		}
  	}
  	exports.getData = getData;
  }));
  var require_validation_error = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var ValidationError = class extends Error {
  		constructor(errors) {
  			super("validation failed");
  			this.errors = errors;
  			this.ajv = this.validation = true;
  		}
  	};
  	exports.default = ValidationError;
  }));
  var require_ref_error = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var resolve_1 = require_resolve();
  	var MissingRefError = class extends Error {
  		constructor(resolver, baseId, ref, msg) {
  			super(msg || `can't resolve reference ${ref} from id ${baseId}`);
  			this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
  			this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
  		}
  	};
  	exports.default = MissingRefError;
  }));
  var require_compile = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
  	var codegen_1 = require_codegen();
  	var validation_error_1 = require_validation_error();
  	var names_1 = require_names();
  	var resolve_1 = require_resolve();
  	var util_1 = require_util();
  	var validate_1 = require_validate();
  	var SchemaEnv = class {
  		constructor(env) {
  			var _a;
  			this.refs = {};
  			this.dynamicAnchors = {};
  			let schema;
  			if (typeof env.schema == "object") schema = env.schema;
  			this.schema = env.schema;
  			this.schemaId = env.schemaId;
  			this.root = env.root || this;
  			this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
  			this.schemaPath = env.schemaPath;
  			this.localRefs = env.localRefs;
  			this.meta = env.meta;
  			this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
  			this.refs = {};
  		}
  	};
  	exports.SchemaEnv = SchemaEnv;
  	function compileSchema(sch) {
  		const _sch = getCompilingSchema.call(this, sch);
  		if (_sch) return _sch;
  		const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
  		const { es5, lines } = this.opts.code;
  		const { ownProperties } = this.opts;
  		const gen = new codegen_1.CodeGen(this.scope, {
  			es5,
  			lines,
  			ownProperties
  		});
  		let _ValidationError;
  		if (sch.$async) _ValidationError = gen.scopeValue("Error", {
  			ref: validation_error_1.default,
  			code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
  		});
  		const validateName = gen.scopeName("validate");
  		sch.validateName = validateName;
  		const schemaCxt = {
  			gen,
  			allErrors: this.opts.allErrors,
  			data: names_1.default.data,
  			parentData: names_1.default.parentData,
  			parentDataProperty: names_1.default.parentDataProperty,
  			dataNames: [names_1.default.data],
  			dataPathArr: [codegen_1.nil],
  			dataLevel: 0,
  			dataTypes: [],
  			definedProperties: /* @__PURE__ */ new Set(),
  			topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? {
  				ref: sch.schema,
  				code: (0, codegen_1.stringify)(sch.schema)
  			} : { ref: sch.schema }),
  			validateName,
  			ValidationError: _ValidationError,
  			schema: sch.schema,
  			schemaEnv: sch,
  			rootId,
  			baseId: sch.baseId || rootId,
  			schemaPath: codegen_1.nil,
  			errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
  			errorPath: (0, codegen_1._)`""`,
  			opts: this.opts,
  			self: this
  		};
  		let sourceCode;
  		try {
  			this._compilations.add(sch);
  			(0, validate_1.validateFunctionCode)(schemaCxt);
  			gen.optimize(this.opts.code.optimize);
  			const validateCode = gen.toString();
  			sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
  			if (this.opts.code.process) sourceCode = this.opts.code.process(sourceCode, sch);
  			const validate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode)(this, this.scope.get());
  			this.scope.value(validateName, { ref: validate });
  			validate.errors = null;
  			validate.schema = sch.schema;
  			validate.schemaEnv = sch;
  			if (sch.$async) validate.$async = true;
  			if (this.opts.code.source === true) validate.source = {
  				validateName,
  				validateCode,
  				scopeValues: gen._values
  			};
  			if (this.opts.unevaluated) {
  				const { props, items } = schemaCxt;
  				validate.evaluated = {
  					props: props instanceof codegen_1.Name ? void 0 : props,
  					items: items instanceof codegen_1.Name ? void 0 : items,
  					dynamicProps: props instanceof codegen_1.Name,
  					dynamicItems: items instanceof codegen_1.Name
  				};
  				if (validate.source) validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
  			}
  			sch.validate = validate;
  			return sch;
  		} catch (e) {
  			delete sch.validate;
  			delete sch.validateName;
  			if (sourceCode) this.logger.error("Error compiling schema, function code:", sourceCode);
  			throw e;
  		} finally {
  			this._compilations.delete(sch);
  		}
  	}
  	exports.compileSchema = compileSchema;
  	function resolveRef(root, baseId, ref) {
  		var _a;
  		ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
  		const schOrFunc = root.refs[ref];
  		if (schOrFunc) return schOrFunc;
  		let _sch = resolve.call(this, root, ref);
  		if (_sch === void 0) {
  			const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref];
  			const { schemaId } = this.opts;
  			if (schema) _sch = new SchemaEnv({
  				schema,
  				schemaId,
  				root,
  				baseId
  			});
  		}
  		if (_sch === void 0) return;
  		return root.refs[ref] = inlineOrCompile.call(this, _sch);
  	}
  	exports.resolveRef = resolveRef;
  	function inlineOrCompile(sch) {
  		if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs)) return sch.schema;
  		return sch.validate ? sch : compileSchema.call(this, sch);
  	}
  	function getCompilingSchema(schEnv) {
  		for (const sch of this._compilations) if (sameSchemaEnv(sch, schEnv)) return sch;
  	}
  	exports.getCompilingSchema = getCompilingSchema;
  	function sameSchemaEnv(s1, s2) {
  		return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
  	}
  	function resolve(root, ref) {
  		let sch;
  		while (typeof (sch = this.refs[ref]) == "string") ref = sch;
  		return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
  	}
  	function resolveSchema(root, ref) {
  		const p = this.opts.uriResolver.parse(ref);
  		const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
  		let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
  		if (Object.keys(root.schema).length > 0 && refPath === baseId) return getJsonPointer.call(this, p, root);
  		const id = (0, resolve_1.normalizeId)(refPath);
  		const schOrRef = this.refs[id] || this.schemas[id];
  		if (typeof schOrRef == "string") {
  			const sch = resolveSchema.call(this, root, schOrRef);
  			if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object") return;
  			return getJsonPointer.call(this, p, sch);
  		}
  		if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object") return;
  		if (!schOrRef.validate) compileSchema.call(this, schOrRef);
  		if (id === (0, resolve_1.normalizeId)(ref)) {
  			const { schema } = schOrRef;
  			const { schemaId } = this.opts;
  			const schId = schema[schemaId];
  			if (schId) baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
  			return new SchemaEnv({
  				schema,
  				schemaId,
  				root,
  				baseId
  			});
  		}
  		return getJsonPointer.call(this, p, schOrRef);
  	}
  	exports.resolveSchema = resolveSchema;
  	var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
  		"properties",
  		"patternProperties",
  		"enum",
  		"dependencies",
  		"definitions"
  	]);
  	function getJsonPointer(parsedRef, { baseId, schema, root }) {
  		var _a;
  		if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/") return;
  		for (const part of parsedRef.fragment.slice(1).split("/")) {
  			if (typeof schema === "boolean") return;
  			const partSchema = schema[(0, util_1.unescapeFragment)(part)];
  			if (partSchema === void 0) return;
  			schema = partSchema;
  			const schId = typeof schema === "object" && schema[this.opts.schemaId];
  			if (!PREVENT_SCOPE_CHANGE.has(part) && schId) baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
  		}
  		let env;
  		if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
  			const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
  			env = resolveSchema.call(this, root, $ref);
  		}
  		const { schemaId } = this.opts;
  		env = env || new SchemaEnv({
  			schema,
  			schemaId,
  			root,
  			baseId
  		});
  		if (env.schema !== env.root.schema) return env;
  	}
  }));
  var data_exports = /* @__PURE__ */ __exportAll({
  	$id: () => $id$12,
  	additionalProperties: () => false,
  	default: () => data_default,
  	description: () => description$1,
  	properties: () => properties$12,
  	required: () => required$3,
  	type: () => type$12
  }), $id$12, description$1, type$12, required$3, properties$12, data_default;
  var init_data = __esmMin((() => {
  	$id$12 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#";
  	description$1 = "Meta-schema for $data reference (JSON AnySchema extension proposal)";
  	type$12 = "object";
  	required$3 = ["$data"];
  	properties$12 = { "$data": {
  		"type": "string",
  		"anyOf": [{ "format": "relative-json-pointer" }, { "format": "json-pointer" }]
  	} };
  	data_default = {
  		$id: $id$12,
  		description: description$1,
  		type: type$12,
  		required: required$3,
  		properties: properties$12,
  		additionalProperties: false
  	};
  }));
  var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	/** @type {(value: string) => boolean} */
  	var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
  	/** @type {(value: string) => boolean} */
  	var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  	/** @type {(value: string) => boolean} */
  	var isPort = RegExp.prototype.test.bind(/^\d*$/u);
  	/** @type {(value: string) => boolean} */
  	var isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu);
  	/** @type {(value: string) => boolean} */
  	var isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu);
  	/** @type {(value: string) => boolean} */
  	var isPathCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/u);
  	/** @type {(value: string) => boolean} */
  	var isQueryFragmentCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/u);
  	/** @type {(value: string) => boolean} */
  	var isUserinfoCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]$/u);
  	var BYTE_HEX = new Array(256);
  	{
  		const HEX_DIGITS = "0123456789ABCDEF";
  		for (let i = 0; i < 256; i++) BYTE_HEX[i] = "%" + HEX_DIGITS[i >> 4] + HEX_DIGITS[i & 15];
  	}
  	function percentEncodeNonAscii(cp) {
  		if (cp < 2048) return BYTE_HEX[192 | cp >> 6] + BYTE_HEX[128 | cp & 63];
  		if (cp < 65536) return BYTE_HEX[224 | cp >> 12] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
  		return BYTE_HEX[240 | cp >> 18] + BYTE_HEX[128 | cp >> 12 & 63] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
  	}
  	/**
  	* @param {Array<string>} input
  	* @returns {string}
  	*/
  	function stringArrayToHexStripped(input) {
  		let acc = "";
  		let code = 0;
  		let i = 0;
  		for (i = 0; i < input.length; i++) {
  			code = input[i].charCodeAt(0);
  			if (code === 48) continue;
  			if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) return "";
  			acc += input[i];
  			break;
  		}
  		for (i += 1; i < input.length; i++) {
  			code = input[i].charCodeAt(0);
  			if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) return "";
  			acc += input[i];
  		}
  		return acc;
  	}
  	/** @type {(value: string) => boolean} */
  	var isHextet = RegExp.prototype.test.bind(/^[\dA-Fa-f]{1,4}$/);
  	/** @type {(value: string) => boolean} */
  	var isIPvFuture = RegExp.prototype.test.bind(/^[vV][\dA-Fa-f]+\.[A-Za-z\d\-._~!$&'()*+,;=:]+$/);
  	/** @type {(value: string) => boolean} */
  	var isZoneCharacter = RegExp.prototype.test.bind(/^[A-Za-z\d\-._~]$/);
  	/**
  	* @param {string} value
  	* @returns {boolean}
  	*/
  	var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  	/**
  	* @param {string} zone
  	* @returns {boolean}
  	*/
  	function isZoneIdentifier(zone) {
  		if (zone.length === 0) return false;
  		for (let i = 0; i < zone.length; i++) {
  			if (isZoneCharacter(zone[i])) continue;
  			if (zone[i] === "%" && i + 2 < zone.length && isHexPair(zone.slice(i + 1, i + 3))) {
  				i += 2;
  				continue;
  			}
  			return false;
  		}
  		return true;
  	}
  	/**
  	* Compresses the longest run of zero hextets to "::" per RFC 5952. A run of a
  	* single zero hextet is left uncompressed. On ties the leftmost run wins.
  	*
  	* @param {string[]} hextets
  	* @returns {string}
  	*/
  	function compressIPv6ZeroRun(hextets) {
  		let bestStart = -1;
  		let bestLength = 0;
  		let runStart = -1;
  		let runLength = 0;
  		for (let i = 0; i < hextets.length; i++) if (hextets[i] === "0") {
  			if (runStart === -1) runStart = i;
  			runLength++;
  			if (runLength > bestLength) {
  				bestLength = runLength;
  				bestStart = runStart;
  			}
  		} else {
  			runStart = -1;
  			runLength = 0;
  		}
  		if (bestLength < 2) return hextets.join(":");
  		const head = hextets.slice(0, bestStart).join(":");
  		const tail = hextets.slice(bestStart + bestLength).join(":");
  		return head + "::" + tail;
  	}
  	/**
  	* Validates an IPv6 address against the alternatives in RFC 3986 section
  	* 3.2.2 and returns the same address with leading hextet zeroes removed.
  	* An embedded IPv4 address counts as two hextets and is only valid at the end.
  	*
  	* @param {string} input
  	* @returns {string|undefined}
  	*/
  	function normalizeIPv6Address(input) {
  		const compression = input.indexOf("::");
  		if (compression !== -1 && input.indexOf("::", compression + 1) !== -1) return void 0;
  		const left = compression === -1 ? input.split(":") : input.slice(0, compression).split(":");
  		const right = compression === -1 ? [] : input.slice(compression + 2).split(":");
  		if (compression !== -1) {
  			if (left.length === 1 && left[0] === "") left.length = 0;
  			if (right.length === 1 && right[0] === "") right.length = 0;
  		}
  		const parts = left.concat(right);
  		let hextetCount = 0;
  		for (let i = 0; i < parts.length; i++) {
  			const part = parts[i];
  			if (part === "") return void 0;
  			if (part.indexOf(".") !== -1) {
  				if (i !== parts.length - 1 || compression !== -1 && right.length === 0 || !isIPv4(part)) return void 0;
  				hextetCount += 2;
  				continue;
  			}
  			if (!isHextet(part)) return void 0;
  			parts[i] = parseInt(part, 16).toString(16);
  			hextetCount++;
  		}
  		if (compression === -1) {
  			if (hextetCount !== 8) return void 0;
  			return compressIPv6ZeroRun(parts);
  		}
  		if (hextetCount >= 8) return void 0;
  		const expanded = parts.slice(0, left.length);
  		for (let i = hextetCount; i < 8; i++) expanded.push("0");
  		for (let i = left.length; i < parts.length; i++) expanded.push(parts[i]);
  		return compressIPv6ZeroRun(expanded);
  	}
  	/**
  	* @typedef {Object} NormalizeIPv6Result
  	* @property {string} host - The normalized host.
  	* @property {string} [escapedHost] - The escaped host.
  	* @property {boolean} isIPV6 - Indicates if the host is an IPv6 address.
  	* @property {boolean} [isIPVFuture] - Indicates if the host is an IPvFuture literal.
  	* @property {boolean} [error] - Indicates if a bracketed IP literal is malformed.
  	*/
  	/**
  	* Validates and normalizes a bracketed IP literal. Raw zone separators remain
  	* accepted for backwards compatibility, while encoded separators and zone
  	* contents follow RFC 6874.
  	*
  	* @param {string} host
  	* @returns {NormalizeIPv6Result}
  	*/
  	function normalizeIPv6(host) {
  		const bracketed = host[0] === "[" && host[host.length - 1] === "]";
  		if ((host[0] === "[" || host[host.length - 1] === "]") && !bracketed) return {
  			host,
  			isIPV6: false,
  			error: true
  		};
  		let input = bracketed ? host.slice(1, -1) : host;
  		if (bracketed && isIPvFuture(input)) {
  			input = input.toLowerCase();
  			return {
  				host: `[${input}]`,
  				escapedHost: input,
  				isIPV6: false,
  				isIPVFuture: true
  			};
  		}
  		if (findToken(input, ":") < 2) return {
  			host,
  			isIPV6: false,
  			error: bracketed
  		};
  		let zoneIdentifier = "";
  		const zoneSeparator = input.indexOf("%");
  		if (zoneSeparator !== -1) {
  			const separatorLength = input.slice(zoneSeparator, zoneSeparator + 3).toLowerCase() === "%25" ? 3 : 1;
  			zoneIdentifier = input.slice(zoneSeparator + separatorLength);
  			if (!isZoneIdentifier(zoneIdentifier)) return {
  				host,
  				isIPV6: false,
  				error: true
  			};
  			input = input.slice(0, zoneSeparator);
  		}
  		const address = normalizeIPv6Address(input);
  		if (address === void 0) return {
  			host,
  			isIPV6: false,
  			error: true
  		};
  		return {
  			host: address + (zoneIdentifier ? "%" + zoneIdentifier : ""),
  			escapedHost: address + (zoneIdentifier ? "%25" + zoneIdentifier : ""),
  			isIPV6: true
  		};
  	}
  	/**
  	* @param {string} str
  	* @param {string} token
  	* @returns {number}
  	*/
  	function findToken(str, token) {
  		let ind = 0;
  		for (let i = 0; i < str.length; i++) if (str[i] === token) ind++;
  		return ind;
  	}
  	/**
  	* @param {string} path
  	* @returns {string}
  	*
  	* @see https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.4
  	*/
  	function removeDotSegments(path) {
  		let input = path;
  		const output = [];
  		let nextSlash = -1;
  		let len = 0;
  		while (len = input.length) {
  			if (len === 1) {
  				if (input === ".") break;
  				else if (input === "/") {
  					output.push("/");
  					break;
  				} else {
  					output.push(input);
  					break;
  				}
  			} else if (len === 2) {
  				if (input[0] === ".") {
  					if (input[1] === ".") break;
  					else if (input[1] === "/") {
  						input = input.slice(2);
  						continue;
  					}
  				} else if (input[0] === "/") {
  					if (input[1] === "." || input[1] === "/") {
  						output.push("/");
  						break;
  					}
  				}
  			} else if (len === 3) {
  				if (input === "/..") {
  					if (output.length !== 0) output.pop();
  					output.push("/");
  					break;
  				}
  			}
  			if (input[0] === ".") {
  				if (input[1] === ".") {
  					if (input[2] === "/") {
  						input = input.slice(3);
  						continue;
  					}
  				} else if (input[1] === "/") {
  					input = input.slice(2);
  					continue;
  				}
  			} else if (input[0] === "/") {
  				if (input[1] === ".") {
  					if (input[2] === "/") {
  						input = input.slice(2);
  						continue;
  					} else if (input[2] === ".") {
  						if (input[3] === "/") {
  							input = input.slice(3);
  							if (output.length !== 0) output.pop();
  							continue;
  						}
  					}
  				}
  			}
  			if ((nextSlash = input.indexOf("/", 1)) === -1) {
  				output.push(input);
  				break;
  			} else {
  				output.push(input.slice(0, nextSlash));
  				input = input.slice(nextSlash);
  			}
  		}
  		return output.join("");
  	}
  	/**
  	* Re-escape RFC 3986 gen-delims that must not appear literally in the host.
  	* After the URI regex parses, these characters cannot be literal in the host
  	* field, so any that appear after decoding came from percent-encoding and
  	* must be restored to prevent authority structure changes.
  	*
  	* @param {string} host
  	* @param {boolean} isIP - true for IPv4/IPv6 hosts (skip colon re-escaping)
  	* @returns {string}
  	*/
  	var HOST_DELIMS = {
  		"@": "%40",
  		"/": "%2F",
  		"?": "%3F",
  		"#": "%23",
  		":": "%3A"
  	};
  	var HOST_DELIM_RE = /[@/?#:]/g;
  	var HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
  	function reescapeHostDelimiters(host, isIP) {
  		const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
  		re.lastIndex = 0;
  		return host.replace(re, (ch) => HOST_DELIMS[ch]);
  	}
  	/**
  	* Normalizes percent escapes and optionally decodes only unreserved ASCII bytes.
  	* Reserved delimiters such as `%2F` stay escaped; `%2E` is unreserved.
  	*
  	* @param {string} input
  	* @param {boolean} [decodeUnreserved=false]
  	* @returns {string}
  	*/
  	function normalizePercentEncoding(input, decodeUnreserved = false) {
  		if (input.indexOf("%") === -1) return input;
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			if (input[i] === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					const normalizedHex = hex.toUpperCase();
  					const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
  					if (decodeUnreserved && isUnreserved(decoded)) output += decoded;
  					else output += "%" + normalizedHex;
  					i += 2;
  					continue;
  				}
  			}
  			output += input[i];
  		}
  		return output;
  	}
  	/**
  	* Normalizes path data without turning reserved escapes into live path syntax.
  	* Valid escapes are uppercased, raw unsafe characters are escaped, and only
  	* unreserved bytes that are not `.` are decoded.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function normalizePathEncoding(input) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					const normalizedHex = hex.toUpperCase();
  					const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
  					if (decoded !== "." && isUnreserved(decoded)) output += decoded;
  					else output += "%" + normalizedHex;
  					i += 2;
  					continue;
  				}
  			}
  			if (isPathCharacter(ch)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Serializes a path without rewriting reserved data. Raw RFC 3986 path
  	* characters remain literal, valid escapes are preserved and uppercased, and
  	* everything else is UTF-8 percent-encoded. In a path-noscheme, a colon in the
  	* first segment must be escaped so the result cannot be parsed as a scheme.
  	*
  	* @param {string} input
  	* @param {boolean} [pathNoScheme=false]
  	* @returns {string}
  	*/
  	function serializePathEncoding(input, pathNoScheme = false) {
  		let output = "";
  		let firstSegment = pathNoScheme && input[0] !== "/";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					output += "%" + hex.toUpperCase();
  					i += 2;
  					continue;
  				}
  			}
  			if (ch === "/") firstSegment = false;
  			if (isPathCharacter(ch) && (ch !== ":" || !firstSegment)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Percent-encodes a URI component using its RFC 3986 literal character set.
  	* Existing valid escapes are preserved and normalized to uppercase hex.
  	*
  	* @param {string} input
  	* @param {(value: string) => boolean} isAllowed
  	* @returns {string}
  	*/
  	function encodeComponent(input, isAllowed) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					output += "%" + hex.toUpperCase();
  					i += 2;
  					continue;
  				}
  			}
  			if (isAllowed(ch)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Encodes userinfo while preserving its RFC 3986 §3.2.1 literal characters.
  	* In particular, authority delimiters such as `@`, `/`, `?`, and `#` are data.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function encodeUserinfo(input) {
  		return encodeComponent(input, isUserinfoCharacter);
  	}
  	/**
  	* Encodes query data using the RFC 3986 §3.4 grammar. A literal `#` must be
  	* escaped because it would otherwise begin the fragment component.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function encodeQuery(input) {
  		return encodeComponent(input, isQueryFragmentCharacter);
  	}
  	/**
  	* Encodes fragment data using the RFC 3986 §3.5 grammar.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function encodeFragment(input) {
  		return encodeComponent(input, isQueryFragmentCharacter);
  	}
  	function isEscapeSafe(cp) {
  		return cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 42 || cp === 43 || cp === 45 || cp === 46 || cp === 47 || cp === 64 || cp === 95;
  	}
  	/**
  	* Normalizes the percent-encoding of a query or fragment component.
  	*
  	* Like `normalizePathEncoding`, but uses the query/fragment character set
  	* (which additionally allows `?`) and decodes `.` since it has no dot-segment
  	* meaning outside of a path.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function normalizeQueryFragmentEncoding(input) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			const ch = input[i];
  			if (ch === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					const normalizedHex = hex.toUpperCase();
  					const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
  					if (isUnreserved(decoded)) output += decoded;
  					else output += "%" + normalizedHex;
  					i += 2;
  					continue;
  				}
  			}
  			if (isQueryFragmentCharacter(ch)) output += ch;
  			else {
  				const code = input.charCodeAt(i);
  				if (code < 128) output += isEscapeSafe(code) ? ch : BYTE_HEX[code];
  				else if (code < 55296 || code > 57343) output += percentEncodeNonAscii(code);
  				else if (code <= 56319 && i + 1 < input.length) {
  					const low = input.charCodeAt(i + 1);
  					if (low >= 56320 && low <= 57343) {
  						output += percentEncodeNonAscii(65536 + (code - 55296 << 10) + (low - 56320));
  						i++;
  					} else output += percentEncodeNonAscii(65533);
  				} else output += percentEncodeNonAscii(65533);
  			}
  		}
  		return output;
  	}
  	/**
  	* Escapes a component while preserving existing valid percent escapes.
  	*
  	* @param {string} input
  	* @returns {string}
  	*/
  	function escapePreservingEscapes(input) {
  		let output = "";
  		for (let i = 0; i < input.length; i++) {
  			if (input[i] === "%" && i + 2 < input.length) {
  				const hex = input.slice(i + 1, i + 3);
  				if (isHexPair(hex)) {
  					output += "%" + hex.toUpperCase();
  					i += 2;
  					continue;
  				}
  			}
  			output += escape(input[i]);
  		}
  		return output;
  	}
  	/**
  	* @param {import('../types/index').URIComponent} component
  	* @returns {string|undefined}
  	*/
  	function recomposeAuthority(component) {
  		const uriTokens = [];
  		if (component.userinfo !== void 0) {
  			uriTokens.push(encodeUserinfo(component.userinfo));
  			uriTokens.push("@");
  		}
  		if (component.host !== void 0) {
  			let host = component.host;
  			if (!isIPv4(host)) {
  				let ipV6res = normalizeIPv6(host);
  				if (ipV6res.isIPV6 !== true && ipV6res.isIPVFuture !== true) {
  					host = normalizePercentEncoding(host, true);
  					ipV6res = normalizeIPv6(host);
  				}
  				if (ipV6res.isIPV6 === true || ipV6res.isIPVFuture === true) host = `[${ipV6res.escapedHost}]`;
  				else host = reescapeHostDelimiters(host, false);
  			}
  			uriTokens.push(host);
  		}
  		if (typeof component.port === "number" || typeof component.port === "string") {
  			const port = String(component.port);
  			if (!isPort(port)) throw new TypeError("URI port is malformed.");
  			uriTokens.push(":");
  			uriTokens.push(port);
  		}
  		return uriTokens.length ? uriTokens.join("") : void 0;
  	}
  	module.exports = {
  		nonSimpleDomain,
  		recomposeAuthority,
  		reescapeHostDelimiters,
  		normalizePercentEncoding,
  		normalizePathEncoding,
  		serializePathEncoding,
  		normalizeQueryFragmentEncoding,
  		encodeUserinfo,
  		encodeQuery,
  		encodeFragment,
  		escapePreservingEscapes,
  		removeDotSegments,
  		isIPv4,
  		isUUID,
  		normalizeIPv6,
  		stringArrayToHexStripped
  	};
  }));
  var require_schemes = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	var { isUUID } = require_utils();
  	var URN_REG = /^([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-./:;=@]|%[\da-f]{2})+)$/iu;
  	var supportedSchemeNames = [
  		"http",
  		"https",
  		"ws",
  		"wss",
  		"urn",
  		"urn:uuid"
  	];
  	/** @typedef {supportedSchemeNames[number]} SchemeName */
  	/**
  	* @param {string} name
  	* @returns {name is SchemeName}
  	*/
  	function isValidSchemeName(name) {
  		return supportedSchemeNames.indexOf(name) !== -1;
  	}
  	/**
  	* @callback SchemeFn
  	* @param {import('../types/index').URIComponent} component
  	* @param {import('../types/index').Options} options
  	* @returns {import('../types/index').URIComponent}
  	*/
  	/**
  	* @typedef {Object} SchemeHandler
  	* @property {SchemeName} scheme - The scheme name.
  	* @property {boolean} [domainHost] - Indicates if the scheme supports domain hosts.
  	* @property {SchemeFn} parse - Function to parse the URI component for this scheme.
  	* @property {SchemeFn} serialize - Function to serialize the URI component for this scheme.
  	* @property {boolean} [skipNormalize] - Indicates if normalization should be skipped for this scheme.
  	* @property {boolean} [absolutePath] - Indicates if the scheme uses absolute paths.
  	* @property {boolean} [unicodeSupport] - Indicates if the scheme supports Unicode.
  	*/
  	/**
  	* @param {import('../types/index').URIComponent} wsComponent
  	* @returns {boolean}
  	*/
  	function wsIsSecure(wsComponent) {
  		if (wsComponent.secure === true) return true;
  		else if (wsComponent.secure === false) return false;
  		else if (wsComponent.scheme) return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
  		else return false;
  	}
  	/** @type {SchemeFn} */
  	function httpParse(component) {
  		if (!component.host) component.error = component.error || "HTTP URIs must have a host.";
  		return component;
  	}
  	/** @type {SchemeFn} */
  	function httpSerialize(component) {
  		const secure = String(component.scheme).toLowerCase() === "https";
  		if (component.port === (secure ? 443 : 80) || component.port === "") component.port = void 0;
  		if (!component.path) component.path = "/";
  		return component;
  	}
  	/** @type {SchemeFn} */
  	function wsParse(wsComponent) {
  		wsComponent.secure = wsIsSecure(wsComponent);
  		wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
  		wsComponent.path = void 0;
  		wsComponent.query = void 0;
  		return wsComponent;
  	}
  	/** @type {SchemeFn} */
  	function wsSerialize(wsComponent) {
  		if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") wsComponent.port = void 0;
  		if (typeof wsComponent.secure === "boolean") {
  			wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
  			wsComponent.secure = void 0;
  		}
  		if (wsComponent.resourceName) {
  			const queryIndex = wsComponent.resourceName.indexOf("?");
  			const path = queryIndex === -1 ? wsComponent.resourceName : wsComponent.resourceName.slice(0, queryIndex);
  			wsComponent.path = path && path !== "/" ? path : void 0;
  			wsComponent.query = queryIndex === -1 ? void 0 : wsComponent.resourceName.slice(queryIndex + 1);
  			wsComponent.resourceName = void 0;
  		}
  		wsComponent.fragment = void 0;
  		return wsComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnParse(urnComponent, options) {
  		if (!urnComponent.path) {
  			urnComponent.error = "URN can not be parsed";
  			return urnComponent;
  		}
  		const matches = urnComponent.path.match(URN_REG);
  		if (matches && matches[0] === urnComponent.path) {
  			const scheme = options.scheme || urnComponent.scheme || "urn";
  			urnComponent.nid = matches[1].toLowerCase();
  			urnComponent.nss = matches[2];
  			const schemeHandler = getSchemeHandler(`${scheme}:${options.nid || urnComponent.nid}`);
  			urnComponent.path = void 0;
  			if (schemeHandler) urnComponent = schemeHandler.parse(urnComponent, options);
  		} else urnComponent.error = urnComponent.error || "URN can not be parsed.";
  		return urnComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnSerialize(urnComponent, options) {
  		if (urnComponent.nid === void 0) throw new Error("URN without nid cannot be serialized");
  		const scheme = options.scheme || urnComponent.scheme || "urn";
  		const nid = urnComponent.nid.toLowerCase();
  		const schemeHandler = getSchemeHandler(`${scheme}:${options.nid || nid}`);
  		if (schemeHandler) urnComponent = schemeHandler.serialize(urnComponent, options);
  		const uriComponent = urnComponent;
  		const nss = urnComponent.nss;
  		uriComponent.path = `${nid || options.nid}:${nss}`;
  		options.skipEscape = true;
  		return uriComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnuuidParse(urnComponent, options) {
  		const uuidComponent = urnComponent;
  		uuidComponent.uuid = uuidComponent.nss;
  		uuidComponent.nss = void 0;
  		if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) uuidComponent.error = uuidComponent.error || "UUID is not valid.";
  		return uuidComponent;
  	}
  	/** @type {SchemeFn} */
  	function urnuuidSerialize(uuidComponent) {
  		const urnComponent = uuidComponent;
  		urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
  		return urnComponent;
  	}
  	var http = {
  		scheme: "http",
  		domainHost: true,
  		parse: httpParse,
  		serialize: httpSerialize
  	};
  	var https = {
  		scheme: "https",
  		domainHost: http.domainHost,
  		parse: httpParse,
  		serialize: httpSerialize
  	};
  	var ws = {
  		scheme: "ws",
  		domainHost: true,
  		parse: wsParse,
  		serialize: wsSerialize
  	};
  	var SCHEMES = {
  		http,
  		https,
  		ws,
  		wss: {
  			scheme: "wss",
  			domainHost: ws.domainHost,
  			parse: ws.parse,
  			serialize: ws.serialize
  		},
  		urn: {
  			scheme: "urn",
  			parse: urnParse,
  			serialize: urnSerialize,
  			skipNormalize: true
  		},
  		"urn:uuid": {
  			scheme: "urn:uuid",
  			parse: urnuuidParse,
  			serialize: urnuuidSerialize,
  			skipNormalize: true
  		}
  	};
  	Object.setPrototypeOf(SCHEMES, null);
  	/**
  	* @param {string|undefined} scheme
  	* @returns {SchemeHandler|undefined}
  	*/
  	function getSchemeHandler(scheme) {
  		return scheme && (SCHEMES[scheme] || SCHEMES[scheme.toLowerCase()]) || void 0;
  	}
  	module.exports = {
  		wsIsSecure,
  		SCHEMES,
  		isValidSchemeName,
  		getSchemeHandler
  	};
  }));
  var require_fast_uri = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, serializePathEncoding, normalizeQueryFragmentEncoding, encodeQuery, encodeFragment, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require_utils();
  	var { SCHEMES, getSchemeHandler } = require_schemes();
  	var VALID_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/u;
  	var MALFORMED_SCHEME_ERROR = "URI scheme is malformed.";
  	/**
  	* @param {string} scheme
  	* @returns {string}
  	*/
  	function decodeValidScheme(scheme) {
  		const decodedScheme = unescape(String(scheme));
  		if (!VALID_SCHEME.test(decodedScheme)) throw new TypeError(MALFORMED_SCHEME_ERROR);
  		return decodedScheme;
  	}
  	/**
  	* @template {import('./types/index').URIComponent|string} T
  	* @param {T} uri
  	* @param {import('./types/index').Options} [options]
  	* @returns {T}
  	*/
  	function normalize(uri, options) {
  		if (typeof uri === "string") uri = normalizeString(uri, options);
  		else if (typeof uri === "object") uri = parse(serialize(uri, options), options);
  		return uri;
  	}
  	/**
  	* @param {string} baseURI
  	* @param {string} relativeURI
  	* @param {import('./types/index').Options} [options]
  	* @returns {string}
  	*/
  	function resolve(baseURI, relativeURI, options) {
  		const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
  		const { parsed: baseParsed, malformedAuthorityOrPort: baseMalformed, malformedPercentEncoding: baseMalformedPercentEncoding, malformedSchemeSpecific: baseMalformedSchemeSpecific, malformedHost: baseMalformedHost, malformedScheme: baseMalformedScheme } = parseWithStatus(baseURI, schemelessOptions);
  		const { parsed: relativeParsed, malformedAuthorityOrPort: relativeMalformed, malformedPercentEncoding: relativeMalformedPercentEncoding, malformedSchemeSpecific: relativeMalformedSchemeSpecific, malformedHost: relativeMalformedHost, malformedScheme: relativeMalformedScheme } = parseWithStatus(relativeURI, schemelessOptions);
  		if (baseMalformed || relativeMalformed || baseMalformedPercentEncoding || relativeMalformedPercentEncoding || baseMalformedSchemeSpecific || relativeMalformedSchemeSpecific || baseMalformedHost || relativeMalformedHost || baseMalformedScheme || relativeMalformedScheme) throw new Error(baseParsed.error || relativeParsed.error || "URI is malformed.");
  		const resolved = resolveComponent(baseParsed, relativeParsed, schemelessOptions, true);
  		const resolvedSchemeHandler = getSchemeHandler(options && options.scheme || resolved.scheme);
  		const resolvedHost = resolved.host;
  		const resolvedHostIsIP = resolvedHost !== void 0 && resolvedHost !== "" && (isIPv4(resolvedHost) || normalizeIPv6(resolvedHost).isIPV6);
  		canonicalizeHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP);
  		const encodedASCIIHost = resolvedHost && resolvedHost.indexOf("%") !== -1 && !/\P{ASCII}/u.test(resolvedHost);
  		if (resolved.error && !encodedASCIIHost) throw new Error(resolved.error);
  		schemelessOptions.skipEscape = true;
  		return serialize(resolved, schemelessOptions);
  	}
  	/**
  	* @param {import ('./types/index').URIComponent} base
  	* @param {import ('./types/index').URIComponent} relative
  	* @param {import('./types/index').Options} [options]
  	* @param {boolean} [skipNormalization=false]
  	* @returns {import ('./types/index').URIComponent}
  	*/
  	function resolveComponent(base, relative, options, skipNormalization) {
  		/** @type {import('./types/index').URIComponent} */
  		const target = {};
  		if (!skipNormalization) {
  			base = parse(serialize(base, options), options);
  			relative = parse(serialize(relative, options), options);
  		}
  		options = options || {};
  		if (!options.tolerant && relative.scheme) {
  			target.scheme = relative.scheme;
  			target.userinfo = relative.userinfo;
  			target.host = relative.host;
  			target.port = relative.port;
  			target.path = removeDotSegments(relative.path || "");
  			target.query = relative.query;
  		} else {
  			if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
  				target.userinfo = relative.userinfo;
  				target.host = relative.host;
  				target.port = relative.port;
  				target.path = removeDotSegments(relative.path || "");
  				target.query = relative.query;
  			} else {
  				if (!relative.path) {
  					target.path = base.path;
  					if (relative.query !== void 0) target.query = relative.query;
  					else target.query = base.query;
  				} else {
  					if (relative.path[0] === "/") target.path = removeDotSegments(relative.path);
  					else {
  						if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) target.path = "/" + relative.path;
  						else if (!base.path) target.path = relative.path;
  						else target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
  						target.path = removeDotSegments(target.path);
  					}
  					target.query = relative.query;
  				}
  				target.userinfo = base.userinfo;
  				target.host = base.host;
  				target.port = base.port;
  			}
  			target.scheme = base.scheme;
  		}
  		target.fragment = relative.fragment;
  		return target;
  	}
  	/**
  	* @param {import ('./types/index').URIComponent|string} uriA
  	* @param {import ('./types/index').URIComponent|string} uriB
  	* @param {import ('./types/index').Options} options
  	* @returns {boolean}
  	*/
  	function equal(uriA, uriB, options) {
  		const normalizedA = normalizeComparableURI(uriA, options);
  		const normalizedB = normalizeComparableURI(uriB, options);
  		return normalizedA !== void 0 && normalizedB !== void 0 && normalizedA === normalizedB;
  	}
  	/**
  	* @param {Readonly<import('./types/index').URIComponent>} cmpts
  	* @param {import('./types/index').Options} [opts]
  	* @returns {string}
  	*/
  	function serialize(cmpts, opts) {
  		const component = {
  			host: cmpts.host,
  			scheme: cmpts.scheme,
  			userinfo: cmpts.userinfo,
  			port: cmpts.port,
  			path: cmpts.path,
  			query: cmpts.query,
  			nid: cmpts.nid,
  			nss: cmpts.nss,
  			uuid: cmpts.uuid,
  			fragment: cmpts.fragment,
  			reference: cmpts.reference,
  			resourceName: cmpts.resourceName,
  			secure: cmpts.secure,
  			error: ""
  		};
  		const options = Object.assign({}, opts);
  		const uriTokens = [];
  		if (component.scheme) component.scheme = decodeValidScheme(component.scheme);
  		const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
  		if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
  		const hasAuthority = component.userinfo !== void 0 || component.host !== void 0 || component.port !== void 0;
  		const pathNoScheme = !options.skipEscape && component.scheme === void 0 && !hasAuthority;
  		if (component.path !== void 0) {
  			if (!options.skipEscape) component.path = serializePathEncoding(component.path, pathNoScheme);
  			else component.path = normalizePercentEncoding(component.path);
  		}
  		if (options.reference !== "suffix" && component.scheme) {
  			component.scheme = decodeValidScheme(component.scheme);
  			uriTokens.push(component.scheme, ":");
  		}
  		const authority = recomposeAuthority(component);
  		if (authority !== void 0) {
  			if (options.reference !== "suffix") uriTokens.push("//");
  			uriTokens.push(authority);
  			if (component.path && component.path[0] !== "/") uriTokens.push("/");
  		}
  		if (component.path !== void 0) {
  			let s = component.path;
  			if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) s = removeDotSegments(s);
  			if (pathNoScheme) s = serializePathEncoding(s, true);
  			if (authority === void 0 && s[0] === "/" && s[1] === "/") s = "/%2F" + s.slice(2);
  			uriTokens.push(s);
  		}
  		if (component.query !== void 0) uriTokens.push("?", encodeQuery(component.query));
  		if (component.fragment !== void 0) uriTokens.push("#", encodeFragment(component.fragment));
  		return uriTokens.join("");
  	}
  	var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  	var AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/;
  	var AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/;
  	/**
  	* @param {import('./types/index').URIComponent} parsed
  	* @param {RegExpMatchArray} matches
  	* @returns {string|undefined}
  	*/
  	function getParseError(parsed, matches) {
  		if (matches[2] !== void 0 && parsed.path && parsed.path[0] !== "/") return "URI path must start with \"/\" when authority is present.";
  		if (typeof parsed.port === "number" && (parsed.port < 0 || parsed.port > 65535)) return "URI port is malformed.";
  	}
  	/**
  	* Checks percent syntax without decoding the represented octets. RFC 3986
  	* percent-encoding is byte-oriented, so sequences such as `%FF` are valid even
  	* though they are not independently valid UTF-8.
  	*
  	* @param {string|undefined} component
  	* @returns {boolean}
  	*/
  	function hasMalformedPercentEncoding(component) {
  		if (component === void 0) return false;
  		let percent = component.indexOf("%");
  		while (percent !== -1) {
  			if (percent + 2 >= component.length || !/^[\da-f]{2}$/iu.test(component.slice(percent + 1, percent + 3))) return true;
  			percent = component.indexOf("%", percent + 3);
  		}
  		return false;
  	}
  	/**
  	* Whether the host is a bracketed IP literal (RFC 3986 `IP-literal`).
  	* An unterminated `[` is not a literal, so it must still be validated as a
  	* reg-name instead of being waved through as an IP.
  	*
  	* @param {string} host
  	* @returns {boolean}
  	*/
  	function isIPLiteral(host) {
  		return host[0] === "[" && host[host.length - 1] === "]";
  	}
  	/**
  	* @param {RegExpMatchArray} matches
  	* @returns {boolean}
  	*/
  	function hasMalformedComponentPercentEncoding(matches) {
  		const host = matches[4];
  		return hasMalformedPercentEncoding(matches[3]) || host !== void 0 && !isIPLiteral(host) && hasMalformedPercentEncoding(host) || hasMalformedPercentEncoding(matches[6]) || hasMalformedPercentEncoding(matches[7]) || hasMalformedPercentEncoding(matches[8]);
  	}
  	/**
  	* @param {import('./types/index').URIComponent} parsed
  	* @param {import('./types/index').Options} options
  	* @param {{ domainHost?: boolean, unicodeSupport?: boolean }|undefined} schemeHandler
  	* @param {boolean} isIP
  	* @returns {boolean} whether host conversion failed
  	*/
  	function canonicalizeHost(parsed, options, schemeHandler, isIP) {
  		if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport) && parsed.host && !isIPLiteral(parsed.host) && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) try {
  			parsed.host = new URL("http://" + parsed.host).hostname;
  		} catch (e) {
  			parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
  			return true;
  		}
  		return false;
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {{ parsed: import('./types/index').URIComponent, malformedAuthorityOrPort: boolean, malformedPercentEncoding: boolean, malformedSchemeSpecific: boolean, malformedHost: boolean, malformedScheme: boolean }}
  	*/
  	function parseWithStatus(uri, opts) {
  		const options = Object.assign({}, opts);
  		/** @type {import('./types/index').URIComponent} */
  		const parsed = {
  			scheme: void 0,
  			userinfo: void 0,
  			host: "",
  			port: void 0,
  			path: "",
  			query: void 0,
  			fragment: void 0
  		};
  		let malformedAuthorityOrPort = false;
  		let malformedPercentEncoding = false;
  		let malformedSchemeSpecific = false;
  		let malformedHost = false;
  		let malformedIPLiteral = false;
  		let malformedScheme = false;
  		let isIP = false;
  		if (options.reference === "suffix") {
  			if (options.scheme) uri = options.scheme + ":" + uri;
  			else uri = "//" + uri;
  		}
  		const authorityMatch = uri.match(AUTHORITY_PREFIX);
  		if (authorityMatch !== null && authorityMatch[1].indexOf("\\") !== -1) {
  			parsed.error = "URI authority must not contain a literal backslash.";
  			malformedAuthorityOrPort = true;
  		}
  		const introducerMatch = uri.match(AUTHORITY_INTRODUCER_REGION);
  		if (introducerMatch !== null) {
  			const region = introducerMatch[1];
  			const normalizedRegion = region.replace(/[\t\n\r]/g, "");
  			if (normalizedRegion.length >= 2) {
  				if (normalizedRegion.slice(0, 2) !== "//") {
  					parsed.error = parsed.error || "URI authority must not contain a literal backslash.";
  					malformedAuthorityOrPort = true;
  				} else if (region.length !== normalizedRegion.length) {
  					parsed.error = parsed.error || "URI authority introducer must not contain whitespace.";
  					malformedAuthorityOrPort = true;
  				}
  			}
  		}
  		const matches = uri.match(URI_PARSE);
  		if (matches) {
  			parsed.scheme = matches[1];
  			parsed.userinfo = matches[3];
  			parsed.host = matches[4];
  			parsed.port = parseInt(matches[5], 10);
  			parsed.path = matches[6] || "";
  			parsed.query = matches[7];
  			parsed.fragment = matches[8];
  			if (parsed.scheme !== void 0) {
  				const decodedScheme = unescape(parsed.scheme);
  				if (VALID_SCHEME.test(decodedScheme)) parsed.scheme = decodedScheme.toLowerCase();
  				else {
  					parsed.error = parsed.error || MALFORMED_SCHEME_ERROR;
  					malformedScheme = true;
  				}
  			}
  			malformedPercentEncoding = hasMalformedComponentPercentEncoding(matches);
  			if (malformedPercentEncoding) parsed.error = parsed.error || "URI contains malformed percent-encoding.";
  			if (isNaN(parsed.port)) parsed.port = matches[5];
  			const parseError = getParseError(parsed, matches);
  			if (parseError !== void 0) {
  				parsed.error = parsed.error || parseError;
  				malformedAuthorityOrPort = true;
  			}
  			if (parsed.host) {
  				if (isIPv4(parsed.host) === false) {
  					const bracketedIPLiteral = isIPLiteral(parsed.host);
  					const hasIPLiteralBracket = parsed.host.indexOf("[") !== -1 || parsed.host.indexOf("]") !== -1;
  					const ipv6result = normalizeIPv6(parsed.host);
  					isIP = ipv6result.isIPV6 || ipv6result.isIPVFuture === true;
  					malformedIPLiteral = hasIPLiteralBracket && (!bracketedIPLiteral || ipv6result.error === true);
  					parsed.host = isIP ? ipv6result.host : ipv6result.host.toLowerCase();
  					if (malformedIPLiteral) {
  						parsed.error = parsed.error || "URI host is malformed.";
  						malformedAuthorityOrPort = true;
  					}
  				} else isIP = true;
  			}
  			if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) parsed.reference = "same-document";
  			else if (parsed.scheme === void 0) parsed.reference = "relative";
  			else if (parsed.fragment === void 0) parsed.reference = "absolute";
  			else parsed.reference = "uri";
  			if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
  			const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
  			if (!malformedIPLiteral) malformedHost = canonicalizeHost(parsed, options, schemeHandler, isIP);
  			if (uri.indexOf("%") !== -1 && parsed.host !== void 0 && !malformedIPLiteral) {
  				let host = isIP ? parsed.host : normalizePercentEncoding(parsed.host, true);
  				if (!isIP) host = normalizePercentEncoding(host.toLowerCase());
  				parsed.host = reescapeHostDelimiters(host, isIP);
  			}
  			if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
  				if (parsed.path) parsed.path = normalizePathEncoding(parsed.path);
  				if (parsed.query) parsed.query = normalizeQueryFragmentEncoding(parsed.query);
  				if (parsed.fragment) parsed.fragment = normalizeQueryFragmentEncoding(parsed.fragment);
  			}
  			if (schemeHandler && schemeHandler.parse) {
  				schemeHandler.parse(parsed, options);
  				if (schemeHandler === SCHEMES.urn && parsed.nid === void 0) malformedSchemeSpecific = true;
  			}
  		} else parsed.error = parsed.error || "URI can not be parsed.";
  		return {
  			parsed,
  			malformedAuthorityOrPort,
  			malformedPercentEncoding,
  			malformedSchemeSpecific,
  			malformedHost,
  			malformedScheme
  		};
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns
  	*/
  	function parse(uri, opts) {
  		return parseWithStatus(uri, opts).parsed;
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {string}
  	*/
  	function normalizeString(uri, opts) {
  		return normalizeStringWithStatus(uri, opts).normalized;
  	}
  	/**
  	* @param {string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {{ normalized: string, malformedAuthorityOrPort: boolean, malformedPercentEncoding: boolean, malformedSchemeSpecific: boolean, malformedHost: boolean, malformedScheme: boolean }}
  	*/
  	function normalizeStringWithStatus(uri, opts) {
  		const { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = parseWithStatus(uri, opts);
  		return {
  			normalized: malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? uri : serialize(parsed, opts),
  			malformedAuthorityOrPort,
  			malformedPercentEncoding,
  			malformedSchemeSpecific,
  			malformedHost,
  			malformedScheme
  		};
  	}
  	/**
  	* @param {import ('./types/index').URIComponent|string} uri
  	* @param {import('./types/index').Options} [opts]
  	* @returns {string|undefined}
  	*/
  	function normalizeComparableURI(uri, opts) {
  		if (typeof uri !== "string" && typeof uri !== "object") return;
  		let value;
  		try {
  			value = typeof uri === "string" ? uri : serialize(uri, opts);
  		} catch {
  			return;
  		}
  		const { normalized, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = normalizeStringWithStatus(value, opts);
  		return malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? void 0 : normalized;
  	}
  	var fastUri = {
  		SCHEMES,
  		normalize,
  		resolve,
  		resolveComponent,
  		equal,
  		serialize,
  		parse
  	};
  	module.exports = fastUri;
  	module.exports.default = fastUri;
  	module.exports.fastUri = fastUri;
  }));
  var require_uri = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var uri = require_fast_uri();
  	uri.code = "require(\"ajv/dist/runtime/uri\").default";
  	exports.default = uri;
  }));
  var require_core$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
  	var validate_1 = require_validate();
  	Object.defineProperty(exports, "KeywordCxt", {
  		enumerable: true,
  		get: function() {
  			return validate_1.KeywordCxt;
  		}
  	});
  	var codegen_1 = require_codegen();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return codegen_1._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.str;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.stringify;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.nil;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.Name;
  		}
  	});
  	Object.defineProperty(exports, "CodeGen", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.CodeGen;
  		}
  	});
  	var validation_error_1 = require_validation_error();
  	var ref_error_1 = require_ref_error();
  	var rules_1 = require_rules();
  	var compile_1 = require_compile();
  	var codegen_2 = require_codegen();
  	var resolve_1 = require_resolve();
  	var dataType_1 = require_dataType();
  	var util_1 = require_util();
  	var $dataRefSchema = (init_data(), __toCommonJS(data_exports).default);
  	var uri_1 = require_uri();
  	var defaultRegExp = (str, flags) => new RegExp(str, flags);
  	defaultRegExp.code = "new RegExp";
  	var META_IGNORE_OPTIONS = [
  		"removeAdditional",
  		"useDefaults",
  		"coerceTypes"
  	];
  	var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
  		"validate",
  		"serialize",
  		"parse",
  		"wrapper",
  		"root",
  		"schema",
  		"keyword",
  		"pattern",
  		"formats",
  		"validate$data",
  		"func",
  		"obj",
  		"Error"
  	]);
  	var removedOptions = {
  		errorDataPath: "",
  		format: "`validateFormats: false` can be used instead.",
  		nullable: "\"nullable\" keyword is supported by default.",
  		jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
  		extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
  		missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
  		processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
  		sourceCode: "Use option `code: {source: true}`",
  		strictDefaults: "It is default now, see option `strict`.",
  		strictKeywords: "It is default now, see option `strict`.",
  		uniqueItems: "\"uniqueItems\" keyword is always validated.",
  		unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
  		cache: "Map is used as cache, schema object as key.",
  		serialize: "Map is used as cache, schema object as key.",
  		ajvErrors: "It is default now."
  	};
  	var deprecatedOptions = {
  		ignoreKeywordsWithRef: "",
  		jsPropertySyntax: "",
  		unicode: "\"minLength\"/\"maxLength\" account for unicode characters by default."
  	};
  	var MAX_EXPRESSION = 200;
  	function requiredOptions(o) {
  		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
  		const s = o.strict;
  		const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
  		const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
  		const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
  		const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
  		return {
  			strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
  			strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
  			strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
  			strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
  			strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
  			code: o.code ? {
  				...o.code,
  				optimize,
  				regExp
  			} : {
  				optimize,
  				regExp
  			},
  			loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
  			loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
  			meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
  			messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
  			inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
  			schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
  			addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
  			validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
  			validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
  			unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
  			int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
  			uriResolver
  		};
  	}
  	var Ajv = class {
  		constructor(opts = {}) {
  			this.schemas = {};
  			this.refs = {};
  			this.formats = Object.create(null);
  			this._compilations = /* @__PURE__ */ new Set();
  			this._loading = {};
  			this._cache = /* @__PURE__ */ new Map();
  			opts = this.opts = {
  				...opts,
  				...requiredOptions(opts)
  			};
  			const { es5, lines } = this.opts.code;
  			this.scope = new codegen_2.ValueScope({
  				scope: {},
  				prefixes: EXT_SCOPE_NAMES,
  				es5,
  				lines
  			});
  			this.logger = getLogger(opts.logger);
  			const formatOpt = opts.validateFormats;
  			opts.validateFormats = false;
  			this.RULES = (0, rules_1.getRules)();
  			checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
  			checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
  			this._metaOpts = getMetaSchemaOptions.call(this);
  			if (opts.formats) addInitialFormats.call(this);
  			this._addVocabularies();
  			this._addDefaultMetaSchema();
  			if (opts.keywords) addInitialKeywords.call(this, opts.keywords);
  			if (typeof opts.meta == "object") this.addMetaSchema(opts.meta);
  			addInitialSchemas.call(this);
  			opts.validateFormats = formatOpt;
  		}
  		_addVocabularies() {
  			this.addKeyword("$async");
  		}
  		_addDefaultMetaSchema() {
  			const { $data, meta, schemaId } = this.opts;
  			let _dataRefSchema = $dataRefSchema;
  			if (schemaId === "id") {
  				_dataRefSchema = { ...$dataRefSchema };
  				_dataRefSchema.id = _dataRefSchema.$id;
  				delete _dataRefSchema.$id;
  			}
  			if (meta && $data) this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
  		}
  		defaultMeta() {
  			const { meta, schemaId } = this.opts;
  			return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
  		}
  		validate(schemaKeyRef, data) {
  			let v;
  			if (typeof schemaKeyRef == "string") {
  				v = this.getSchema(schemaKeyRef);
  				if (!v) throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
  			} else v = this.compile(schemaKeyRef);
  			const valid = v(data);
  			if (!("$async" in v)) this.errors = v.errors;
  			return valid;
  		}
  		compile(schema, _meta) {
  			const sch = this._addSchema(schema, _meta);
  			return sch.validate || this._compileSchemaEnv(sch);
  		}
  		compileAsync(schema, meta) {
  			if (typeof this.opts.loadSchema != "function") throw new Error("options.loadSchema should be a function");
  			const { loadSchema } = this.opts;
  			return runCompileAsync.call(this, schema, meta);
  			async function runCompileAsync(_schema, _meta) {
  				await loadMetaSchema.call(this, _schema.$schema);
  				const sch = this._addSchema(_schema, _meta);
  				return sch.validate || _compileAsync.call(this, sch);
  			}
  			async function loadMetaSchema($ref) {
  				if ($ref && !this.getSchema($ref)) await runCompileAsync.call(this, { $ref }, true);
  			}
  			async function _compileAsync(sch) {
  				try {
  					return this._compileSchemaEnv(sch);
  				} catch (e) {
  					if (!(e instanceof ref_error_1.default)) throw e;
  					checkLoaded.call(this, e);
  					await loadMissingSchema.call(this, e.missingSchema);
  					return _compileAsync.call(this, sch);
  				}
  			}
  			function checkLoaded({ missingSchema: ref, missingRef }) {
  				if (this.refs[ref]) throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
  			}
  			async function loadMissingSchema(ref) {
  				const _schema = await _loadSchema.call(this, ref);
  				if (!this.refs[ref]) await loadMetaSchema.call(this, _schema.$schema);
  				if (!this.refs[ref]) this.addSchema(_schema, ref, meta);
  			}
  			async function _loadSchema(ref) {
  				const p = this._loading[ref];
  				if (p) return p;
  				try {
  					return await (this._loading[ref] = loadSchema(ref));
  				} finally {
  					delete this._loading[ref];
  				}
  			}
  		}
  		addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
  			if (Array.isArray(schema)) {
  				for (const sch of schema) this.addSchema(sch, void 0, _meta, _validateSchema);
  				return this;
  			}
  			let id;
  			if (typeof schema === "object") {
  				const { schemaId } = this.opts;
  				id = schema[schemaId];
  				if (id !== void 0 && typeof id != "string") throw new Error(`schema ${schemaId} must be string`);
  			}
  			key = (0, resolve_1.normalizeId)(key || id);
  			this._checkUnique(key);
  			this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
  			return this;
  		}
  		addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
  			this.addSchema(schema, key, true, _validateSchema);
  			return this;
  		}
  		validateSchema(schema, throwOrLogError) {
  			if (typeof schema == "boolean") return true;
  			let $schema;
  			$schema = schema.$schema;
  			if ($schema !== void 0 && typeof $schema != "string") throw new Error("$schema must be a string");
  			$schema = $schema || this.opts.defaultMeta || this.defaultMeta();
  			if (!$schema) {
  				this.logger.warn("meta-schema not available");
  				this.errors = null;
  				return true;
  			}
  			const valid = this.validate($schema, schema);
  			if (!valid && throwOrLogError) {
  				const message = "schema is invalid: " + this.errorsText();
  				if (this.opts.validateSchema === "log") this.logger.error(message);
  				else throw new Error(message);
  			}
  			return valid;
  		}
  		getSchema(keyRef) {
  			let sch;
  			while (typeof (sch = getSchEnv.call(this, keyRef)) == "string") keyRef = sch;
  			if (sch === void 0) {
  				const { schemaId } = this.opts;
  				const root = new compile_1.SchemaEnv({
  					schema: {},
  					schemaId
  				});
  				sch = compile_1.resolveSchema.call(this, root, keyRef);
  				if (!sch) return;
  				this.refs[keyRef] = sch;
  			}
  			return sch.validate || this._compileSchemaEnv(sch);
  		}
  		removeSchema(schemaKeyRef) {
  			if (schemaKeyRef instanceof RegExp) {
  				this._removeAllSchemas(this.schemas, schemaKeyRef);
  				this._removeAllSchemas(this.refs, schemaKeyRef);
  				return this;
  			}
  			switch (typeof schemaKeyRef) {
  				case "undefined":
  					this._removeAllSchemas(this.schemas);
  					this._removeAllSchemas(this.refs);
  					this._cache.clear();
  					return this;
  				case "string": {
  					const sch = getSchEnv.call(this, schemaKeyRef);
  					if (typeof sch == "object") this._cache.delete(sch.schema);
  					delete this.schemas[schemaKeyRef];
  					delete this.refs[schemaKeyRef];
  					return this;
  				}
  				case "object": {
  					const cacheKey = schemaKeyRef;
  					this._cache.delete(cacheKey);
  					let id = schemaKeyRef[this.opts.schemaId];
  					if (id) {
  						id = (0, resolve_1.normalizeId)(id);
  						delete this.schemas[id];
  						delete this.refs[id];
  					}
  					return this;
  				}
  				default: throw new Error("ajv.removeSchema: invalid parameter");
  			}
  		}
  		addVocabulary(definitions) {
  			for (const def of definitions) this.addKeyword(def);
  			return this;
  		}
  		addKeyword(kwdOrDef, def) {
  			let keyword;
  			if (typeof kwdOrDef == "string") {
  				keyword = kwdOrDef;
  				if (typeof def == "object") {
  					this.logger.warn("these parameters are deprecated, see docs for addKeyword");
  					def.keyword = keyword;
  				}
  			} else if (typeof kwdOrDef == "object" && def === void 0) {
  				def = kwdOrDef;
  				keyword = def.keyword;
  				if (Array.isArray(keyword) && !keyword.length) throw new Error("addKeywords: keyword must be string or non-empty array");
  			} else throw new Error("invalid addKeywords parameters");
  			checkKeyword.call(this, keyword, def);
  			if (!def) {
  				(0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
  				return this;
  			}
  			keywordMetaschema.call(this, def);
  			const definition = {
  				...def,
  				type: (0, dataType_1.getJSONTypes)(def.type),
  				schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
  			};
  			(0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
  			return this;
  		}
  		getKeyword(keyword) {
  			const rule = this.RULES.all[keyword];
  			return typeof rule == "object" ? rule.definition : !!rule;
  		}
  		removeKeyword(keyword) {
  			const { RULES } = this;
  			delete RULES.keywords[keyword];
  			delete RULES.all[keyword];
  			for (const group of RULES.rules) {
  				const i = group.rules.findIndex((rule) => rule.keyword === keyword);
  				if (i >= 0) group.rules.splice(i, 1);
  			}
  			return this;
  		}
  		addFormat(name, format) {
  			if (typeof format == "string") format = new RegExp(format);
  			this.formats[name] = format;
  			return this;
  		}
  		errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
  			if (!errors || errors.length === 0) return "No errors";
  			return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
  		}
  		$dataMetaSchema(metaSchema, keywordsJsonPointers) {
  			const rules = this.RULES.all;
  			metaSchema = JSON.parse(JSON.stringify(metaSchema));
  			for (const jsonPointer of keywordsJsonPointers) {
  				const segments = jsonPointer.split("/").slice(1);
  				let keywords = metaSchema;
  				for (const seg of segments) keywords = keywords[seg];
  				for (const key in rules) {
  					const rule = rules[key];
  					if (typeof rule != "object") continue;
  					const { $data } = rule.definition;
  					const schema = keywords[key];
  					if ($data && schema) keywords[key] = schemaOrData(schema);
  				}
  			}
  			return metaSchema;
  		}
  		_removeAllSchemas(schemas, regex) {
  			for (const keyRef in schemas) {
  				const sch = schemas[keyRef];
  				if (!regex || regex.test(keyRef)) {
  					if (typeof sch == "string") delete schemas[keyRef];
  					else if (sch && !sch.meta) {
  						this._cache.delete(sch.schema);
  						delete schemas[keyRef];
  					}
  				}
  			}
  		}
  		_addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
  			let id;
  			const { schemaId } = this.opts;
  			if (typeof schema == "object") id = schema[schemaId];
  			else if (this.opts.jtd) throw new Error("schema must be object");
  			else if (typeof schema != "boolean") throw new Error("schema must be object or boolean");
  			let sch = this._cache.get(schema);
  			if (sch !== void 0) return sch;
  			baseId = (0, resolve_1.normalizeId)(id || baseId);
  			const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
  			sch = new compile_1.SchemaEnv({
  				schema,
  				schemaId,
  				meta,
  				baseId,
  				localRefs
  			});
  			this._cache.set(sch.schema, sch);
  			if (addSchema && !baseId.startsWith("#")) {
  				if (baseId) this._checkUnique(baseId);
  				this.refs[baseId] = sch;
  			}
  			if (validateSchema) this.validateSchema(schema, true);
  			return sch;
  		}
  		_checkUnique(id) {
  			if (this.schemas[id] || this.refs[id]) throw new Error(`schema with key or id "${id}" already exists`);
  		}
  		_compileSchemaEnv(sch) {
  			if (sch.meta) this._compileMetaSchema(sch);
  			else compile_1.compileSchema.call(this, sch);
  			/* istanbul ignore if */
  			if (!sch.validate) throw new Error("ajv implementation error");
  			return sch.validate;
  		}
  		_compileMetaSchema(sch) {
  			const currentOpts = this.opts;
  			this.opts = this._metaOpts;
  			try {
  				compile_1.compileSchema.call(this, sch);
  			} finally {
  				this.opts = currentOpts;
  			}
  		}
  	};
  	Ajv.ValidationError = validation_error_1.default;
  	Ajv.MissingRefError = ref_error_1.default;
  	exports.default = Ajv;
  	function checkOptions(checkOpts, options, msg, log = "error") {
  		for (const key in checkOpts) {
  			const opt = key;
  			if (opt in options) this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
  		}
  	}
  	function getSchEnv(keyRef) {
  		keyRef = (0, resolve_1.normalizeId)(keyRef);
  		return this.schemas[keyRef] || this.refs[keyRef];
  	}
  	function addInitialSchemas() {
  		const optsSchemas = this.opts.schemas;
  		if (!optsSchemas) return;
  		if (Array.isArray(optsSchemas)) this.addSchema(optsSchemas);
  		else for (const key in optsSchemas) this.addSchema(optsSchemas[key], key);
  	}
  	function addInitialFormats() {
  		for (const name in this.opts.formats) {
  			const format = this.opts.formats[name];
  			if (format) this.addFormat(name, format);
  		}
  	}
  	function addInitialKeywords(defs) {
  		if (Array.isArray(defs)) {
  			this.addVocabulary(defs);
  			return;
  		}
  		this.logger.warn("keywords option as map is deprecated, pass array");
  		for (const keyword in defs) {
  			const def = defs[keyword];
  			if (!def.keyword) def.keyword = keyword;
  			this.addKeyword(def);
  		}
  	}
  	function getMetaSchemaOptions() {
  		const metaOpts = { ...this.opts };
  		for (const opt of META_IGNORE_OPTIONS) delete metaOpts[opt];
  		return metaOpts;
  	}
  	var noLogs = {
  		log() {},
  		warn() {},
  		error() {}
  	};
  	function getLogger(logger) {
  		if (logger === false) return noLogs;
  		if (logger === void 0) return console;
  		if (logger.log && logger.warn && logger.error) return logger;
  		throw new Error("logger must implement log, warn and error methods");
  	}
  	var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  	function checkKeyword(keyword, def) {
  		const { RULES } = this;
  		(0, util_1.eachItem)(keyword, (kwd) => {
  			if (RULES.keywords[kwd]) throw new Error(`Keyword ${kwd} is already defined`);
  			if (!KEYWORD_NAME.test(kwd)) throw new Error(`Keyword ${kwd} has invalid name`);
  		});
  		if (!def) return;
  		if (def.$data && !("code" in def || "validate" in def)) throw new Error("$data keyword must have \"code\" or \"validate\" function");
  	}
  	function addRule(keyword, definition, dataType) {
  		var _a;
  		const post = definition === null || definition === void 0 ? void 0 : definition.post;
  		if (dataType && post) throw new Error("keyword with \"post\" flag cannot have \"type\"");
  		const { RULES } = this;
  		let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
  		if (!ruleGroup) {
  			ruleGroup = {
  				type: dataType,
  				rules: []
  			};
  			RULES.rules.push(ruleGroup);
  		}
  		RULES.keywords[keyword] = true;
  		if (!definition) return;
  		const rule = {
  			keyword,
  			definition: {
  				...definition,
  				type: (0, dataType_1.getJSONTypes)(definition.type),
  				schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
  			}
  		};
  		if (definition.before) addBeforeRule.call(this, ruleGroup, rule, definition.before);
  		else ruleGroup.rules.push(rule);
  		RULES.all[keyword] = rule;
  		(_a = definition.implements) === null || _a === void 0 || _a.forEach((kwd) => this.addKeyword(kwd));
  	}
  	function addBeforeRule(ruleGroup, rule, before) {
  		const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
  		if (i >= 0) ruleGroup.rules.splice(i, 0, rule);
  		else {
  			ruleGroup.rules.push(rule);
  			this.logger.warn(`rule ${before} is not defined`);
  		}
  	}
  	function keywordMetaschema(def) {
  		let { metaSchema } = def;
  		if (metaSchema === void 0) return;
  		if (def.$data && this.opts.$data) metaSchema = schemaOrData(metaSchema);
  		def.validateSchema = this.compile(metaSchema, true);
  	}
  	var $dataRef = { $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#" };
  	function schemaOrData(schema) {
  		return { anyOf: [schema, $dataRef] };
  	}
  }));
  var require_id = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = {
  		keyword: "id",
  		code() {
  			throw new Error("NOT SUPPORTED: keyword \"id\", use \"$id\" for schema ID");
  		}
  	};
  }));
  var require_ref = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.callRef = exports.getValidate = void 0;
  	var ref_error_1 = require_ref_error();
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var compile_1 = require_compile();
  	var util_1 = require_util();
  	var def = {
  		keyword: "$ref",
  		schemaType: "string",
  		code(cxt) {
  			const { gen, schema: $ref, it } = cxt;
  			const { baseId, schemaEnv: env, validateName, opts, self } = it;
  			const { root } = env;
  			if (($ref === "#" || $ref === "#/") && baseId === root.baseId) return callRootRef();
  			const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
  			if (schOrEnv === void 0) throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
  			if (schOrEnv instanceof compile_1.SchemaEnv) return callValidate(schOrEnv);
  			return inlineRefSchema(schOrEnv);
  			function callRootRef() {
  				if (env === root) return callRef(cxt, validateName, env, env.$async);
  				const rootName = gen.scopeValue("root", { ref: root });
  				return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
  			}
  			function callValidate(sch) {
  				callRef(cxt, getValidate(cxt, sch), sch, sch.$async);
  			}
  			function inlineRefSchema(sch) {
  				const schName = gen.scopeValue("schema", opts.code.source === true ? {
  					ref: sch,
  					code: (0, codegen_1.stringify)(sch)
  				} : { ref: sch });
  				const valid = gen.name("valid");
  				const schCxt = cxt.subschema({
  					schema: sch,
  					dataTypes: [],
  					schemaPath: codegen_1.nil,
  					topSchemaRef: schName,
  					errSchemaPath: $ref
  				}, valid);
  				cxt.mergeEvaluated(schCxt);
  				cxt.ok(valid);
  			}
  		}
  	};
  	function getValidate(cxt, sch) {
  		const { gen } = cxt;
  		return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
  	}
  	exports.getValidate = getValidate;
  	function callRef(cxt, v, sch, $async) {
  		const { gen, it } = cxt;
  		const { allErrors, schemaEnv: env, opts } = it;
  		const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
  		if ($async) callAsyncRef();
  		else callSyncRef();
  		function callAsyncRef() {
  			if (!env.$async) throw new Error("async schema referenced by sync schema");
  			const valid = gen.let("valid");
  			gen.try(() => {
  				gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
  				addEvaluatedFrom(v);
  				if (!allErrors) gen.assign(valid, true);
  			}, (e) => {
  				gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
  				addErrorsFrom(e);
  				if (!allErrors) gen.assign(valid, false);
  			});
  			cxt.ok(valid);
  		}
  		function callSyncRef() {
  			cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
  		}
  		function addErrorsFrom(source) {
  			const errs = (0, codegen_1._)`${source}.errors`;
  			gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
  			gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
  		}
  		function addEvaluatedFrom(source) {
  			var _a;
  			if (!it.opts.unevaluated) return;
  			const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
  			if (it.props !== true) {
  				if (schEvaluated && !schEvaluated.dynamicProps) {
  					if (schEvaluated.props !== void 0) it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
  				} else {
  					const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
  					it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
  				}
  			}
  			if (it.items !== true) {
  				if (schEvaluated && !schEvaluated.dynamicItems) {
  					if (schEvaluated.items !== void 0) it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
  				} else {
  					const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
  					it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
  				}
  			}
  		}
  	}
  	exports.callRef = callRef;
  	exports.default = def;
  }));
  var require_core = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var id_1 = require_id();
  	var ref_1 = require_ref();
  	exports.default = [
  		"$schema",
  		"$id",
  		"$defs",
  		"$vocabulary",
  		{ keyword: "$comment" },
  		"definitions",
  		id_1.default,
  		ref_1.default
  	];
  }));
  var require_limitNumber = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var ops = codegen_1.operators;
  	var KWDs = {
  		maximum: {
  			okStr: "<=",
  			ok: ops.LTE,
  			fail: ops.GT
  		},
  		minimum: {
  			okStr: ">=",
  			ok: ops.GTE,
  			fail: ops.LT
  		},
  		exclusiveMaximum: {
  			okStr: "<",
  			ok: ops.LT,
  			fail: ops.GTE
  		},
  		exclusiveMinimum: {
  			okStr: ">",
  			ok: ops.GT,
  			fail: ops.LTE
  		}
  	};
  	exports.default = {
  		keyword: Object.keys(KWDs),
  		type: "number",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
  			params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode } = cxt;
  			cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
  		}
  	};
  }));
  var require_multipleOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: "multipleOf",
  		type: "number",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
  			params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, schemaCode, it } = cxt;
  			const prec = it.opts.multipleOfPrecision;
  			const res = gen.let("res");
  			const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
  			cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
  		}
  	};
  }));
  var require_ucs2length = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	function ucs2length(str) {
  		const len = str.length;
  		let length = 0;
  		let pos = 0;
  		let value;
  		while (pos < len) {
  			length++;
  			value = str.charCodeAt(pos++);
  			if (value >= 55296 && value <= 56319 && pos < len) {
  				value = str.charCodeAt(pos);
  				if ((value & 64512) === 56320) pos++;
  			}
  		}
  		return length;
  	}
  	exports.default = ucs2length;
  	ucs2length.code = "require(\"ajv/dist/runtime/ucs2length\").default";
  }));
  var require_limitLength = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var ucs2length_1 = require_ucs2length();
  	exports.default = {
  		keyword: ["maxLength", "minLength"],
  		type: "string",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message({ keyword, schemaCode }) {
  				const comp = keyword === "maxLength" ? "more" : "fewer";
  				return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
  			},
  			params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode, it } = cxt;
  			const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
  			const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
  			cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
  		}
  	};
  }));
  var require_pattern = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var util_1 = require_util();
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: "pattern",
  		type: "string",
  		schemaType: "string",
  		$data: true,
  		error: {
  			message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
  			params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schema, schemaCode, it } = cxt;
  			const u = it.opts.unicodeRegExp ? "u" : "";
  			if ($data) {
  				const { regExp } = it.opts.code;
  				const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
  				const valid = gen.let("valid");
  				gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
  				cxt.fail$data((0, codegen_1._)`!${valid}`);
  			} else {
  				const regExp = (0, code_1.usePattern)(cxt, schema);
  				cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
  			}
  		}
  	};
  }));
  var require_limitProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: ["maxProperties", "minProperties"],
  		type: "object",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message({ keyword, schemaCode }) {
  				const comp = keyword === "maxProperties" ? "more" : "fewer";
  				return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
  			},
  			params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode } = cxt;
  			const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
  			cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
  		}
  	};
  }));
  var require_required = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "required",
  		type: "object",
  		schemaType: "array",
  		$data: true,
  		error: {
  			message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
  			params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
  		},
  		code(cxt) {
  			const { gen, schema, schemaCode, data, $data, it } = cxt;
  			const { opts } = it;
  			if (!$data && schema.length === 0) return;
  			const useLoop = schema.length >= opts.loopRequired;
  			if (it.allErrors) allErrorsMode();
  			else exitOnErrorMode();
  			if (opts.strictRequired) {
  				const props = cxt.parentSchema.properties;
  				const { definedProperties } = cxt.it;
  				for (const requiredKey of schema) if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
  					const msg = `required property "${requiredKey}" is not defined at "${it.schemaEnv.baseId + it.errSchemaPath}" (strictRequired)`;
  					(0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
  				}
  			}
  			function allErrorsMode() {
  				if (useLoop || $data) cxt.block$data(codegen_1.nil, loopAllRequired);
  				else for (const prop of schema) (0, code_1.checkReportMissingProp)(cxt, prop);
  			}
  			function exitOnErrorMode() {
  				const missing = gen.let("missing");
  				if (useLoop || $data) {
  					const valid = gen.let("valid", true);
  					cxt.block$data(valid, () => loopUntilMissing(missing, valid));
  					cxt.ok(valid);
  				} else {
  					gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
  					(0, code_1.reportMissingProp)(cxt, missing);
  					gen.else();
  				}
  			}
  			function loopAllRequired() {
  				gen.forOf("prop", schemaCode, (prop) => {
  					cxt.setParams({ missingProperty: prop });
  					gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
  				});
  			}
  			function loopUntilMissing(missing, valid) {
  				cxt.setParams({ missingProperty: missing });
  				gen.forOf(missing, schemaCode, () => {
  					gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
  					gen.if((0, codegen_1.not)(valid), () => {
  						cxt.error();
  						gen.break();
  					});
  				}, codegen_1.nil);
  			}
  		}
  	};
  }));
  var require_limitItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: ["maxItems", "minItems"],
  		type: "array",
  		schemaType: "number",
  		$data: true,
  		error: {
  			message({ keyword, schemaCode }) {
  				const comp = keyword === "maxItems" ? "more" : "fewer";
  				return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
  			},
  			params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { keyword, data, schemaCode } = cxt;
  			const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
  			cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
  		}
  	};
  }));
  var require_equal = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var equal = require_fast_deep_equal();
  	equal.code = "require(\"ajv/dist/runtime/equal\").default";
  	exports.default = equal;
  }));
  var require_uniqueItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dataType_1 = require_dataType();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var equal_1 = require_equal();
  	exports.default = {
  		keyword: "uniqueItems",
  		type: "array",
  		schemaType: "boolean",
  		$data: true,
  		error: {
  			message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
  			params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
  			if (!$data && !schema) return;
  			const valid = gen.let("valid");
  			const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
  			cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
  			cxt.ok(valid);
  			function validateUniqueItems() {
  				const i = gen.let("i", (0, codegen_1._)`${data}.length`);
  				const j = gen.let("j");
  				cxt.setParams({
  					i,
  					j
  				});
  				gen.assign(valid, true);
  				gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
  			}
  			function canOptimize() {
  				return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
  			}
  			function loopN(i, j) {
  				const item = gen.name("item");
  				const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
  				const indices = gen.const("indices", (0, codegen_1._)`{}`);
  				gen.for((0, codegen_1._)`;${i}--;`, () => {
  					gen.let(item, (0, codegen_1._)`${data}[${i}]`);
  					gen.if(wrongType, (0, codegen_1._)`continue`);
  					if (itemTypes.length > 1) gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
  					gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
  						gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
  						cxt.error();
  						gen.assign(valid, false).break();
  					}).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
  				});
  			}
  			function loopN2(i, j) {
  				const eql = (0, util_1.useFunc)(gen, equal_1.default);
  				const outer = gen.name("outer");
  				gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
  					cxt.error();
  					gen.assign(valid, false).break(outer);
  				})));
  			}
  		}
  	};
  }));
  var require_const = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var equal_1 = require_equal();
  	exports.default = {
  		keyword: "const",
  		$data: true,
  		error: {
  			message: "must be equal to constant",
  			params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schemaCode, schema } = cxt;
  			if ($data || schema && typeof schema == "object") cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
  			else cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
  		}
  	};
  }));
  var require_enum = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var equal_1 = require_equal();
  	exports.default = {
  		keyword: "enum",
  		schemaType: "array",
  		$data: true,
  		error: {
  			message: "must be equal to one of the allowed values",
  			params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, $data, schema, schemaCode, it } = cxt;
  			if (!$data && schema.length === 0) throw new Error("enum must have non-empty array");
  			const useLoop = schema.length >= it.opts.loopEnum;
  			let eql;
  			const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
  			let valid;
  			if (useLoop || $data) {
  				valid = gen.let("valid");
  				cxt.block$data(valid, loopEnum);
  			} else {
  				/* istanbul ignore if */
  				if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  				const vSchema = gen.const("vSchema", schemaCode);
  				valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
  			}
  			cxt.pass(valid);
  			function loopEnum() {
  				gen.assign(valid, false);
  				gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
  			}
  			function equalCode(vSchema, i) {
  				const sch = schema[i];
  				return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
  			}
  		}
  	};
  }));
  var require_validation = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var limitNumber_1 = require_limitNumber();
  	var multipleOf_1 = require_multipleOf();
  	var limitLength_1 = require_limitLength();
  	var pattern_1 = require_pattern();
  	var limitProperties_1 = require_limitProperties();
  	var required_1 = require_required();
  	var limitItems_1 = require_limitItems();
  	var uniqueItems_1 = require_uniqueItems();
  	var const_1 = require_const();
  	var enum_1 = require_enum();
  	exports.default = [
  		limitNumber_1.default,
  		multipleOf_1.default,
  		limitLength_1.default,
  		pattern_1.default,
  		limitProperties_1.default,
  		required_1.default,
  		limitItems_1.default,
  		uniqueItems_1.default,
  		{
  			keyword: "type",
  			schemaType: ["string", "array"]
  		},
  		{
  			keyword: "nullable",
  			schemaType: "boolean"
  		},
  		const_1.default,
  		enum_1.default
  	];
  }));
  var require_additionalItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateAdditionalItems = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var def = {
  		keyword: "additionalItems",
  		type: "array",
  		schemaType: ["boolean", "object"],
  		before: "uniqueItems",
  		error: {
  			message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
  			params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  		},
  		code(cxt) {
  			const { parentSchema, it } = cxt;
  			const { items } = parentSchema;
  			if (!Array.isArray(items)) {
  				(0, util_1.checkStrictMode)(it, "\"additionalItems\" is ignored when \"items\" is not an array of schemas");
  				return;
  			}
  			validateAdditionalItems(cxt, items);
  		}
  	};
  	function validateAdditionalItems(cxt, items) {
  		const { gen, schema, data, keyword, it } = cxt;
  		it.items = true;
  		const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  		if (schema === false) {
  			cxt.setParams({ len: items.length });
  			cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
  		} else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
  			const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
  			gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
  			cxt.ok(valid);
  		}
  		function validateItems(valid) {
  			gen.forRange("i", items.length, len, (i) => {
  				cxt.subschema({
  					keyword,
  					dataProp: i,
  					dataPropType: util_1.Type.Num
  				}, valid);
  				if (!it.allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  			});
  		}
  	}
  	exports.validateAdditionalItems = validateAdditionalItems;
  	exports.default = def;
  }));
  var require_items = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateTuple = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var code_1 = require_code();
  	var def = {
  		keyword: "items",
  		type: "array",
  		schemaType: [
  			"object",
  			"array",
  			"boolean"
  		],
  		before: "uniqueItems",
  		code(cxt) {
  			const { schema, it } = cxt;
  			if (Array.isArray(schema)) return validateTuple(cxt, "additionalItems", schema);
  			it.items = true;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) return;
  			cxt.ok((0, code_1.validateArray)(cxt));
  		}
  	};
  	function validateTuple(cxt, extraItems, schArr = cxt.schema) {
  		const { gen, parentSchema, data, keyword, it } = cxt;
  		checkStrictTuple(parentSchema);
  		if (it.opts.unevaluated && schArr.length && it.items !== true) it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
  		const valid = gen.name("valid");
  		const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  		schArr.forEach((sch, i) => {
  			if ((0, util_1.alwaysValidSchema)(it, sch)) return;
  			gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
  				keyword,
  				schemaProp: i,
  				dataProp: i
  			}, valid));
  			cxt.ok(valid);
  		});
  		function checkStrictTuple(sch) {
  			const { opts, errSchemaPath } = it;
  			const l = schArr.length;
  			const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
  			if (opts.strictTuples && !fullTuple) {
  				const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
  				(0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
  			}
  		}
  	}
  	exports.validateTuple = validateTuple;
  	exports.default = def;
  }));
  var require_prefixItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var items_1 = require_items();
  	exports.default = {
  		keyword: "prefixItems",
  		type: "array",
  		schemaType: ["array"],
  		before: "uniqueItems",
  		code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
  	};
  }));
  var require_items2020 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var code_1 = require_code();
  	var additionalItems_1 = require_additionalItems();
  	exports.default = {
  		keyword: "items",
  		type: "array",
  		schemaType: ["object", "boolean"],
  		before: "uniqueItems",
  		error: {
  			message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
  			params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  		},
  		code(cxt) {
  			const { schema, parentSchema, it } = cxt;
  			const { prefixItems } = parentSchema;
  			it.items = true;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) return;
  			if (prefixItems) (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
  			else cxt.ok((0, code_1.validateArray)(cxt));
  		}
  	};
  }));
  var require_contains = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "contains",
  		type: "array",
  		schemaType: ["object", "boolean"],
  		before: "uniqueItems",
  		trackErrors: true,
  		error: {
  			message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
  			params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
  		},
  		code(cxt) {
  			const { gen, schema, parentSchema, data, it } = cxt;
  			let min;
  			let max;
  			const { minContains, maxContains } = parentSchema;
  			if (it.opts.next) {
  				min = minContains === void 0 ? 1 : minContains;
  				max = maxContains;
  			} else min = 1;
  			const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  			cxt.setParams({
  				min,
  				max
  			});
  			if (max === void 0 && min === 0) {
  				(0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
  				return;
  			}
  			if (max !== void 0 && min > max) {
  				(0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
  				cxt.fail();
  				return;
  			}
  			if ((0, util_1.alwaysValidSchema)(it, schema)) {
  				let cond = (0, codegen_1._)`${len} >= ${min}`;
  				if (max !== void 0) cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
  				cxt.pass(cond);
  				return;
  			}
  			it.items = true;
  			const valid = gen.name("valid");
  			if (max === void 0 && min === 1) validateItems(valid, () => gen.if(valid, () => gen.break()));
  			else if (min === 0) {
  				gen.let(valid, true);
  				if (max !== void 0) gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
  			} else {
  				gen.let(valid, false);
  				validateItemsWithCount();
  			}
  			cxt.result(valid, () => cxt.reset());
  			function validateItemsWithCount() {
  				const schValid = gen.name("_valid");
  				const count = gen.let("count", 0);
  				validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
  			}
  			function validateItems(_valid, block) {
  				gen.forRange("i", 0, len, (i) => {
  					cxt.subschema({
  						keyword: "contains",
  						dataProp: i,
  						dataPropType: util_1.Type.Num,
  						compositeRule: true
  					}, _valid);
  					block();
  				});
  			}
  			function checkLimits(count) {
  				gen.code((0, codegen_1._)`${count}++`);
  				if (max === void 0) gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
  				else {
  					gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
  					if (min === 1) gen.assign(valid, true);
  					else gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
  				}
  			}
  		}
  	};
  }));
  var require_dependencies = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var code_1 = require_code();
  	exports.error = {
  		message: ({ params: { property, depsCount, deps } }) => {
  			const property_ies = depsCount === 1 ? "property" : "properties";
  			return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
  		},
  		params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
      missingProperty: ${missingProperty},
      depsCount: ${depsCount},
      deps: ${deps}}`
  	};
  	var def = {
  		keyword: "dependencies",
  		type: "object",
  		schemaType: "object",
  		error: exports.error,
  		code(cxt) {
  			const [propDeps, schDeps] = splitDependencies(cxt);
  			validatePropertyDeps(cxt, propDeps);
  			validateSchemaDeps(cxt, schDeps);
  		}
  	};
  	function splitDependencies({ schema }) {
  		const propertyDeps = {};
  		const schemaDeps = {};
  		for (const key in schema) {
  			if (key === "__proto__") continue;
  			const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
  			deps[key] = schema[key];
  		}
  		return [propertyDeps, schemaDeps];
  	}
  	function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
  		const { gen, data, it } = cxt;
  		if (Object.keys(propertyDeps).length === 0) return;
  		const missing = gen.let("missing");
  		for (const prop in propertyDeps) {
  			const deps = propertyDeps[prop];
  			if (deps.length === 0) continue;
  			const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
  			cxt.setParams({
  				property: prop,
  				depsCount: deps.length,
  				deps: deps.join(", ")
  			});
  			if (it.allErrors) gen.if(hasProperty, () => {
  				for (const depProp of deps) (0, code_1.checkReportMissingProp)(cxt, depProp);
  			});
  			else {
  				gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
  				(0, code_1.reportMissingProp)(cxt, missing);
  				gen.else();
  			}
  		}
  	}
  	exports.validatePropertyDeps = validatePropertyDeps;
  	function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
  		const { gen, data, keyword, it } = cxt;
  		const valid = gen.name("valid");
  		for (const prop in schemaDeps) {
  			if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop])) continue;
  			gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
  				const schCxt = cxt.subschema({
  					keyword,
  					schemaProp: prop
  				}, valid);
  				cxt.mergeValidEvaluated(schCxt, valid);
  			}, () => gen.var(valid, true));
  			cxt.ok(valid);
  		}
  	}
  	exports.validateSchemaDeps = validateSchemaDeps;
  	exports.default = def;
  }));
  var require_propertyNames = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "propertyNames",
  		type: "object",
  		schemaType: ["object", "boolean"],
  		error: {
  			message: "property name must be valid",
  			params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
  		},
  		code(cxt) {
  			const { gen, schema, data, it } = cxt;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) return;
  			const valid = gen.name("valid");
  			gen.forIn("key", data, (key) => {
  				cxt.setParams({ propertyName: key });
  				cxt.subschema({
  					keyword: "propertyNames",
  					data: key,
  					dataTypes: ["string"],
  					propertyName: key,
  					compositeRule: true
  				}, valid);
  				gen.if((0, codegen_1.not)(valid), () => {
  					cxt.error(true);
  					if (!it.allErrors) gen.break();
  				});
  			});
  			cxt.ok(valid);
  		}
  	};
  }));
  var require_additionalProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "additionalProperties",
  		type: ["object"],
  		schemaType: ["boolean", "object"],
  		allowUndefined: true,
  		trackErrors: true,
  		error: {
  			message: "must NOT have additional properties",
  			params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
  		},
  		code(cxt) {
  			const { gen, schema, parentSchema, data, errsCount, it } = cxt;
  			/* istanbul ignore if */
  			if (!errsCount) throw new Error("ajv implementation error");
  			const { allErrors, opts } = it;
  			it.props = true;
  			if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema)) return;
  			const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
  			const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
  			checkAdditionalProperties();
  			cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  			function checkAdditionalProperties() {
  				gen.forIn("key", data, (key) => {
  					if (!props.length && !patProps.length) additionalPropertyCode(key);
  					else gen.if(isAdditional(key), () => additionalPropertyCode(key));
  				});
  			}
  			function isAdditional(key) {
  				let definedProp;
  				if (props.length > 8) {
  					const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
  					definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
  				} else if (props.length) definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
  				else definedProp = codegen_1.nil;
  				if (patProps.length) definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
  				return (0, codegen_1.not)(definedProp);
  			}
  			function deleteAdditional(key) {
  				gen.code((0, codegen_1._)`delete ${data}[${key}]`);
  			}
  			function additionalPropertyCode(key) {
  				if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
  					deleteAdditional(key);
  					return;
  				}
  				if (schema === false) {
  					cxt.setParams({ additionalProperty: key });
  					cxt.error();
  					if (!allErrors) gen.break();
  					return;
  				}
  				if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
  					const valid = gen.name("valid");
  					if (opts.removeAdditional === "failing") {
  						applyAdditionalSchema(key, valid, false);
  						gen.if((0, codegen_1.not)(valid), () => {
  							cxt.reset();
  							deleteAdditional(key);
  						});
  					} else {
  						applyAdditionalSchema(key, valid);
  						if (!allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  					}
  				}
  			}
  			function applyAdditionalSchema(key, valid, errors) {
  				const subschema = {
  					keyword: "additionalProperties",
  					dataProp: key,
  					dataPropType: util_1.Type.Str
  				};
  				if (errors === false) Object.assign(subschema, {
  					compositeRule: true,
  					createErrors: false,
  					allErrors: false
  				});
  				cxt.subschema(subschema, valid);
  			}
  		}
  	};
  }));
  var require_properties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var validate_1 = require_validate();
  	var code_1 = require_code();
  	var util_1 = require_util();
  	var additionalProperties_1 = require_additionalProperties();
  	exports.default = {
  		keyword: "properties",
  		type: "object",
  		schemaType: "object",
  		code(cxt) {
  			const { gen, schema, parentSchema, data, it } = cxt;
  			if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
  			const allProps = (0, code_1.allSchemaProperties)(schema);
  			for (const prop of allProps) it.definedProperties.add(prop);
  			if (it.opts.unevaluated && allProps.length && it.props !== true) it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
  			const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
  			if (properties.length === 0) return;
  			const valid = gen.name("valid");
  			for (const prop of properties) {
  				if (hasDefault(prop)) applyPropertySchema(prop);
  				else {
  					gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
  					applyPropertySchema(prop);
  					if (!it.allErrors) gen.else().var(valid, true);
  					gen.endIf();
  				}
  				cxt.it.definedProperties.add(prop);
  				cxt.ok(valid);
  			}
  			function hasDefault(prop) {
  				return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
  			}
  			function applyPropertySchema(prop) {
  				cxt.subschema({
  					keyword: "properties",
  					schemaProp: prop,
  					dataProp: prop
  				}, valid);
  			}
  		}
  	};
  }));
  var require_patternProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var code_1 = require_code();
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var util_2 = require_util();
  	exports.default = {
  		keyword: "patternProperties",
  		type: "object",
  		schemaType: "object",
  		code(cxt) {
  			const { gen, schema, data, parentSchema, it } = cxt;
  			const { opts } = it;
  			const patterns = (0, code_1.allSchemaProperties)(schema);
  			const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
  			if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) return;
  			const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
  			const valid = gen.name("valid");
  			if (it.props !== true && !(it.props instanceof codegen_1.Name)) it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
  			const { props } = it;
  			validatePatternProperties();
  			function validatePatternProperties() {
  				for (const pat of patterns) {
  					if (checkProperties) checkMatchingProperties(pat);
  					if (it.allErrors) validateProperties(pat);
  					else {
  						gen.var(valid, true);
  						validateProperties(pat);
  						gen.if(valid);
  					}
  				}
  			}
  			function checkMatchingProperties(pat) {
  				for (const prop in checkProperties) if (new RegExp(pat).test(prop)) (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
  			}
  			function validateProperties(pat) {
  				gen.forIn("key", data, (key) => {
  					gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
  						const alwaysValid = alwaysValidPatterns.includes(pat);
  						if (!alwaysValid) cxt.subschema({
  							keyword: "patternProperties",
  							schemaProp: pat,
  							dataProp: key,
  							dataPropType: util_2.Type.Str
  						}, valid);
  						if (it.opts.unevaluated && props !== true) gen.assign((0, codegen_1._)`${props}[${key}]`, true);
  						else if (!alwaysValid && !it.allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  					});
  				});
  			}
  		}
  	};
  }));
  var require_not = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "not",
  		schemaType: ["object", "boolean"],
  		trackErrors: true,
  		code(cxt) {
  			const { gen, schema, it } = cxt;
  			if ((0, util_1.alwaysValidSchema)(it, schema)) {
  				cxt.fail();
  				return;
  			}
  			const valid = gen.name("valid");
  			cxt.subschema({
  				keyword: "not",
  				compositeRule: true,
  				createErrors: false,
  				allErrors: false
  			}, valid);
  			cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
  		},
  		error: { message: "must NOT be valid" }
  	};
  }));
  var require_anyOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = {
  		keyword: "anyOf",
  		schemaType: "array",
  		trackErrors: true,
  		code: require_code().validateUnion,
  		error: { message: "must match a schema in anyOf" }
  	};
  }));
  var require_oneOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "oneOf",
  		schemaType: "array",
  		trackErrors: true,
  		error: {
  			message: "must match exactly one schema in oneOf",
  			params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
  		},
  		code(cxt) {
  			const { gen, schema, parentSchema, it } = cxt;
  			/* istanbul ignore if */
  			if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  			if (it.opts.discriminator && parentSchema.discriminator) return;
  			const schArr = schema;
  			const valid = gen.let("valid", false);
  			const passing = gen.let("passing", null);
  			const schValid = gen.name("_valid");
  			cxt.setParams({ passing });
  			gen.block(validateOneOf);
  			cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  			function validateOneOf() {
  				schArr.forEach((sch, i) => {
  					let schCxt;
  					if ((0, util_1.alwaysValidSchema)(it, sch)) gen.var(schValid, true);
  					else schCxt = cxt.subschema({
  						keyword: "oneOf",
  						schemaProp: i,
  						compositeRule: true
  					}, schValid);
  					if (i > 0) gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
  					gen.if(schValid, () => {
  						gen.assign(valid, true);
  						gen.assign(passing, i);
  						if (schCxt) cxt.mergeEvaluated(schCxt, codegen_1.Name);
  					});
  				});
  			}
  		}
  	};
  }));
  var require_allOf = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "allOf",
  		schemaType: "array",
  		code(cxt) {
  			const { gen, schema, it } = cxt;
  			/* istanbul ignore if */
  			if (!Array.isArray(schema)) throw new Error("ajv implementation error");
  			const valid = gen.name("valid");
  			schema.forEach((sch, i) => {
  				if ((0, util_1.alwaysValidSchema)(it, sch)) return;
  				const schCxt = cxt.subschema({
  					keyword: "allOf",
  					schemaProp: i
  				}, valid);
  				cxt.ok(valid);
  				cxt.mergeEvaluated(schCxt);
  			});
  		}
  	};
  }));
  var require_if = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var def = {
  		keyword: "if",
  		schemaType: ["object", "boolean"],
  		trackErrors: true,
  		error: {
  			message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
  			params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
  		},
  		code(cxt) {
  			const { gen, parentSchema, it } = cxt;
  			if (parentSchema.then === void 0 && parentSchema.else === void 0) (0, util_1.checkStrictMode)(it, "\"if\" without \"then\" and \"else\" is ignored");
  			const hasThen = hasSchema(it, "then");
  			const hasElse = hasSchema(it, "else");
  			if (!hasThen && !hasElse) return;
  			const valid = gen.let("valid", true);
  			const schValid = gen.name("_valid");
  			validateIf();
  			cxt.reset();
  			if (hasThen && hasElse) {
  				const ifClause = gen.let("ifClause");
  				cxt.setParams({ ifClause });
  				gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
  			} else if (hasThen) gen.if(schValid, validateClause("then"));
  			else gen.if((0, codegen_1.not)(schValid), validateClause("else"));
  			cxt.pass(valid, () => cxt.error(true));
  			function validateIf() {
  				const schCxt = cxt.subschema({
  					keyword: "if",
  					compositeRule: true,
  					createErrors: false,
  					allErrors: false
  				}, schValid);
  				cxt.mergeEvaluated(schCxt);
  			}
  			function validateClause(keyword, ifClause) {
  				return () => {
  					const schCxt = cxt.subschema({ keyword }, schValid);
  					gen.assign(valid, schValid);
  					cxt.mergeValidEvaluated(schCxt, valid);
  					if (ifClause) gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
  					else cxt.setParams({ ifClause: keyword });
  				};
  			}
  		}
  	};
  	function hasSchema(it, keyword) {
  		const schema = it.schema[keyword];
  		return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
  	}
  	exports.default = def;
  }));
  var require_thenElse = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: ["then", "else"],
  		schemaType: ["object", "boolean"],
  		code({ keyword, parentSchema, it }) {
  			if (parentSchema.if === void 0) (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
  		}
  	};
  }));
  var require_applicator = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var additionalItems_1 = require_additionalItems();
  	var prefixItems_1 = require_prefixItems();
  	var items_1 = require_items();
  	var items2020_1 = require_items2020();
  	var contains_1 = require_contains();
  	var dependencies_1 = require_dependencies();
  	var propertyNames_1 = require_propertyNames();
  	var additionalProperties_1 = require_additionalProperties();
  	var properties_1 = require_properties();
  	var patternProperties_1 = require_patternProperties();
  	var not_1 = require_not();
  	var anyOf_1 = require_anyOf();
  	var oneOf_1 = require_oneOf();
  	var allOf_1 = require_allOf();
  	var if_1 = require_if();
  	var thenElse_1 = require_thenElse();
  	function getApplicator(draft2020 = false) {
  		const applicator = [
  			not_1.default,
  			anyOf_1.default,
  			oneOf_1.default,
  			allOf_1.default,
  			if_1.default,
  			thenElse_1.default,
  			propertyNames_1.default,
  			additionalProperties_1.default,
  			dependencies_1.default,
  			properties_1.default,
  			patternProperties_1.default
  		];
  		if (draft2020) applicator.push(prefixItems_1.default, items2020_1.default);
  		else applicator.push(additionalItems_1.default, items_1.default);
  		applicator.push(contains_1.default);
  		return applicator;
  	}
  	exports.default = getApplicator;
  }));
  var require_format$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	exports.default = {
  		keyword: "format",
  		type: ["number", "string"],
  		schemaType: "string",
  		$data: true,
  		error: {
  			message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
  			params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
  		},
  		code(cxt, ruleType) {
  			const { gen, data, $data, schema, schemaCode, it } = cxt;
  			const { opts, errSchemaPath, schemaEnv, self } = it;
  			if (!opts.validateFormats) return;
  			if ($data) validate$DataFormat();
  			else validateFormat();
  			function validate$DataFormat() {
  				const fmts = gen.scopeValue("formats", {
  					ref: self.formats,
  					code: opts.code.formats
  				});
  				const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
  				const fType = gen.let("fType");
  				const format = gen.let("format");
  				gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
  				cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
  				function unknownFmt() {
  					if (opts.strictSchema === false) return codegen_1.nil;
  					return (0, codegen_1._)`${schemaCode} && !${format}`;
  				}
  				function invalidFmt() {
  					const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
  					const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
  					return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
  				}
  			}
  			function validateFormat() {
  				const formatDef = self.formats[schema];
  				if (!formatDef) {
  					unknownFormat();
  					return;
  				}
  				if (formatDef === true) return;
  				const [fmtType, format, fmtRef] = getFormat(formatDef);
  				if (fmtType === ruleType) cxt.pass(validCondition());
  				function unknownFormat() {
  					if (opts.strictSchema === false) {
  						self.logger.warn(unknownMsg());
  						return;
  					}
  					throw new Error(unknownMsg());
  					function unknownMsg() {
  						return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
  					}
  				}
  				function getFormat(fmtDef) {
  					const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
  					const fmt = gen.scopeValue("formats", {
  						key: schema,
  						ref: fmtDef,
  						code
  					});
  					if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) return [
  						fmtDef.type || "string",
  						fmtDef.validate,
  						(0, codegen_1._)`${fmt}.validate`
  					];
  					return [
  						"string",
  						fmtDef,
  						fmt
  					];
  				}
  				function validCondition() {
  					if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
  						if (!schemaEnv.$async) throw new Error("async format in sync schema");
  						return (0, codegen_1._)`await ${fmtRef}(${data})`;
  					}
  					return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
  				}
  			}
  		}
  	};
  }));
  var require_format = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = [require_format$1().default];
  }));
  var require_metadata = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.contentVocabulary = exports.metadataVocabulary = void 0;
  	exports.metadataVocabulary = [
  		"title",
  		"description",
  		"default",
  		"deprecated",
  		"readOnly",
  		"writeOnly",
  		"examples"
  	];
  	exports.contentVocabulary = [
  		"contentMediaType",
  		"contentEncoding",
  		"contentSchema"
  	];
  }));
  var require_draft7 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var core_1 = require_core();
  	var validation_1 = require_validation();
  	var applicator_1 = require_applicator();
  	var format_1 = require_format();
  	var metadata_1 = require_metadata();
  	exports.default = [
  		core_1.default,
  		validation_1.default,
  		(0, applicator_1.default)(),
  		format_1.default,
  		metadata_1.metadataVocabulary,
  		metadata_1.contentVocabulary
  	];
  }));
  var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.DiscrError = void 0;
  	var DiscrError;
  	(function(DiscrError) {
  		DiscrError["Tag"] = "tag";
  		DiscrError["Mapping"] = "mapping";
  	})(DiscrError || (exports.DiscrError = DiscrError = {}));
  }));
  var require_discriminator = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var types_1 = require_types();
  	var compile_1 = require_compile();
  	var ref_error_1 = require_ref_error();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "discriminator",
  		type: "object",
  		schemaType: "object",
  		error: {
  			message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
  			params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
  		},
  		code(cxt) {
  			const { gen, data, schema, parentSchema, it } = cxt;
  			const { oneOf } = parentSchema;
  			if (!it.opts.discriminator) throw new Error("discriminator: requires discriminator option");
  			const tagName = schema.propertyName;
  			if (typeof tagName != "string") throw new Error("discriminator: requires propertyName");
  			if (schema.mapping) throw new Error("discriminator: mapping is not supported");
  			if (!oneOf) throw new Error("discriminator: requires oneOf keyword");
  			const valid = gen.let("valid", false);
  			const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
  			gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, {
  				discrError: types_1.DiscrError.Tag,
  				tag,
  				tagName
  			}));
  			cxt.ok(valid);
  			function validateMapping() {
  				const mapping = getMapping();
  				gen.if(false);
  				for (const tagValue in mapping) {
  					gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
  					gen.assign(valid, applyTagSchema(mapping[tagValue]));
  				}
  				gen.else();
  				cxt.error(false, {
  					discrError: types_1.DiscrError.Mapping,
  					tag,
  					tagName
  				});
  				gen.endIf();
  			}
  			function applyTagSchema(schemaProp) {
  				const _valid = gen.name("valid");
  				const schCxt = cxt.subschema({
  					keyword: "oneOf",
  					schemaProp
  				}, _valid);
  				cxt.mergeEvaluated(schCxt, codegen_1.Name);
  				return _valid;
  			}
  			function getMapping() {
  				var _a;
  				const oneOfMapping = {};
  				const topRequired = hasRequired(parentSchema);
  				let tagRequired = true;
  				for (let i = 0; i < oneOf.length; i++) {
  					let sch = oneOf[i];
  					if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
  						const ref = sch.$ref;
  						sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
  						if (sch instanceof compile_1.SchemaEnv) sch = sch.schema;
  						if (sch === void 0) throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
  					}
  					const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
  					if (typeof propSch != "object") throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
  					tagRequired = tagRequired && (topRequired || hasRequired(sch));
  					addMappings(propSch, i);
  				}
  				if (!tagRequired) throw new Error(`discriminator: "${tagName}" must be required`);
  				return oneOfMapping;
  				function hasRequired({ required }) {
  					return Array.isArray(required) && required.includes(tagName);
  				}
  				function addMappings(sch, i) {
  					if (sch.const) addMapping(sch.const, i);
  					else if (sch.enum) for (const tagValue of sch.enum) addMapping(tagValue, i);
  					else throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
  				}
  				function addMapping(tagValue, i) {
  					if (typeof tagValue != "string" || tagValue in oneOfMapping) throw new Error(`discriminator: "${tagName}" values must be unique strings`);
  					oneOfMapping[tagValue] = i;
  				}
  			}
  		}
  	};
  }));
  var json_schema_draft_07_exports = /* @__PURE__ */ __exportAll({
  	$id: () => $id$11,
  	$schema: () => $schema$11,
  	default: () => json_schema_draft_07_default,
  	definitions: () => definitions,
  	properties: () => properties$11,
  	title: () => title$11,
  	type: () => type$11
  });
  var $schema$11, $id$11, title$11, definitions, type$11, properties$11, json_schema_draft_07_default;
  var init_json_schema_draft_07 = __esmMin((() => {
  	$schema$11 = "http://json-schema.org/draft-07/schema#";
  	$id$11 = "http://json-schema.org/draft-07/schema#";
  	title$11 = "Core schema meta-schema";
  	definitions = {
  		"schemaArray": {
  			"type": "array",
  			"minItems": 1,
  			"items": { "$ref": "#" }
  		},
  		"nonNegativeInteger": {
  			"type": "integer",
  			"minimum": 0
  		},
  		"nonNegativeIntegerDefault0": { "allOf": [{ "$ref": "#/definitions/nonNegativeInteger" }, { "default": 0 }] },
  		"simpleTypes": { "enum": [
  			"array",
  			"boolean",
  			"integer",
  			"null",
  			"number",
  			"object",
  			"string"
  		] },
  		"stringArray": {
  			"type": "array",
  			"items": { "type": "string" },
  			"uniqueItems": true,
  			"default": []
  		}
  	};
  	type$11 = ["object", "boolean"];
  	properties$11 = {
  		"$id": {
  			"type": "string",
  			"format": "uri-reference"
  		},
  		"$schema": {
  			"type": "string",
  			"format": "uri"
  		},
  		"$ref": {
  			"type": "string",
  			"format": "uri-reference"
  		},
  		"$comment": { "type": "string" },
  		"title": { "type": "string" },
  		"description": { "type": "string" },
  		"default": true,
  		"readOnly": {
  			"type": "boolean",
  			"default": false
  		},
  		"examples": {
  			"type": "array",
  			"items": true
  		},
  		"multipleOf": {
  			"type": "number",
  			"exclusiveMinimum": 0
  		},
  		"maximum": { "type": "number" },
  		"exclusiveMaximum": { "type": "number" },
  		"minimum": { "type": "number" },
  		"exclusiveMinimum": { "type": "number" },
  		"maxLength": { "$ref": "#/definitions/nonNegativeInteger" },
  		"minLength": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
  		"pattern": {
  			"type": "string",
  			"format": "regex"
  		},
  		"additionalItems": { "$ref": "#" },
  		"items": {
  			"anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/schemaArray" }],
  			"default": true
  		},
  		"maxItems": { "$ref": "#/definitions/nonNegativeInteger" },
  		"minItems": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
  		"uniqueItems": {
  			"type": "boolean",
  			"default": false
  		},
  		"contains": { "$ref": "#" },
  		"maxProperties": { "$ref": "#/definitions/nonNegativeInteger" },
  		"minProperties": { "$ref": "#/definitions/nonNegativeIntegerDefault0" },
  		"required": { "$ref": "#/definitions/stringArray" },
  		"additionalProperties": { "$ref": "#" },
  		"definitions": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#" },
  			"default": {}
  		},
  		"properties": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#" },
  			"default": {}
  		},
  		"patternProperties": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#" },
  			"propertyNames": { "format": "regex" },
  			"default": {}
  		},
  		"dependencies": {
  			"type": "object",
  			"additionalProperties": { "anyOf": [{ "$ref": "#" }, { "$ref": "#/definitions/stringArray" }] }
  		},
  		"propertyNames": { "$ref": "#" },
  		"const": true,
  		"enum": {
  			"type": "array",
  			"items": true,
  			"minItems": 1,
  			"uniqueItems": true
  		},
  		"type": { "anyOf": [{ "$ref": "#/definitions/simpleTypes" }, {
  			"type": "array",
  			"items": { "$ref": "#/definitions/simpleTypes" },
  			"minItems": 1,
  			"uniqueItems": true
  		}] },
  		"format": { "type": "string" },
  		"contentMediaType": { "type": "string" },
  		"contentEncoding": { "type": "string" },
  		"if": { "$ref": "#" },
  		"then": { "$ref": "#" },
  		"else": { "$ref": "#" },
  		"allOf": { "$ref": "#/definitions/schemaArray" },
  		"anyOf": { "$ref": "#/definitions/schemaArray" },
  		"oneOf": { "$ref": "#/definitions/schemaArray" },
  		"not": { "$ref": "#" }
  	};
  	json_schema_draft_07_default = {
  		$schema: $schema$11,
  		$id: $id$11,
  		title: title$11,
  		definitions,
  		type: type$11,
  		properties: properties$11,
  		"default": true
  	};
  }));
  var require_ajv = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
  	var core_1 = require_core$1();
  	var draft7_1 = require_draft7();
  	var discriminator_1 = require_discriminator();
  	var draft7MetaSchema = (init_json_schema_draft_07(), __toCommonJS(json_schema_draft_07_exports).default);
  	var META_SUPPORT_DATA = ["/properties"];
  	var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
  	var Ajv = class extends core_1.default {
  		_addVocabularies() {
  			super._addVocabularies();
  			draft7_1.default.forEach((v) => this.addVocabulary(v));
  			if (this.opts.discriminator) this.addKeyword(discriminator_1.default);
  		}
  		_addDefaultMetaSchema() {
  			super._addDefaultMetaSchema();
  			if (!this.opts.meta) return;
  			const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
  			this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
  			this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
  		}
  		defaultMeta() {
  			return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
  		}
  	};
  	exports.Ajv = Ajv;
  	module.exports = exports = Ajv;
  	module.exports.Ajv = Ajv;
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = Ajv;
  	var validate_1 = require_validate();
  	Object.defineProperty(exports, "KeywordCxt", {
  		enumerable: true,
  		get: function() {
  			return validate_1.KeywordCxt;
  		}
  	});
  	var codegen_1 = require_codegen();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return codegen_1._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.str;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.stringify;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.nil;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.Name;
  		}
  	});
  	Object.defineProperty(exports, "CodeGen", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.CodeGen;
  		}
  	});
  	var validation_error_1 = require_validation_error();
  	Object.defineProperty(exports, "ValidationError", {
  		enumerable: true,
  		get: function() {
  			return validation_error_1.default;
  		}
  	});
  	var ref_error_1 = require_ref_error();
  	Object.defineProperty(exports, "MissingRefError", {
  		enumerable: true,
  		get: function() {
  			return ref_error_1.default;
  		}
  	});
  }));
  var require_dynamicAnchor = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.dynamicAnchor = void 0;
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var compile_1 = require_compile();
  	var ref_1 = require_ref();
  	var def = {
  		keyword: "$dynamicAnchor",
  		schemaType: "string",
  		code: (cxt) => dynamicAnchor(cxt, cxt.schema)
  	};
  	function dynamicAnchor(cxt, anchor) {
  		const { gen, it } = cxt;
  		it.schemaEnv.root.dynamicAnchors[anchor] = true;
  		const v = (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`;
  		const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
  		gen.if((0, codegen_1._)`!${v}`, () => gen.assign(v, validate));
  	}
  	exports.dynamicAnchor = dynamicAnchor;
  	function _getValidate(cxt) {
  		const { schemaEnv, schema, self } = cxt.it;
  		const { root, baseId, localRefs, meta } = schemaEnv.root;
  		const { schemaId } = self.opts;
  		const sch = new compile_1.SchemaEnv({
  			schema,
  			schemaId,
  			root,
  			baseId,
  			localRefs,
  			meta
  		});
  		compile_1.compileSchema.call(self, sch);
  		return (0, ref_1.getValidate)(cxt, sch);
  	}
  	exports.default = def;
  }));
  var require_dynamicRef = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.dynamicRef = void 0;
  	var codegen_1 = require_codegen();
  	var names_1 = require_names();
  	var ref_1 = require_ref();
  	var def = {
  		keyword: "$dynamicRef",
  		schemaType: "string",
  		code: (cxt) => dynamicRef(cxt, cxt.schema)
  	};
  	function dynamicRef(cxt, ref) {
  		const { gen, keyword, it } = cxt;
  		if (ref[0] !== "#") throw new Error(`"${keyword}" only supports hash fragment reference`);
  		const anchor = ref.slice(1);
  		if (it.allErrors) _dynamicRef();
  		else {
  			const valid = gen.let("valid", false);
  			_dynamicRef(valid);
  			cxt.ok(valid);
  		}
  		function _dynamicRef(valid) {
  			if (it.schemaEnv.root.dynamicAnchors[anchor]) {
  				const v = gen.let("_v", (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`);
  				gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
  			} else _callRef(it.validateName, valid)();
  		}
  		function _callRef(validate, valid) {
  			return valid ? () => gen.block(() => {
  				(0, ref_1.callRef)(cxt, validate);
  				gen.let(valid, true);
  			}) : () => (0, ref_1.callRef)(cxt, validate);
  		}
  	}
  	exports.dynamicRef = dynamicRef;
  	exports.default = def;
  }));
  var require_recursiveAnchor = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dynamicAnchor_1 = require_dynamicAnchor();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "$recursiveAnchor",
  		schemaType: "boolean",
  		code(cxt) {
  			if (cxt.schema) (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
  			else (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
  		}
  	};
  }));
  var require_recursiveRef = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dynamicRef_1 = require_dynamicRef();
  	exports.default = {
  		keyword: "$recursiveRef",
  		schemaType: "string",
  		code: (cxt) => (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema)
  	};
  }));
  var require_dynamic = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dynamicAnchor_1 = require_dynamicAnchor();
  	var dynamicRef_1 = require_dynamicRef();
  	var recursiveAnchor_1 = require_recursiveAnchor();
  	var recursiveRef_1 = require_recursiveRef();
  	exports.default = [
  		dynamicAnchor_1.default,
  		dynamicRef_1.default,
  		recursiveAnchor_1.default,
  		recursiveRef_1.default
  	];
  }));
  var require_dependentRequired = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dependencies_1 = require_dependencies();
  	exports.default = {
  		keyword: "dependentRequired",
  		type: "object",
  		schemaType: "object",
  		error: dependencies_1.error,
  		code: (cxt) => (0, dependencies_1.validatePropertyDeps)(cxt)
  	};
  }));
  var require_dependentSchemas = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dependencies_1 = require_dependencies();
  	exports.default = {
  		keyword: "dependentSchemas",
  		type: "object",
  		schemaType: "object",
  		code: (cxt) => (0, dependencies_1.validateSchemaDeps)(cxt)
  	};
  }));
  var require_limitContains = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var util_1 = require_util();
  	exports.default = {
  		keyword: ["maxContains", "minContains"],
  		type: "array",
  		schemaType: "number",
  		code({ keyword, parentSchema, it }) {
  			if (parentSchema.contains === void 0) (0, util_1.checkStrictMode)(it, `"${keyword}" without "contains" is ignored`);
  		}
  	};
  }));
  var require_next = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var dependentRequired_1 = require_dependentRequired();
  	var dependentSchemas_1 = require_dependentSchemas();
  	var limitContains_1 = require_limitContains();
  	exports.default = [
  		dependentRequired_1.default,
  		dependentSchemas_1.default,
  		limitContains_1.default
  	];
  }));
  var require_unevaluatedProperties = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	var names_1 = require_names();
  	exports.default = {
  		keyword: "unevaluatedProperties",
  		type: "object",
  		schemaType: ["boolean", "object"],
  		trackErrors: true,
  		error: {
  			message: "must NOT have unevaluated properties",
  			params: ({ params }) => (0, codegen_1._)`{unevaluatedProperty: ${params.unevaluatedProperty}}`
  		},
  		code(cxt) {
  			const { gen, schema, data, errsCount, it } = cxt;
  			/* istanbul ignore if */
  			if (!errsCount) throw new Error("ajv implementation error");
  			const { allErrors, props } = it;
  			if (props instanceof codegen_1.Name) gen.if((0, codegen_1._)`${props} !== true`, () => gen.forIn("key", data, (key) => gen.if(unevaluatedDynamic(props, key), () => unevaluatedPropCode(key))));
  			else if (props !== true) gen.forIn("key", data, (key) => props === void 0 ? unevaluatedPropCode(key) : gen.if(unevaluatedStatic(props, key), () => unevaluatedPropCode(key)));
  			it.props = true;
  			cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  			function unevaluatedPropCode(key) {
  				if (schema === false) {
  					cxt.setParams({ unevaluatedProperty: key });
  					cxt.error();
  					if (!allErrors) gen.break();
  					return;
  				}
  				if (!(0, util_1.alwaysValidSchema)(it, schema)) {
  					const valid = gen.name("valid");
  					cxt.subschema({
  						keyword: "unevaluatedProperties",
  						dataProp: key,
  						dataPropType: util_1.Type.Str
  					}, valid);
  					if (!allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  				}
  			}
  			function unevaluatedDynamic(evaluatedProps, key) {
  				return (0, codegen_1._)`!${evaluatedProps} || !${evaluatedProps}[${key}]`;
  			}
  			function unevaluatedStatic(evaluatedProps, key) {
  				const ps = [];
  				for (const p in evaluatedProps) if (evaluatedProps[p] === true) ps.push((0, codegen_1._)`${key} !== ${p}`);
  				return (0, codegen_1.and)(...ps);
  			}
  		}
  	};
  }));
  var require_unevaluatedItems = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var codegen_1 = require_codegen();
  	var util_1 = require_util();
  	exports.default = {
  		keyword: "unevaluatedItems",
  		type: "array",
  		schemaType: ["boolean", "object"],
  		error: {
  			message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
  			params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  		},
  		code(cxt) {
  			const { gen, schema, data, it } = cxt;
  			const items = it.items || 0;
  			if (items === true) return;
  			const len = gen.const("len", (0, codegen_1._)`${data}.length`);
  			if (schema === false) {
  				cxt.setParams({ len: items });
  				cxt.fail((0, codegen_1._)`${len} > ${items}`);
  			} else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
  				const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items}`);
  				gen.if((0, codegen_1.not)(valid), () => validateItems(valid, items));
  				cxt.ok(valid);
  			}
  			it.items = true;
  			function validateItems(valid, from) {
  				gen.forRange("i", from, len, (i) => {
  					cxt.subschema({
  						keyword: "unevaluatedItems",
  						dataProp: i,
  						dataPropType: util_1.Type.Num
  					}, valid);
  					if (!it.allErrors) gen.if((0, codegen_1.not)(valid), () => gen.break());
  				});
  			}
  		}
  	};
  }));
  var require_unevaluated = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var unevaluatedProperties_1 = require_unevaluatedProperties();
  	var unevaluatedItems_1 = require_unevaluatedItems();
  	exports.default = [unevaluatedProperties_1.default, unevaluatedItems_1.default];
  }));
  var require_draft2020 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var core_1 = require_core();
  	var validation_1 = require_validation();
  	var applicator_1 = require_applicator();
  	var dynamic_1 = require_dynamic();
  	var next_1 = require_next();
  	var unevaluated_1 = require_unevaluated();
  	var format_1 = require_format();
  	var metadata_1 = require_metadata();
  	exports.default = [
  		dynamic_1.default,
  		core_1.default,
  		validation_1.default,
  		(0, applicator_1.default)(true),
  		format_1.default,
  		metadata_1.metadataVocabulary,
  		metadata_1.contentVocabulary,
  		next_1.default,
  		unevaluated_1.default
  	];
  }));
  var schema_exports = /* @__PURE__ */ __exportAll({
  	$comment: () => $comment,
  	$dynamicAnchor: () => $dynamicAnchor$7,
  	$id: () => $id$10,
  	$schema: () => $schema$10,
  	$vocabulary: () => $vocabulary$7,
  	allOf: () => allOf$1,
  	default: () => schema_default,
  	properties: () => properties$10,
  	title: () => title$10,
  	type: () => type$10
  });
  var $schema$10, $id$10, $vocabulary$7, $dynamicAnchor$7, title$10, allOf$1, type$10, $comment, properties$10, schema_default;
  var init_schema = __esmMin((() => {
  	$schema$10 = "https://json-schema.org/draft/2020-12/schema";
  	$id$10 = "https://json-schema.org/draft/2020-12/schema";
  	$vocabulary$7 = {
  		"https://json-schema.org/draft/2020-12/vocab/core": true,
  		"https://json-schema.org/draft/2020-12/vocab/applicator": true,
  		"https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
  		"https://json-schema.org/draft/2020-12/vocab/validation": true,
  		"https://json-schema.org/draft/2020-12/vocab/meta-data": true,
  		"https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
  		"https://json-schema.org/draft/2020-12/vocab/content": true
  	};
  	$dynamicAnchor$7 = "meta";
  	title$10 = "Core and Validation specifications meta-schema";
  	allOf$1 = [
  		{ "$ref": "meta/core" },
  		{ "$ref": "meta/applicator" },
  		{ "$ref": "meta/unevaluated" },
  		{ "$ref": "meta/validation" },
  		{ "$ref": "meta/meta-data" },
  		{ "$ref": "meta/format-annotation" },
  		{ "$ref": "meta/content" }
  	];
  	type$10 = ["object", "boolean"];
  	$comment = "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.";
  	properties$10 = {
  		"definitions": {
  			"$comment": "\"definitions\" has been replaced by \"$defs\".",
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"deprecated": true,
  			"default": {}
  		},
  		"dependencies": {
  			"$comment": "\"dependencies\" has been split and replaced by \"dependentSchemas\" and \"dependentRequired\" in order to serve their differing semantics.",
  			"type": "object",
  			"additionalProperties": { "anyOf": [{ "$dynamicRef": "#meta" }, { "$ref": "meta/validation#/$defs/stringArray" }] },
  			"deprecated": true,
  			"default": {}
  		},
  		"$recursiveAnchor": {
  			"$comment": "\"$recursiveAnchor\" has been replaced by \"$dynamicAnchor\".",
  			"$ref": "meta/core#/$defs/anchorString",
  			"deprecated": true
  		},
  		"$recursiveRef": {
  			"$comment": "\"$recursiveRef\" has been replaced by \"$dynamicRef\".",
  			"$ref": "meta/core#/$defs/uriReferenceString",
  			"deprecated": true
  		}
  	};
  	schema_default = {
  		$schema: $schema$10,
  		$id: $id$10,
  		$vocabulary: $vocabulary$7,
  		$dynamicAnchor: $dynamicAnchor$7,
  		title: title$10,
  		allOf: allOf$1,
  		type: type$10,
  		$comment,
  		properties: properties$10
  	};
  }));
  var applicator_exports = /* @__PURE__ */ __exportAll({
  	$defs: () => $defs$3,
  	$dynamicAnchor: () => $dynamicAnchor$6,
  	$id: () => $id$9,
  	$schema: () => $schema$9,
  	$vocabulary: () => $vocabulary$6,
  	default: () => applicator_default,
  	properties: () => properties$9,
  	title: () => title$9,
  	type: () => type$9
  });
  var $schema$9, $id$9, $vocabulary$6, $dynamicAnchor$6, title$9, type$9, properties$9, $defs$3, applicator_default;
  var init_applicator = __esmMin((() => {
  	$schema$9 = "https://json-schema.org/draft/2020-12/schema";
  	$id$9 = "https://json-schema.org/draft/2020-12/meta/applicator";
  	$vocabulary$6 = { "https://json-schema.org/draft/2020-12/vocab/applicator": true };
  	$dynamicAnchor$6 = "meta";
  	title$9 = "Applicator vocabulary meta-schema";
  	type$9 = ["object", "boolean"];
  	properties$9 = {
  		"prefixItems": { "$ref": "#/$defs/schemaArray" },
  		"items": { "$dynamicRef": "#meta" },
  		"contains": { "$dynamicRef": "#meta" },
  		"additionalProperties": { "$dynamicRef": "#meta" },
  		"properties": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"default": {}
  		},
  		"patternProperties": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"propertyNames": { "format": "regex" },
  			"default": {}
  		},
  		"dependentSchemas": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" },
  			"default": {}
  		},
  		"propertyNames": { "$dynamicRef": "#meta" },
  		"if": { "$dynamicRef": "#meta" },
  		"then": { "$dynamicRef": "#meta" },
  		"else": { "$dynamicRef": "#meta" },
  		"allOf": { "$ref": "#/$defs/schemaArray" },
  		"anyOf": { "$ref": "#/$defs/schemaArray" },
  		"oneOf": { "$ref": "#/$defs/schemaArray" },
  		"not": { "$dynamicRef": "#meta" }
  	};
  	$defs$3 = { "schemaArray": {
  		"type": "array",
  		"minItems": 1,
  		"items": { "$dynamicRef": "#meta" }
  	} };
  	applicator_default = {
  		$schema: $schema$9,
  		$id: $id$9,
  		$vocabulary: $vocabulary$6,
  		$dynamicAnchor: $dynamicAnchor$6,
  		title: title$9,
  		type: type$9,
  		properties: properties$9,
  		$defs: $defs$3
  	};
  }));
  var unevaluated_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$5,
  	$id: () => $id$8,
  	$schema: () => $schema$8,
  	$vocabulary: () => $vocabulary$5,
  	default: () => unevaluated_default,
  	properties: () => properties$8,
  	title: () => title$8,
  	type: () => type$8
  });
  var $schema$8, $id$8, $vocabulary$5, $dynamicAnchor$5, title$8, type$8, properties$8, unevaluated_default;
  var init_unevaluated = __esmMin((() => {
  	$schema$8 = "https://json-schema.org/draft/2020-12/schema";
  	$id$8 = "https://json-schema.org/draft/2020-12/meta/unevaluated";
  	$vocabulary$5 = { "https://json-schema.org/draft/2020-12/vocab/unevaluated": true };
  	$dynamicAnchor$5 = "meta";
  	title$8 = "Unevaluated applicator vocabulary meta-schema";
  	type$8 = ["object", "boolean"];
  	properties$8 = {
  		"unevaluatedItems": { "$dynamicRef": "#meta" },
  		"unevaluatedProperties": { "$dynamicRef": "#meta" }
  	};
  	unevaluated_default = {
  		$schema: $schema$8,
  		$id: $id$8,
  		$vocabulary: $vocabulary$5,
  		$dynamicAnchor: $dynamicAnchor$5,
  		title: title$8,
  		type: type$8,
  		properties: properties$8
  	};
  }));
  var content_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$4,
  	$id: () => $id$7,
  	$schema: () => $schema$7,
  	$vocabulary: () => $vocabulary$4,
  	default: () => content_default,
  	properties: () => properties$7,
  	title: () => title$7,
  	type: () => type$7
  });
  var $schema$7, $id$7, $vocabulary$4, $dynamicAnchor$4, title$7, type$7, properties$7, content_default;
  var init_content = __esmMin((() => {
  	$schema$7 = "https://json-schema.org/draft/2020-12/schema";
  	$id$7 = "https://json-schema.org/draft/2020-12/meta/content";
  	$vocabulary$4 = { "https://json-schema.org/draft/2020-12/vocab/content": true };
  	$dynamicAnchor$4 = "meta";
  	title$7 = "Content vocabulary meta-schema";
  	type$7 = ["object", "boolean"];
  	properties$7 = {
  		"contentEncoding": { "type": "string" },
  		"contentMediaType": { "type": "string" },
  		"contentSchema": { "$dynamicRef": "#meta" }
  	};
  	content_default = {
  		$schema: $schema$7,
  		$id: $id$7,
  		$vocabulary: $vocabulary$4,
  		$dynamicAnchor: $dynamicAnchor$4,
  		title: title$7,
  		type: type$7,
  		properties: properties$7
  	};
  }));
  var core_exports = /* @__PURE__ */ __exportAll({
  	$defs: () => $defs$2,
  	$dynamicAnchor: () => $dynamicAnchor$3,
  	$id: () => $id$6,
  	$schema: () => $schema$6,
  	$vocabulary: () => $vocabulary$3,
  	default: () => core_default,
  	properties: () => properties$6,
  	title: () => title$6,
  	type: () => type$6
  });
  var $schema$6, $id$6, $vocabulary$3, $dynamicAnchor$3, title$6, type$6, properties$6, $defs$2, core_default;
  var init_core = __esmMin((() => {
  	$schema$6 = "https://json-schema.org/draft/2020-12/schema";
  	$id$6 = "https://json-schema.org/draft/2020-12/meta/core";
  	$vocabulary$3 = { "https://json-schema.org/draft/2020-12/vocab/core": true };
  	$dynamicAnchor$3 = "meta";
  	title$6 = "Core vocabulary meta-schema";
  	type$6 = ["object", "boolean"];
  	properties$6 = {
  		"$id": {
  			"$ref": "#/$defs/uriReferenceString",
  			"$comment": "Non-empty fragments not allowed.",
  			"pattern": "^[^#]*#?$"
  		},
  		"$schema": { "$ref": "#/$defs/uriString" },
  		"$ref": { "$ref": "#/$defs/uriReferenceString" },
  		"$anchor": { "$ref": "#/$defs/anchorString" },
  		"$dynamicRef": { "$ref": "#/$defs/uriReferenceString" },
  		"$dynamicAnchor": { "$ref": "#/$defs/anchorString" },
  		"$vocabulary": {
  			"type": "object",
  			"propertyNames": { "$ref": "#/$defs/uriString" },
  			"additionalProperties": { "type": "boolean" }
  		},
  		"$comment": { "type": "string" },
  		"$defs": {
  			"type": "object",
  			"additionalProperties": { "$dynamicRef": "#meta" }
  		}
  	};
  	$defs$2 = {
  		"anchorString": {
  			"type": "string",
  			"pattern": "^[A-Za-z_][-A-Za-z0-9._]*$"
  		},
  		"uriString": {
  			"type": "string",
  			"format": "uri"
  		},
  		"uriReferenceString": {
  			"type": "string",
  			"format": "uri-reference"
  		}
  	};
  	core_default = {
  		$schema: $schema$6,
  		$id: $id$6,
  		$vocabulary: $vocabulary$3,
  		$dynamicAnchor: $dynamicAnchor$3,
  		title: title$6,
  		type: type$6,
  		properties: properties$6,
  		$defs: $defs$2
  	};
  }));
  var format_annotation_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$2,
  	$id: () => $id$5,
  	$schema: () => $schema$5,
  	$vocabulary: () => $vocabulary$2,
  	default: () => format_annotation_default,
  	properties: () => properties$5,
  	title: () => title$5,
  	type: () => type$5
  });
  var $schema$5, $id$5, $vocabulary$2, $dynamicAnchor$2, title$5, type$5, properties$5, format_annotation_default;
  var init_format_annotation = __esmMin((() => {
  	$schema$5 = "https://json-schema.org/draft/2020-12/schema";
  	$id$5 = "https://json-schema.org/draft/2020-12/meta/format-annotation";
  	$vocabulary$2 = { "https://json-schema.org/draft/2020-12/vocab/format-annotation": true };
  	$dynamicAnchor$2 = "meta";
  	title$5 = "Format vocabulary meta-schema for annotation results";
  	type$5 = ["object", "boolean"];
  	properties$5 = { "format": { "type": "string" } };
  	format_annotation_default = {
  		$schema: $schema$5,
  		$id: $id$5,
  		$vocabulary: $vocabulary$2,
  		$dynamicAnchor: $dynamicAnchor$2,
  		title: title$5,
  		type: type$5,
  		properties: properties$5
  	};
  }));
  var meta_data_exports = /* @__PURE__ */ __exportAll({
  	$dynamicAnchor: () => $dynamicAnchor$1,
  	$id: () => $id$4,
  	$schema: () => $schema$4,
  	$vocabulary: () => $vocabulary$1,
  	default: () => meta_data_default,
  	properties: () => properties$4,
  	title: () => title$4,
  	type: () => type$4
  });
  var $schema$4, $id$4, $vocabulary$1, $dynamicAnchor$1, title$4, type$4, properties$4, meta_data_default;
  var init_meta_data = __esmMin((() => {
  	$schema$4 = "https://json-schema.org/draft/2020-12/schema";
  	$id$4 = "https://json-schema.org/draft/2020-12/meta/meta-data";
  	$vocabulary$1 = { "https://json-schema.org/draft/2020-12/vocab/meta-data": true };
  	$dynamicAnchor$1 = "meta";
  	title$4 = "Meta-data vocabulary meta-schema";
  	type$4 = ["object", "boolean"];
  	properties$4 = {
  		"title": { "type": "string" },
  		"description": { "type": "string" },
  		"default": true,
  		"deprecated": {
  			"type": "boolean",
  			"default": false
  		},
  		"readOnly": {
  			"type": "boolean",
  			"default": false
  		},
  		"writeOnly": {
  			"type": "boolean",
  			"default": false
  		},
  		"examples": {
  			"type": "array",
  			"items": true
  		}
  	};
  	meta_data_default = {
  		$schema: $schema$4,
  		$id: $id$4,
  		$vocabulary: $vocabulary$1,
  		$dynamicAnchor: $dynamicAnchor$1,
  		title: title$4,
  		type: type$4,
  		properties: properties$4
  	};
  }));
  var validation_exports = /* @__PURE__ */ __exportAll({
  	$defs: () => $defs$1,
  	$dynamicAnchor: () => $dynamicAnchor,
  	$id: () => $id$3,
  	$schema: () => $schema$3,
  	$vocabulary: () => $vocabulary,
  	default: () => validation_default,
  	properties: () => properties$3,
  	title: () => title$3,
  	type: () => type$3
  });
  var $schema$3, $id$3, $vocabulary, $dynamicAnchor, title$3, type$3, properties$3, $defs$1, validation_default;
  var init_validation = __esmMin((() => {
  	$schema$3 = "https://json-schema.org/draft/2020-12/schema";
  	$id$3 = "https://json-schema.org/draft/2020-12/meta/validation";
  	$vocabulary = { "https://json-schema.org/draft/2020-12/vocab/validation": true };
  	$dynamicAnchor = "meta";
  	title$3 = "Validation vocabulary meta-schema";
  	type$3 = ["object", "boolean"];
  	properties$3 = {
  		"type": { "anyOf": [{ "$ref": "#/$defs/simpleTypes" }, {
  			"type": "array",
  			"items": { "$ref": "#/$defs/simpleTypes" },
  			"minItems": 1,
  			"uniqueItems": true
  		}] },
  		"const": true,
  		"enum": {
  			"type": "array",
  			"items": true
  		},
  		"multipleOf": {
  			"type": "number",
  			"exclusiveMinimum": 0
  		},
  		"maximum": { "type": "number" },
  		"exclusiveMaximum": { "type": "number" },
  		"minimum": { "type": "number" },
  		"exclusiveMinimum": { "type": "number" },
  		"maxLength": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minLength": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
  		"pattern": {
  			"type": "string",
  			"format": "regex"
  		},
  		"maxItems": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minItems": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
  		"uniqueItems": {
  			"type": "boolean",
  			"default": false
  		},
  		"maxContains": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minContains": {
  			"$ref": "#/$defs/nonNegativeInteger",
  			"default": 1
  		},
  		"maxProperties": { "$ref": "#/$defs/nonNegativeInteger" },
  		"minProperties": { "$ref": "#/$defs/nonNegativeIntegerDefault0" },
  		"required": { "$ref": "#/$defs/stringArray" },
  		"dependentRequired": {
  			"type": "object",
  			"additionalProperties": { "$ref": "#/$defs/stringArray" }
  		}
  	};
  	$defs$1 = {
  		"nonNegativeInteger": {
  			"type": "integer",
  			"minimum": 0
  		},
  		"nonNegativeIntegerDefault0": {
  			"$ref": "#/$defs/nonNegativeInteger",
  			"default": 0
  		},
  		"simpleTypes": { "enum": [
  			"array",
  			"boolean",
  			"integer",
  			"null",
  			"number",
  			"object",
  			"string"
  		] },
  		"stringArray": {
  			"type": "array",
  			"items": { "type": "string" },
  			"uniqueItems": true,
  			"default": []
  		}
  	};
  	validation_default = {
  		$schema: $schema$3,
  		$id: $id$3,
  		$vocabulary,
  		$dynamicAnchor,
  		title: title$3,
  		type: type$3,
  		properties: properties$3,
  		$defs: $defs$1
  	};
  }));
  var require_json_schema_2020_12 = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var metaSchema = (init_schema(), __toCommonJS(schema_exports).default);
  	var applicator = (init_applicator(), __toCommonJS(applicator_exports).default);
  	var unevaluated = (init_unevaluated(), __toCommonJS(unevaluated_exports).default);
  	var content = (init_content(), __toCommonJS(content_exports).default);
  	var core = (init_core(), __toCommonJS(core_exports).default);
  	var format = (init_format_annotation(), __toCommonJS(format_annotation_exports).default);
  	var metadata = (init_meta_data(), __toCommonJS(meta_data_exports).default);
  	var validation = (init_validation(), __toCommonJS(validation_exports).default);
  	var META_SUPPORT_DATA = ["/properties"];
  	function addMetaSchema2020($data) {
  		[
  			metaSchema,
  			applicator,
  			unevaluated,
  			content,
  			core,
  			with$data(this, format),
  			metadata,
  			with$data(this, validation)
  		].forEach((sch) => this.addMetaSchema(sch, void 0, false));
  		return this;
  		function with$data(ajv, sch) {
  			return $data ? ajv.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch;
  		}
  	}
  	exports.default = addMetaSchema2020;
  }));
  var require__2020 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv2020 = void 0;
  	var core_1 = require_core$1();
  	var draft2020_1 = require_draft2020();
  	var discriminator_1 = require_discriminator();
  	var json_schema_2020_12_1 = require_json_schema_2020_12();
  	var META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema";
  	var Ajv2020 = class extends core_1.default {
  		constructor(opts = {}) {
  			super({
  				...opts,
  				dynamicRef: true,
  				next: true,
  				unevaluated: true
  			});
  		}
  		_addVocabularies() {
  			super._addVocabularies();
  			draft2020_1.default.forEach((v) => this.addVocabulary(v));
  			if (this.opts.discriminator) this.addKeyword(discriminator_1.default);
  		}
  		_addDefaultMetaSchema() {
  			super._addDefaultMetaSchema();
  			const { $data, meta } = this.opts;
  			if (!meta) return;
  			json_schema_2020_12_1.default.call(this, $data);
  			this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
  		}
  		defaultMeta() {
  			return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
  		}
  	};
  	exports.Ajv2020 = Ajv2020;
  	module.exports = exports = Ajv2020;
  	module.exports.Ajv2020 = Ajv2020;
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = Ajv2020;
  	var validate_1 = require_validate();
  	Object.defineProperty(exports, "KeywordCxt", {
  		enumerable: true,
  		get: function() {
  			return validate_1.KeywordCxt;
  		}
  	});
  	var codegen_1 = require_codegen();
  	Object.defineProperty(exports, "_", {
  		enumerable: true,
  		get: function() {
  			return codegen_1._;
  		}
  	});
  	Object.defineProperty(exports, "str", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.str;
  		}
  	});
  	Object.defineProperty(exports, "stringify", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.stringify;
  		}
  	});
  	Object.defineProperty(exports, "nil", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.nil;
  		}
  	});
  	Object.defineProperty(exports, "Name", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.Name;
  		}
  	});
  	Object.defineProperty(exports, "CodeGen", {
  		enumerable: true,
  		get: function() {
  			return codegen_1.CodeGen;
  		}
  	});
  	var validation_error_1 = require_validation_error();
  	Object.defineProperty(exports, "ValidationError", {
  		enumerable: true,
  		get: function() {
  			return validation_error_1.default;
  		}
  	});
  	var ref_error_1 = require_ref_error();
  	Object.defineProperty(exports, "MissingRefError", {
  		enumerable: true,
  		get: function() {
  			return ref_error_1.default;
  		}
  	});
  }));
  var require_formats = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
  	function fmtDef(validate, compare) {
  		return {
  			validate,
  			compare
  		};
  	}
  	exports.fullFormats = {
  		date: fmtDef(date, compareDate),
  		time: fmtDef(time, compareTime),
  		"date-time": fmtDef(date_time, compareDateTime),
  		duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
  		uri,
  		"uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
  		"uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
  		url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
  		email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
  		hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
  		ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  		ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
  		regex,
  		uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
  		"json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
  		"json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
  		"relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
  		byte,
  		int32: {
  			type: "number",
  			validate: validateInt32
  		},
  		int64: {
  			type: "number",
  			validate: validateInt64
  		},
  		float: {
  			type: "number",
  			validate: validateNumber
  		},
  		double: {
  			type: "number",
  			validate: validateNumber
  		},
  		password: true,
  		binary: true
  	};
  	exports.fastFormats = {
  		...exports.fullFormats,
  		date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
  		time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareTime),
  		"date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
  		uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
  		"uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
  		email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  	};
  	exports.formatNames = Object.keys(exports.fullFormats);
  	function isLeapYear(year) {
  		return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  	}
  	var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
  	var DAYS = [
  		0,
  		31,
  		28,
  		31,
  		30,
  		31,
  		30,
  		31,
  		31,
  		30,
  		31,
  		30,
  		31
  	];
  	function date(str) {
  		const matches = DATE.exec(str);
  		if (!matches) return false;
  		const year = +matches[1];
  		const month = +matches[2];
  		const day = +matches[3];
  		return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
  	}
  	function compareDate(d1, d2) {
  		if (!(d1 && d2)) return void 0;
  		if (d1 > d2) return 1;
  		if (d1 < d2) return -1;
  		return 0;
  	}
  	var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
  	function time(str, withTimeZone) {
  		const matches = TIME.exec(str);
  		if (!matches) return false;
  		const hour = +matches[1];
  		const minute = +matches[2];
  		const second = +matches[3];
  		const timeZone = matches[5];
  		return (hour <= 23 && minute <= 59 && second <= 59 || hour === 23 && minute === 59 && second === 60) && (!withTimeZone || timeZone !== "");
  	}
  	function compareTime(t1, t2) {
  		if (!(t1 && t2)) return void 0;
  		const a1 = TIME.exec(t1);
  		const a2 = TIME.exec(t2);
  		if (!(a1 && a2)) return void 0;
  		t1 = a1[1] + a1[2] + a1[3] + (a1[4] || "");
  		t2 = a2[1] + a2[2] + a2[3] + (a2[4] || "");
  		if (t1 > t2) return 1;
  		if (t1 < t2) return -1;
  		return 0;
  	}
  	var DATE_TIME_SEPARATOR = /t|\s/i;
  	function date_time(str) {
  		const dateTime = str.split(DATE_TIME_SEPARATOR);
  		return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1], true);
  	}
  	function compareDateTime(dt1, dt2) {
  		if (!(dt1 && dt2)) return void 0;
  		const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
  		const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
  		const res = compareDate(d1, d2);
  		if (res === void 0) return void 0;
  		return res || compareTime(t1, t2);
  	}
  	var NOT_URI_FRAGMENT = /\/|:/;
  	var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  	function uri(str) {
  		return NOT_URI_FRAGMENT.test(str) && URI.test(str);
  	}
  	var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  	function byte(str) {
  		BYTE.lastIndex = 0;
  		return BYTE.test(str);
  	}
  	var MIN_INT32 = -(2 ** 31);
  	var MAX_INT32 = 2 ** 31 - 1;
  	function validateInt32(value) {
  		return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
  	}
  	function validateInt64(value) {
  		return Number.isInteger(value);
  	}
  	function validateNumber() {
  		return true;
  	}
  	var Z_ANCHOR = /[^\\]\\Z/;
  	function regex(str) {
  		if (Z_ANCHOR.test(str)) return false;
  		try {
  			new RegExp(str);
  			return true;
  		} catch (e) {
  			return false;
  		}
  	}
  }));
  var require_limit = /* @__PURE__ */ __commonJSMin(((exports) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.formatLimitDefinition = void 0;
  	var ajv_1 = require_ajv();
  	var codegen_1 = require_codegen();
  	var ops = codegen_1.operators;
  	var KWDs = {
  		formatMaximum: {
  			okStr: "<=",
  			ok: ops.LTE,
  			fail: ops.GT
  		},
  		formatMinimum: {
  			okStr: ">=",
  			ok: ops.GTE,
  			fail: ops.LT
  		},
  		formatExclusiveMaximum: {
  			okStr: "<",
  			ok: ops.LT,
  			fail: ops.GTE
  		},
  		formatExclusiveMinimum: {
  			okStr: ">",
  			ok: ops.GT,
  			fail: ops.LTE
  		}
  	};
  	exports.formatLimitDefinition = {
  		keyword: Object.keys(KWDs),
  		type: "string",
  		schemaType: "string",
  		$data: true,
  		error: {
  			message: ({ keyword, schemaCode }) => codegen_1.str`should be ${KWDs[keyword].okStr} ${schemaCode}`,
  			params: ({ keyword, schemaCode }) => codegen_1._`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  		},
  		code(cxt) {
  			const { gen, data, schemaCode, keyword, it } = cxt;
  			const { opts, self } = it;
  			if (!opts.validateFormats) return;
  			const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
  			if (fCxt.$data) validate$DataFormat();
  			else validateFormat();
  			function validate$DataFormat() {
  				const fmts = gen.scopeValue("formats", {
  					ref: self.formats,
  					code: opts.code.formats
  				});
  				const fmt = gen.const("fmt", codegen_1._`${fmts}[${fCxt.schemaCode}]`);
  				cxt.fail$data(codegen_1.or(codegen_1._`typeof ${fmt} != "object"`, codegen_1._`${fmt} instanceof RegExp`, codegen_1._`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
  			}
  			function validateFormat() {
  				const format = fCxt.schema;
  				const fmtDef = self.formats[format];
  				if (!fmtDef || fmtDef === true) return;
  				if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
  				const fmt = gen.scopeValue("formats", {
  					key: format,
  					ref: fmtDef,
  					code: opts.code.formats ? codegen_1._`${opts.code.formats}${codegen_1.getProperty(format)}` : void 0
  				});
  				cxt.fail$data(compareCode(fmt));
  			}
  			function compareCode(fmt) {
  				return codegen_1._`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
  			}
  		},
  		dependencies: ["format"]
  	};
  	var formatLimitPlugin = (ajv) => {
  		ajv.addKeyword(exports.formatLimitDefinition);
  		return ajv;
  	};
  	exports.default = formatLimitPlugin;
  }));
  var require_dist = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  	Object.defineProperty(exports, "__esModule", { value: true });
  	var formats_1 = require_formats();
  	var limit_1 = require_limit();
  	var codegen_1 = require_codegen();
  	var fullName = new codegen_1.Name("fullFormats");
  	var fastName = new codegen_1.Name("fastFormats");
  	var formatsPlugin = (ajv, opts = { keywords: true }) => {
  		if (Array.isArray(opts)) {
  			addFormats(ajv, opts, formats_1.fullFormats, fullName);
  			return ajv;
  		}
  		const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
  		addFormats(ajv, opts.formats || formats_1.formatNames, formats, exportName);
  		if (opts.keywords) limit_1.default(ajv);
  		return ajv;
  	};
  	formatsPlugin.get = (name, mode = "full") => {
  		const f = (mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats)[name];
  		if (!f) throw new Error(`Unknown format "${name}"`);
  		return f;
  	};
  	function addFormats(ajv, list, fs, exportName) {
  		var _a;
  		var _b;
  		(_a = (_b = ajv.opts.code).formats) !== null && _a !== void 0 || (_b.formats = codegen_1._`require("ajv-formats/dist/formats").${exportName}`);
  		for (const f of list) ajv.addFormat(f, fs[f]);
  	}
  	module.exports = exports = formatsPlugin;
  	Object.defineProperty(exports, "__esModule", { value: true });
  	exports.default = formatsPlugin;
  }));
  var JsonSnapshotError = class extends Error {
  	constructor(kind, dataPath) {
  		super("JSON snapshot failed.");
  		this.kind = kind;
  		this.dataPath = dataPath;
  	}
  };
  function appendPointer(path, key) {
  	return `${path}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
  }
  /** Copy JSON values without invoking accessors, toJSON, or input iterators. */
  function snapshotJson(value) {
  	const active = /* @__PURE__ */ new WeakSet();
  	let remaining = 1e5;
  	const visit = (input, path, depth) => {
  		if (--remaining < 0 || depth > 128) throw new JsonSnapshotError("limit", path);
  		if (input === null || typeof input === "string" || typeof input === "boolean") return input;
  		if (typeof input === "number" && Number.isFinite(input)) return input;
  		if (typeof input !== "object" || input === null || active.has(input)) throw new JsonSnapshotError("invalid", path);
  		const array = Array.isArray(input);
  		const prototype = Object.getPrototypeOf(input);
  		if (!array && prototype !== null && prototype !== Object.prototype) throw new JsonSnapshotError("invalid", path);
  		if (Object.getOwnPropertySymbols(input).length) throw new JsonSnapshotError("invalid", path);
  		active.add(input);
  		try {
  			if (array) {
  				const length = input.length;
  				if (!Number.isSafeInteger(length) || length > remaining) throw new JsonSnapshotError("limit", path);
  				const result = [];
  				for (let i = 0; i < length; i++) {
  					const child = appendPointer(path, String(i));
  					const descriptor = Object.getOwnPropertyDescriptor(input, i);
  					if (!descriptor || !("value" in descriptor)) throw new JsonSnapshotError("invalid", child);
  					result.push(visit(descriptor.value, child, depth + 1));
  				}
  				for (const key of Object.keys(input)) if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length) throw new JsonSnapshotError("invalid", appendPointer(path, key));
  				return result;
  			}
  			const result = {};
  			for (const key of Object.keys(input)) {
  				const child = appendPointer(path, key);
  				const descriptor = Object.getOwnPropertyDescriptor(input, key);
  				if (!descriptor || !("value" in descriptor)) throw new JsonSnapshotError("invalid", child);
  				Object.defineProperty(result, key, {
  					value: visit(descriptor.value, child, depth + 1),
  					enumerable: true,
  					writable: true,
  					configurable: true
  				});
  			}
  			return result;
  		} finally {
  			active.delete(input);
  		}
  	};
  	return visit(value, "", 0);
  }
  function isJsonRecord(value) {
  	return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  var import_ajv = require_ajv();
  var import__2020 = require__2020();
  var import_dist = /* @__PURE__ */ __toESM(require_dist(), 1);
  var import_fast_uri = /* @__PURE__ */ __toESM(require_fast_uri(), 1);
  var DIALECT_07 = "http://json-schema.org/draft-07/schema#";
  var DIALECT_2020 = "https://json-schema.org/draft/2020-12/schema";
  var { parse, resolve, normalize } = import_fast_uri.default;
  var maps = [
  	"$defs",
  	"definitions",
  	"properties",
  	"patternProperties",
  	"dependentSchemas",
  	"dependencies"
  ];
  var singles = [
  	"additionalProperties",
  	"additionalItems",
  	"contains",
  	"propertyNames",
  	"not",
  	"if",
  	"then",
  	"else",
  	"unevaluatedProperties",
  	"unevaluatedItems",
  	"contentSchema"
  ];
  var arrays = [
  	"allOf",
  	"anyOf",
  	"oneOf",
  	"prefixItems"
  ];
  var BundleError = class extends Error {
  	constructor(code) {
  		super("Invalid schema bundle.");
  		this.code = code;
  	}
  };
  function fail(code) {
  	throw new BundleError(code);
  }
  var ownString = (value, name) => {
  	const descriptor = Object.getOwnPropertyDescriptor(value, name);
  	return descriptor && "value" in descriptor && typeof descriptor.value === "string" ? descriptor.value : void 0;
  };
  var freezeIdentity = (identity) => Object.freeze({ ...identity });
  function scopeFor(value) {
  	const fallback = freezeIdentity({
  		ownerId: "unknown",
  		contractId: "unknown",
  		revision: "unknown",
  		variantId: "default"
  	});
  	try {
  		if (!isJsonRecord(value)) return Object.freeze({ identity: fallback });
  		const descriptor = Object.getOwnPropertyDescriptor(value, "identity");
  		const id = descriptor && "value" in descriptor ? descriptor.value : null;
  		if (!isJsonRecord(id)) return Object.freeze({ identity: fallback });
  		const ownerId = ownString(id, "ownerId"), contractId = ownString(id, "contractId");
  		const revision = ownString(id, "revision"), variantId = ownString(id, "variantId");
  		if (ownerId === void 0 || contractId === void 0 || revision === void 0 || variantId === void 0) return Object.freeze({ identity: fallback });
  		return Object.freeze({ identity: freezeIdentity({
  			ownerId,
  			contractId,
  			revision,
  			variantId
  		}) });
  	} catch (_a) {
  		return Object.freeze({ identity: fallback });
  	}
  }
  function dialectFor(uri) {
  	if (typeof uri !== "string") return void 0;
  	const canonical = uri.replace(/#$/, "").replace(/^https:/, "http:");
  	if (canonical === "http://json-schema.org/draft-07/schema") return "draft-07";
  	if (canonical === "http://json-schema.org/draft/2020-12/schema") return "2020-12";
  }
  var normalizeUri = (uri) => normalize(uri).replace(/#$/, "");
  function absoluteUri(uri, fragments) {
  	if (typeof uri !== "string" || !uri) return fail("resource-invalid");
  	const parsed = parse(uri);
  	if (parsed.error || !parsed.scheme || !fragments && parsed.fragment !== void 0) return fail("resource-invalid");
  	return normalizeUri(uri);
  }
  function referenceKey(value) {
  	var _a;
  	if (!isJsonRecord(value) || typeof value.repository !== "string" || typeof value.path !== "string") return fail("artifact-role-invalid");
  	for (const key of [
  		"symbol",
  		"version",
  		"sha256"
  	]) if (key in value && typeof value[key] !== "string") return fail("artifact-role-invalid");
  	return JSON.stringify([
  		value.repository,
  		value.path,
  		(_a = value.symbol) !== null && _a !== void 0 ? _a : null
  	]);
  }
  /** Check declared provenance only; paths and retrieval URIs are never fetched. */
  function validateArtifacts(bundle) {
  	const provenance = bundle.provenance;
  	if (!isJsonRecord(provenance)) fail("artifact-role-invalid");
  	const roles = /* @__PURE__ */ new Map();
  	for (const role of [
  		"canonicalSources",
  		"generatedFiles",
  		"referenceSchemas",
  		"generationSources"
  	]) {
  		const refs = provenance[role];
  		if (!Array.isArray(refs) || role === "canonicalSources" && refs.length === 0) fail("artifact-role-invalid");
  		for (const ref of refs) {
  			const key = referenceKey(ref);
  			if (roles.has(key)) fail("artifact-role-invalid");
  			roles.set(key, role);
  		}
  	}
  	for (const resource of [bundle.root, ...bundle.resources]) {
  		if (!isJsonRecord(resource) || !isJsonRecord(resource.artifact)) fail("artifact-role-invalid");
  		const artifact = resource.artifact;
  		const key = referenceKey(artifact.source);
  		if (artifact.role === "canonical-schema") {
  			if (roles.get(key) !== "canonicalSources") fail("artifact-role-invalid");
  		} else if (artifact.role === "generated-schema") {
  			if (roles.get(key) !== "generatedFiles" || !Array.isArray(artifact.generatedFrom) || !artifact.generatedFrom.length) fail("artifact-role-invalid");
  			for (const ref of artifact.generatedFrom) if (roles.get(referenceKey(ref)) !== "canonicalSources") fail("artifact-role-invalid");
  		} else fail("artifact-role-invalid");
  	}
  }
  function prepare(bundle, ajv) {
  	const registry = /* @__PURE__ */ new Map();
  	const nodes = [];
  	const register = (id, location) => {
  		const key = normalizeUri(id), previous = registry.get(key);
  		if (previous !== void 0 && previous !== location) fail("resource-id-conflict");
  		registry.set(key, location);
  	};
  	const resources = [];
  	const walk = (node, base, location) => {
  		if (typeof node === "boolean") return;
  		if (!isJsonRecord(node)) return;
  		if ("$schema" in node) {
  			const dialect = dialectFor(node.$schema);
  			if (!dialect) fail("dialect-unsupported");
  			if (dialect !== bundle.dialect) fail("dialect-conflict");
  			node.$schema = dialect === "draft-07" ? DIALECT_07 : DIALECT_2020;
  		}
  		if ("$id" in node) {
  			if (typeof node.$id !== "string") fail("schema-invalid");
  			base = absoluteUri(resolve(base, node.$id), true);
  			register(base, location);
  			node.$id = base;
  		}
  		for (const key of ["$anchor", "$dynamicAnchor"]) if (typeof node[key] === "string") register(`${base.replace(/#.*$/, "")}#${node[key]}`, location);
  		nodes.push({
  			node,
  			base
  		});
  		if (node.$async === true) fail("schema-invalid");
  		if (typeof node.format === "string" && !ajv.formats[node.format]) fail("schema-invalid");
  		for (const key of maps) if (isJsonRecord(node[key])) {
  			for (const [name, child] of Object.entries(node[key])) if (typeof child === "boolean" || isJsonRecord(child)) walk(child, base, appendPointer(appendPointer(location, key), name));
  		}
  		for (const key of singles) if (typeof node[key] === "boolean" || isJsonRecord(node[key])) walk(node[key], base, `${location}/${key}`);
  		for (const key of [...arrays, "items"]) {
  			const children = node[key];
  			if (Array.isArray(children)) children.forEach((child, index) => walk(child, base, `${location}/${key}/${index}`));
  			else if (key === "items" && (typeof children === "boolean" || isJsonRecord(children))) walk(children, base, `${location}/${key}`);
  		}
  	};
  	const supplied = [bundle.root, ...bundle.resources];
  	for (let index = 0; index < supplied.length; index++) {
  		const resource = supplied[index];
  		if (!isJsonRecord(resource) || typeof resource.document !== "boolean" && !isJsonRecord(resource.document)) fail("resource-invalid");
  		const uri = absoluteUri(resource.retrievalUri, false);
  		register(uri, `${index}`);
  		walk(resource.document, uri, `${index}`);
  		resources.push({
  			uri,
  			document: resource.document
  		});
  	}
  	for (const { node, base } of nodes) if (typeof node.$ref === "string") {
  		const absolute = normalizeUri(resolve(base, node.$ref));
  		let location = registry.get(absolute);
  		if (location === void 0) {
  			const hash = absolute.indexOf("#");
  			const resource = registry.get(hash < 0 ? absolute : absolute.slice(0, hash));
  			const fragment = hash < 0 ? "" : decodeURIComponent(absolute.slice(hash + 1));
  			if (resource !== void 0 && (fragment === "" || fragment.startsWith("/"))) location = resource + fragment;
  		}
  		if (location !== void 0) {
  			const slash = location.indexOf("/");
  			node.$ref = resources[Number(slash < 0 ? location : location.slice(0, slash))].uri + "#" + encodeURIComponent(slash < 0 ? "" : location.slice(slash)).replace(/%2F/g, "/");
  		} else node.$ref = absolute.includes("#") ? absolute : absolute + "#";
  	}
  	return {
  		root: resources[0].uri,
  		resources,
  		registry,
  		nodes
  	};
  }
  function structuralDiagnostics(errors, scope, rootUri) {
  	return Object.freeze(errors.map((error) => {
  		let dataPath = error.instancePath;
  		if (error.keyword === "required" && typeof error.params.missingProperty === "string") dataPath = appendPointer(dataPath, error.params.missingProperty);
  		if (error.keyword === "additionalProperties" && typeof error.params.additionalProperty === "string") dataPath = appendPointer(dataPath, error.params.additionalProperty);
  		const hash = error.schemaPath.indexOf("#");
  		const resourceUri = hash > 0 ? error.schemaPath.slice(0, hash) : rootUri;
  		const schemaPath = decodeURIComponent(hash >= 0 ? error.schemaPath.slice(hash + 1) : error.schemaPath);
  		return Object.freeze({
  			scope,
  			phase: "structure",
  			code: "schema-data-invalid",
  			dataPath,
  			schemaPath,
  			resourceUri,
  			keyword: error.keyword
  		});
  	}));
  }
  function makeValidator(validate, scope, dialect, rootUri) {
  	return Object.freeze({
  		identity: scope.identity,
  		dialect,
  		validate(data, context) {
  			var _a;
  			let currentScope = scope;
  			try {
  				if (context !== void 0) {
  					if (!isJsonRecord(context)) throw new Error();
  					const consumerId = ownString(context, "consumerId");
  					if (consumerId === void 0) throw new Error();
  					currentScope = Object.freeze({
  						...scope,
  						consumerId
  					});
  				}
  				if (validate(snapshotJson(data))) return Object.freeze({
  					kind: "valid",
  					diagnostics: Object.freeze([])
  				});
  				const diagnostics = structuralDiagnostics((_a = validate.errors) !== null && _a !== void 0 ? _a : [], currentScope, rootUri);
  				if (!diagnostics.length) throw new Error();
  				return Object.freeze({
  					kind: "invalid",
  					diagnostics
  				});
  			} catch (error) {
  				if (error instanceof JsonSnapshotError && error.kind === "invalid") return Object.freeze({
  					kind: "invalid",
  					diagnostics: Object.freeze([Object.freeze({
  						scope: currentScope,
  						phase: "structure",
  						code: "input-not-json",
  						dataPath: error.dataPath
  					})])
  				});
  				return Object.freeze({
  					kind: "execution-error",
  					diagnostics: Object.freeze([Object.freeze({
  						scope: currentScope,
  						phase: "execution",
  						operation: "structure",
  						code: error instanceof JsonSnapshotError && error.kind === "limit" || error instanceof RangeError ? "limit-exceeded" : "engine-failed"
  					})])
  				});
  			}
  		}
  	});
  }
  /** Compile an isolated synchronous validator from an immutable private snapshot. */
  function compileSchemaBundle(input) {
  	const scope = scopeFor(input);
  	try {
  		if (!isJsonRecord(input)) fail("resource-invalid");
  		const declaredDialect = Object.getOwnPropertyDescriptor(input, "dialect");
  		if (!declaredDialect || "value" in declaredDialect && declaredDialect.value === void 0) fail("dialect-required");
  		if (!("value" in declaredDialect)) fail("resource-invalid");
  		if (declaredDialect.value !== "draft-07" && declaredDialect.value !== "2020-12") fail("dialect-unsupported");
  		const candidate = snapshotJson(input);
  		if (!isJsonRecord(candidate) || !isJsonRecord(candidate.identity)) fail("resource-invalid");
  		for (const key of [
  			"ownerId",
  			"contractId",
  			"revision",
  			"variantId"
  		]) if (typeof candidate.identity[key] !== "string") fail("resource-invalid");
  		if (!candidate.dialect) fail("dialect-required");
  		if (candidate.dialect !== "draft-07" && candidate.dialect !== "2020-12") fail("dialect-unsupported");
  		if (!Array.isArray(candidate.resources) || !isJsonRecord(candidate.root)) fail("resource-invalid");
  		const bundle = candidate;
  		validateArtifacts(bundle);
  		const options = {
  			allErrors: true,
  			coerceTypes: false,
  			useDefaults: false,
  			removeAdditional: false,
  			strict: false,
  			logger: false,
  			ownProperties: true
  		};
  		const ajv = bundle.dialect === "draft-07" ? new import_ajv.Ajv(options) : new import__2020.Ajv2020(options);
  		import_dist.default.default(ajv);
  		const prepared = prepare(bundle, ajv);
  		for (const resource of prepared.resources) {
  			if (!ajv.validateSchema(resource.document)) fail("schema-invalid");
  			ajv.addSchema(resource.document, resource.uri);
  		}
  		const validate = ajv.getSchema(prepared.root);
  		if (!validate || "$async" in validate && validate.$async) fail("schema-invalid");
  		return Object.freeze({
  			kind: "compiled",
  			validator: makeValidator(validate, scope, bundle.dialect, prepared.root),
  			diagnostics: Object.freeze([])
  		});
  	} catch (error) {
  		let code;
  		if (error instanceof BundleError) code = error.code;
  		else if (error instanceof import_ajv.MissingRefError) code = "ref-unresolved";
  		else if (error instanceof JsonSnapshotError && error.kind === "invalid") code = "resource-invalid";
  		else if (error instanceof SyntaxError) code = "schema-invalid";
  		if (code) return Object.freeze({
  			kind: "schema-error",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "compile",
  				code
  			})])
  		});
  		return Object.freeze({
  			kind: "execution-error",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "execution",
  				operation: "compile",
  				code: error instanceof JsonSnapshotError && error.kind === "limit" || error instanceof RangeError ? "limit-exceeded" : "engine-failed"
  			})])
  		});
  	}
  }
  function deepFreeze(value) {
  	if (value !== null && typeof value === "object") {
  		Object.values(value).forEach(deepFreeze);
  		Object.freeze(value);
  	}
  	return value;
  }
  function ownerFailure(scope, code) {
  	return Object.freeze({
  		kind: "execution-error",
  		diagnostics: Object.freeze([Object.freeze({
  			scope,
  			phase: "execution",
  			operation: "semantic",
  			code
  		})])
  	});
  }
  function asyncResult(value) {
  	try {
  		Promise.prototype.then.call(value, () => void 0, () => void 0);
  		return true;
  	} catch (_a) {}
  	return "then" in value;
  }
  /** Validate one protected candidate/context snapshot, then invoke a synchronous owner at most once. */
  function validateSchemaInput(compiled, data, options) {
  	let scope = scopeFor(compiled);
  	let context;
  	let owner;
  	try {
  		if (!isJsonRecord(options)) return ownerFailure(scope, "owner-context-invalid");
  		const descriptor = Object.getOwnPropertyDescriptor(options, "context");
  		if (!descriptor || !("value" in descriptor)) return ownerFailure(scope, "owner-context-invalid");
  		const candidate = snapshotJson(descriptor.value);
  		if (!isJsonRecord(candidate) || typeof candidate.consumerId !== "string" || typeof candidate.nowMs !== "number" || !Number.isFinite(candidate.nowMs) || !Object.hasOwn(candidate, "settings")) return ownerFailure(scope, "owner-context-invalid");
  		context = deepFreeze(candidate);
  		scope = Object.freeze({
  			...scope,
  			consumerId: context.consumerId
  		});
  		const ownerDescriptor = Object.getOwnPropertyDescriptor(options, "ownerValidate");
  		if (ownerDescriptor && !("value" in ownerDescriptor)) return ownerFailure(scope, "owner-result-invalid");
  		owner = ownerDescriptor === null || ownerDescriptor === void 0 ? void 0 : ownerDescriptor.value;
  		if (owner !== void 0 && typeof owner !== "function") return ownerFailure(scope, "owner-result-invalid");
  	} catch (_a) {
  		return ownerFailure(scope, "owner-context-invalid");
  	}
  	let input;
  	try {
  		input = deepFreeze(snapshotJson(data));
  		const structural = compiled.validate(input, { consumerId: context.consumerId });
  		if (!isJsonRecord(structural) || !Array.isArray(structural.diagnostics) || (structural.kind === "valid" ? structural.diagnostics.length !== 0 : structural.diagnostics.length === 0) || ![
  			"valid",
  			"invalid",
  			"execution-error"
  		].includes(structural.kind)) throw new Error();
  		if (structural.kind !== "valid") return structural;
  	} catch (error) {
  		if (error instanceof JsonSnapshotError && error.kind === "invalid") return Object.freeze({
  			kind: "invalid",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "structure",
  				code: "input-not-json",
  				dataPath: error.dataPath
  			})])
  		});
  		return Object.freeze({
  			kind: "execution-error",
  			diagnostics: Object.freeze([Object.freeze({
  				scope,
  				phase: "execution",
  				operation: "structure",
  				code: error instanceof JsonSnapshotError && error.kind === "limit" || error instanceof RangeError ? "limit-exceeded" : "engine-failed"
  			})])
  		});
  	}
  	if (!owner) return Object.freeze({
  		kind: "valid",
  		diagnostics: Object.freeze([])
  	});
  	let result;
  	try {
  		result = owner(input, context);
  	} catch (_b) {
  		return ownerFailure(scope, "owner-validation-failed");
  	}
  	try {
  		if (result !== null && (typeof result === "object" || typeof result === "function") && asyncResult(result)) return ownerFailure(scope, "async-owner-unsupported");
  		const snapshot = snapshotJson(result);
  		if (!isJsonRecord(snapshot) || !Array.isArray(snapshot.issues)) return ownerFailure(scope, "owner-result-invalid");
  		if (snapshot.kind === "valid" && snapshot.issues.length === 0) return Object.freeze({
  			kind: "valid",
  			diagnostics: Object.freeze([])
  		});
  		if (snapshot.kind !== "invalid" || snapshot.issues.length === 0) return ownerFailure(scope, "owner-result-invalid");
  		const diagnostics = [];
  		for (const issue of snapshot.issues) {
  			if (!isJsonRecord(issue) || typeof issue.dataPath !== "string" || issue.dataPath !== "" && !issue.dataPath.startsWith("/") || /~(?:[^01]|$)/u.test(issue.dataPath) || typeof issue.ruleId !== "string") return ownerFailure(scope, "owner-result-invalid");
  			diagnostics.push(Object.freeze({
  				scope,
  				phase: "semantic",
  				code: "owner-input-invalid",
  				dataPath: issue.dataPath,
  				ruleId: issue.ruleId
  			}));
  		}
  		return Object.freeze({
  			kind: "invalid",
  			diagnostics: Object.freeze(diagnostics)
  		});
  	} catch (_c) {
  		return ownerFailure(scope, "owner-result-invalid");
  	}
  }
  var camera_intrinsics_v1_default = {
  	$schema: "https://json-schema.org/draft/2020-12/schema",
  	$id: "https://kubohiroya.github.io/turbowarp-camera-source/schema/camera-intrinsics-v1.json",
  	title: "Camera intrinsic calibration profile v1",
  	description: "How one camera projects the world onto its own captured image. Carries no world pose: where a camera stands is solved separately against a shared reference, and mixing the two lets a stale extrinsic be read as a current placement.",
  	type: "object",
  	additionalProperties: false,
  	required: [
  		"schema",
  		"version",
  		"profileId",
  		"cameraId",
  		"calibratedAt",
  		"producer",
  		"cameraModel",
  		"image",
  		"intrinsics",
  		"distortion"
  	],
  	properties: {
  		"schema": { "const": "twcs/camera-intrinsics" },
  		"version": { "const": 1 },
  		"profileId": {
  			"$ref": "#/$defs/identifier",
  			"description": "Identifies this calibration run. A new solve produces a new id."
  		},
  		"cameraId": {
  			"$ref": "#/$defs/identifier",
  			"description": "Operator-assigned camera name such as stage-left. Stable across calibration runs."
  		},
  		"calibratedAt": {
  			"type": "string",
  			"pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,6})?Z$",
  			"description": "When the calibration was solved, as an RFC 3339 timestamp in UTC."
  		},
  		"producer": {
  			"type": "string",
  			"minLength": 1,
  			"maxLength": 256,
  			"description": "Free text naming whatever produced the profile. Diagnostics only; the contract does not care which extension, tool or person it was."
  		},
  		"cameraModel": { "const": "pinhole" },
  		"image": {
  			"type": "object",
  			"additionalProperties": false,
  			"required": [
  				"width",
  				"height",
  				"undistorted"
  			],
  			"description": "The image the calibration was solved against. Always the camera's own capture; preview mirroring is a display choice and never changes the calibration.",
  			"properties": {
  				"width": {
  					"type": "integer",
  					"minimum": 1,
  					"maximum": 16384
  				},
  				"height": {
  					"type": "integer",
  					"minimum": 1,
  					"maximum": 16384
  				},
  				"undistorted": {
  					"type": "boolean",
  					"description": "False for the base contract: the profile describes the raw frame and the consumer applies the distortion model. True states that the images are already corrected, which then forbids leftover coefficients."
  				}
  			}
  		},
  		"intrinsics": {
  			"type": "object",
  			"additionalProperties": false,
  			"required": [
  				"fx",
  				"fy",
  				"cx",
  				"cy",
  				"skew"
  			],
  			"description": "Pinhole parameters in pixels of the calibration image, with x to the right and y downward from the top-left corner. Named rather than packed into an array because nine numbers cannot say whether they are row-major or column-major. The equivalent row-major 3x3 matrix is [fx, skew, cx, 0, fy, cy, 0, 0, 1].",
  			"properties": {
  				"fx": {
  					"type": "number",
  					"exclusiveMinimum": 0,
  					"maximum": 1e7
  				},
  				"fy": {
  					"type": "number",
  					"exclusiveMinimum": 0,
  					"maximum": 1e7
  				},
  				"cx": {
  					"type": "number",
  					"minimum": -1e7,
  					"maximum": 1e7
  				},
  				"cy": {
  					"type": "number",
  					"minimum": -1e7,
  					"maximum": 1e7
  				},
  				"skew": {
  					"type": "number",
  					"minimum": -1e7,
  					"maximum": 1e7,
  					"description": "Axis skew. Zero for every square-pixel sensor; kept explicit so it is never assumed."
  				}
  			}
  		},
  		"distortion": {
  			"type": "object",
  			"additionalProperties": false,
  			"required": ["model", "coefficients"],
  			"properties": {
  				"model": { "enum": [
  					"none",
  					"brown-conrady",
  					"kannala-brandt"
  				] },
  				"coefficients": {
  					"type": "array",
  					"items": {
  						"type": "number",
  						"minimum": -1e4,
  						"maximum": 1e4
  					},
  					"description": "Brown-Conrady carries the OpenCV coefficients in their usual order: k1, k2, p1, p2, optionally k3, and k4 to k6 for the rational model. Kannala-Brandt carries the four fisheye coefficients."
  				}
  			},
  			"allOf": [
  				{
  					"if": {
  						"type": "object",
  						"required": ["model"],
  						"properties": { "model": { "const": "none" } }
  					},
  					"then": {
  						"type": "object",
  						"properties": { "coefficients": {
  							"type": "array",
  							"maxItems": 0
  						} }
  					}
  				},
  				{
  					"if": {
  						"type": "object",
  						"required": ["model"],
  						"properties": { "model": { "const": "brown-conrady" } }
  					},
  					"then": {
  						"type": "object",
  						"properties": { "coefficients": {
  							"type": "array",
  							"anyOf": [
  								{
  									"minItems": 4,
  									"maxItems": 4
  								},
  								{
  									"minItems": 5,
  									"maxItems": 5
  								},
  								{
  									"minItems": 8,
  									"maxItems": 8
  								}
  							]
  						} }
  					}
  				},
  				{
  					"if": {
  						"type": "object",
  						"required": ["model"],
  						"properties": { "model": { "const": "kannala-brandt" } }
  					},
  					"then": {
  						"type": "object",
  						"properties": { "coefficients": {
  							"type": "array",
  							"minItems": 4,
  							"maxItems": 4
  						} }
  					}
  				}
  			]
  		},
  		"capture": {
  			"type": "object",
  			"additionalProperties": false,
  			"description": "The capture configuration the calibration was solved under. Optional as a whole, and optional member by member, but the difference matters: an absent block means nothing was recorded and compatibility cannot be decided, while an absent member inside a present block means the device reported no such control at calibration time. frameRate and facingMode are recorded for the operator and do not decide compatibility, because neither changes how the lens projects.",
  			"properties": {
  				"frameRate": {
  					"type": "number",
  					"exclusiveMinimum": 0,
  					"maximum": 1e3
  				},
  				"facingMode": {
  					"type": "string",
  					"minLength": 1,
  					"maxLength": 256
  				},
  				"resizeMode": {
  					"enum": ["none", "crop-and-scale"],
  					"description": "Cropping changes the effective intrinsics at the same resolution."
  				},
  				"zoom": {
  					"type": "number",
  					"exclusiveMinimum": 0,
  					"maximum": 1e3
  				},
  				"focusMode": { "enum": [
  					"none",
  					"manual",
  					"single-shot",
  					"continuous"
  				] },
  				"focusDistance": {
  					"type": "number",
  					"minimum": 0,
  					"maximum": 1e4
  				}
  			}
  		},
  		"quality": {
  			"type": "object",
  			"additionalProperties": false,
  			"required": ["sampleCount", "reprojectionErrorPx"],
  			"description": "Optional. Absent means the producer did not report quality, which is not the same as a measured zero.",
  			"properties": {
  				"sampleCount": {
  					"type": "integer",
  					"minimum": 1,
  					"maximum": 1e4
  				},
  				"reprojectionErrorPx": {
  					"type": "number",
  					"minimum": 0,
  					"maximum": 1e4
  				}
  			}
  		},
  		"device": {
  			"type": "object",
  			"additionalProperties": false,
  			"description": "Hints for recognizing the physical camera again. deviceId is a hint and not an identity: browsers scope it per origin and per profile, so it changes without the camera changing.",
  			"properties": {
  				"label": {
  					"type": "string",
  					"minLength": 1,
  					"maxLength": 256
  				},
  				"deviceId": {
  					"type": "string",
  					"minLength": 1,
  					"maxLength": 256
  				}
  			}
  		}
  	},
  	allOf: [{
  		"if": {
  			"type": "object",
  			"required": ["image"],
  			"properties": { "image": {
  				"type": "object",
  				"required": ["undistorted"],
  				"properties": { "undistorted": { "const": true } }
  			} }
  		},
  		"then": {
  			"type": "object",
  			"properties": { "distortion": {
  				"type": "object",
  				"properties": { "model": { "const": "none" } }
  			} }
  		}
  	}],
  	$defs: { "identifier": {
  		"type": "string",
  		"pattern": "^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$"
  	} }
  };
  var editor_legacy_calibration_default = {
  	$schema: "https://json-schema.org/draft/2020-12/schema",
  	$id: "https://kubohiroya.github.io/turbowarp-camera-source/schema/editor-legacy-calibration.json",
  	title: "Existing Camera Source legacy input shape",
  	type: "object",
  	required: [
  		"schema",
  		"version",
  		"calibrationId",
  		"cameraId",
  		"imageWidth",
  		"imageHeight",
  		"intrinsicMatrix",
  		"distortionCoefficients",
  		"calibratedAt"
  	],
  	properties: {
  		"schema": { "const": "twrmc/camera-calibration" },
  		"version": { "const": 1 },
  		"calibrationId": { "type": "string" },
  		"cameraId": { "type": "string" },
  		"imageWidth": { "type": "number" },
  		"imageHeight": { "type": "number" },
  		"intrinsicMatrix": {
  			"type": "array",
  			"items": { "type": "number" },
  			"minItems": 9,
  			"maxItems": 9
  		},
  		"distortionCoefficients": {
  			"type": "array",
  			"items": { "type": "number" }
  		},
  		"calibratedAt": { "type": "string" },
  		"worldFromCameraMatrix": true,
  		"worldUnit": true
  	},
  	additionalProperties: false
  };
  var editor_ros_camera_info_default = {
  	$schema: "https://json-schema.org/draft/2020-12/schema",
  	$id: "https://kubohiroya.github.io/turbowarp-camera-source/schema/editor-ros-camera-info.json",
  	title: "Raw ROS camera_info shape (owner validates matrices and metadata)",
  	type: "object",
  	required: [
  		"image_width",
  		"image_height",
  		"camera_name",
  		"camera_matrix",
  		"distortion_coefficients",
  		"turbowarp_camera_source"
  	],
  	properties: {
  		"image_width": true,
  		"image_height": true,
  		"camera_name": true,
  		"camera_matrix": true,
  		"distortion_model": true,
  		"distortion_coefficients": true,
  		"rectification_matrix": true,
  		"projection_matrix": true,
  		"binning_x": true,
  		"binning_y": true,
  		"roi": true,
  		"turbowarp_camera_source": true
  	},
  	additionalProperties: false
  };
  var CAMERA_INTRINSIC_PROFILE_SCHEMA = "twcs/camera-intrinsics";
  /** The application-specific format this contract replaces. Read for migration, never written. */
  var LEGACY_CALIBRATION_SCHEMA = "twrmc/camera-calibration";
  var IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
  var UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/;
  var MAXIMUM_IMAGE_EDGE = 16384;
  var MAXIMUM_PIXEL_MAGNITUDE = 1e7;
  var MAXIMUM_DISTORTION_MAGNITUDE = 1e4;
  var MAXIMUM_SAMPLE_COUNT = 1e4;
  var MAXIMUM_REPROJECTION_ERROR_PX = 1e4;
  var MAXIMUM_TEXT_LENGTH = 256;
  var MAXIMUM_FRAME_RATE = 1e3;
  var MAXIMUM_ZOOM = 1e3;
  var MAXIMUM_FOCUS_DISTANCE = 1e4;
  var MAXIMUM_SCAN_DEPTH = 16;
  var AFFINE_ROW_TOLERANCE = 1e-6;
  var DISTORTION_MODELS = [
  	"none",
  	"brown-conrady",
  	"kannala-brandt"
  ];
  var RESIZE_MODES = ["none", "crop-and-scale"];
  var FOCUS_MODES = [
  	"none",
  	"manual",
  	"single-shot",
  	"continuous"
  ];
  /**
  * Coefficient counts each model accepts.
  *
  * The Brown-Conrady lengths are the OpenCV sets that consumers already handle: four, the usual five
  * with k3, and eight for the rational model. Longer OpenCV vectors (thin prism, tilted sensor) are
  * rejected rather than carried, because no consumer in this family implements them and a profile
  * that is accepted but only partly applied is worse than one that is refused.
  */
  var DISTORTION_COEFFICIENT_LENGTHS = {
  	none: [0],
  	"brown-conrady": [
  		4,
  		5,
  		8
  	],
  	"kannala-brandt": [4]
  };
  /**
  * Key names that carry pairing or authentication material.
  *
  * Signaling data is short-lived session state and a calibration profile is a document operators keep
  * and copy between venues. Rejecting the whole document is deliberate: a profile that reached here
  * carrying an SDP is evidence that something upstream is mixing the two, and quietly stripping the
  * key would hide that.
  */
  var FORBIDDEN_KEYS = /* @__PURE__ */ new Set([
  	"accesstoken",
  	"answer",
  	"apikey",
  	"authorization",
  	"candidate",
  	"credential",
  	"credentials",
  	"ice",
  	"icecandidate",
  	"offer",
  	"passphrase",
  	"password",
  	"secret",
  	"sdp",
  	"token"
  ]);
  var ProfileRejection = class extends Error {
  	constructor(detail) {
  		super(detail.message);
  		this.name = "ProfileRejection";
  		this.detail = detail;
  	}
  };
  function reject(code, path, message) {
  	throw new ProfileRejection({
  		code,
  		path,
  		message
  	});
  }
  function isRecord(value) {
  	return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function member(path, name) {
  	return path.length === 0 ? name : `${path}.${name}`;
  }
  /** Normalizes a key so `ICE-Candidate`, `iceCandidate` and `ice_candidate` all match one entry. */
  function comparableKey(key) {
  	return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function assertNoForbiddenKeys(value, path, depth, seen) {
  	if (depth > MAXIMUM_SCAN_DEPTH) reject("invalid-value", path, "The document is nested more deeply than a profile ever is.");
  	if (typeof value !== "object" || value === null) return;
  	if (seen.has(value)) reject("invalid-value", path, "The document contains a cycle.");
  	seen.add(value);
  	if (Array.isArray(value)) {
  		value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, depth + 1, seen));
  		return;
  	}
  	for (const [key, child] of Object.entries(value)) {
  		if (FORBIDDEN_KEYS.has(comparableKey(key))) reject("forbidden-field", member(path, key), "Pairing and authentication material must not travel inside a calibration profile.");
  		assertNoForbiddenKeys(child, member(path, key), depth + 1, seen);
  	}
  }
  function requireRecord(value, path) {
  	if (!isRecord(value)) reject(path.length === 0 ? "not-an-object" : "invalid-type", path, "Expected an object.");
  	return value;
  }
  /** Rejects unknown members as well as missing ones, so an unrecognized field is never ignored. */
  function requireExactKeys(record, path, required, optional = []) {
  	const known = /* @__PURE__ */ new Set([...required, ...optional]);
  	for (const key of Object.keys(record)) if (!known.has(key)) reject("unexpected-field", member(path, key), "Unknown member.");
  	for (const key of required) if (!(key in record)) reject("missing-field", member(path, key), "Required member is missing.");
  }
  function requireText(value, path) {
  	if (typeof value !== "string") reject("invalid-type", path, "Expected a string.");
  	if (value.length === 0 || value.length > MAXIMUM_TEXT_LENGTH) reject("out-of-range", path, `Expected between 1 and ${MAXIMUM_TEXT_LENGTH} characters.`);
  	return value;
  }
  function requireIdentifier(value, path) {
  	const text = requireText(value, path);
  	if (!IDENTIFIER_PATTERN.test(text)) reject("invalid-value", path, "Expected letters, digits, dot, underscore, colon or hyphen.");
  	return text;
  }
  function requireUtcTimestamp(value, path) {
  	const text = requireText(value, path);
  	if (!UTC_TIMESTAMP_PATTERN.test(text) || !Number.isFinite(Date.parse(text))) reject("invalid-value", path, "Expected an RFC 3339 timestamp in UTC, such as 2026-09-15T04:05:06Z.");
  	return text;
  }
  function requireBoolean(value, path) {
  	if (typeof value !== "boolean") reject("invalid-type", path, "Expected a boolean.");
  	return value;
  }
  function requireFinite(value, path) {
  	if (typeof value !== "number") reject("invalid-type", path, "Expected a number.");
  	if (!Number.isFinite(value)) reject("invalid-value", path, "Expected a finite number.");
  	return value;
  }
  function requireInteger(value, path, minimum, maximum) {
  	const numeric = requireFinite(value, path);
  	if (!Number.isInteger(numeric)) reject("invalid-value", path, "Expected an integer.");
  	if (numeric < minimum || numeric > maximum) reject("out-of-range", path, `Expected between ${minimum} and ${maximum}.`);
  	return numeric;
  }
  function requireBounded(value, path, minimum, maximum) {
  	const numeric = requireFinite(value, path);
  	if (numeric < minimum || numeric > maximum) reject("out-of-range", path, `Expected between ${minimum} and ${maximum}.`);
  	return numeric;
  }
  function requireLiteral(value, path, expected, code) {
  	if (value !== expected) reject(code, path, `Expected ${JSON.stringify(expected)}.`);
  	return expected;
  }
  function readImage(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [
  		"width",
  		"height",
  		"undistorted"
  	]);
  	return {
  		width: requireInteger(record["width"], member(path, "width"), 1, MAXIMUM_IMAGE_EDGE),
  		height: requireInteger(record["height"], member(path, "height"), 1, MAXIMUM_IMAGE_EDGE),
  		undistorted: requireBoolean(record["undistorted"], member(path, "undistorted"))
  	};
  }
  /**
  * Reads the pinhole parameters.
  *
  * The principal point is allowed to sit outside the frame — a cropped or shifted sensor puts it
  * there legitimately — but not arbitrarily far, because a principal point far outside the image is
  * the signature of values given in the wrong unit rather than of an unusual lens.
  */
  function readIntrinsics(value, path, image) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [
  		"fx",
  		"fy",
  		"cx",
  		"cy",
  		"skew"
  	]);
  	return {
  		fx: requireBounded(record["fx"], member(path, "fx"), Number.MIN_VALUE, MAXIMUM_PIXEL_MAGNITUDE),
  		fy: requireBounded(record["fy"], member(path, "fy"), Number.MIN_VALUE, MAXIMUM_PIXEL_MAGNITUDE),
  		cx: requireBounded(record["cx"], member(path, "cx"), -image.width, image.width * 2),
  		cy: requireBounded(record["cy"], member(path, "cy"), -image.height, image.height * 2),
  		skew: requireBounded(record["skew"], member(path, "skew"), -1e7, MAXIMUM_PIXEL_MAGNITUDE)
  	};
  }
  function readDistortion$1(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, ["model", "coefficients"]);
  	const modelPath = member(path, "model");
  	const rawModel = record["model"];
  	if (typeof rawModel !== "string" || !DISTORTION_MODELS.includes(rawModel)) reject("invalid-distortion", modelPath, `Expected one of ${DISTORTION_MODELS.join(", ")}.`);
  	const model = rawModel;
  	const coefficientsPath = member(path, "coefficients");
  	const rawCoefficients = record["coefficients"];
  	if (!Array.isArray(rawCoefficients)) reject("invalid-type", coefficientsPath, "Expected an array.");
  	const allowed = DISTORTION_COEFFICIENT_LENGTHS[model];
  	if (!allowed.includes(rawCoefficients.length)) reject("invalid-distortion", coefficientsPath, `The ${model} model takes ${allowed.join(" or ")} coefficients, not ${rawCoefficients.length}.`);
  	return {
  		model,
  		coefficients: rawCoefficients.map((coefficient, index) => requireBounded(coefficient, `${coefficientsPath}[${index}]`, -1e4, MAXIMUM_DISTORTION_MAGNITUDE))
  	};
  }
  function requireEnum(value, path, allowed) {
  	const text = requireText(value, path);
  	if (!allowed.includes(text)) reject("invalid-value", path, `Expected one of ${allowed.join(", ")}.`);
  	return text;
  }
  function readCapture(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [], [
  		"frameRate",
  		"facingMode",
  		"resizeMode",
  		"zoom",
  		"focusMode",
  		"focusDistance"
  	]);
  	const read = (name, reader) => name in record ? reader(record[name], member(path, name)) : void 0;
  	const frameRate = read("frameRate", (raw, at) => requireBounded(raw, at, Number.MIN_VALUE, MAXIMUM_FRAME_RATE));
  	const facingMode = read("facingMode", requireText);
  	const resizeMode = read("resizeMode", (raw, at) => requireEnum(raw, at, RESIZE_MODES));
  	const zoom = read("zoom", (raw, at) => requireBounded(raw, at, Number.MIN_VALUE, MAXIMUM_ZOOM));
  	const focusMode = read("focusMode", (raw, at) => requireEnum(raw, at, FOCUS_MODES));
  	const focusDistance = read("focusDistance", (raw, at) => requireBounded(raw, at, 0, MAXIMUM_FOCUS_DISTANCE));
  	return {
  		...frameRate === void 0 ? {} : { frameRate },
  		...facingMode === void 0 ? {} : { facingMode },
  		...resizeMode === void 0 ? {} : { resizeMode },
  		...zoom === void 0 ? {} : { zoom },
  		...focusMode === void 0 ? {} : { focusMode },
  		...focusDistance === void 0 ? {} : { focusDistance }
  	};
  }
  function readQuality(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, ["sampleCount", "reprojectionErrorPx"]);
  	return {
  		sampleCount: requireInteger(record["sampleCount"], member(path, "sampleCount"), 1, MAXIMUM_SAMPLE_COUNT),
  		reprojectionErrorPx: requireBounded(record["reprojectionErrorPx"], member(path, "reprojectionErrorPx"), 0, MAXIMUM_REPROJECTION_ERROR_PX)
  	};
  }
  function readDevice(value, path) {
  	const record = requireRecord(value, path);
  	requireExactKeys(record, path, [], ["label", "deviceId"]);
  	const label = "label" in record ? requireText(record["label"], member(path, "label")) : void 0;
  	const deviceId = "deviceId" in record ? requireText(record["deviceId"], member(path, "deviceId")) : void 0;
  	return {
  		...label === void 0 ? {} : { label },
  		...deviceId === void 0 ? {} : { deviceId }
  	};
  }
  function readProfile(input) {
  	assertNoForbiddenKeys(input, "", 0, /* @__PURE__ */ new WeakSet());
  	const record = requireRecord(input, "");
  	requireLiteral(record["schema"], "schema", CAMERA_INTRINSIC_PROFILE_SCHEMA, "unsupported-schema");
  	requireLiteral(record["version"], "version", 1, "unsupported-version");
  	requireExactKeys(record, "", [
  		"schema",
  		"version",
  		"profileId",
  		"cameraId",
  		"calibratedAt",
  		"producer",
  		"cameraModel",
  		"image",
  		"intrinsics",
  		"distortion"
  	], [
  		"capture",
  		"quality",
  		"device"
  	]);
  	const image = readImage(record["image"], "image");
  	const distortion = readDistortion$1(record["distortion"], "distortion");
  	if (image.undistorted && distortion.model !== "none") reject("inconsistent-profile", "distortion.model", "A profile for an already undistorted image cannot also carry distortion coefficients.");
  	const capture = "capture" in record ? readCapture(record["capture"], "capture") : void 0;
  	const quality = "quality" in record ? readQuality(record["quality"], "quality") : void 0;
  	const device = "device" in record ? readDevice(record["device"], "device") : void 0;
  	return {
  		schema: CAMERA_INTRINSIC_PROFILE_SCHEMA,
  		version: 1,
  		profileId: requireIdentifier(record["profileId"], "profileId"),
  		cameraId: requireIdentifier(record["cameraId"], "cameraId"),
  		calibratedAt: requireUtcTimestamp(record["calibratedAt"], "calibratedAt"),
  		producer: requireText(record["producer"], "producer"),
  		cameraModel: requireLiteral(record["cameraModel"], "cameraModel", "pinhole", "invalid-value"),
  		image,
  		intrinsics: readIntrinsics(record["intrinsics"], "intrinsics", image),
  		distortion,
  		...capture === void 0 ? {} : { capture },
  		...quality === void 0 ? {} : { quality },
  		...device === void 0 ? {} : { device }
  	};
  }
  function toResult(read) {
  	try {
  		return {
  			ok: true,
  			profile: read()
  		};
  	} catch (error) {
  		if (error instanceof ProfileRejection) return {
  			ok: false,
  			error: error.detail
  		};
  		throw error;
  	}
  }
  /**
  * Reads whichever profile format a document is written in.
  *
  * An operator holding a file does not know, and should not have to know, which of two schemas it
  * uses; they know they calibrated this camera once and kept the result. Dispatching on the document
  * itself means one entry point accepts both, and the profile that comes out records where it came
  * from in `producer`, so nothing about the conversion is hidden.
  *
  * Only the declared schema decides. A document that says nothing recognizable is refused by the
  * current parser, which names what it expected.
  */
  function readCameraProfileDocument(input) {
  	if (isRecord(input) && input["schema"] === "twrmc/camera-calibration") return adoptLegacyCameraCalibration(input);
  	return parseCameraIntrinsicProfile(input);
  }
  /** Validates a parsed document and returns a normalized profile, or the reason it was refused. */
  function parseCameraIntrinsicProfile(input) {
  	return toResult(() => readProfile(input));
  }
  /**
  * Renders a profile as JSON with a fixed member order.
  *
  * Stable output means the same profile always produces the same bytes, so a file can be compared or
  * hashed to tell whether two machines really hold the same calibration.
  */
  function orderedCapture(capture) {
  	const members = [
  		["frameRate", capture.frameRate],
  		["facingMode", capture.facingMode],
  		["resizeMode", capture.resizeMode],
  		["zoom", capture.zoom],
  		["focusMode", capture.focusMode],
  		["focusDistance", capture.focusDistance]
  	];
  	return Object.fromEntries(members.filter((entry) => entry[1] !== void 0));
  }
  function serializeCameraIntrinsicProfile(profile) {
  	const ordered = {
  		schema: profile.schema,
  		version: profile.version,
  		profileId: profile.profileId,
  		cameraId: profile.cameraId,
  		calibratedAt: profile.calibratedAt,
  		producer: profile.producer,
  		cameraModel: profile.cameraModel,
  		image: {
  			width: profile.image.width,
  			height: profile.image.height,
  			undistorted: profile.image.undistorted
  		},
  		intrinsics: {
  			fx: profile.intrinsics.fx,
  			fy: profile.intrinsics.fy,
  			cx: profile.intrinsics.cx,
  			cy: profile.intrinsics.cy,
  			skew: profile.intrinsics.skew
  		},
  		distortion: {
  			model: profile.distortion.model,
  			coefficients: [...profile.distortion.coefficients]
  		},
  		...profile.capture === void 0 ? {} : { capture: orderedCapture(profile.capture) },
  		...profile.quality === void 0 ? {} : { quality: {
  			sampleCount: profile.quality.sampleCount,
  			reprojectionErrorPx: profile.quality.reprojectionErrorPx
  		} },
  		...profile.device === void 0 ? {} : { device: {
  			...profile.device.label === void 0 ? {} : { label: profile.device.label },
  			...profile.device.deviceId === void 0 ? {} : { deviceId: profile.device.deviceId }
  		} }
  	};
  	return `${JSON.stringify(ordered, null, 2)}\n`;
  }
  function readLegacyMatrixRow(matrix, offset, expected) {
  	expected.forEach((value, index) => {
  		const actual = requireFinite(matrix[offset + index], `intrinsicMatrix[${offset + index}]`);
  		if (Math.abs(actual - value) > AFFINE_ROW_TOLERANCE) reject("inconsistent-profile", `intrinsicMatrix[${offset + index}]`, `Expected ${value} in the intrinsic matrix; the value read as ${actual}.`);
  	});
  }
  /**
  * Converts a `twrmc/camera-calibration` v1 document into this contract.
  *
  * The world pose the old format carried is deliberately dropped. It was the extrinsic of whichever
  * calibration sample happened to be last, so treating it as a placement in a shared world frame puts
  * a camera somewhere it has never been. Placement belongs to whoever solves it against a common
  * reference, and a profile that simply lacks it is honest about what it knows.
  *
  * Quality is dropped for the same reason: the old format recorded none, and inventing a sample count
  * or a reprojection error would turn "unknown" into a measurement.
  */
  function adoptLegacyCameraCalibration(input) {
  	return toResult(() => {
  		assertNoForbiddenKeys(input, "", 0, /* @__PURE__ */ new WeakSet());
  		const record = requireRecord(input, "");
  		requireLiteral(record["schema"], "schema", LEGACY_CALIBRATION_SCHEMA, "unsupported-schema");
  		requireLiteral(record["version"], "version", 1, "unsupported-version");
  		requireExactKeys(record, "", [
  			"schema",
  			"version",
  			"calibrationId",
  			"cameraId",
  			"imageWidth",
  			"imageHeight",
  			"intrinsicMatrix",
  			"distortionCoefficients",
  			"calibratedAt"
  		], ["worldFromCameraMatrix", "worldUnit"]);
  		const matrix = record["intrinsicMatrix"];
  		if (!Array.isArray(matrix) || matrix.length !== 9) reject("invalid-value", "intrinsicMatrix", "Expected nine numbers in row-major order.");
  		readLegacyMatrixRow(matrix, 3, [0]);
  		readLegacyMatrixRow(matrix, 6, [
  			0,
  			0,
  			1
  		]);
  		const rawCoefficients = record["distortionCoefficients"];
  		if (!Array.isArray(rawCoefficients)) reject("invalid-type", "distortionCoefficients", "Expected an array.");
  		const model = rawCoefficients.length === 0 ? "none" : "brown-conrady";
  		return readProfile({
  			schema: CAMERA_INTRINSIC_PROFILE_SCHEMA,
  			version: 1,
  			profileId: record["calibrationId"],
  			cameraId: record["cameraId"],
  			calibratedAt: record["calibratedAt"],
  			producer: `${LEGACY_CALIBRATION_SCHEMA} v1`,
  			cameraModel: "pinhole",
  			image: {
  				width: record["imageWidth"],
  				height: record["imageHeight"],
  				undistorted: false
  			},
  			intrinsics: {
  				fx: matrix[0],
  				fy: matrix[4],
  				cx: matrix[2],
  				cy: matrix[5],
  				skew: matrix[1]
  			},
  			distortion: {
  				model,
  				coefficients: rawCoefficients
  			}
  		});
  	});
  }
  var YamlError = class extends Error {
  	constructor(message, line) {
  		super(line > 0 ? `Line ${line}: ${message}` : message);
  		this.name = "YamlError";
  		this.line = line;
  	}
  };
  var MAXIMUM_DEPTH = 16;
  var MAXIMUM_LENGTH = 65536;
  function parseYaml(source) {
  	if (source.length > MAXIMUM_LENGTH) throw new YamlError("The document is longer than a calibration file ever is.", 0);
  	const lines = splitLines(source);
  	if (lines.length === 0) throw new YamlError("The document is empty.", 0);
  	const reader = new BlockReader(lines);
  	const value = reader.readBlock(lines[0].indent, 0);
  	if (!reader.done()) throw new YamlError("Unexpected indentation.", reader.peek().number);
  	return value;
  }
  function splitLines(source) {
  	const lines = [];
  	let started = false;
  	source.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/).forEach((raw, index) => {
  		const number = index + 1;
  		if (/\t/.test(raw.match(/^\s*/)[0])) throw new YamlError("Tabs cannot indent YAML.", number);
  		const text = stripComment(raw).trimEnd();
  		const content = text.trimStart();
  		if (content.length === 0) return;
  		if (!started && content.startsWith("%")) return;
  		if (content === "---" || content.startsWith("--- ")) {
  			if (started) throw new YamlError("Only one document is read from a calibration file.", number);
  			started = true;
  			const rest = content.slice(3).trim();
  			if (rest.length > 0) lines.push({
  				number,
  				indent: 0,
  				text: rest
  			});
  			return;
  		}
  		if (content === "...") {
  			started = true;
  			return;
  		}
  		started = true;
  		lines.push({
  			number,
  			indent: text.length - content.length,
  			text: content
  		});
  	});
  	return lines;
  }
  /** Removes a `#` comment that is not inside quotes. A `#` only starts one after whitespace. */
  function stripComment(raw) {
  	let quote;
  	for (let index = 0; index < raw.length; index += 1) {
  		const character = raw[index];
  		if (quote) {
  			if (character === "\\" && quote === "\"") index += 1;
  			else if (character === quote) quote = void 0;
  			continue;
  		}
  		if (character === "\"" || character === "'") quote = character;
  		else if (character === "#" && (index === 0 || /\s/.test(raw[index - 1]))) return raw.slice(0, index);
  	}
  	return raw;
  }
  var BlockReader = class {
  	constructor(lines) {
  		this.lines = lines;
  		this.index = 0;
  	}
  	done() {
  		return this.index >= this.lines.length;
  	}
  	peek() {
  		return this.lines[this.index];
  	}
  	readBlock(indent, depth) {
  		if (depth > MAXIMUM_DEPTH) throw new YamlError("The document is nested too deeply.", this.peek()?.number ?? 0);
  		const first = this.peek();
  		if (!first) throw new YamlError("Expected a value.", 0);
  		if (first.text === "-" || first.text.startsWith("- ")) return this.readSequence(indent, depth);
  		if (findMappingColon(first.text) >= 0) return this.readMapping(indent, depth);
  		this.index += 1;
  		return this.readInline(first.text, first.number, first.indent);
  	}
  	readMapping(indent, depth) {
  		const mapping = {};
  		while (!this.done()) {
  			const line = this.peek();
  			if (line.indent < indent) break;
  			if (line.indent > indent) throw new YamlError("Unexpected indentation.", line.number);
  			const colon = findMappingColon(line.text);
  			if (colon < 0) throw new YamlError("Expected a \"key: value\" pair.", line.number);
  			const key = readKey(line.text.slice(0, colon).trim(), line.number);
  			if (Object.prototype.hasOwnProperty.call(mapping, key)) throw new YamlError(`The key "${key}" appears twice.`, line.number);
  			const rest = line.text.slice(colon + 1).trim();
  			this.index += 1;
  			if (rest.length > 0) {
  				mapping[key] = this.readInline(rest, line.number, line.indent);
  				continue;
  			}
  			const next = this.peek();
  			const nestedSequence = next !== void 0 && next.indent === indent && (next.text === "-" || next.text.startsWith("- "));
  			if (next === void 0 || next.indent <= indent && !nestedSequence) mapping[key] = null;
  			else mapping[key] = this.readBlock(next.indent, depth + 1);
  		}
  		return mapping;
  	}
  	readSequence(indent, depth) {
  		const sequence = [];
  		while (!this.done()) {
  			const line = this.peek();
  			if (line.indent < indent || !(line.text === "-" || line.text.startsWith("- "))) break;
  			if (line.indent > indent) throw new YamlError("Unexpected indentation.", line.number);
  			const rest = line.text.slice(1).trim();
  			this.index += 1;
  			if (rest.length === 0) {
  				const next = this.peek();
  				sequence.push(next !== void 0 && next.indent > indent ? this.readBlock(next.indent, depth + 1) : null);
  			} else if (findMappingColon(rest) >= 0 && !/^[[{"']/.test(rest)) throw new YamlError("A mapping inside a block sequence is not part of a calibration file.", line.number);
  			else sequence.push(this.readInline(rest, line.number, line.indent));
  		}
  		return sequence;
  	}
  	/**
  	* Reads a value that starts on one line. A flow collection may continue on the lines after it, as
  	* PyYAML writes long matrices, so those lines are drawn in until the brackets balance.
  	*/
  	readInline(text, number, indent) {
  		if (text.startsWith("[") || text.startsWith("{")) {
  			let joined = text;
  			while (!flowClosed(joined)) {
  				const next = this.peek();
  				if (!next || next.indent <= indent) throw new YamlError("A bracket is never closed.", number);
  				joined += ` ${next.text}`;
  				this.index += 1;
  			}
  			const flow = new FlowReader(joined, number);
  			const value = flow.readValue(0);
  			flow.expectEnd();
  			return value;
  		}
  		return readScalar(text, number);
  	}
  };
  /** Where the `: ` separating a key from its value is, or -1. Colons inside quotes do not count. */
  function findMappingColon(text) {
  	let quote;
  	for (let index = 0; index < text.length; index += 1) {
  		const character = text[index];
  		if (quote) {
  			if (character === "\\" && quote === "\"") index += 1;
  			else if (character === quote) quote = void 0;
  			continue;
  		}
  		if (index === 0 && (character === "[" || character === "{")) return -1;
  		if (character === "\"" || character === "'") quote = character;
  		else if (character === ":" && (index === text.length - 1 || text[index + 1] === " ")) return index;
  	}
  	return -1;
  }
  function flowClosed(text) {
  	let depth = 0;
  	let quote;
  	for (let index = 0; index < text.length; index += 1) {
  		const character = text[index];
  		if (quote) {
  			if (character === "\\" && quote === "\"") index += 1;
  			else if (character === quote) quote = void 0;
  			continue;
  		}
  		if (character === "\"" || character === "'") quote = character;
  		else if (character === "[" || character === "{") depth += 1;
  		else if (character === "]" || character === "}") depth -= 1;
  	}
  	return depth <= 0;
  }
  function readKey(text, number) {
  	const value = readScalar(text, number);
  	if (typeof value !== "string") return String(value);
  	return value;
  }
  var FlowReader = class {
  	constructor(text, number) {
  		this.text = text;
  		this.number = number;
  		this.index = 0;
  	}
  	readValue(depth) {
  		if (depth > MAXIMUM_DEPTH) throw new YamlError("The document is nested too deeply.", this.number);
  		this.skipSpace();
  		const character = this.text[this.index];
  		if (character === "[") return this.readSequence(depth);
  		if (character === "{") return this.readMapping(depth);
  		return readScalar(this.readToken(), this.number);
  	}
  	expectEnd() {
  		this.skipSpace();
  		if (this.index < this.text.length) throw new YamlError("Unexpected text after a closing bracket.", this.number);
  	}
  	readSequence(depth) {
  		this.index += 1;
  		const sequence = [];
  		this.skipSpace();
  		if (this.text[this.index] === "]") {
  			this.index += 1;
  			return sequence;
  		}
  		for (;;) {
  			sequence.push(this.readValue(depth + 1));
  			this.skipSpace();
  			const separator = this.text[this.index];
  			this.index += 1;
  			if (separator === "]") return sequence;
  			if (separator !== ",") throw new YamlError("Expected \",\" or \"]\" in a sequence.", this.number);
  			this.skipSpace();
  			if (this.text[this.index] === "]") {
  				this.index += 1;
  				return sequence;
  			}
  		}
  	}
  	readMapping(depth) {
  		this.index += 1;
  		const mapping = {};
  		this.skipSpace();
  		if (this.text[this.index] === "}") {
  			this.index += 1;
  			return mapping;
  		}
  		for (;;) {
  			this.skipSpace();
  			const key = readKey(this.readToken(":"), this.number);
  			this.skipSpace();
  			if (this.text[this.index] !== ":") throw new YamlError("Expected \":\" after a key.", this.number);
  			this.index += 1;
  			if (Object.prototype.hasOwnProperty.call(mapping, key)) throw new YamlError(`The key "${key}" appears twice.`, this.number);
  			mapping[key] = this.readValue(depth + 1);
  			this.skipSpace();
  			const separator = this.text[this.index];
  			this.index += 1;
  			if (separator === "}") return mapping;
  			if (separator !== ",") throw new YamlError("Expected \",\" or \"}\" in a mapping.", this.number);
  			this.skipSpace();
  			if (this.text[this.index] === "}") {
  				this.index += 1;
  				return mapping;
  			}
  		}
  	}
  	/** A quoted string, or plain text up to the next flow delimiter. */
  	readToken(stopAlso = "") {
  		this.skipSpace();
  		const start = this.index;
  		const character = this.text[this.index];
  		if (character === "\"" || character === "'") {
  			this.index += 1;
  			while (this.index < this.text.length) {
  				const current = this.text[this.index];
  				if (current === "\\" && character === "\"") {
  					this.index += 2;
  					continue;
  				}
  				if (current === character) {
  					if (character === "'" && this.text[this.index + 1] === "'") {
  						this.index += 2;
  						continue;
  					}
  					this.index += 1;
  					return this.text.slice(start, this.index);
  				}
  				this.index += 1;
  			}
  			throw new YamlError("A quoted string is never closed.", this.number);
  		}
  		while (this.index < this.text.length && !`,]}${stopAlso}`.includes(this.text[this.index])) this.index += 1;
  		return this.text.slice(start, this.index).trim();
  	}
  	skipSpace() {
  		while (this.index < this.text.length && /\s/.test(this.text[this.index])) this.index += 1;
  	}
  };
  var INTEGER = /^[-+]?(?:0|[1-9][0-9_]*)$/;
  var FLOAT = /^[-+]?(?:[0-9][0-9_]*)?\.?[0-9]*(?:[eE][-+]?[0-9]+)?$/;
  function readScalar(text, number) {
  	const value = text.trim();
  	if (value.length === 0) return null;
  	const first = value[0];
  	if (first === "\"") return readDoubleQuoted(value, number);
  	if (first === "'") {
  		if (value.length < 2 || !value.endsWith("'")) throw new YamlError("A quoted string is never closed.", number);
  		return value.slice(1, -1).replace(/''/g, "'");
  	}
  	if (first === "&" || first === "*") throw new YamlError("Anchors and aliases are not read.", number);
  	if (first === "!") throw new YamlError("Tags are not read.", number);
  	if (first === "|" || first === ">") throw new YamlError("Block scalars are not read.", number);
  	if (first === "@" || first === "`") throw new YamlError(`A plain value cannot start with "${first}".`, number);
  	if (value === "~" || value === "null" || value === "Null" || value === "NULL") return null;
  	if (value === "true" || value === "True" || value === "TRUE") return true;
  	if (value === "false" || value === "False" || value === "FALSE") return false;
  	if (/^[-+]?\.(?:inf|Inf|INF|nan|NaN|NAN)$/.test(value)) throw new YamlError("Infinity and NaN are not calibration values.", number);
  	if (INTEGER.test(value)) return Number(value.replace(/_/g, ""));
  	if (/[0-9]/.test(value) && FLOAT.test(value)) {
  		const parsed = Number(value.replace(/_/g, ""));
  		if (Number.isFinite(parsed)) return parsed;
  	}
  	return value;
  }
  function readDoubleQuoted(value, number) {
  	if (value.length < 2 || !value.endsWith("\"")) throw new YamlError("A quoted string is never closed.", number);
  	const body = value.slice(1, -1);
  	let result = "";
  	for (let index = 0; index < body.length; index += 1) {
  		const character = body[index];
  		if (character !== "\\") {
  			result += character;
  			continue;
  		}
  		const escape = body[index + 1];
  		index += 1;
  		switch (escape) {
  			case "\"":
  			case "\\":
  			case "/":
  				result += escape;
  				break;
  			case "n":
  				result += "\n";
  				break;
  			case "t":
  				result += "	";
  				break;
  			case "r":
  				result += "\r";
  				break;
  			case "0":
  				result += "\0";
  				break;
  			case "u": {
  				const hex = body.slice(index + 1, index + 5);
  				if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new YamlError("Invalid \\u escape.", number);
  				result += String.fromCharCode(parseInt(hex, 16));
  				index += 4;
  				break;
  			}
  			default: throw new YamlError(`Unsupported escape "\\${escape ?? ""}".`, number);
  		}
  	}
  	return result;
  }
  /**
  * The file a calibration is exchanged in: a ROS `camera_info` YAML document.
  *
  * The profile contract is how this extension holds a calibration; it is not a format anyone outside
  * this family reads. A file an operator carries between machines is better written in the format
  * the tools they will meet already read, and for one camera's intrinsics that is the YAML that
  * ROS's `camera_calibration_parsers` reads and writes -- OpenCV-based pipelines, ROS and ROS 2
  * drivers, and SLAM tools load it as it is.
  *
  * ROS carries what projection needs and nothing about when or how the camera was configured, which
  * is exactly what deciding whether a profile still fits requires. Those members travel in one extra
  * top-level mapping, `turbowarp_camera_source`, named after their owner. ROS's reader looks keys up
  * by name and never enumerates the document, so a file with the extra mapping still loads there,
  * and a file without it is still ROS.
  *
  * A file that lacks the mapping altogether cannot become a profile: when it was calibrated and which
  * run it was are required members, and inventing either would turn "unknown" into a record.
  */
  /** The top-level key holding the members ROS has no place for. */
  var CAMERA_INFO_EXTENSION_KEY = "turbowarp_camera_source";
  var MATRIX_TOLERANCE = 1e-6;
  /**
  * Every top-level key a ROS file may have, and the extra mapping.
  *
  * Anything else is refused rather than dropped. A calibration file that carries a key nobody reads
  * is either from a tool that means something by it or has had something pasted into it, and a
  * profile validator that fails closed does not start ignoring members because they arrived in YAML.
  */
  var ROOT_KEYS = /* @__PURE__ */ new Set([
  	"image_width",
  	"image_height",
  	"camera_name",
  	"camera_matrix",
  	"distortion_model",
  	"distortion_coefficients",
  	"rectification_matrix",
  	"projection_matrix",
  	"binning_x",
  	"binning_y",
  	"roi",
  	CAMERA_INFO_EXTENSION_KEY
  ]);
  /** ROS distortion model names, as `sensor_msgs/distortion_models.hpp` spells them. */
  var PLUMB_BOB = "plumb_bob";
  var RATIONAL_POLYNOMIAL = "rational_polynomial";
  var EQUIDISTANT = "equidistant";
  var CameraInfoRejection = class extends Error {
  	constructor(detail) {
  		super(detail.message);
  		this.detail = detail;
  	}
  };
  function refuse(code, path, message) {
  	throw new CameraInfoRejection({
  		code,
  		path,
  		message
  	});
  }
  /**
  * Renders a profile as a ROS `camera_info` YAML document.
  *
  * The layout follows what `camera_calibration_parsers` writes, key for key and in the same order, so
  * the file reads like one ROS produced. The projection matrix is the calibration matrix with a zero
  * fourth column, which is what a monocular camera with no rectification has; binning and region of
  * interest are left out, as ROS treats them as optional.
  *
  * Strings in the extra mapping are always double-quoted. A timestamp left plain is read as a date
  * by YAML 1.1 readers such as PyYAML, and an id made only of digits as a number.
  */
  function serializeCameraInfoYaml(profile) {
  	const { fx, fy, cx, cy, skew } = profile.intrinsics;
  	const { model, coefficients } = rosDistortion(profile);
  	const lines = [
  		`image_width: ${profile.image.width}`,
  		`image_height: ${profile.image.height}`,
  		`camera_name: ${plainOrQuoted(profile.cameraId)}`,
  		...matrix("camera_matrix", 3, 3, [
  			fx,
  			skew,
  			cx,
  			0,
  			fy,
  			cy,
  			0,
  			0,
  			1
  		]),
  		`distortion_model: ${model}`,
  		...matrix("distortion_coefficients", 1, coefficients.length, coefficients),
  		...matrix("rectification_matrix", 3, 3, [
  			1,
  			0,
  			0,
  			0,
  			1,
  			0,
  			0,
  			0,
  			1
  		]),
  		...matrix("projection_matrix", 3, 4, [
  			fx,
  			skew,
  			cx,
  			0,
  			0,
  			fy,
  			cy,
  			0,
  			0,
  			0,
  			1,
  			0
  		]),
  		`${CAMERA_INFO_EXTENSION_KEY}:`,
  		`  schema: ${quoted(profile.schema)}`,
  		`  version: ${profile.version}`,
  		`  profileId: ${quoted(profile.profileId)}`,
  		`  calibratedAt: ${quoted(profile.calibratedAt)}`,
  		`  producer: ${quoted(profile.producer)}`,
  		`  undistorted: ${profile.image.undistorted}`
  	];
  	const capture = profile.capture;
  	if (capture !== void 0) {
  		lines.push("  capture:");
  		if (Object.keys(capture).length === 0) lines[lines.length - 1] += " {}";
  		appendMember(lines, "frameRate", capture.frameRate);
  		appendMember(lines, "facingMode", capture.facingMode);
  		appendMember(lines, "resizeMode", capture.resizeMode);
  		appendMember(lines, "zoom", capture.zoom);
  		appendMember(lines, "focusMode", capture.focusMode);
  		appendMember(lines, "focusDistance", capture.focusDistance);
  	}
  	if (profile.quality !== void 0) {
  		lines.push("  quality:");
  		appendMember(lines, "sampleCount", profile.quality.sampleCount);
  		appendMember(lines, "reprojectionErrorPx", profile.quality.reprojectionErrorPx);
  	}
  	if (profile.device !== void 0) {
  		lines.push("  device:");
  		if (Object.keys(profile.device).length === 0) lines[lines.length - 1] += " {}";
  		appendMember(lines, "label", profile.device.label);
  		appendMember(lines, "deviceId", profile.device.deviceId);
  	}
  	return `${lines.join("\n")}\n`;
  }
  /**
  * Turns a ROS `camera_info` YAML document into a profile document, ready to be validated.
  *
  * Only the shape ROS defines is checked here -- matrix sizes, the fixed entries of the calibration
  * matrix, a rectification that does nothing, a distortion model ROS names. Everything the profile
  * contract says about the values themselves is left to the profile validator, so there is one
  * place that decides whether a calibration is acceptable.
  */
  function readCameraInfoYaml(text) {
  	let parsed;
  	try {
  		parsed = parseYaml(text);
  	} catch (error) {
  		if (error instanceof YamlError) return {
  			ok: false,
  			error: {
  				code: "not-an-object",
  				path: "",
  				message: `The profile is not valid YAML. ${error.message}`
  			}
  		};
  		throw error;
  	}
  	return readCameraInfoDocument(parsed);
  }
  /** Validate a raw ROS mapping without serializing or replacing the editable data. */
  function readCameraInfoDocument(parsed) {
  	try {
  		return {
  			ok: true,
  			document: toProfileDocument(parsed)
  		};
  	} catch (error) {
  		if (error instanceof CameraInfoRejection) return {
  			ok: false,
  			error: error.detail
  		};
  		throw error;
  	}
  }
  function toProfileDocument(parsed) {
  	const root = record(parsed, "");
  	for (const key of Object.keys(root)) if (!ROOT_KEYS.has(key)) refuse("unexpected-field", key, "Unknown member.");
  	readBinningAndRoi(root);
  	const width = root["image_width"];
  	const height = root["image_height"];
  	if (width === void 0) refuse("missing-field", "image_width", "Required member is missing.");
  	if (height === void 0) refuse("missing-field", "image_height", "Required member is missing.");
  	const k = readMatrix(root, "camera_matrix", 3, 3);
  	expectEntries(k, "camera_matrix", [
  		[3, 0],
  		[6, 0],
  		[7, 0],
  		[8, 1]
  	]);
  	if ("rectification_matrix" in root) expectEntries(readMatrix(root, "rectification_matrix", 3, 3), "rectification_matrix", [
  		1,
  		0,
  		0,
  		0,
  		1,
  		0,
  		0,
  		0,
  		1
  	].map((value, index) => [index, value]), "A rectification other than identity belongs to a stereo pair, not to one camera's intrinsics.");
  	if ("projection_matrix" in root) readMatrix(root, "projection_matrix", 3, 4);
  	const distortion = readDistortion(root);
  	const extension = root[CAMERA_INFO_EXTENSION_KEY];
  	if (extension === void 0) refuse("missing-field", CAMERA_INFO_EXTENSION_KEY, "The file is a ROS camera_info document without the calibration record: when it was calibrated and under which camera settings are not known.");
  	const extra = record(extension, CAMERA_INFO_EXTENSION_KEY);
  	const known = /* @__PURE__ */ new Set([
  		"schema",
  		"version",
  		"profileId",
  		"calibratedAt",
  		"producer",
  		"undistorted",
  		"capture",
  		"quality",
  		"device"
  	]);
  	for (const key of Object.keys(extra)) if (!known.has(key)) refuse("unexpected-field", `${CAMERA_INFO_EXTENSION_KEY}.${key}`, "Unknown member.");
  	if (extra["schema"] !== "twcs/camera-intrinsics") refuse("unsupported-schema", `${CAMERA_INFO_EXTENSION_KEY}.schema`, `Expected ${JSON.stringify(CAMERA_INTRINSIC_PROFILE_SCHEMA)}.`);
  	if (extra["version"] !== 1) refuse("unsupported-version", `${CAMERA_INFO_EXTENSION_KEY}.version`, `Expected 1.`);
  	const undistorted = extra["undistorted"] ?? false;
  	return {
  		schema: CAMERA_INTRINSIC_PROFILE_SCHEMA,
  		version: 1,
  		profileId: extra["profileId"],
  		cameraId: root["camera_name"],
  		calibratedAt: extra["calibratedAt"],
  		producer: extra["producer"],
  		cameraModel: "pinhole",
  		image: {
  			width,
  			height,
  			undistorted
  		},
  		intrinsics: {
  			fx: k[0],
  			fy: k[4],
  			cx: k[2],
  			cy: k[5],
  			skew: k[1]
  		},
  		distortion,
  		..."capture" in extra ? { capture: extra["capture"] } : {},
  		..."quality" in extra ? { quality: extra["quality"] } : {},
  		..."device" in extra ? { device: extra["device"] } : {}
  	};
  }
  /**
  * Maps a ROS distortion model onto the profile's.
  *
  * `plumb_bob` coefficients that are all zero read as no distortion. ROS has no model for "none"; a
  * lens-free image is written as plumb_bob with five zeros, and reading it back must not invent a
  * Brown-Conrady lens that happens to do nothing.
  */
  function readDistortion(root) {
  	const rawModel = root["distortion_model"] ?? PLUMB_BOB;
  	const coefficients = readMatrix(root, "distortion_coefficients", 1, void 0);
  	switch (rawModel) {
  		case PLUMB_BOB:
  			if (coefficients.length !== 4 && coefficients.length !== 5) refuse("invalid-distortion", "distortion_coefficients", `plumb_bob takes 5 coefficients, not ${coefficients.length}.`);
  			return isAllZero(coefficients) ? {
  				model: "none",
  				coefficients: []
  			} : {
  				model: "brown-conrady",
  				coefficients
  			};
  		case RATIONAL_POLYNOMIAL:
  			if (coefficients.length !== 8) refuse("invalid-distortion", "distortion_coefficients", `rational_polynomial takes 8 coefficients, not ${coefficients.length}.`);
  			return {
  				model: "brown-conrady",
  				coefficients
  			};
  		case EQUIDISTANT:
  			if (coefficients.length !== 4) refuse("invalid-distortion", "distortion_coefficients", `equidistant takes 4 coefficients, not ${coefficients.length}.`);
  			return {
  				model: "kannala-brandt",
  				coefficients
  			};
  		default: refuse("invalid-distortion", "distortion_model", `Expected ${PLUMB_BOB}, ${RATIONAL_POLYNOMIAL} or ${EQUIDISTANT}.`);
  	}
  }
  /**
  * Binning and a region of interest change which pixels the calibration describes. ROS writes both
  * with their do-nothing values, and only those are accepted: a calibration of a binned or cropped
  * image is a different calibration, and reading it as the full frame's would move the principal
  * point without anyone noticing.
  */
  function readBinningAndRoi(root) {
  	for (const name of ["binning_x", "binning_y"]) {
  		const value = root[name];
  		if (value !== void 0 && value !== 0 && value !== 1) refuse("inconsistent-profile", name, "A binned image is not the image the calibration describes.");
  	}
  	const roi = root["roi"];
  	if (roi === void 0) return;
  	const region = record(roi, "roi");
  	const width = region["width"] ?? 0;
  	const height = region["height"] ?? 0;
  	const offsetX = region["x_offset"] ?? 0;
  	const offsetY = region["y_offset"] ?? 0;
  	const whole = width === 0 && height === 0;
  	const full = width === root["image_width"] && height === root["image_height"];
  	if (offsetX !== 0 || offsetY !== 0 || !(whole || full)) refuse("inconsistent-profile", "roi", "A region of interest is not the image the calibration describes.");
  }
  function rosDistortion(profile) {
  	const coefficients = [...profile.distortion.coefficients];
  	switch (profile.distortion.model) {
  		case "none": return {
  			model: PLUMB_BOB,
  			coefficients: [
  				0,
  				0,
  				0,
  				0,
  				0
  			]
  		};
  		case "kannala-brandt": return {
  			model: EQUIDISTANT,
  			coefficients
  		};
  		case "brown-conrady":
  			if (coefficients.length === 8) return {
  				model: RATIONAL_POLYNOMIAL,
  				coefficients
  			};
  			return {
  				model: PLUMB_BOB,
  				coefficients: coefficients.length === 4 ? [...coefficients, 0] : coefficients
  			};
  	}
  }
  function readMatrix(root, name, rows, cols) {
  	const value = root[name];
  	if (value === void 0) refuse("missing-field", name, "Required member is missing.");
  	const matrix = record(value, name);
  	const declaredRows = matrix["rows"];
  	const declaredCols = matrix["cols"];
  	const data = matrix["data"];
  	if (declaredRows !== rows) refuse("invalid-value", `${name}.rows`, `Expected ${rows}.`);
  	if (cols !== void 0 && declaredCols !== cols) refuse("invalid-value", `${name}.cols`, `Expected ${cols}.`);
  	if (typeof declaredCols !== "number" || !Number.isInteger(declaredCols) || declaredCols < 0) refuse("invalid-value", `${name}.cols`, "Expected a column count.");
  	if (!Array.isArray(data)) refuse("invalid-type", `${name}.data`, "Expected a sequence of numbers.");
  	if (data.length !== rows * declaredCols) refuse("invalid-value", `${name}.data`, `Expected ${rows * declaredCols} numbers for a ${rows}x${declaredCols} matrix, not ${data.length}.`);
  	return data.map((entry, index) => {
  		if (typeof entry !== "number" || !Number.isFinite(entry)) refuse("invalid-type", `${name}.data[${index}]`, "Expected a number.");
  		return entry;
  	});
  }
  function expectEntries(data, name, entries, message) {
  	for (const [index, expected] of entries) if (Math.abs(data[index] - expected) > MATRIX_TOLERANCE) refuse("inconsistent-profile", `${name}.data[${index}]`, message ?? `Expected ${expected}; the value read as ${data[index]}.`);
  }
  function record(value, path) {
  	if (typeof value !== "object" || value === null || Array.isArray(value)) refuse("not-an-object", path, "Expected a mapping.");
  	return value;
  }
  function isAllZero(values) {
  	return values.every((value) => value === 0);
  }
  function matrix(name, rows, cols, data) {
  	return [
  		`${name}:`,
  		`  rows: ${rows}`,
  		`  cols: ${cols}`,
  		`  data: [${data.map(number).join(", ")}]`
  	];
  }
  /** Numbers as JavaScript writes them, which is the shortest text that reads back to the same value. */
  function number(value) {
  	return Object.is(value, -0) ? "0" : String(value);
  }
  function quoted(text) {
  	return JSON.stringify(text);
  }
  /** Camera names are identifiers and read the same plain, which is how ROS writes them. */
  function plainOrQuoted(text) {
  	return /^[A-Za-z][A-Za-z0-9._-]*$/.test(text) && !/^(?:true|false|null|yes|no|on|off|y|n)$/i.test(text) ? text : quoted(text);
  }
  function appendMember(lines, name, value) {
  	if (value === void 0) return;
  	lines.push(`    ${name}: ${typeof value === "string" ? quoted(value) : number(value)}`);
  }
  function bundle(document, filename, variantId) {
  	const source = {
  		repository: "turbowarp-camera-source",
  		path: "schemas/" + filename
  	};
  	return {
  		identity: {
  			ownerId: "turbowarp-camera-source",
  			contractId: "camera-profile",
  			revision: "profile-v0.16.0",
  			variantId
  		},
  		dialect: "2020-12",
  		root: {
  			retrievalUri: document.$id,
  			document,
  			artifact: {
  				role: "canonical-schema",
  				source
  			}
  		},
  		resources: [],
  		provenance: {
  			canonicalSources: [source],
  			generatedFiles: [],
  			referenceSchemas: [],
  			generationSources: []
  		}
  	};
  }
  var cameraProfileSchemaBundles = {
  	twcs: bundle(camera_intrinsics_v1_default, "camera-intrinsics-v1.json", "twcs"),
  	legacy: bundle(editor_legacy_calibration_default, "editor-legacy-calibration.json", "legacy"),
  	ros: bundle(editor_ros_camera_info_default, "editor-ros-camera-info.json", "ros")
  };
  /** Raw edit values stay separate from any normalized profile returned by the owner. */
  function readCameraProfileInput(data) {
  	if (data && typeof data === "object" && Object.hasOwn(data, "image_width")) {
  		const read = readCameraInfoDocument(data);
  		return read.ok ? readCameraProfileDocument(read.document) : read;
  	}
  	return readCameraProfileDocument(data);
  }
  var validateCameraProfileInput = (data) => {
  	const result = readCameraProfileInput(data);
  	return result.ok ? {
  		kind: "valid",
  		issues: []
  	} : {
  		kind: "invalid",
  		issues: [{
  			dataPath: "",
  			ruleId: result.error.code
  		}]
  	};
  };
  function decodeCameraProfileSource(source) {
  	const json = source.trim().startsWith("{");
  	const data = json ? JSON.parse(source.trim()) : parseYaml(source.trim());
  	let variantId;
  	if (!json) variantId = "ros";
  	else if (data && typeof data === "object" && "schema" in data && data.schema === "twcs/camera-intrinsics") variantId = "twcs";
  	else if (data && typeof data === "object" && "schema" in data && data.schema === "twrmc/camera-calibration") variantId = "legacy";
  	else throw new TypeError("Unrecognized camera profile variant.");
  	return {
  		source,
  		format: json ? "json" : "yaml",
  		variantId,
  		data
  	};
  }
  var sourceCompilations = Object.fromEntries(Object.entries(cameraProfileSchemaBundles).map(([key, bundle]) => [key, compileSchemaBundle(bundle)]));
  /** Safe source boundary: preserve raw input separately from diagnostics and normalized values. */
  function validateCameraProfileSource(source, context) {
  	let consumerId;
  	try {
  		const descriptor = Object.getOwnPropertyDescriptor(context, "consumerId");
  		if (descriptor && "value" in descriptor && typeof descriptor.value === "string") consumerId = descriptor.value;
  	} catch {}
  	let decoded;
  	try {
  		decoded = decodeCameraProfileSource(source);
  	} catch (error) {
  		const code = error instanceof TypeError && error.message === "Unrecognized camera profile variant." ? "variant-unrecognized" : "input-format-invalid";
  		return {
  			source,
  			result: {
  				kind: "invalid",
  				diagnostics: [{
  					scope: {
  						identity: {
  							...cameraProfileSchemaBundles.twcs.identity,
  							variantId: "unrecognized"
  						},
  						...consumerId === void 0 ? {} : { consumerId }
  					},
  					phase: "decode",
  					code,
  					dataPath: ""
  				}]
  			}
  		};
  	}
  	const compilation = sourceCompilations[decoded.variantId];
  	if (compilation.kind !== "compiled") return {
  		...decoded,
  		result: compilation
  	};
  	return {
  		...decoded,
  		result: validateSchemaInput(compilation.validator, decoded.data, {
  			context,
  			ownerValidate: validateCameraProfileInput
  		})
  	};
  }
  function checkedSource(value) {
  	return value.result.kind === "valid" ? {
  		source: value.source,
  		result: {
  			kind: "valid",
  			diagnostics: []
  		}
  	} : {
  		source: value.source,
  		result: {
  			kind: value.result.kind,
  			diagnostics: value.result.diagnostics
  		}
  	};
  }
  function createSourceEditorOptions(nowMs = Date.now) {
  	const context = () => ({
  		consumerId: extensionConfig.id,
  		nowMs: nowMs(),
  		settings: null
  	});
  	return [{
  		apiVersion: 1,
  		extensionId: extensionConfig.id,
  		editorId: "camera-profile-source",
  		opcodes: ["registerCameraProfile", "registerCameraProfileAs"].map((opcode) => `${extensionConfig.id}_${opcode}`),
  		bindings: [{
  			argument: "PROFILE_JSON",
  			variants: Object.entries(cameraProfileSchemaBundles).map(([variantId, schemaBundle]) => ({
  				variantId,
  				format: variantId === "ros" ? "yaml" : "json",
  				schemaBundle
  			})),
  			decode: (source) => {
  				const decoded = decodeCameraProfileSource(source);
  				return {
  					...decoded,
  					data: decoded.data
  				};
  			},
  			validateSource: (source, context) => checkedSource(validateCameraProfileSource(source, context))
  		}],
  		validationContext: context
  	}];
  }
  /** Optional capability: old GUIs continue executing blocks without editor registration. */
  function registerSourceEditors(scratch, nowMs = Date.now) {
  	const api = scratch?.gui?.blockEditors;
  	if (api?.apiVersion !== 1 || typeof api.registerSourceEditor !== "function") return () => {};
  	const removers = [];
  	try {
  		for (const options of createSourceEditorOptions(nowMs)) removers.push(api.registerSourceEditor(options));
  	} catch {
  		for (const remove of removers.reverse()) remove();
  		return () => {};
  	}
  	let active = true;
  	return () => {
  		if (active) {
  			active = false;
  			for (const remove of removers.reverse()) remove();
  		}
  	};
  }
  var block_definitions_default = {
  	extensionName: "Camera Source",
  	blocks: [
  		{
  			"opcode": "startSharedCamera",
  			"blockType": "COMMAND",
  			"text": "start shared camera [CAMERA_ID] with device ID [DEVICE_ID]",
  			"arguments": {
  				"CAMERA_ID": {
  					"type": "STRING",
  					"defaultValue": "default"
  				},
  				"DEVICE_ID": {
  					"type": "STRING",
  					"defaultValue": ""
  				}
  			}
  		},
  		{
  			"opcode": "startRequestedSharedCamera",
  			"blockType": "COMMAND",
  			"text": "start shared camera [CAMERA_ID] requested by this page",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "startSharedCameraFromCameraButton",
  			"blockType": "COMMAND",
  			"text": "start shared camera [CAMERA_ID] from the browser's camera button",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "hideCameraButton",
  			"blockType": "COMMAND",
  			"text": "hide the camera button for shared camera [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraButtonAvailable",
  			"blockType": "BOOLEAN",
  			"text": "browser's camera button available?",
  			"arguments": {}
  		},
  		{
  			"opcode": "stopSharedCamera",
  			"blockType": "COMMAND",
  			"text": "stop shared camera [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "isCameraRunning",
  			"blockType": "BOOLEAN",
  			"text": "shared camera [CAMERA_ID] is running?",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraErrorCode",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] error code",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraError",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] error",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraDeviceIdReporter",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] device ID",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "showCameraPreview",
  			"blockType": "COMMAND",
  			"text": "show shared camera [CAMERA_ID] preview flipped [PREVIEW_FLIP]",
  			"arguments": {
  				"CAMERA_ID": {
  					"type": "STRING",
  					"defaultValue": "default"
  				},
  				"PREVIEW_FLIP": {
  					"type": "STRING",
  					"defaultValue": "horizontal",
  					"menu": "flips"
  				}
  			}
  		},
  		{
  			"opcode": "hideCameraPreview",
  			"blockType": "COMMAND",
  			"text": "hide shared camera [CAMERA_ID] preview",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameWidth",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame width",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameHeight",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame height",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameRate",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame rate",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "refreshCameraDevices",
  			"blockType": "COMMAND",
  			"text": "refresh camera devices",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraDeviceCount",
  			"blockType": "REPORTER",
  			"text": "camera device count",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraDeviceIdAt",
  			"blockType": "REPORTER",
  			"text": "camera device ID at [INDEX]",
  			"arguments": { "INDEX": {
  				"type": "STRING",
  				"defaultValue": "1"
  			} }
  		},
  		{
  			"opcode": "cameraDeviceLabelAt",
  			"blockType": "REPORTER",
  			"text": "camera device label at [INDEX]",
  			"arguments": { "INDEX": {
  				"type": "STRING",
  				"defaultValue": "1"
  			} }
  		},
  		{
  			"opcode": "registerCameraProfile",
  			"blockType": "COMMAND",
  			"text": "register camera profile [PROFILE_JSON]",
  			"arguments": { "PROFILE_JSON": {
  				"type": "STRING",
  				"defaultValue": "{}"
  			} }
  		},
  		{
  			"opcode": "registerCameraProfileAs",
  			"blockType": "COMMAND",
  			"text": "register camera profile [PROFILE_JSON] as [CAMERA_ID]",
  			"arguments": {
  				"PROFILE_JSON": {
  					"type": "STRING",
  					"defaultValue": "{}"
  				},
  				"CAMERA_ID": {
  					"type": "STRING",
  					"defaultValue": "default"
  				}
  			}
  		},
  		{
  			"opcode": "forgetCameraProfile",
  			"blockType": "COMMAND",
  			"text": "forget camera profile for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileRegistered",
  			"blockType": "BOOLEAN",
  			"text": "camera [CAMERA_ID] is calibrated?",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileJson",
  			"blockType": "REPORTER",
  			"text": "camera profile JSON for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileYaml",
  			"blockType": "REPORTER",
  			"text": "camera profile YAML for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileError",
  			"blockType": "REPORTER",
  			"text": "camera profile error",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraProfileErrorDetail",
  			"blockType": "REPORTER",
  			"text": "camera profile error detail",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraProfileCompatibility",
  			"blockType": "REPORTER",
  			"text": "camera profile compatibility for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileCompatibilityDetail",
  			"blockType": "REPORTER",
  			"text": "camera profile compatibility detail for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileAdaptation",
  			"blockType": "REPORTER",
  			"text": "camera profile adaptation for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileIntrinsicsJson",
  			"blockType": "REPORTER",
  			"text": "camera intrinsics JSON for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraConditionsJson",
  			"blockType": "REPORTER",
  			"text": "camera conditions JSON for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraConditionsGeneration",
  			"blockType": "REPORTER",
  			"text": "camera conditions generation for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "saveCameraProfile",
  			"blockType": "COMMAND",
  			"text": "save camera profile for [CAMERA_ID] to browser storage",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "restoreStoredCameraProfile",
  			"blockType": "COMMAND",
  			"text": "restore stored camera profile for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "restoreStoredCameraProfileForDevice",
  			"blockType": "COMMAND",
  			"text": "restore stored camera profile calibrated on the device of [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "bindCameraProfileToDevice",
  			"blockType": "COMMAND",
  			"text": "bind camera profile for [CAMERA_ID] to its current device",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraProfileOnDevice",
  			"blockType": "BOOLEAN",
  			"text": "camera profile for [CAMERA_ID] belongs to its current device?",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "storedCameraProfileResult",
  			"blockType": "REPORTER",
  			"text": "stored camera profile result for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "storedCameraProfileDetail",
  			"blockType": "REPORTER",
  			"text": "stored camera profile detail for [CAMERA_ID]",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "storedCameraProfilesGeneration",
  			"blockType": "REPORTER",
  			"text": "stored camera profiles generation",
  			"arguments": {}
  		}
  	],
  	menus: { "flips": {
  		"acceptReporters": true,
  		"items": [
  			"none",
  			"horizontal",
  			"vertical",
  			"both"
  		]
  	} }
  };
  function positiveNumber(value) {
  	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : void 0;
  }
  function nonNegativeNumber(value) {
  	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : void 0;
  }
  function nonEmptyText(value) {
  	if (typeof value !== "string") return void 0;
  	const text = value.trim();
  	return text.length === 0 ? void 0 : text;
  }
  function pixelCount(value) {
  	return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  }
  /**
  * Builds the conditions record.
  *
  * Frame size comes from the delivered frame rather than from the track settings: a track can report
  * a requested size that the browser then satisfies with something else, and the number a consumer
  * has to match its intrinsics against is the size of the image it is actually handed.
  */
  function readCameraConditions(frame, settings = {}) {
  	const label = nonEmptyText(frame.label);
  	const frameRate = positiveNumber(settings.frameRate);
  	const facingMode = nonEmptyText(settings.facingMode);
  	const resizeMode = nonEmptyText(settings.resizeMode);
  	const zoom = positiveNumber(settings.zoom);
  	const focusMode = nonEmptyText(settings.focusMode);
  	const focusDistance = nonNegativeNumber(settings.focusDistance);
  	return {
  		width: pixelCount(frame.width),
  		height: pixelCount(frame.height),
  		deviceId: nonEmptyText(frame.deviceId) ?? nonEmptyText(settings.deviceId) ?? "",
  		previewFlip: frame.previewFlip,
  		...label === void 0 ? {} : { label },
  		...frameRate === void 0 ? {} : { frameRate },
  		...facingMode === void 0 ? {} : { facingMode },
  		...resizeMode === void 0 ? {} : { resizeMode },
  		...zoom === void 0 ? {} : { zoom },
  		...focusMode === void 0 ? {} : { focusMode },
  		...focusDistance === void 0 ? {} : { focusDistance }
  	};
  }
  /** Zoom readings are device-reported floats; compare them with a tolerance rather than exactly. */
  var ZOOM_TOLERANCE = 1e-6;
  var FOCUS_DISTANCE_TOLERANCE = 1e-6;
  function finding(code, state, decisive, detail) {
  	return {
  		code,
  		state,
  		decisive,
  		detail
  	};
  }
  function describe(value) {
  	return value === void 0 ? "not reported" : String(value);
  }
  /**
  * Compares one optical member.
  *
  * Absent on both sides is agreement, not ignorance: the device reported no such control when the
  * calibration was solved and reports none now. Present on one side only is a change nobody can
  * quantify, so it is left unknown rather than guessed in either direction.
  */
  function compareMember(code, name, recorded, observed, equal) {
  	if (recorded === void 0 && observed === void 0) return finding(code, "matched", true, `Neither the profile nor the camera reports ${name}.`);
  	if (recorded === void 0 || observed === void 0) return finding(code, "unknown", true, `${name} is ${describe(recorded)} in the profile and ${describe(observed)} now, so the two cannot be compared.`);
  	const same = equal(recorded, observed);
  	return finding(code, same ? "matched" : "mismatched", true, same ? `${name} is ${describe(observed)} in both.` : `${name} was ${describe(recorded)} at calibration and is ${describe(observed)} now.`);
  }
  var sameText = (left, right) => left === right;
  var nearlyEqual = (tolerance) => (left, right) => Math.abs(left - right) <= tolerance;
  function captureFindings(capture, conditions) {
  	return [
  		compareMember("resize-mode", "Resize mode", capture.resizeMode, conditions.resizeMode, sameText),
  		compareMember("zoom", "Zoom", capture.zoom, conditions.zoom, nearlyEqual(ZOOM_TOLERANCE)),
  		compareMember("focus-mode", "Focus mode", capture.focusMode, conditions.focusMode, sameText),
  		compareMember("focus-distance", "Focus distance", capture.focusDistance, conditions.focusDistance, nearlyEqual(FOCUS_DISTANCE_TOLERANCE))
  	];
  }
  function imageSizeFinding(profile, conditions) {
  	const expected = `${profile.image.width}x${profile.image.height}`;
  	if (conditions.width === 0 || conditions.height === 0) return finding("image-size", "unknown", true, `The camera has delivered no frame yet, so its size cannot be compared with the calibrated ${expected}.`);
  	const actual = `${conditions.width}x${conditions.height}`;
  	return actual === expected ? finding("image-size", "matched", true, `The frame is ${actual}, as calibrated.`) : finding("image-size", "mismatched", true, `The calibration was solved at ${expected} and the camera now delivers ${actual}.`);
  }
  function deviceFindings(profile, conditions) {
  	const recordedLabel = profile.device?.label;
  	const observedLabel = conditions.label;
  	const label = recordedLabel !== void 0 && observedLabel !== void 0 ? finding("device-label", recordedLabel === observedLabel ? "matched" : "mismatched", true, recordedLabel === observedLabel ? `The camera still reports itself as ${observedLabel}.` : `The profile was solved on ${recordedLabel} and the camera now reports ${observedLabel}.`) : finding("device-label", "unknown", false, "A device label is missing on one side, which is normal before the browser grants camera permission.");
  	const recordedId = profile.device?.deviceId;
  	const observedId = conditions.deviceId.length === 0 ? void 0 : conditions.deviceId;
  	return [label, finding("device-id", recordedId !== void 0 && observedId !== void 0 && recordedId === observedId ? "matched" : "unknown", false, "A device id is scoped to one browser and profile, so it changes without the camera changing. It is a hint for ordering candidates, never proof of identity.")];
  }
  /**
  * Judges a profile against the conditions a camera reports.
  *
  * The verdict is `incompatible` when any decisive finding mismatched, `undetermined` when any
  * decisive finding could not be settled, and `compatible` only when every decisive finding matched.
  * Unknown never resolves upward into `compatible`.
  */
  function evaluateProfileCompatibility(profile, conditions) {
  	const findings = [imageSizeFinding(profile, conditions)];
  	if (profile.image.undistorted) findings.push(finding("undistorted-frames", "unknown", true, "The profile describes already undistorted images. This extension hands over the camera frames as captured and cannot confirm that something upstream corrects them."));
  	if (profile.capture === void 0) findings.push(finding("capture-conditions", "unknown", true, "The profile records no capture conditions, so whether the optics are configured as they were at calibration cannot be decided."));
  	else findings.push(...captureFindings(profile.capture, conditions));
  	findings.push(finding("frame-rate", "matched", false, `Frame rate was ${describe(profile.capture?.frameRate)} at calibration and is ${describe(conditions.frameRate)} now. It does not change how the lens projects.`), finding("facing-mode", "matched", false, `Facing mode was ${describe(profile.capture?.facingMode)} at calibration and is ${describe(conditions.facingMode)} now.`), ...deviceFindings(profile, conditions));
  	const decisive = findings.filter((entry) => entry.decisive);
  	return {
  		state: decisive.some((entry) => entry.state === "mismatched") ? "incompatible" : decisive.some((entry) => entry.state === "unknown") ? "undetermined" : "compatible",
  		findings
  	};
  }
  /** The findings that decided the verdict, in the order they were made. */
  function decisiveFindings(report) {
  	return report.findings.filter((entry) => entry.decisive && entry.state !== "matched");
  }
  /** Aspect ratios are compared with a tolerance; reported sizes are whole pixels. */
  var ASPECT_TOLERANCE = .001;
  function adaptProfileToConditions(profile, conditions) {
  	const { width: calibratedWidth, height: calibratedHeight } = profile.image;
  	const { width, height } = conditions;
  	if (width === 0 || height === 0) return {
  		state: "unavailable",
  		code: "no-frame",
  		width,
  		height,
  		scale: 1,
  		detail: "The camera has delivered no frame yet, so there is no size to adapt to."
  	};
  	if (width === calibratedWidth && height === calibratedHeight) return {
  		state: "exact",
  		code: "exact",
  		intrinsics: profile.intrinsics,
  		width,
  		height,
  		scale: 1,
  		detail: `The frame is ${width}x${height}, as calibrated.`
  	};
  	if (profile.image.undistorted) return {
  		state: "unavailable",
  		code: "undistorted-frames",
  		width,
  		height,
  		scale: 1,
  		detail: "The profile describes already undistorted images, so it cannot be re-expressed for a different frame size here."
  	};
  	if (profile.capture?.resizeMode === "crop-and-scale") return {
  		state: "unavailable",
  		code: "cropped",
  		width,
  		height,
  		scale: 1,
  		detail: "The track was calibrated with crop-and-scale resizing, so a different frame size may be a crop rather than a scale and the principal point cannot be placed."
  	};
  	const scaleX = width / calibratedWidth;
  	const scaleY = height / calibratedHeight;
  	if (Math.abs(scaleX - scaleY) > ASPECT_TOLERANCE) return {
  		state: "unavailable",
  		code: "aspect-changed",
  		width,
  		height,
  		scale: 1,
  		detail: `The calibrated ${calibratedWidth}x${calibratedHeight} and the current ${width}x${height} have different aspect ratios, so the difference is not a scale.`
  	};
  	const scale = (scaleX + scaleY) / 2;
  	return {
  		state: "scaled",
  		code: "uniform-scale",
  		intrinsics: scaleIntrinsics(profile.intrinsics, scale),
  		width,
  		height,
  		scale,
  		detail: `The calibrated ${calibratedWidth}x${calibratedHeight} has been scaled by ${scale} to the current ${width}x${height}.`
  	};
  }
  function scaleIntrinsics(intrinsics, scale) {
  	return {
  		fx: intrinsics.fx * scale,
  		fy: intrinsics.fy * scale,
  		cx: intrinsics.cx * scale,
  		cy: intrinsics.cy * scale,
  		skew: intrinsics.skew
  	};
  }
  /**
  * The intrinsics to use, if there are any.
  *
  * Both conditions have to hold, and they are different questions. Compatibility asks whether this
  * profile describes this camera as it is configured now; adaptation asks whether the numbers can be
  * expressed for the frame size in front of us. A profile can fit the camera and still have no usable
  * form — a crop, say — and it can adapt cleanly while belonging to a different camera entirely.
  *
  * Returning undefined rather than the stored numbers is the whole point. Intrinsics from another
  * configuration do not fail visibly: they project, and the geometry that comes back looks like a
  * slightly different camera pose rather than like a mistake.
  */
  function usableIntrinsics(compatibility, adaptation) {
  	if (compatibility.state !== "compatible") return void 0;
  	if (adaptation.intrinsics === void 0) return void 0;
  	return {
  		...adaptation.intrinsics,
  		width: adaptation.width,
  		height: adaptation.height,
  		scale: adaptation.scale,
  		adaptation: adaptation.state
  	};
  }
  /**
  * The profiles this runtime knows about.
  *
  * Producer-agnostic by construction: a profile arrives as a document that
  * either passes validation or does not, and nothing here can tell chessboard
  * calibration from an operator pasting JSON. Naming a producing extension would
  * undo the split that keeps this package free of runtime dependencies.
  *
  * Registration is keyed by `cameraId`, not by `profileId`: a camera has one
  * calibration in force at a time, and a fresh solve replaces the previous one
  * rather than accumulating beside it.
  */
  var CameraProfileRegistry = class {
  	constructor() {
  		this.profiles = /* @__PURE__ */ new Map();
  	}
  	/**
  	* Validates a document and, only if it passes, stores it.
  	*
  	* Both the current contract and the `twrmc/camera-calibration` file an operator may still be
  	* carrying are accepted; the second is converted on the way in, dropping the world pose it
  	* carried rather than letting a stale extrinsic arrive as a placement.
  	*
  	* Nothing is written before the document has been checked. A half-registered
  	* profile would be indistinguishable from a good one at the point of use.
  	*/
  	register(document) {
  		const result = readCameraProfileDocument(document);
  		if (!result.ok) return result;
  		this.profiles.set(result.profile.cameraId, result.profile);
  		return result;
  	}
  	forget(cameraId) {
  		return this.profiles.delete(cameraId.trim());
  	}
  	clear() {
  		this.profiles.clear();
  	}
  	get(cameraId) {
  		return this.profiles.get(cameraId.trim());
  	}
  	has(cameraId) {
  		return this.profiles.has(cameraId.trim());
  	}
  	cameraIds() {
  		return [...this.profiles.keys()].sort();
  	}
  	/**
  	* The profile for a camera, judged against how that camera is configured now.
  	*
  	* Absent when the camera has never been calibrated. Callers that need one say so themselves.
  	*/
  	assess(cameraId, conditions) {
  		const profile = this.get(cameraId);
  		if (!profile) return void 0;
  		const compatibility = evaluateProfileCompatibility(profile, conditions);
  		const adaptation = adaptProfileToConditions(profile, conditions);
  		const usable = usableIntrinsics(compatibility, adaptation);
  		return {
  			profile,
  			compatibility,
  			adaptation,
  			...usable === void 0 ? {} : { usable }
  		};
  	}
  };
  /**
  * Profile text as an operator hands it over: a ROS `camera_info` YAML file, or profile JSON.
  *
  * The operator does not know which one a file is and should not have to. JSON always starts with a
  * brace; a calibration YAML file never does, because its top level is a block mapping. That one
  * character decides, and each branch names what it expected when the text is not what it looked
  * like.
  */
  function readProfileText(text) {
  	const trimmed = text.trim();
  	if (trimmed.length === 0) return {
  		ok: false,
  		error: {
  			code: "not-an-object",
  			path: "",
  			message: "The profile is empty."
  		}
  	};
  	if (trimmed.startsWith("{")) try {
  		return {
  			ok: true,
  			document: JSON.parse(trimmed)
  		};
  	} catch {
  		return {
  			ok: false,
  			error: {
  				code: "not-an-object",
  				path: "",
  				message: "The profile is not valid JSON."
  			}
  		};
  	}
  	return readCameraInfoYaml(trimmed);
  }
  /**
  * Profiles kept in the browser between sessions.
  *
  * A cache, not a backup. IndexedDB belongs to one origin in one browser profile, and the browser may
  * evict it; the exported file stays the thing an operator keeps. What this buys is the common case:
  * the calibration app and the app that uses its result are served from the same origin, so a solve
  * saved in one window can be picked up by the other without a file changing hands.
  *
  * The store holds documents and says nothing about whether one fits a camera. That is decided when
  * a profile is restored, against the camera as it is then, by the same validation and compatibility
  * rules every other way in goes through.
  */
  var cameraProfileDatabaseName = "kubohiroya-camera-source";
  var cameraProfileObjectStoreName = "camera-profiles";
  /** Other windows on the same origin hear about a save here. The message is `{profileId}`. */
  var cameraProfileChannelName = "kubohiroya-camera-source:camera-profiles";
  function isText(value) {
  	return typeof value === "string";
  }
  /**
  * Whether a value read back has the shape of a record.
  *
  * The database outlives this build. Anything another version, or a developer console, left behind is
  * skipped here rather than handed on as if this build had written it.
  */
  function isStoredCameraProfile(value) {
  	if (typeof value !== "object" || value === null) return false;
  	const record = value;
  	return isText(record["profileId"]) && isText(record["cameraId"]) && isText(record["calibratedAt"]) && isText(record["savedAt"]) && isText(record["document"]) && (record["deviceLabel"] === void 0 || isText(record["deviceLabel"]));
  }
  function settle(request) {
  	return new Promise((resolve, reject) => {
  		request.onsuccess = () => resolve(request.result);
  		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("IndexedDB request failed."));
  	});
  }
  /**
  * The IndexedDB store.
  *
  * The database is opened on first use, not on construction: every project that loads this extension
  * would otherwise create it, including the ones that never save a profile. A failed open is not
  * remembered, so a later call gets another attempt instead of inheriting one bad moment for good.
  */
  function createIndexedDbCameraProfileStore(factory = globalThis.indexedDB) {
  	let opening;
  	const database = () => {
  		if (!factory) return Promise.reject(/* @__PURE__ */ new Error("IndexedDB is not available."));
  		if (!opening) {
  			const request = factory.open(cameraProfileDatabaseName, 1);
  			request.onupgradeneeded = () => {
  				if (!request.result.objectStoreNames.contains("camera-profiles")) request.result.createObjectStore(cameraProfileObjectStoreName, { keyPath: "profileId" });
  			};
  			opening = settle(request).then((db) => {
  				db.onversionchange = () => {
  					db.close();
  					opening = void 0;
  				};
  				return db;
  			});
  			opening.catch(() => {
  				opening = void 0;
  			});
  		}
  		return opening;
  	};
  	return {
  		async list() {
  			return (await settle((await database()).transaction(cameraProfileObjectStoreName, "readonly").objectStore(cameraProfileObjectStoreName).getAll())).filter(isStoredCameraProfile);
  		},
  		async put(record) {
  			const transaction = (await database()).transaction(cameraProfileObjectStoreName, "readwrite");
  			transaction.objectStore(cameraProfileObjectStoreName).put(record);
  			await new Promise((resolve, reject) => {
  				transaction.oncomplete = () => resolve();
  				transaction.onerror = () => reject(transaction.error ?? /* @__PURE__ */ new Error("IndexedDB write failed."));
  				transaction.onabort = () => reject(transaction.error ?? /* @__PURE__ */ new Error("IndexedDB write aborted."));
  			});
  		}
  	};
  }
  /**
  * Where the extension instance puts itself on the VM runtime.
  *
  * Present as soon as the extension is registered. Absent means Camera Source is not loaded, which a
  * consumer has to handle whatever else it does.
  */
  var cameraSourceRuntimeKey = "ext_kubohiroyacamerasource";
  /**
  * Where the versioned capability sits, when the build publishing it has that path enabled.
  *
  * Separate from `cameraSourceRuntimeKey` on purpose. The extension key is present as soon as Camera
  * Source is registered; this one appears only when the calibration profile contract is switched on.
  * A consumer can therefore tell "not loaded" from "loaded, and not offering profiles", and neither
  * has to be reported as the other.
  */
  var cameraSourceCapabilityKey = "kubohiroyaCameraSourceCapability";
  var runtimeCapabilityVersion = 1;
  function createRuntimeCapability(host) {
  	const capability = {
  		version: runtimeCapabilityVersion,
  		requireVersion(version) {
  			if (version !== runtimeCapabilityVersion) throw new Error(`Unsupported Camera Source runtime capability version: ${version}; this build provides ${runtimeCapabilityVersion}.`);
  			return capability;
  		},
  		registerProfile: (document) => host.registerProfile(document),
  		forgetProfile: (cameraId) => host.forgetProfile(cameraId),
  		profileFor: (cameraId) => host.profileFor(cameraId),
  		calibratedCameras: () => host.calibratedCameras(),
  		assessProfile: (cameraId) => host.assessProfile(cameraId),
  		intrinsicsFor: (cameraId) => host.intrinsicsFor(cameraId),
  		conditionsFor: (cameraId) => host.conditionsFor(cameraId),
  		conditionsGeneration: (cameraId) => host.conditionsGeneration(cameraId)
  	};
  	return Object.freeze(capability);
  }
  var FLIPS = [
  	"none",
  	"horizontal",
  	"vertical",
  	"both"
  ];
  function isFlip(value) {
  	return typeof value === "string" && FLIPS.includes(value);
  }
  /** Reads a flip, accepting the boolean the older API used for left-right. */
  function toFlip(value, fallback = "none") {
  	if (isFlip(value)) return value;
  	if (value === true) return "horizontal";
  	if (value === false) return "none";
  	return fallback;
  }
  function flipsHorizontally(flip) {
  	return flip === "horizontal" || flip === "both";
  }
  function flipsVertically(flip) {
  	return flip === "vertical" || flip === "both";
  }
  /** Whether this browser has the capability element at all. */
  function supportsUserMediaElement(view = globalThis) {
  	return "HTMLUserMediaElement" in view;
  }
  /**
  * Places `<usermedia>` in `container` and resolves once the operator has answered.
  *
  * No styling is applied beyond taking the element out of the document flow: the element enforces
  * its own contrast and size rules, and a stylesheet fighting them is how a prompt stops opening.
  */
  function requestUserMedia(options) {
  	const element = options.document.createElement("usermedia");
  	const button = options.document.createElement("button");
  	button.type = "button";
  	button.textContent = options.label;
  	element.append(button);
  	element.style.position = "absolute";
  	element.style.left = "50%";
  	element.style.top = "50%";
  	element.style.transform = "translate(-50%, -50%)";
  	element.style.zIndex = "2";
  	try {
  		element.setConstraints?.({ video: {} });
  	} catch {}
  	let settle = () => {};
  	const settled = new Promise((resolve) => {
  		settle = resolve;
  	});
  	let done = false;
  	const finish = (outcome) => {
  		if (done) return;
  		done = true;
  		element.remove();
  		settle(outcome);
  	};
  	element.addEventListener("stream", () => {
  		const stream = element.stream;
  		if (stream && typeof stream.getTracks === "function") finish({
  			kind: "stream",
  			stream
  		});
  		else finish({
  			kind: "error",
  			code: "usermedia-empty",
  			message: "The camera button returned no stream."
  		});
  	});
  	element.addEventListener("cancel", () => finish({ kind: "cancelled" }));
  	element.addEventListener("error", (event) => {
  		const detail = event.error;
  		const code = typeof detail?.name === "string" && detail.name.length > 0 ? detail.name : "usermedia-error";
  		const message = typeof detail?.message === "string" && detail.message.length > 0 ? detail.message : "The camera button could not open the camera.";
  		finish({
  			kind: "error",
  			code,
  			message
  		});
  	});
  	options.container.append(element);
  	return Object.freeze({
  		dismiss: () => finish({ kind: "cancelled" }),
  		settled
  	});
  }
  var videoLayer = "video";
  var haveCurrentData = 2;
  function videoSkinClass(renderer) {
  	const BaseSkin = renderer.exports?.Skin;
  	if (typeof BaseSkin !== "function") throw new Error("Camera preview requires renderer.exports.Skin.");
  	return class VideoSkin extends BaseSkin {
  		constructor(id, skinRenderer, video, onFrame) {
  			super(id, skinRenderer);
  			this.texture = null;
  			this.textureSize = [0, 0];
  			this.dirty = true;
  			this.disposed = false;
  			this.videoFrameCallbackId = null;
  			this.animationFrameId = null;
  			this.lastCurrentTime = NaN;
  			this.handleVideoFrame = () => {
  				if (this.disposed) return;
  				this.markChanged();
  				this.scheduleFrame();
  			};
  			this.handleAnimationFrame = () => {
  				if (this.disposed) return;
  				if (this.video.currentTime !== this.lastCurrentTime) this.markChanged();
  				this.scheduleFrame();
  			};
  			this.video = video;
  			this.onFrame = onFrame;
  			this.private = true;
  			this.syncMetrics();
  			this.scheduleFrame();
  		}
  		get size() {
  			return this.textureSize;
  		}
  		getTexture() {
  			if (this.disposed || this.video.readyState < haveCurrentData || this.video.videoWidth === 0 || this.video.videoHeight === 0) return null;
  			if (this.syncMetrics()) this.onFrame(true);
  			if (!this.dirty && this.video.currentTime === this.lastCurrentTime) return this.texture;
  			const gl = renderer.gl;
  			if (!this.texture) {
  				this.texture = gl.createTexture();
  				if (!this.texture) throw new Error("Camera preview could not create a WebGL texture.");
  				gl.bindTexture(gl.TEXTURE_2D, this.texture);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  			} else gl.bindTexture(gl.TEXTURE_2D, this.texture);
  			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  			try {
  				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
  			} finally {
  				gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  			}
  			this.dirty = false;
  			this.lastCurrentTime = this.video.currentTime;
  			return this.texture;
  		}
  		dispose() {
  			this.disposed = true;
  			if (this.videoFrameCallbackId !== null && this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.videoFrameCallbackId);
  			if (this.animationFrameId !== null && typeof globalThis.cancelAnimationFrame === "function") globalThis.cancelAnimationFrame(this.animationFrameId);
  			if (this.texture) renderer.gl.deleteTexture(this.texture);
  			this.texture = null;
  			super.dispose();
  		}
  		useNearest() {
  			return false;
  		}
  		updateSilhouette() {}
  		syncMetrics() {
  			const width = this.video.videoWidth;
  			const height = this.video.videoHeight;
  			if (width === this.textureSize[0] && height === this.textureSize[1]) return false;
  			this.textureSize = [width, height];
  			this.rotationCenter[0] = width / 2;
  			this.rotationCenter[1] = height / 2;
  			return true;
  		}
  		/**
  		* Says a new frame arrived, to everything that has to hear it.
  		*
  		* Three separate listeners, and missing any one of them stops the picture
  		* without stopping anything else:
  		*
  		* `dirty` is this skin's own note that the texture it holds is behind the
  		* video. `getTexture` reads it.
  		*
  		* `emitWasAltered` is the renderer's. A renderer that redrew every frame
  		* regardless would not need it, but this one skips the work when nothing
  		* says it changed -- and a video is the one skin whose content changes
  		* without anybody touching a drawable. Without this the preview updated
  		* only when something else forced a redraw, so resizing the stage showed
  		* the current frame and then it froze again. `draw` was still being called
  		* thirty times a second; it was returning immediately every time.
  		*
  		* `onFrame` is the extension's, which asks the VM for a redraw and keeps
  		* the drawable's size in step with the video's.
  		*/
  		markChanged() {
  			this.dirty = true;
  			this.emitWasAltered();
  			this.onFrame(this.syncMetrics());
  		}
  		scheduleFrame() {
  			if (typeof this.video.requestVideoFrameCallback === "function") this.videoFrameCallbackId = this.video.requestVideoFrameCallback(this.handleVideoFrame);
  			else if (typeof globalThis.requestAnimationFrame === "function") this.animationFrameId = globalThis.requestAnimationFrame(this.handleAnimationFrame);
  		}
  	};
  }
  function assertRenderer(renderer) {
  	if (!renderer || !Array.isArray(renderer._allSkins) || !Number.isInteger(renderer._nextSkinId) || typeof renderer.createDrawable !== "function" || typeof renderer.destroyDrawable !== "function" || typeof renderer.destroySkin !== "function" || typeof renderer.getNativeSize !== "function") throw new Error("Camera preview requires a compatible TurboWarp renderer.");
  }
  function createVideoPreview(renderer, video, flip, requestRedraw) {
  	assertRenderer(renderer);
  	const VideoSkin = videoSkinClass(renderer);
  	const skinId = renderer._nextSkinId++;
  	let drawableId;
  	let disposed = false;
  	let previewFlip = flip;
  	let lastLayout = "";
  	const updateLayout = () => {
  		if (drawableId === void 0 || video.videoWidth === 0 || video.videoHeight === 0) return;
  		const [stageWidth, stageHeight] = renderer.getNativeSize();
  		const layout = [
  			video.videoWidth,
  			video.videoHeight,
  			stageWidth,
  			stageHeight,
  			previewFlip
  		].join(":");
  		if (layout === lastLayout) return;
  		const scale = Math.max(stageWidth / video.videoWidth, stageHeight / video.videoHeight) * 100;
  		renderer.updateDrawableScale(drawableId, [flipsHorizontally(previewFlip) ? -scale : scale, flipsVertically(previewFlip) ? -scale : scale]);
  		lastLayout = layout;
  	};
  	const skin = new VideoSkin(skinId, renderer, video, (metricsChanged) => {
  		if (metricsChanged) skin.emitWasAltered();
  		updateLayout();
  		requestRedraw();
  	});
  	renderer._allSkins[skinId] = skin;
  	try {
  		drawableId = renderer.createDrawable(videoLayer);
  		if (drawableId === void 0) throw new Error("Camera preview could not create a video drawable.");
  		renderer.updateDrawableSkinId(drawableId, skinId);
  		renderer.updateDrawablePosition(drawableId, [0, 0]);
  		updateLayout();
  		renderer.updateDrawableVisible(drawableId, true);
  		renderer.markSkinAsPrivate?.(skinId);
  		renderer.markDrawableAsNoninteractive?.(drawableId);
  		requestRedraw();
  	} catch (error) {
  		try {
  			if (drawableId !== void 0) renderer.destroyDrawable(drawableId, videoLayer);
  		} finally {
  			renderer.destroySkin(skinId);
  		}
  		throw error;
  	}
  	return Object.freeze({
  		setFlip: (nextFlip) => {
  			if (disposed || previewFlip === nextFlip) return;
  			previewFlip = nextFlip;
  			updateLayout();
  			requestRedraw();
  		},
  		dispose: () => {
  			if (disposed) return;
  			disposed = true;
  			try {
  				if (drawableId !== void 0) renderer.destroyDrawable(drawableId, videoLayer);
  			} finally {
  				try {
  					renderer.destroySkin(skinId);
  				} finally {
  					requestRedraw();
  				}
  			}
  		}
  	});
  }
  function finite(value) {
  	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
  }
  /** The time of one presented frame, or the previous one when the metadata carries no time. */
  function frameTimeFrom(metadata, timeOriginMs, previous) {
  	const capture = finite(metadata.captureTime);
  	const presentation = finite(metadata.presentationTime);
  	const milliseconds = capture ?? presentation;
  	if (milliseconds === void 0) return previous;
  	return Object.freeze({
  		timestampUs: Math.round((timeOriginMs + milliseconds) * 1e3),
  		source: capture === void 0 ? "presentation" : "capture",
  		presentedFrames: finite(metadata.presentedFrames) ?? (previous?.presentedFrames ?? 0) + 1
  	});
  }
  /**
  * Follows one video element for as long as its camera runs.
  *
  * Nothing is recorded where the browser has no `requestVideoFrameCallback`; frame sources then carry
  * no time, which a consumer has to treat as unknown rather than as now.
  */
  var FrameTimeWatcher = class {
  	constructor(element, timeOriginMs) {
  		this.disposed = false;
  		this.element = element;
  		this.timeOriginMs = timeOriginMs;
  		this.schedule();
  	}
  	latest() {
  		return this.frame;
  	}
  	dispose() {
  		this.disposed = true;
  		if (this.handle !== void 0) {
  			this.element.cancelVideoFrameCallback(this.handle);
  			this.handle = void 0;
  		}
  	}
  	schedule() {
  		if (this.disposed || typeof this.element.requestVideoFrameCallback !== "function") return;
  		this.handle = this.element.requestVideoFrameCallback((_now, metadata) => {
  			this.handle = void 0;
  			this.frame = frameTimeFrom(metadata, this.timeOriginMs, this.frame);
  			this.schedule();
  		});
  	}
  };
  var blockDefinitions = block_definitions_default.blocks;
  var menuDefinitions = block_definitions_default.menus;
  /**
  * The documentation site this extension's palette button opens, and the icon the palette draws
  * on every block. Hosts that bundle several extensions read both out of `getInfo()`, so a
  * bundled Camera Source without them loses its docs button in the host's palette.
  */
  var EXTENSION_DOCS_URI = "https://kubohiroya.github.io/turbowarp-camera-source/";
  var BLOCK_ICON_URI = `data:image/svg+xml,${encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><g fill=\"none\" stroke=\"#fff\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 20h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z\"/><path d=\"m40 29 14-9v24l-14-9\"/></g></svg>")}`;
  var defaultCameraId = "default";
  function mediaDevices() {
  	const devices = globalThis.navigator?.mediaDevices;
  	if (!devices || typeof devices.getUserMedia !== "function") throw new Error("Camera Source requires navigator.mediaDevices.getUserMedia.");
  	return devices;
  }
  function normalizeId(value, fallback = defaultCameraId) {
  	return String(value ?? "").trim() || fallback;
  }
  /**
  * The camera a page was opened for, from its query parameters.
  *
  * Returns only what was named, so a page opened without parameters starts a camera exactly as the
  * plain block does. A size or rate that is not a positive number is ignored rather than guessed.
  */
  function requestedCamera(search) {
  	let parameters;
  	try {
  		parameters = new URLSearchParams(search);
  	} catch {
  		return {};
  	}
  	const deviceId = optionalText(parameters.get("cameraDeviceId"));
  	const video = {};
  	if (deviceId) video.deviceId = { exact: deviceId };
  	const ideal = (name) => {
  		const value = Number(parameters.get(name) ?? "");
  		return Number.isFinite(value) && value > 0 ? value : void 0;
  	};
  	const width = ideal("cameraWidth");
  	const height = ideal("cameraHeight");
  	const frameRate = ideal("cameraFrameRate");
  	if (width !== void 0) video.width = { ideal: width };
  	if (height !== void 0) video.height = { ideal: height };
  	if (frameRate !== void 0) video.frameRate = { ideal: frameRate };
  	if (Object.keys(video).length === 0) return {};
  	return {
  		...deviceId ? { deviceId } : {},
  		video
  	};
  }
  function optionalText(value) {
  	return String(value ?? "").trim();
  }
  function indexFrom(value) {
  	const parsed = Number.parseInt(String(value ?? ""), 10);
  	return Number.isFinite(parsed) ? parsed - 1 : -1;
  }
  function videoConstraints(options) {
  	if (typeof options.video === "object" && options.video !== null) return {
  		audio: false,
  		video: options.video
  	};
  	if (options.deviceId) return {
  		audio: false,
  		video: { deviceId: { exact: options.deviceId } }
  	};
  	return {
  		audio: false,
  		video: options.video ?? true
  	};
  }
  /**
  * The flip a `show preview` block asked for.
  *
  * The menu accepts reporters, so the value can arrive as any string a project computed. Anything
  * outside the vocabulary falls back to horizontal rather than silently drawing the preview
  * unflipped: a project that asked for a flip and got none would look like the camera was wrong.
  */
  function requestedPreviewFlip(args) {
  	return toFlip(args.PREVIEW_FLIP, "horizontal");
  }
  /** The preview flip a consumer asked for through the runtime API. */
  function previewFlipOf(options) {
  	return toFlip(options.previewFlip);
  }
  /** The document with its camera id replaced, or the value untouched when it is not an object. */
  function rebindCameraId(document, cameraId) {
  	if (typeof document !== "object" || document === null || Array.isArray(document)) return document;
  	return {
  		...document,
  		cameraId
  	};
  }
  function parseJson(text) {
  	try {
  		return {
  			ok: true,
  			value: JSON.parse(text)
  		};
  	} catch {
  		return { ok: false };
  	}
  }
  /** Which saved profile, in words an operator can match against the file they exported. */
  function describeStoredProfile(profile) {
  	const label = profile.device?.label;
  	return `Profile ${profile.profileId} calibrated at ${profile.calibratedAt}${label ? ` on ${label}` : ""}.`;
  }
  function compatibilityDetail(report) {
  	const findings = decisiveFindings(report);
  	if (findings.length === 0) return "The profile matches the camera as configured.";
  	return findings.map((entry) => entry.detail).join(" ");
  }
  /**
  * Newest calibration first.
  *
  * Timestamps are compared as instants, so an offset other than `Z` still sorts where it belongs. One
  * that does not parse sorts last: it cannot be shown to be newer than anything.
  */
  function newestFirst(left, right) {
  	const instant = (text) => {
  		const value = Date.parse(text);
  		return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  	};
  	const byCalibration = instant(right.calibratedAt) - instant(left.calibratedAt);
  	if (byCalibration !== 0 && !Number.isNaN(byCalibration)) return byCalibration;
  	return instant(right.savedAt) - instant(left.savedAt) || 0;
  }
  function cameraFailure(error) {
  	if (error instanceof Error) return {
  		code: error.name || "Error",
  		message: error.message
  	};
  	return {
  		code: "Error",
  		message: String(error)
  	};
  }
  var CameraSourceExtension = class {
  	constructor(options = {}) {
  		this.sessions = /* @__PURE__ */ new Map();
  		this.blockLeases = /* @__PURE__ */ new Map();
  		this.blockPreviewLeases = /* @__PURE__ */ new Map();
  		this.blockPreviewRevisions = /* @__PURE__ */ new Map();
  		this.cameraFailures = /* @__PURE__ */ new Map();
  		this.cameraButtons = /* @__PURE__ */ new Map();
  		this.profiles = new CameraProfileRegistry();
  		this.generations = /* @__PURE__ */ new Map();
  		this.lastConditions = /* @__PURE__ */ new Map();
  		this.assessments = /* @__PURE__ */ new Map();
  		this.devices = [];
  		this.storedProfileOutcomes = /* @__PURE__ */ new Map();
  		this.storedProfilesGeneration = 0;
  		this.removeFixedEditors = () => {};
  		this.dispose = () => {
  			this.removeFixedEditors();
  			this.removeSourceEditors();
  			this.stopAllCameras();
  			const runtime = Scratch.vm.runtime;
  			if (runtime["kubohiroyaCameraSourceCapability"] === this.capability) delete runtime[cameraSourceCapabilityKey];
  			this.profileChannel?.close();
  			Scratch.vm.runtime.off?.("PROJECT_STOP_ALL", this.handleProjectBoundary);
  			Scratch.vm.runtime.off?.("PROJECT_LOADED", this.handleProjectBoundary);
  			Scratch.vm.runtime.off?.("RUNTIME_DISPOSED", this.dispose);
  		};
  		this.handleProjectBoundary = () => {
  			this.stopAllCameras();
  			this.profileError = void 0;
  			this.storedProfileOutcomes.clear();
  		};
  		this.removeSourceEditors = registerSourceEditors(Scratch);
  		try {
  			this.removeFixedEditors = registerFixedInputEditors(Scratch, fixedInputEditors);
  			this.profileStore = options.profileStore ?? createIndexedDbCameraProfileStore();
  			this.profileChannel = this.openProfileChannel();
  			Scratch.vm.runtime[cameraSourceRuntimeKey] = this;
  			this.capability = createRuntimeCapability({
  				registerProfile: (document) => this.profiles.register(document),
  				forgetProfile: (cameraId) => this.profiles.forget(cameraId),
  				profileFor: (cameraId) => this.profiles.get(cameraId),
  				calibratedCameras: () => this.profiles.cameraIds(),
  				assessProfile: (cameraId) => {
  					return this.assessmentOf(cameraId);
  				},
  				intrinsicsFor: (cameraId) => this.intrinsicsOf(cameraId),
  				conditionsFor: (cameraId) => this.conditionsOf(cameraId),
  				conditionsGeneration: (cameraId) => this.generationOf(cameraId)
  			});
  			Scratch.vm.runtime[cameraSourceCapabilityKey] = this.capability;
  			Scratch.vm.runtime.on?.("PROJECT_STOP_ALL", this.handleProjectBoundary);
  			Scratch.vm.runtime.on?.("PROJECT_LOADED", this.handleProjectBoundary);
  			Scratch.vm.runtime.on?.("RUNTIME_DISPOSED", this.dispose);
  		} catch (error) {
  			this.dispose();
  			throw error;
  		}
  	}
  	getInfo() {
  		return {
  			id: extensionConfig.id,
  			name: Scratch.translate(block_definitions_default.extensionName),
  			docsURI: EXTENSION_DOCS_URI,
  			blockIconURI: BLOCK_ICON_URI,
  			blocks: blockDefinitions.map((block) => this.toScratchBlock(block)),
  			menus: Object.fromEntries(Object.entries(menuDefinitions).map(([id, menu]) => [id, {
  				acceptReporters: menu.acceptReporters,
  				items: [...menu.items]
  			}]))
  		};
  	}
  	isCameraRunning(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		return session?.stream ? this.isStreamRunning(session.stream) : false;
  	}
  	cameraErrorCode(args = {}) {
  		return this.cameraFailures.get(normalizeId(args.CAMERA_ID))?.code ?? "";
  	}
  	cameraError(args = {}) {
  		return this.cameraFailures.get(normalizeId(args.CAMERA_ID))?.message ?? "";
  	}
  	cameraDeviceIdReporter(args = {}) {
  		return this.sessions.get(normalizeId(args.CAMERA_ID))?.activeDeviceId ?? "";
  	}
  	cameraFrameWidth(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		if (!session?.stream) return 0;
  		return session.video?.videoWidth || this.trackSetting(session, "width");
  	}
  	cameraFrameHeight(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		if (!session?.stream) return 0;
  		return session.video?.videoHeight || this.trackSetting(session, "height");
  	}
  	cameraFrameRate(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		return session?.stream ? this.trackSetting(session, "frameRate") : 0;
  	}
  	async startSharedCamera(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		if (this.blockLeases.has(cameraId)) return;
  		const deviceId = optionalText(args.DEVICE_ID);
  		const options = {
  			owner: "camera-source-block",
  			cameraId
  		};
  		if (deviceId) options.deviceId = deviceId;
  		const lease = await this.acquireCamera(options);
  		this.blockLeases.set(cameraId, lease);
  	}
  	async acquireCamera(options = {}) {
  		const cameraId = normalizeId(options.cameraId);
  		const session = this.session(cameraId);
  		if (session.startPromise) await session.startPromise;
  		else if (!session.stream) await this.start(session, options);
  		return this.lease(session, options);
  	}
  	/**
  	* Shares a stream the caller already holds, under a camera id, without opening a camera.
  	*
  	* Refuses when the id already runs a different stream rather than quietly joining it: the caller
  	* asked for its own stream to be shared, and answering with somebody else's would leave it
  	* believing a stream is in use that nobody reads. Adopting the same stream twice is the one case
  	* that joins, because that is what the caller asked for and already got.
  	*/
  	async adoptCamera(options) {
  		const stream = options?.stream;
  		if (typeof stream !== "object" || stream === null || typeof stream.getTracks !== "function") throw new TypeError("Camera Source adoptCamera requires a MediaStream.");
  		const cameraId = normalizeId(options.cameraId);
  		const session = this.session(cameraId);
  		if (session.startPromise) await session.startPromise;
  		if (session.stream && session.stream !== stream) throw new Error(`Camera id ${cameraId} already runs another stream. Release its leases before adopting.`);
  		if (!session.stream) await this.adopt(session, stream);
  		return this.lease(session, options);
  	}
  	lease(session, options) {
  		const cameraId = session.cameraId;
  		const token = Symbol(String(options.owner ?? "camera-lease"));
  		session.leases.add(token);
  		try {
  			if (options.preview === true) {
  				session.previewLeases.set(token, previewFlipOf(options));
  				this.ensurePreview(session);
  				session.preview?.setFlip(this.previewFlip(session));
  			}
  		} catch (error) {
  			session.leases.delete(token);
  			session.previewLeases.delete(token);
  			this.stopWhenUnused(session);
  			this.cameraFailures.set(cameraId, cameraFailure(error));
  			throw error;
  		}
  		let released = false;
  		return Object.freeze({
  			getFrameSource: () => this.getFrameSource(session),
  			release: async () => {
  				if (released) return;
  				released = true;
  				session.leases.delete(token);
  				session.previewLeases.delete(token);
  				if (session.previewLeases.size === 0) {
  					session.preview?.dispose();
  					session.preview = null;
  				} else session.preview?.setFlip(this.previewFlip(session));
  				this.stopWhenUnused(session);
  			}
  		});
  	}
  	async showCameraPreview(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const flip = requestedPreviewFlip(args);
  		if (this.blockPreviewLeases.get(cameraId)?.flip === flip) return;
  		const revision = this.nextPreviewBlockRevision(cameraId);
  		const lease = await this.acquireCamera({
  			owner: "camera-source-preview-block",
  			cameraId,
  			preview: true,
  			previewFlip: flip
  		});
  		if (this.blockPreviewRevisions.get(cameraId) !== revision) {
  			await lease.release();
  			return;
  		}
  		const current = this.blockPreviewLeases.get(cameraId);
  		this.blockPreviewLeases.set(cameraId, {
  			lease,
  			flip
  		});
  		await current?.lease.release();
  	}
  	async hideCameraPreview(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		this.nextPreviewBlockRevision(cameraId);
  		const existing = this.blockPreviewLeases.get(cameraId);
  		if (!existing) return;
  		this.blockPreviewLeases.delete(cameraId);
  		await existing.lease.release();
  	}
  	stopSharedCamera(args = {}) {
  		this.stopCameraSession(normalizeId(args.CAMERA_ID));
  	}
  	async refreshCameraDevices() {
  		this.devices = (await mediaDevices().enumerateDevices()).filter((device) => device.kind === "videoinput");
  	}
  	cameraDeviceCount() {
  		return this.devices.length;
  	}
  	cameraDeviceIdAt(args) {
  		return this.devices[indexFrom(args.INDEX)]?.deviceId ?? "";
  	}
  	cameraDeviceLabelAt(args) {
  		return this.devices[indexFrom(args.INDEX)]?.label ?? "";
  	}
  	stopAllCameras() {
  		for (const request of [...this.cameraButtons.values()]) request.dismiss();
  		this.cameraButtons.clear();
  		for (const cameraId of [...this.sessions.keys()]) this.stopCameraSession(cameraId);
  		this.blockLeases.clear();
  		this.blockPreviewLeases.clear();
  	}
  	registerCameraProfile(args = {}) {
  		this.registerProfileText(args.PROFILE_JSON, (document) => document);
  	}
  	/**
  	* Registers a profile under the camera id the project names, whatever id the document carries.
  	*
  	* The id in a document is the name the camera had where it was solved. A calibration app knows one
  	* camera and calls it `default`; the app that uses the result may call the same camera `pose`.
  	* Rebinding happens before validation, so the document is checked as the profile it is about to
  	* become rather than as the one it was.
  	*/
  	registerCameraProfileAs(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		this.registerProfileText(args.PROFILE_JSON, (document) => rebindCameraId(document, cameraId));
  	}
  	/**
  	* Writes the profile registered for a camera to browser storage.
  	*
  	* Only a registered profile can be saved, so whatever reaches storage has already passed
  	* validation. Other windows on the origin are told once the write has committed, not before: a
  	* window that went looking on the strength of an uncommitted write would find nothing and conclude
  	* there was nothing to find.
  	*/
  	async saveCameraProfile(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const profile = this.profiles.get(cameraId);
  		if (!profile) {
  			this.storedProfileOutcomes.set(cameraId, {
  				state: "no-profile",
  				detail: ""
  			});
  			return;
  		}
  		const label = profile.device?.label;
  		const record = {
  			profileId: profile.profileId,
  			cameraId: profile.cameraId,
  			calibratedAt: profile.calibratedAt,
  			savedAt: (/* @__PURE__ */ new Date()).toISOString(),
  			...label === void 0 ? {} : { deviceLabel: label },
  			document: serializeCameraIntrinsicProfile(profile)
  		};
  		try {
  			await this.profileStore.put(record);
  		} catch {
  			this.storedProfileOutcomes.set(cameraId, {
  				state: "unavailable",
  				detail: ""
  			});
  			return;
  		}
  		this.storedProfilesGeneration += 1;
  		this.storedProfileOutcomes.set(cameraId, {
  			state: "saved",
  			detail: describeStoredProfile(profile)
  		});
  		try {
  			this.profileChannel?.postMessage({ profileId: profile.profileId });
  		} catch {}
  	}
  	/**
  	* Registers the newest saved profile that fits the camera as it is configured now.
  	*
  	* Fails closed. Only a `compatible` verdict registers anything; `undetermined` is not a weaker yes,
  	* and a camera that has not delivered a frame yet cannot be shown to match any calibration. When
  	* nothing qualifies, whatever is already registered for the camera stays exactly as it was: a
  	* restore that found nothing usable has no business taking away a profile that was.
  	*
  	* Every candidate is judged against the conditions directly, without going through the registry,
  	* so trying a candidate that loses never displaces the registered one even for a moment.
  	*/
  	async restoreStoredCameraProfile(args = {}) {
  		await this.restoreStoredProfile(normalizeId(args.CAMERA_ID), false);
  	}
  	/**
  	* Like `restore stored camera profile`, but only from profiles calibrated on the device the camera
  	* is running on now.
  	*
  	* Compatibility alone cannot tell two cameras of the same model apart: they report the same label
  	* and the same capture conditions, so either one's calibration reads as `compatible` for the other.
  	* What differs is the device id, which is scoped to this origin and browser profile. That scope is
  	* exactly where browser storage lives, so a profile saved here and a camera opened here agree on it
  	* for as long as the browser keeps both.
  	*
  	* A camera that is not running has no device id, and the answer is then `undetermined`. A profile
  	* brought in from another browser carries another id and is never a candidate; register it with
  	* the file and `bind camera profile ... to its current device` first.
  	*/
  	async restoreStoredCameraProfileForDevice(args = {}) {
  		await this.restoreStoredProfile(normalizeId(args.CAMERA_ID), true);
  	}
  	/**
  	* Records the device the camera is running on in its registered profile.
  	*
  	* For the case where the operator has said which camera a profile belongs to, typically by loading
  	* a file for it. Only a profile `compatible` with the camera as it is now is bound: a profile that
  	* does not fit is not made more trustworthy by naming a device in it. A label the camera reports is
  	* written too when the profile has none; one it already has has been compared and matched.
  	*/
  	bindCameraProfileToDevice(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const profile = this.profiles.get(cameraId);
  		if (!profile) return;
  		const conditions = this.conditionsOf(cameraId);
  		if (conditions.deviceId.length === 0) return;
  		if (evaluateProfileCompatibility(profile, conditions).state !== "compatible") return;
  		const document = JSON.parse(serializeCameraIntrinsicProfile(profile));
  		const label = profile.device?.label ?? conditions.label;
  		document["device"] = {
  			...label === void 0 ? {} : { label },
  			deviceId: conditions.deviceId
  		};
  		this.profiles.register(document);
  	}
  	/** Whether the registered profile was calibrated on, or bound to, the device the camera runs on. */
  	cameraProfileOnDevice(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const deviceId = this.profiles.get(cameraId)?.device?.deviceId;
  		return deviceId !== void 0 && deviceId.length > 0 && deviceId === this.conditionsOf(cameraId).deviceId;
  	}
  	/**
  	* Starts a camera the way the page's query parameters ask, or as `start shared camera` does when
  	* they ask nothing.
  	*
  	* How one app hands a camera to another it opens on the same origin. An app running several USB
  	* cameras opens the lens calibration app for one of them, and the calibration has to be solved on
  	* that device at the size the app will use: a camera the browser picks may be the other camera of
  	* the same model, and a profile solved at another size is `incompatible`.
  	*
  	* `cameraDeviceId` is required exactly. `cameraWidth`, `cameraHeight` and `cameraFrameRate` are
  	* asked for as `ideal`, the way the opening app asked, so the camera settles on the same mode.
  	*/
  	async startRequestedSharedCamera(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		if (this.blockLeases.has(cameraId)) return;
  		const lease = await this.acquireCamera({
  			owner: "camera-source-block",
  			cameraId,
  			...requestedCamera(globalThis.location?.search ?? "")
  		});
  		this.blockLeases.set(cameraId, lease);
  	}
  	/** Whether this browser has the camera button element at all. */
  	cameraButtonAvailable() {
  		return supportsUserMediaElement();
  	}
  	/**
  	* Starts a camera from the browser's own camera button, rather than from `getUserMedia`.
  	*
  	* For a `.sb3` opened in the editor. The document belongs to TurboWarp there, so no host above
  	* the project can place a capability element -- and without one, the browser-managed handover is
  	* closed to the work entirely. #39 kept this element out of the extension so that no extension
  	* could manufacture an operator's intent; placing a block *is* that intent, and the browser still
  	* collects the click and draws the prompt. What the block does is put the element where it can be
  	* clicked.
  	*
  	* A camera id that already runs a stream joins it: a packaged work's host adopted one before the
  	* project started, and asking again would only refuse (`adoptCamera` guards an id against a
  	* second stream). So the same project runs in both distributions with this block in it.
  	*
  	* Nothing here throws into the project. A refusal, an unsupported browser and a failed open all
  	* land in `shared camera error code`, and `start shared camera` remains available.
  	*/
  	async startSharedCameraFromCameraButton(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		if (this.blockLeases.has(cameraId)) return;
  		if (this.sessions.get(cameraId)?.stream) {
  			this.blockLeases.set(cameraId, await this.acquireCamera({
  				owner: "camera-source-block",
  				cameraId
  			}));
  			return;
  		}
  		if (!supportsUserMediaElement()) {
  			this.cameraFailures.set(cameraId, {
  				code: "usermedia-unsupported",
  				message: "This browser has no camera button element."
  			});
  			return;
  		}
  		const container = this.cameraButtonContainer();
  		if (!container) {
  			this.cameraFailures.set(cameraId, {
  				code: "usermedia-no-stage",
  				message: "The stage the camera button would be placed on was not found."
  			});
  			return;
  		}
  		this.cameraButtons.get(cameraId)?.dismiss();
  		const request = requestUserMedia({
  			document,
  			container,
  			label: Scratch.translate("Allow the camera")
  		});
  		this.cameraButtons.set(cameraId, request);
  		const outcome = await request.settled;
  		if (this.cameraButtons.get(cameraId) === request) this.cameraButtons.delete(cameraId);
  		if (outcome.kind === "cancelled") {
  			this.cameraFailures.set(cameraId, {
  				code: "usermedia-cancelled",
  				message: "The camera was not allowed."
  			});
  			return;
  		}
  		if (outcome.kind === "error") {
  			this.cameraFailures.set(cameraId, {
  				code: outcome.code,
  				message: outcome.message
  			});
  			return;
  		}
  		try {
  			this.blockLeases.set(cameraId, await this.adoptCamera({
  				owner: "camera-source-block",
  				cameraId,
  				stream: outcome.stream
  			}));
  		} catch (error) {
  			outcome.stream.getTracks().forEach((track) => track.stop());
  			this.cameraFailures.set(cameraId, cameraFailure(error));
  		}
  	}
  	/** Removes a camera button still waiting for an answer; the script waiting on it continues. */
  	hideCameraButton(args = {}) {
  		this.cameraButtons.get(normalizeId(args.CAMERA_ID))?.dismiss();
  	}
  	/**
  	* Where the camera button goes: the element that holds the stage canvas.
  	*
  	* The preview is a renderer skin, so the extension has had no DOM of its own to hang this on. A
  	* capability element cannot be drawn into WebGL, and the editor's own layout is not ours to
  	* restructure, so it is placed over the canvas and centred, with the element keeping its own look.
  	*/
  	cameraButtonContainer() {
  		const parent = (Scratch.vm.runtime.renderer?.gl?.canvas)?.parentElement ?? null;
  		if (!parent) return null;
  		const style = parent.style;
  		const computed = globalThis.getComputedStyle?.(parent);
  		if (style && computed?.position === "static") style.position = "relative";
  		return parent;
  	}
  	async restoreStoredProfile(cameraId, sameDevice) {
  		let records;
  		try {
  			records = await this.profileStore.list();
  		} catch {
  			this.storedProfileOutcomes.set(cameraId, {
  				state: "unavailable",
  				detail: ""
  			});
  			return;
  		}
  		const conditions = this.conditionsOf(cameraId);
  		if (sameDevice && conditions.deviceId.length === 0) {
  			this.storedProfileOutcomes.set(cameraId, {
  				state: "undetermined",
  				detail: "The camera is not running, so the device a saved profile was calibrated on cannot be compared."
  			});
  			return;
  		}
  		let incompatible;
  		let undetermined;
  		let otherDevices = 0;
  		for (const record of [...records].sort(newestFirst)) {
  			const parsed = parseJson(record.document);
  			if (!parsed.ok) continue;
  			const document = rebindCameraId(parsed.value, cameraId);
  			const result = readCameraProfileDocument(document);
  			if (!result.ok) continue;
  			if (sameDevice && result.profile.device?.deviceId !== conditions.deviceId) {
  				otherDevices += 1;
  				continue;
  			}
  			const report = evaluateProfileCompatibility(result.profile, conditions);
  			if (report.state === "compatible") {
  				this.profiles.register(document);
  				this.storedProfileOutcomes.set(cameraId, {
  					state: "restored",
  					detail: describeStoredProfile(result.profile)
  				});
  				return;
  			}
  			if (report.state === "incompatible") incompatible ?? (incompatible = report);
  			else undetermined ?? (undetermined = report);
  		}
  		const decisive = incompatible ?? undetermined;
  		this.storedProfileOutcomes.set(cameraId, decisive === void 0 ? {
  			state: "none",
  			detail: otherDevices === 0 ? "" : `${otherDevices} saved profile(s) were calibrated on other devices and were not considered.`
  		} : {
  			state: decisive.state,
  			detail: compatibilityDetail(decisive)
  		});
  	}
  	storedCameraProfileResult(args = {}) {
  		return this.storedProfileOutcomes.get(normalizeId(args.CAMERA_ID))?.state ?? "";
  	}
  	storedCameraProfileDetail(args = {}) {
  		return this.storedProfileOutcomes.get(normalizeId(args.CAMERA_ID))?.detail ?? "";
  	}
  	/**
  	* A counter that moves whenever a profile is saved, here or in another window on this origin.
  	*
  	* A project waiting for the calibration app compares this integer rather than polling storage: it
  	* restores when the number moves, and the restore decides whether what arrived is usable.
  	*/
  	storedCameraProfilesGeneration() {
  		return this.storedProfilesGeneration;
  	}
  	forgetCameraProfile(args = {}) {
  		this.profiles.forget(normalizeId(args.CAMERA_ID));
  	}
  	cameraProfileRegistered(args = {}) {
  		return this.profiles.has(normalizeId(args.CAMERA_ID));
  	}
  	cameraProfileJson(args = {}) {
  		const profile = this.profiles.get(normalizeId(args.CAMERA_ID));
  		return profile ? serializeCameraIntrinsicProfile(profile) : "";
  	}
  	/**
  	* The registered profile as a ROS `camera_info` YAML document, which is how a calibration is
  	* written to a file or handed to another machine.
  	*
  	* The standard part loads in ROS and OpenCV-based tools as it is. What deciding compatibility needs
  	* and ROS has no place for travels in the `turbowarp_camera_source` mapping, which ROS's reader
  	* does not look at.
  	*/
  	cameraProfileYaml(args = {}) {
  		const profile = this.profiles.get(normalizeId(args.CAMERA_ID));
  		return profile ? serializeCameraInfoYaml(profile) : "";
  	}
  	cameraProfileError() {
  		return this.profileError?.code ?? "";
  	}
  	cameraProfileErrorDetail() {
  		if (!this.profileError) return "";
  		const { path, message } = this.profileError;
  		return path ? `${path}: ${message}` : message;
  	}
  	cameraProfileCompatibility(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		return this.assessmentOf(cameraId)?.compatibility.state ?? "";
  	}
  	cameraProfileCompatibilityDetail(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const assessment = this.assessmentOf(cameraId);
  		return assessment === void 0 ? "" : compatibilityDetail(assessment.compatibility);
  	}
  	cameraProfileAdaptation(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		return this.assessmentOf(cameraId)?.adaptation.state ?? "";
  	}
  	cameraProfileIntrinsicsJson(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const usable = this.intrinsicsOf(cameraId);
  		return usable === void 0 ? "" : JSON.stringify(usable);
  	}
  	cameraConditionsJson(args = {}) {
  		return JSON.stringify(this.conditionsOf(normalizeId(args.CAMERA_ID)));
  	}
  	cameraConditionsGeneration(args = {}) {
  		return this.generationOf(normalizeId(args.CAMERA_ID));
  	}
  	/**
  	* Registers profile text, whichever of the two forms an operator was handed.
  	*
  	* A ROS `camera_info` YAML file is what the calibration app writes and what leaves the PC; profile
  	* JSON is what this extension renders and stores. Both reach the same validator, so a file is
  	* accepted or refused for the same reasons whichever form it came in.
  	*/
  	registerProfileText(value, prepare) {
  		const parsed = readProfileText(Scratch.Cast.toString(value ?? ""));
  		if (!parsed.ok) {
  			this.profileError = parsed.error;
  			return;
  		}
  		const result = this.profiles.register(prepare(parsed.document));
  		this.profileError = result.ok ? void 0 : result.error;
  	}
  	/**
  	* Listens for saves made in other windows on this origin.
  	*
  	* Absent where the browser has no BroadcastChannel. The generation then moves only for saves made
  	* here, and a project still finds another window's profile the next time it restores.
  	*/
  	openProfileChannel() {
  		const Channel = globalThis.BroadcastChannel;
  		if (typeof Channel !== "function") return void 0;
  		try {
  			const channel = new Channel(cameraProfileChannelName);
  			channel.onmessage = () => {
  				this.storedProfilesGeneration += 1;
  			};
  			return channel;
  		} catch {
  			return;
  		}
  	}
  	/** What the track reports about itself right now. Read only. */
  	intrinsicsOf(cameraId) {
  		const id = normalizeId(cameraId);
  		return this.assessmentOf(id)?.usable;
  	}
  	conditionsOf(cameraId) {
  		const id = normalizeId(cameraId);
  		const session = this.sessions.get(id);
  		if (!session?.stream) return {
  			width: 0,
  			height: 0,
  			deviceId: "",
  			previewFlip: "none"
  		};
  		const track = session.stream.getVideoTracks()[0];
  		let settings = {};
  		try {
  			settings = track?.getSettings() ?? {};
  		} catch {
  			settings = {};
  		}
  		const device = this.devices.find((entry) => entry.deviceId === session.activeDeviceId);
  		return readCameraConditions({
  			width: session.video?.videoWidth ?? 0,
  			height: session.video?.videoHeight ?? 0,
  			deviceId: session.activeDeviceId,
  			previewFlip: this.previewFlip(session),
  			...device?.label ? { label: device.label } : {}
  		}, settings);
  	}
  	/**
  	* A counter that moves when the geometry does.
  	*
  	* Derived by comparing the members that affect projection, so it advances on
  	* a resolution change or a zoom and stays put for a frame rate change. A
  	* consumer holding a placement solved from these conditions compares one
  	* number rather than re-checking each of them.
  	*/
  	/**
  	* The conditions that decide geometry, as one comparable string.
  	*
  	* The preview flip is not among them. It changes how the stage draws the frame and nothing about
  	* how the lens projects, so folding it in would advance the generation and invalidate consumers'
  	* work every time an operator turned the preview over.
  	*/
  	conditionsSignature(conditions) {
  		return JSON.stringify([
  			conditions.width,
  			conditions.height,
  			conditions.resizeMode ?? null,
  			conditions.zoom ?? null,
  			conditions.focusMode ?? null,
  			conditions.focusDistance ?? null,
  			conditions.deviceId
  		]);
  	}
  	/**
  	* The assessment for a camera, reusing the last one while nothing it depends on has changed.
  	*
  	* The conditions are read on every call, so this cannot answer with a stale view of the camera.
  	* What is skipped is the derivation: judging compatibility builds a finding for every member it
  	* compares, each with its own sentence, and these reporters are read from blocks that a project
  	* can evaluate on every frame. Reusing the result while the inputs are identical keeps that off
  	* the frame budget without putting a staleness window in its place.
  	*/
  	assessmentOf(cameraId) {
  		const id = normalizeId(cameraId);
  		const conditions = this.conditionsOf(id);
  		const signature = this.conditionsSignature(conditions);
  		const profile = this.profiles.get(id);
  		const cached = this.assessments.get(id);
  		if (cached && cached.signature === signature && cached.profile === profile) return cached.assessment;
  		const assessment = this.profiles.assess(id, conditions);
  		this.assessments.set(id, {
  			signature,
  			profile,
  			assessment
  		});
  		return assessment;
  	}
  	generationOf(cameraId) {
  		const id = normalizeId(cameraId);
  		const conditions = this.conditionsOf(id);
  		const signature = this.conditionsSignature(conditions);
  		const previous = this.lastConditions.get(id);
  		if (previous === void 0) {
  			this.lastConditions.set(id, signature);
  			this.generations.set(id, 0);
  			return 0;
  		}
  		if (previous === signature) return this.generations.get(id) ?? 0;
  		const next = (this.generations.get(id) ?? 0) + 1;
  		this.lastConditions.set(id, signature);
  		this.generations.set(id, next);
  		return next;
  	}
  	session(cameraId) {
  		const existing = this.sessions.get(cameraId);
  		if (existing) return existing;
  		const session = {
  			cameraId,
  			leases: /* @__PURE__ */ new Set(),
  			previewLeases: /* @__PURE__ */ new Map(),
  			active: true,
  			stream: null,
  			video: null,
  			preview: null,
  			startPromise: null,
  			activeDeviceId: "",
  			frameTimes: null,
  			adopted: false
  		};
  		this.sessions.set(cameraId, session);
  		return session;
  	}
  	/**
  	* Brings a caller's stream into a session, taking the same path `start` takes after acquisition.
  	*
  	* `adopted` is set before anything can fail, so no failure path can reach the tracks.
  	*/
  	async adopt(session, stream) {
  		session.adopted = true;
  		session.startPromise = (async () => {
  			let video = null;
  			try {
  				if (!session.active) throw new Error("Camera adoption was cancelled.");
  				video = document.createElement("video");
  				video.muted = true;
  				video.playsInline = true;
  				video.srcObject = stream;
  				await video.play();
  				if (!session.active) throw new Error("Camera adoption was cancelled.");
  				session.stream = stream;
  				session.video = video;
  				session.frameTimes = new FrameTimeWatcher(video, globalThis.performance?.timeOrigin ?? 0);
  				this.watchStreamEnd(session, stream);
  				this.updateActiveDevice(session);
  				this.cameraFailures.delete(session.cameraId);
  			} catch (error) {
  				if (video) video.srcObject = null;
  				throw error;
  			}
  		})();
  		try {
  			await session.startPromise;
  		} catch (error) {
  			if (this.sessions.get(session.cameraId) === session) this.stopCameraSession(session.cameraId);
  			this.cameraFailures.set(session.cameraId, cameraFailure(error));
  			throw error;
  		}
  	}
  	async start(session, options) {
  		session.startPromise = (async () => {
  			const stream = await mediaDevices().getUserMedia(videoConstraints(options));
  			let video = null;
  			try {
  				if (!session.active) throw new Error("Camera acquisition was cancelled.");
  				video = document.createElement("video");
  				video.muted = true;
  				video.playsInline = true;
  				video.srcObject = stream;
  				await video.play();
  				if (!session.active) throw new Error("Camera acquisition was cancelled.");
  				session.stream = stream;
  				session.video = video;
  				session.frameTimes = new FrameTimeWatcher(video, globalThis.performance?.timeOrigin ?? 0);
  				this.watchStreamEnd(session, stream);
  				this.updateActiveDevice(session);
  				this.cameraFailures.delete(session.cameraId);
  			} catch (error) {
  				stream.getTracks().forEach((track) => track.stop());
  				if (video) video.srcObject = null;
  				throw error;
  			}
  		})();
  		try {
  			await session.startPromise;
  		} catch (error) {
  			if (this.sessions.get(session.cameraId) === session) this.stopCameraSession(session.cameraId);
  			this.cameraFailures.set(session.cameraId, cameraFailure(error));
  			throw error;
  		}
  	}
  	nextPreviewBlockRevision(cameraId) {
  		const revision = (this.blockPreviewRevisions.get(cameraId) ?? 0) + 1;
  		this.blockPreviewRevisions.set(cameraId, revision);
  		return revision;
  	}
  	isStreamRunning(stream) {
  		return stream.active !== false && stream.getVideoTracks().some((track) => track.readyState !== "ended");
  	}
  	watchStreamEnd(session, stream) {
  		const handleEnded = () => {
  			if (this.sessions.get(session.cameraId) !== session || session.stream !== stream) return;
  			if (!this.isStreamRunning(stream)) this.stopCameraSession(session.cameraId);
  		};
  		for (const track of stream.getVideoTracks()) track.addEventListener("ended", handleEnded, { once: true });
  	}
  	updateActiveDevice(session) {
  		const settings = (session.stream?.getVideoTracks()[0] ?? null)?.getSettings();
  		session.activeDeviceId = typeof settings?.deviceId === "string" ? settings.deviceId : "";
  	}
  	trackSetting(session, name) {
  		const value = session.stream?.getVideoTracks()[0]?.getSettings()[name];
  		return typeof value === "number" && Number.isFinite(value) ? value : 0;
  	}
  	ensurePreview(session) {
  		if (session.preview || !session.video) return;
  		const runtime = Scratch.vm.runtime;
  		session.preview = createVideoPreview(runtime.renderer, session.video, this.previewFlip(session), () => runtime.requestRedraw?.());
  	}
  	/**
  	* How the preview is shown for a camera several consumers may be watching.
  	*
  	* Any consumer asking for a flipped preview flips it for everyone, which is
  	* the same rule the previous boolean followed.
  	*/
  	previewFlip(session) {
  		for (const flip of session.previewLeases.values()) if (flip !== "none") return flip;
  		return "none";
  	}
  	getFrameSource(session) {
  		if (!session.video || !session.stream) throw new Error("Shared camera is not running.");
  		const frameTime = session.frameTimes?.latest();
  		return Object.freeze({
  			kind: "video",
  			element: session.video,
  			width: session.video.videoWidth,
  			height: session.video.videoHeight,
  			previewFlip: this.previewFlip(session),
  			deviceId: session.activeDeviceId,
  			...frameTime === void 0 ? {} : { frameTime }
  		});
  	}
  	stopWhenUnused(session) {
  		if (this.sessions.get(session.cameraId) !== session) return;
  		if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
  	}
  	stopCameraSession(cameraId) {
  		const session = this.sessions.get(cameraId);
  		if (!session) return;
  		session.active = false;
  		this.nextPreviewBlockRevision(cameraId);
  		session.preview?.dispose();
  		session.frameTimes?.dispose();
  		session.frameTimes = null;
  		if (!session.adopted) session.stream?.getTracks().forEach((track) => track.stop());
  		if (session.video) session.video.srcObject = null;
  		session.stream = null;
  		session.video = null;
  		session.startPromise = null;
  		session.preview = null;
  		session.activeDeviceId = "";
  		session.leases.clear();
  		session.previewLeases.clear();
  		this.sessions.delete(cameraId);
  		this.blockLeases.delete(cameraId);
  		this.blockPreviewLeases.delete(cameraId);
  		this.assessments.delete(cameraId);
  	}
  	toScratchBlock(block) {
  		return {
  			opcode: block.opcode,
  			blockType: Scratch.BlockType[block.blockType],
  			text: Scratch.translate(block.text),
  			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
  				type: Scratch.ArgumentType[argument.type],
  				defaultValue: argument.defaultValue,
  				...argument.menu === void 0 ? {} : { menu: argument.menu }
  			}]))
  		};
  	}
  };
  if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  Scratch.extensions.register(new CameraSourceExtension());

})(Scratch);
