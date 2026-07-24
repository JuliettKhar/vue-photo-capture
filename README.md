# Vue Photo Capture
A Vue 3 Composition API library for capturing photos from a webcam or camera device. It manages the video stream lifecycle, captures frames as `Blob`s, switches cameras, controls torch/zoom and can scan QR/barcodes — with reactive state and automatic cleanup.

[//]: # (![Forks]&#40;https://img.shields.io/github/forks/JuliettKhar/vue-photo-capture&#41;)
[//]: # (![Stars]&#40;https://img.shields.io/github/stars/JuliettKhar/vue-photo-capture&#41;)
[//]: # (![Coverage]&#40;https://img.shields.io/codecov/c/github/JuliettKhar/vue-photo-capture&#41;)
![Downloads](https://img.shields.io/npm/dt/vue-photo-capture)
![NPM Version](https://img.shields.io/npm/v/vue-photo-capture)
![Minified Size](https://img.shields.io/bundlephobia/min/vue-photo-capture)
![Build Status](https://img.shields.io/github/actions/workflow/status/JuliettKhar/vue-photo-capture/.github/workflows/check-app.yml)
![Open Issues](https://img.shields.io/github/issues/JuliettKhar/vue-photo-capture)
![License](https://img.shields.io/npm/l/vue-photo-capture)

## Features

- **Stream lifecycle** — start/stop the camera with real cleanup (tracks are stopped, no leaked camera light).
- **Photo capture** — capture the current frame as a `Blob`, with mime type / quality / mirror options.
- **Output helpers** — `toObjectURL` (auto-revoking), `toDataURL`, `toFile` — no manual memory management.
- **Camera switching** — list `devices`, switch by `deviceId`, or flip front/back.
- **Hardware controls** — torch/flashlight and zoom via `applyConstraints` (where supported).
- **Barcode / QR scanning** — via the native `BarcodeDetector` (where supported).
- **Reactive state** — `isSupported`, `isActive`, `error`, `permission`, `isFrontCamera`, capability flags.

## Installation
```shell
npm install vue-photo-capture
```
> `vue@^3` is a peer dependency — the library uses the Vue already installed in your app.

## Usage
```vue
<script setup>
import { onMounted, ref } from 'vue';
import { usePhotoCapture } from 'vue-photo-capture';

const video = ref(null);
const preview = ref('');

const {
  videoStream,
  setUpVideoForScreenshot,
  capturePhoto,
  toObjectURL,
  error,
} = usePhotoCapture();

onMounted(async () => {
  await setUpVideoForScreenshot();
  video.value.srcObject = videoStream.value;
});

async function takePhoto() {
  await capturePhoto(video.value);
  preview.value = toObjectURL(); // auto-revokes the previous URL
}
</script>

<template>
  <video ref="video" playsinline autoplay></video>
  <button @click="takePhoto">Capture Photo</button>
  <img v-if="preview" :src="preview" alt="photo" />
  <p v-if="error">{{ error.message }}</p>
</template>
```

The composable **automatically stops all tracks on unmount** (disable via `usePhotoCapture({ autoCleanup: false })` and call `stop()` yourself).

## API

`usePhotoCapture(options?)` returns:

### State
| Property | Type | Description |
|---|---|---|
| `videoForScreenShot` | `Ref<HTMLVideoElement \| null>` | Internal `<video>` bound to the stream. |
| `screenshotVideoBlob` | `Ref<Blob \| null>` | Most recently captured photo. |
| `videoStream` | `Ref<MediaStream \| null>` | Active media stream. |
| `isSupported` | `boolean` | `getUserMedia` availability (SSR-safe). |
| `isActive` | `Ref<boolean>` | Whether a stream is running. |
| `error` | `Ref<Error \| null>` | Last setup/capture error (preserves the original `DOMException`). |
| `permission` | `Ref<'prompt' \| 'granted' \| 'denied' \| 'unknown'>` | Camera permission state. |
| `devices` | `Ref<MediaDeviceInfo[]>` | Available video input devices. |
| `currentDeviceId` | `Ref<string \| null>` | Active device id. |
| `isFrontCamera` | `Ref<boolean>` | `true` when the active camera faces the user. |
| `canTorch` / `canZoom` | `Ref<boolean>` | Hardware capability flags. |
| `zoomRange` | `Ref<{ min, max, step } \| null>` | Allowed zoom range. |
| `torchOn` / `zoom` | `Ref<boolean>` / `Ref<number>` | Current torch/zoom values. |
| `isBarcodeSupported` | `boolean` | `BarcodeDetector` availability. |
| `detectedCodes` | `Ref<DetectedBarcode[]>` | Codes from the last scan. |

### Methods
| Method | Description |
|---|---|
| `setUpVideoForScreenshot(constraints?)` | Request the camera and start the stream. |
| `capturePhoto(video?, { type?, quality?, mirror? })` | Capture a frame → `Promise<Blob>`. |
| `stop()` | Stop all tracks and reset state. |
| `refreshDevices()` | Re-enumerate video devices. |
| `switchCamera(deviceId?)` | Switch to a device, or flip front/back with no argument. |
| `toObjectURL(blob?)` | `blob:` URL for `<img>`, auto-revoking the previous one. |
| `toDataURL(blob?)` | `Promise<string>` base64 data URL. |
| `toFile(name?, blob?)` | Wrap the photo in a `File` for uploads. |
| `setTorch(on)` / `setZoom(value)` | Control torch/zoom (throws if unsupported). |
| `scan(source?)` | Detect codes in one frame → `Promise<DetectedBarcode[]>`. |
| `startScanning(onDetect?)` / `stopScanning()` | Continuous scanning loop. |

**Default constraints** passed to `getUserMedia`:
```javascript
{
  width: { max: 1280, ideal: 1280 },
  height: { min: 400, ideal: 1080 },
  facingMode: 'user',
  frameRate: { min: 15, ideal: 24, max: 30 },
  aspectRatio: { ideal: 16 / 9 },
}
```

## Examples

### Switch cameras
```vue
<script setup>
const { devices, currentDeviceId, switchCamera } = usePhotoCapture();
// after setUpVideoForScreenshot() the `devices` list is populated with labels
</script>

<template>
  <select :value="currentDeviceId" @change="switchCamera($event.target.value)">
    <option v-for="d in devices" :key="d.deviceId" :value="d.deviceId">{{ d.label }}</option>
  </select>
  <button @click="switchCamera()">Flip front/back</button>
</template>
```

### Torch & zoom
```js
const { canTorch, canZoom, zoomRange, setTorch, setZoom } = usePhotoCapture();
if (canTorch.value) await setTorch(true);
if (canZoom.value) await setZoom(zoomRange.value.max);
```

### Scan QR / barcodes
```js
const { isBarcodeSupported, startScanning, stopScanning } = usePhotoCapture();
if (isBarcodeSupported) {
  startScanning((codes) => console.log(codes[0].rawValue));
}
```

### Upload the photo
```js
const { capturePhoto, toFile } = usePhotoCapture();
await capturePhoto(videoEl);
const form = new FormData();
form.append('photo', toFile('capture.png'));
await fetch('/upload', { method: 'POST', body: form });
```

> **Browser support:** `torch`, `zoom` and `BarcodeDetector` are progressive enhancements —
> mainly Chromium/Android. Always gate them behind `canTorch` / `canZoom` / `isBarcodeSupported`.

## Demo
[Live demo](https://juliettkhar.github.io/vue-photo-capture/) · source in [`index.html`](./index.html).

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the MIT License.
