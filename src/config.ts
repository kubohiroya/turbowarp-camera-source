export const extensionConfig = {
  id: 'kubohiroyacamerasource',
  slug: 'camera-source',
  name: 'Camera Source',
  description: 'Share one MediaDevices camera stream between TurboWarp extensions.',
  author: 'Hiroya Kubo',
  license: 'MPL-2.0',
  unsandboxed: true,
  blockIconURI: `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="17" cy="24" r="9" fill="none" stroke="#4C97FF" stroke-width="3"/><circle cx="17" cy="24" r="3.4" fill="#4C97FF"/><path d="M30 24h10M29 17l9-5M29 31l9 5" fill="none" stroke="#59C059" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    'stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h24a4 4 0 0 1 ' +
    '4 4v16a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z"/><path d="m40 29 14-9v24l-14-9"/>' +
    '</g></svg>'
  )}`,
} as const;

export const extensionDescriptions = {ja: '1つのカメラ映像を複数のTurboWarp機能拡張で共有します。'} as const;
