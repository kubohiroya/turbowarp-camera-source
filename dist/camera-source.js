// Name: Camera Source
// ID: kubohiroyacamerasource
// Description: Share one MediaDevices camera stream between TurboWarp extensions.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  const extensionConfig = {
    id: "kubohiroyacamerasource",
    name: "Camera Source"
  };
  const extensionName = "Camera Source";
  const blocks = [{ "opcode": "startSharedCamera", "blockType": "COMMAND", "text": "start shared camera", "description": "Starts the shared MediaDevices camera stream.", "arguments": {} }, { "opcode": "stopSharedCamera", "blockType": "COMMAND", "text": "stop shared camera", "description": "Stops the shared camera stream and releases its tracks.", "arguments": {} }, { "opcode": "isCameraRunning", "blockType": "BOOLEAN", "text": "shared camera is running?", "description": "Reports whether the shared camera stream is active.", "arguments": {} }, { "opcode": "cameraDeviceIdReporter", "blockType": "REPORTER", "text": "shared camera device ID", "description": "Returns the active shared camera device ID when available.", "arguments": {} }];
  const definitions = {
    extensionName,
    blocks
  };
  const blockDefinitions = definitions.blocks;
  function mediaDevices() {
    const devices = globalThis.navigator?.mediaDevices;
    if (!devices || typeof devices.getUserMedia !== "function") {
      throw new Error("Camera Source requires navigator.mediaDevices.getUserMedia.");
    }
    return devices;
  }
  function videoConstraints(options) {
    return { audio: false, video: options.video ?? true };
  }
  class CameraSourceExtension {
    constructor() {
      this.stream = null;
      this.video = null;
      this.leases = /* @__PURE__ */ new Set();
      this.startPromise = null;
      this.mirrored = false;
      this.activeDeviceId = "";
      Scratch.vm.runtime.ext_kubohiroyacamerasource = this;
    }
    getInfo() {
      return {
        id: extensionConfig.id,
        name: Scratch.translate(definitions.extensionName),
        blocks: blockDefinitions.map((block) => this.toScratchBlock(block))
      };
    }
    isCameraRunning() {
      return this.stream !== null;
    }
    cameraDeviceIdReporter() {
      return this.activeDeviceId;
    }
    async startSharedCamera() {
      const lease = await this.acquireCamera({ owner: "camera-source-block" });
      await lease.release();
    }
    async acquireCamera(options = {}) {
      const token = Symbol(String(options.owner ?? "camera-lease"));
      if (this.startPromise) {
        await this.startPromise;
      } else if (!this.stream) {
        await this.start(options);
      }
      this.leases.add(token);
      let released = false;
      return Object.freeze({
        getFrameSource: () => this.getFrameSource(),
        release: async () => {
          if (released) return;
          released = true;
          this.leases.delete(token);
          if (this.leases.size === 0) this.stopSharedCamera();
        }
      });
    }
    stopSharedCamera() {
      this.stream?.getTracks().forEach((track) => track.stop());
      if (this.video) this.video.srcObject = null;
      this.stream = null;
      this.video = null;
      this.startPromise = null;
      this.activeDeviceId = "";
    }
    async start(options) {
      this.mirrored = options.mirrored === true;
      this.startPromise = (async () => {
        const stream = await mediaDevices().getUserMedia(videoConstraints(options));
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play();
        this.stream = stream;
        this.video = video;
        this.updateActiveDevice();
      })();
      try {
        await this.startPromise;
      } catch (error) {
        this.stopSharedCamera();
        throw error;
      }
    }
    updateActiveDevice() {
      const track = this.stream?.getVideoTracks()[0] ?? null;
      const settings = track?.getSettings();
      this.activeDeviceId = typeof settings?.deviceId === "string" ? settings.deviceId : "";
    }
    getFrameSource() {
      if (!this.video || !this.stream) {
        throw new Error("Shared camera is not running.");
      }
      return Object.freeze({
        kind: "video",
        element: this.video,
        width: this.video.videoWidth,
        height: this.video.videoHeight,
        mirrored: this.mirrored,
        deviceId: this.activeDeviceId
      });
    }
    toScratchBlock(block) {
      return {
        opcode: block.opcode,
        blockType: Scratch.BlockType[block.blockType],
        text: Scratch.translate(block.text),
        arguments: Object.fromEntries(
          Object.entries(block.arguments).map(([name, argument]) => [
            name,
            {
              type: Scratch.ArgumentType[argument.type],
              defaultValue: argument.defaultValue
            }
          ])
        )
      };
    }
  }
  if (!Scratch.extensions.unsandboxed) {
    throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  }
  Scratch.extensions.register(new CameraSourceExtension());

})(Scratch);
