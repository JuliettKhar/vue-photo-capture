# Getting Started

`vue-photo-capture` is a Vue 3 Composition API library for capturing photos and video from a
webcam or camera device. It manages the stream lifecycle, captures stills, records clips,
switches cameras, controls torch/zoom/focus/exposure and can scan QR/barcodes — with reactive
state and automatic cleanup.

## Installation

```sh
npm install vue-photo-capture
```

> `vue@^3` is a **peer dependency** — the library uses the Vue already installed in your app.

## Quick start

Pass a template ref via `videoRef` and the stream binds to it automatically — no manual
`srcObject`:

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { usePhotoCapture } from 'vue-photo-capture';

const video = ref(null);
const preview = ref('');

const { setUpVideoForScreenshot, takePhoto, toObjectURL, error } = usePhotoCapture({
  videoRef: video,
});

onMounted(setUpVideoForScreenshot);

async function capture() {
  await takePhoto();              // full-res via ImageCapture, canvas fallback
  preview.value = toObjectURL();  // auto-revokes the previous URL
}
</script>

<template>
  <video ref="video" playsinline autoplay muted></video>
  <button @click="capture">Capture Photo</button>
  <img v-if="preview" :src="preview" alt="photo" />
  <p v-if="error">{{ error.message }}</p>
</template>
```

The composable **automatically stops all tracks on unmount** — disable via
`usePhotoCapture({ autoCleanup: false })` and call `stop()` yourself.

## Prefer a ready-made UI?

Use the [`<CameraCapture>`](/guide/camera-capture) component instead of wiring the composable:

```vue
<script setup>
import { CameraCapture } from 'vue-photo-capture';
</script>

<template>
  <CameraCapture facing-mode="environment" @capture="onPhoto" @error="onError" />
</template>
```

## Next steps

- [usePhotoCapture](/guide/use-photo-capture) — the composable in depth
- [`<CameraCapture>`](/guide/camera-capture) — the drop-in component
- [Recipes](/guide/recipes) — switch cameras, torch/zoom, recording, scanning, crop/resize, self-timer
- [API](/api) — full reference
