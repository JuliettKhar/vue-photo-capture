# Recipes

## Switch cameras

```vue
<script setup>
const { devices, currentDeviceId, switchCamera } = usePhotoCapture();
// `devices` is populated with labels after setUpVideoForScreenshot()
</script>

<template>
  <select :value="currentDeviceId" @change="switchCamera($event.target.value)">
    <option v-for="d in devices" :key="d.deviceId" :value="d.deviceId">{{ d.label }}</option>
  </select>
  <button @click="switchCamera()">Flip front/back</button>
</template>
```

## Torch & zoom

```js
const { canTorch, canZoom, zoomRange, setTorch, setZoom } = usePhotoCapture();
if (canTorch.value) await setTorch(true);
if (canZoom.value) await setZoom(zoomRange.value.max);
```

## Focus, exposure & white balance

```js
const {
  canFocus, focusRange, setFocusDistance, focusAt,
  canExposure, exposureRange, setExposureCompensation,
  canWhiteBalance, colorTemperatureRange, setColorTemperature,
} = usePhotoCapture();

if (canFocus.value) await setFocusDistance(focusRange.value.min);
await focusAt(0.5, 0.5); // tap-to-focus at a normalized point
if (canExposure.value) await setExposureCompensation(exposureRange.value.max);
if (canWhiteBalance.value) await setColorTemperature(5600);
```

> `torch`, `zoom` and the advanced controls are progressive enhancements — mostly Chromium/Android.
> Always gate them behind the `can*` flags.

## Record a video clip

```js
const { setUpVideoForScreenshot, startRecording, stopRecording, isRecording } =
  usePhotoCapture({ videoRef: video, audio: true }); // audio: true records with sound

await setUpVideoForScreenshot();
startRecording();                 // ... later ...
const clip = await stopRecording();   // Blob (video/webm)
```

## Scan QR / barcodes

```js
const { isBarcodeSupported, startScanning, stopScanning } = usePhotoCapture();
if (isBarcodeSupported) startScanning((codes) => console.log(codes[0].rawValue));
```

For Safari/Firefox, install the [`barcode-detector`](https://www.npmjs.com/package/barcode-detector)
ponyfill and `import 'barcode-detector/side-effects'` once — it registers a global
`BarcodeDetector`, after which `isBarcodeSupported` becomes `true`.

## Crop & resize

```js
const { takePhoto } = usePhotoCapture();
await takePhoto({
  crop: { x: 200, y: 100, width: 800, height: 800 }, // source pixels (clamped)
  maxWidth: 1024,
  maxHeight: 1024,
  type: 'image/jpeg',
  quality: 0.85,
});
```

`editImage(blob, options)` is exported standalone — it applies EXIF orientation, crop and resize
to any blob:

```js
import { editImage } from 'vue-photo-capture';
const thumb = await editImage(someBlob, { maxWidth: 320, maxHeight: 320 });
```

## Self-timer & burst

```js
const { captureBurst, captureAfter } = usePhotoCapture();
const shots = await captureBurst(5, { interval: 200 });               // Blob[]
const photo = await captureAfter(3, { onTick: (n) => console.log(n) }); // 3-2-1 then snap
```

## Upload the photo

```js
const { capturePhoto, toFile } = usePhotoCapture();
await capturePhoto(videoEl);
const form = new FormData();
form.append('photo', toFile('capture.png'));
await fetch('/upload', { method: 'POST', body: form });
```
