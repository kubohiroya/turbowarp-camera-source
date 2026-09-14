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
  			"opcode": "cameraErrorCode",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] error code",
  			"description": "Returns the latest camera failure code, or an empty string after a successful start.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraError",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] error",
  			"description": "Returns the latest camera failure message, or an empty string after a successful start.",
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
  			"opcode": "showCameraPreview",
  			"blockType": "COMMAND",
  			"text": "show shared camera [CAMERA_ID] preview mirrored [MIRRORED]",
  			"description": "Shows the named shared camera with the GPU-backed stage preview.",
  			"arguments": {
  				"CAMERA_ID": {
  					"type": "STRING",
  					"defaultValue": "default"
  				},
  				"MIRRORED": {
  					"type": "STRING",
  					"defaultValue": "true"
  				}
  			}
  		},
  		{
  			"opcode": "hideCameraPreview",
  			"blockType": "COMMAND",
  			"text": "hide shared camera [CAMERA_ID] preview",
  			"description": "Hides the block-owned preview without stopping leases owned by other consumers.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameWidth",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame width",
  			"description": "Returns the active video frame width in pixels, or zero while the camera is not running.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameHeight",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame height",
  			"description": "Returns the active video frame height in pixels, or zero while the camera is not running.",
  			"arguments": { "CAMERA_ID": {
  				"type": "STRING",
  				"defaultValue": "default"
  			} }
  		},
  		{
  			"opcode": "cameraFrameRate",
  			"blockType": "REPORTER",
  			"text": "shared camera [CAMERA_ID] frame rate",
  			"description": "Returns the active video track frame rate, or zero when it is unavailable.",
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
  //#region src/video-preview.ts
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
  				this.dirty = true;
  				this.onFrame(this.syncMetrics());
  				this.scheduleFrame();
  			};
  			this.handleAnimationFrame = () => {
  				if (this.disposed) return;
  				if (this.video.currentTime !== this.lastCurrentTime) {
  					this.dirty = true;
  					this.onFrame(this.syncMetrics());
  				}
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
  		scheduleFrame() {
  			if (typeof this.video.requestVideoFrameCallback === "function") this.videoFrameCallbackId = this.video.requestVideoFrameCallback(this.handleVideoFrame);
  			else if (typeof globalThis.requestAnimationFrame === "function") this.animationFrameId = globalThis.requestAnimationFrame(this.handleAnimationFrame);
  		}
  	};
  }
  function assertRenderer(renderer) {
  	if (!renderer || !Array.isArray(renderer._allSkins) || !Number.isInteger(renderer._nextSkinId) || typeof renderer.createDrawable !== "function" || typeof renderer.destroyDrawable !== "function" || typeof renderer.destroySkin !== "function" || typeof renderer.getNativeSize !== "function") throw new Error("Camera preview requires a compatible TurboWarp renderer.");
  }
  function createVideoPreview(renderer, video, mirrored, requestRedraw) {
  	assertRenderer(renderer);
  	const VideoSkin = videoSkinClass(renderer);
  	const skinId = renderer._nextSkinId++;
  	let drawableId;
  	let disposed = false;
  	let previewMirrored = mirrored;
  	let lastLayout = "";
  	const updateLayout = () => {
  		if (drawableId === void 0 || video.videoWidth === 0 || video.videoHeight === 0) return;
  		const [stageWidth, stageHeight] = renderer.getNativeSize();
  		const layout = [
  			video.videoWidth,
  			video.videoHeight,
  			stageWidth,
  			stageHeight,
  			previewMirrored
  		].join(":");
  		if (layout === lastLayout) return;
  		const scale = Math.max(stageWidth / video.videoWidth, stageHeight / video.videoHeight) * 100;
  		renderer.updateDrawableScale(drawableId, [previewMirrored ? -scale : scale, scale]);
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
  		setMirrored: (nextMirrored) => {
  			if (disposed || previewMirrored === nextMirrored) return;
  			previewMirrored = nextMirrored;
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
  	constructor() {
  		this.sessions = /* @__PURE__ */ new Map();
  		this.blockLeases = /* @__PURE__ */ new Map();
  		this.blockPreviewLeases = /* @__PURE__ */ new Map();
  		this.blockPreviewRevisions = /* @__PURE__ */ new Map();
  		this.cameraFailures = /* @__PURE__ */ new Map();
  		this.devices = [];
  		this.dispose = () => {
  			this.stopAllCameras();
  			Scratch.vm.runtime.off?.("PROJECT_STOP_ALL", this.handleProjectBoundary);
  			Scratch.vm.runtime.off?.("PROJECT_LOADED", this.handleProjectBoundary);
  			Scratch.vm.runtime.off?.("RUNTIME_DISPOSED", this.dispose);
  		};
  		this.handleProjectBoundary = () => {
  			this.stopAllCameras();
  		};
  		Scratch.vm.runtime.ext_kubohiroyacamerasource = this;
  		Scratch.vm.runtime.on?.("PROJECT_STOP_ALL", this.handleProjectBoundary);
  		Scratch.vm.runtime.on?.("PROJECT_LOADED", this.handleProjectBoundary);
  		Scratch.vm.runtime.on?.("RUNTIME_DISPOSED", this.dispose);
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
  		const token = Symbol(String(options.owner ?? "camera-lease"));
  		if (session.startPromise) await session.startPromise;
  		else if (!session.stream) await this.start(session, options);
  		session.leases.add(token);
  		try {
  			if (options.preview === true) {
  				session.previewLeases.set(token, options.mirrored === true);
  				this.ensurePreview(session);
  				session.preview?.setMirrored(this.previewMirrored(session));
  			}
  		} catch (error) {
  			session.leases.delete(token);
  			session.previewLeases.delete(token);
  			if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
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
  				} else session.preview?.setMirrored(this.previewMirrored(session));
  				if (session.leases.size === 0) this.stopCameraSession(session.cameraId);
  			}
  		});
  	}
  	async showCameraPreview(args = {}) {
  		const cameraId = normalizeId(args.CAMERA_ID);
  		const mirrored = Scratch.Cast.toBoolean(args.MIRRORED ?? true);
  		if (this.blockPreviewLeases.get(cameraId)?.mirrored === mirrored) return;
  		const revision = this.nextPreviewBlockRevision(cameraId);
  		const lease = await this.acquireCamera({
  			owner: "camera-source-preview-block",
  			cameraId,
  			preview: true,
  			mirrored
  		});
  		if (this.blockPreviewRevisions.get(cameraId) !== revision) {
  			await lease.release();
  			return;
  		}
  		const current = this.blockPreviewLeases.get(cameraId);
  		this.blockPreviewLeases.set(cameraId, {
  			lease,
  			mirrored
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
  		for (const cameraId of [...this.sessions.keys()]) this.stopCameraSession(cameraId);
  		this.blockLeases.clear();
  		this.blockPreviewLeases.clear();
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
  		session.preview = createVideoPreview(runtime.renderer, session.video, this.previewMirrored(session), () => runtime.requestRedraw?.());
  	}
  	previewMirrored(session) {
  		return [...session.previewLeases.values()].some(Boolean);
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
  		session.active = false;
  		this.nextPreviewBlockRevision(cameraId);
  		session.preview?.dispose();
  		session.stream?.getTracks().forEach((track) => track.stop());
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
