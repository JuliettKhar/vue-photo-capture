# Nuxt

`vue-photo-capture` ships a Nuxt module that **auto-imports** the composable/helpers and
**registers `<CameraCapture>` globally** — no manual imports. It's SSR-safe: browser APIs are
guarded (`isSupported`) and the component starts the camera on mount (client only).

## Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['vue-photo-capture/nuxt'],
});
```

That's it. In any component:

```vue
<script setup>
// usePhotoCapture and editImage are auto-imported — no import statement needed
const { setUpVideoForScreenshot, takePhoto, toObjectURL } = usePhotoCapture();

onMounted(setUpVideoForScreenshot);
</script>

<template>
  <!-- <CameraCapture> is registered globally -->
  <CameraCapture @capture="onPhoto" />
</template>
```

## Options

Configure via the `vuePhotoCapture` key in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['vue-photo-capture/nuxt'],
  vuePhotoCapture: {
    composables: true, // auto-import usePhotoCapture / editImage. Default: true
    component: true,   // register <CameraCapture> globally.       Default: true
    prefix: '',        // component name prefix, e.g. 'V' → <VCameraCapture>. Default: ''
  },
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `composables` | `boolean` | `true` | Auto-import `usePhotoCapture` and `editImage`. |
| `component` | `boolean` | `true` | Register `<CameraCapture>` globally. |
| `prefix` | `string` | `''` | Prefix the component name (e.g. `'V'` → `<VCameraCapture>`). |

## SSR notes

- The composable and component are safe to reference during SSR — the stream only starts on the
  client (`onMounted`), and `isSupported` is `false` on the server.
- `@nuxt/kit` is an **optional peer dependency** — it's provided by your Nuxt project, so nothing
  extra to install.

## Without the module

You don't need the module — you can always import directly in any Nuxt component:

```vue
<script setup>
import { usePhotoCapture, CameraCapture } from 'vue-photo-capture';
</script>
```

The module just removes the imports and makes `<CameraCapture>` global.
