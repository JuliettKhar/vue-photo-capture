import { defineNuxtModule, addComponent, addImports, resolvePath } from '@nuxt/kit';

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
    async setup(options: ModuleOptions) {
        if (options.composables !== false) {
            addImports([
                { name: 'usePhotoCapture', from: 'vue-photo-capture' },
                { name: 'editImage', from: 'vue-photo-capture' },
            ]);
        }

        if (options.component !== false) {
            // Resolve the package to an absolute path — addComponent expects a
            // filesystem path, not a bare module specifier.
            addComponent({
                name: `${options.prefix ?? ''}CameraCapture`,
                export: 'CameraCapture',
                filePath: await resolvePath('vue-photo-capture'),
            });
        }
    },
});
