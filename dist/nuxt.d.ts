export interface ModuleOptions {
    /** Auto-import `usePhotoCapture` and `editImage`. Default: `true`. */
    composables?: boolean;
    /** Register the `<CameraCapture>` component globally. Default: `true`. */
    component?: boolean;
    /** Prefix for the registered component name (e.g. `'V'` → `<VCameraCapture>`). Default: `''`. */
    prefix?: string;
}
/**
 * Nuxt module for vue-photo-capture. Auto-imports the composable/helpers and
 * registers `<CameraCapture>` globally. SSR-safe — the composable guards browser
 * APIs (`isSupported`) and the component starts the camera on mount.
 *
 * ```ts
 * // nuxt.config.ts
 * export default defineNuxtConfig({
 *   modules: ['vue-photo-capture/nuxt'],
 * })
 * ```
 */
declare const _default: NuxtModule<TOptions, TOptions, false>;
export default _default;
