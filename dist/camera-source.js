// Name: Camera Source
// ID: kubohiroyacamerasource
// Description: Share one MediaDevices camera stream between TurboWarp extensions.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  //#region src/config.ts
  var extensionConfig = {
  	id: "kubohiroyacamerasource",
  	slug: "camera-source",
  	name: "Camera Source",
  	description: "Share one MediaDevices camera stream between TurboWarp extensions.",
  	author: "Hiroya Kubo",
  	license: "MPL-2.0",
  	unsandboxed: true
  };
  var block_definitions_default = {
  	extensionName: "Camera Source",
  	blocks: [
  		{
  			"opcode": "startSharedCamera",
  			"blockType": "COMMAND",
  			"text": "start shared camera [CAMERA_ID] with device ID [DEVICE_ID]",
  			"description": "Starts or keeps a named shared MediaDevices camera stream.",
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
  			"opcode": "stopSharedCamera",
  			"blockType": "COMMAND",
  			"text": "stop shared camera [CAMERA_ID]",
  			"description": "Stops a named shared camera stream and releases its tracks.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "isCameraRunning",
  			"blockType": "BOOLEAN",
  			"text": "shared camera [CAMERA_ID] is running?",
  			"description": "Reports whether a named shared camera stream is active.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraDeviceIdReporter",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] device ID",
  			"description": "Returns the active device ID for a named shared camera when available.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "refreshCameraDevices",
  			"blockType": "COMMAND",
  			"text": "refresh camera devices",
  			"description": "Refreshes the browser camera device list.",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraDeviceCount",
  			"blockType": "REPORTER",
  			"text": "camera device count",
  			"description": "Returns the number of known camera devices after refresh.",
  			"arguments": {}
  		},
  		{
  			"opcode": "cameraDeviceIdAt",
  			"blockType": "REPORTER",
  			"text": "camera device ID at [INDEX]",
  			"description": "Returns the one-based camera device ID at the requested index.",
  			"arguments": { "INDEX": {
  				"type": "STRING",
  				"defaultValue": "1"
  			} }
  		},
  		{
  			"opcode": "cameraDeviceLabelAt",
  			"blockType": "REPORTER",
  			"text": "camera device label at [INDEX]",
  			"description": "Returns the one-based camera device label at the requested index when the browser exposes it.",
  			"arguments": { "INDEX": {
  				"type": "STRING",
  				"defaultValue": "1"
  			} }
  		}
  	]
  };
  //#endregion
  //#region src/extension.ts
  var blockDefinitions = block_definitions_default.blocks;
  var defaultCameraId = "default";
  function mediaDevices() {
  	const devices = globalThis.navigator?.mediaDevices;
  	if (!devices || typeof devices.getUserMedia !== "function") throw new Error("Camera Source requires navigator.mediaDevices.getUserMedia.");
  	return devices;
  }
  function normalizeId(value, fallback = defaultCameraId) {
  	return String(value ?? "").trim() || fallback;
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
  var CameraSourceExtension = class {
  	constructor() {
  		this.sessions = /* @__PURE__ */ new Map();
  		this.blockLeases = /* @__PURE__ */ new Map();
  		this.devices = [];
  		Scratch.vm.runtime.ext_kubohiroyacamerasource = this;
  	}
  	getInfo() {
  		return {
  			id: extensionConfig.id,
  			name: Scratch.translate(block_definitions_default.extensionName),
  			blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
  		};
  	}
  	isCameraRunning(args = {}) {
  		const session = this.sessions.get(normalizeId(args.CAMERA_ID));
  		return Boolean(session?.stream);
  	}
  	cameraDeviceIdReporter(args = {}) {
  		return this.sessions.get(normalizeId(args.CAMERA_ID))?.activeDeviceId ?? "";
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
  		const token = Symbol(String(options.owner ?? "camera-lease"));
  		if (session.startPromise) await session.startPromise;
  		else if (!session.stream) await this.start(session, options);
  		session.leases.add(token);
  		let released = false;
  		return Object.freeze({
  			getFrameSource: () => this.getFrameSource(session),
  			release: async () => {
  				if (released) return;
  				released = true;
  				session.leases.delete(token);
  				if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
  			}
  		});
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
  		for (const cameraId of [...this.sessions.keys()]) this.stopCameraSession(cameraId);
  		this.blockLeases.clear();
  	}
  	session(cameraId) {
  		const existing = this.sessions.get(cameraId);
  		if (existing) return existing;
  		const session = {
  			cameraId,
  			leases: /* @__PURE__ */ new Set(),
  			stream: null,
  			video: null,
  			startPromise: null,
  			mirrored: false,
  			activeDeviceId: ""
  		};
  		this.sessions.set(cameraId, session);
  		return session;
  	}
  	async start(session, options) {
  		session.mirrored = options.mirrored === true;
  		session.startPromise = (async () => {
  			const stream = await mediaDevices().getUserMedia(videoConstraints(options));
  			const video = document.createElement("video");
  			video.muted = true;
  			video.playsInline = true;
  			video.srcObject = stream;
  			await video.play();
  			session.stream = stream;
  			session.video = video;
  			this.updateActiveDevice(session);
  		})();
  		try {
  			await session.startPromise;
  		} catch (error) {
  			this.stopCameraSession(session.cameraId);
  			throw error;
  		}
  	}
  	updateActiveDevice(session) {
  		const settings = (session.stream?.getVideoTracks()[0] ?? null)?.getSettings();
  		session.activeDeviceId = typeof settings?.deviceId === "string" ? settings.deviceId : "";
  	}
  	getFrameSource(session) {
  		if (!session.video || !session.stream) throw new Error("Shared camera is not running.");
  		return Object.freeze({
  			kind: "video",
  			element: session.video,
  			width: session.video.videoWidth,
  			height: session.video.videoHeight,
  			mirrored: session.mirrored,
  			deviceId: session.activeDeviceId
  		});
  	}
  	stopCameraSession(cameraId) {
  		const session = this.sessions.get(cameraId);
  		if (!session) return;
  		session.stream?.getTracks().forEach((track) => track.stop());
  		if (session.video) session.video.srcObject = null;
  		session.stream = null;
  		session.video = null;
  		session.startPromise = null;
  		session.activeDeviceId = "";
  		session.leases.clear();
  		this.sessions.delete(cameraId);
  		this.blockLeases.delete(cameraId);
  	}
  	toScratchBlock(block) {
  		return {
  			opcode: block.opcode,
  			blockType: Scratch.BlockType[block.blockType],
  			text: Scratch.translate(block.text),
  			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
  				type: Scratch.ArgumentType[argument.type],
  				defaultValue: argument.defaultValue
  			}]))
  		};
  	}
  };
  //#endregion
  //#region src/index.ts
  if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  Scratch.extensions.register(new CameraSourceExtension());
  //#endregion

})(Scratch);
