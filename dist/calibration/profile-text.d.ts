import type { ProfileError } from './types.js';
export type ProfileTextResult = {
    readonly ok: true;
    readonly document: unknown;
} | {
    readonly ok: false;
    readonly error: ProfileError;
};
export declare function readProfileText(text: string): ProfileTextResult;
//# sourceMappingURL=profile-text.d.ts.map