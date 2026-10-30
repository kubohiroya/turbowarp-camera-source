export const extensionConfig = {
  id: 'kubohiroyacamerasource',
  slug: 'camera-source',
  name: 'Camera Source',
  description: 'Share one MediaDevices camera stream between TurboWarp extensions.',
  author: 'Hiroya Kubo',
  license: 'MPL-2.0',
  unsandboxed: true,
  blockIconURI:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+CiAgPHBhdGggZD0ibTEzIDE2IDMtN2gxNWw0IDdaIiBmaWxsPSIjNEM5N0ZGIi8+CiAgPHJlY3QgeD0iNCIgeT0iMTUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIyOCIgcng9IjUiIGZpbGw9IiM0Qzk3RkYiLz4KICA8cmVjdCB4PSI4IiB5PSIyMCIgd2lkdGg9IjciIGhlaWdodD0iMyIgcng9IjEiIGZpbGw9IiNmZmYiLz4KICA8Y2lyY2xlIGN4PSIyNyIgY3k9IjI5IiByPSI5IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMjciIGN5PSIyOSIgcj0iNS41IiBmaWxsPSIjNTlDMDU5Ii8+CiAgPGNpcmNsZSBjeD0iMzguNSIgY3k9IjIwLjUiIHI9IjEuNSIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4K'
} as const;

export const extensionDescriptions = {ja: '1つのカメラ映像を複数のTurboWarp機能拡張で共有します。'} as const;
