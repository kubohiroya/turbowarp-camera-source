/** Optional GUI capability; it does not import the Editor or a story application. */
export interface CameraControlsHost {
  registerProvider(options: {
    id: string;
    cameraId: string;
    kind: 'permission' | 'settings';
    element: unknown;
    visible?: boolean;
    running?: boolean;
    onOpen?: () => unknown;
    onClose?: () => unknown;
    onStart?: () => unknown;
  }): {
    update(state: {visible?: boolean; running?: boolean}): void;
    dispose(): void;
  };
}
