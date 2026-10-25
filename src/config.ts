export const extensionConfig = {
  id: 'kubohiroyacamerasource',
  slug: 'camera-source',
  name: 'Camera Source',
  description: 'Share one MediaDevices camera stream between TurboWarp extensions.',
  author: 'Hiroya Kubo',
  license: 'MPL-2.0',
  unsandboxed: true
} as const;

export const extensionDescriptions = {ja: '1つのカメラ映像を複数のTurboWarp機能拡張で共有します。'} as const;
