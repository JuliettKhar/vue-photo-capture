import { defineNuxtModule, addComponent, addImports } from '@nuxt/kit';

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
export default defineNuxtModule<ModuleOptions>({
    meta: {
        name: 'vue-photo-capture',
        configKey: 'vuePhotoCapture',
        compatibility: { nuxt: '>=3.0.0' },
    },
    defaults: {
        composables: true,
        component: true,
        prefix: '',
    },
    setup(options: ModuleOptions) {
        if (options.composables !== false) {
            addImports([
                { name: 'usePhotoCapture', from: 'vue-photo-capture' },
                { name: 'editImage', from: 'vue-photo-capture' },
            ]);
        }

        if (options.component !== false) {
            addComponent({
                name: `${options.prefix ?? ''}CameraCapture`,
                export: 'CameraCapture',
                filePath: 'vue-photo-capture',
            });
        }
    },
});
