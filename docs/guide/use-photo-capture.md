# usePhotoCapture

```js
import { usePhotoCapture } from 'vue-photo-capture';

const camera = usePhotoCapture(options);
```

## Options

| Option | Type | Description |
|---|---|---|
| `videoRef` | `Ref<HTMLVideoElement \| null>` | Auto-bind the stream to this element and use it as the default capture source. |
| `audio` | `boolean` | Also request a microphone track — required to record video **with sound**. Default `false`. |
| `autoCleanup` | `boolean` | Stop tracks and reset on unmount. Default `true`. |

## Lifecycle

```js
const { setUpVideoForScreenshot, stop, isActive, error, permission } = usePhotoCapture();

await setUpVideoForScreenshot();        // request the camera and start the stream
// ... capture, record, scan ...
stop();                                 // stop tracks and reset (also runs on unmount)
```

`setUpVideoForScreenshot(constraints?)` accepts standard `getUserMedia` video constraints. If the
requested constraints can't be satisfied it **retries once with relaxed constraints** instead of
throwing `OverconstrainedError`.

**Default constraints:**

```js
{
  width: { max: 1280, ideal: 1280 },
  height: { min: 400, ideal: 1080 },
  facingMode: 'user',
  frameRate: { min: 15, ideal: 24, max: 30 },
  aspectRatio: { ideal: 16 / 9 },
}
```

## Capturing

```js
const { capturePhoto, takePhoto, captureBurst, captureAfter } = usePhotoCapture();

await capturePhoto(videoEl, { type, quality, mirror, crop, maxWidth, maxHeight });
await takePhoto({ type, quality, mirror, crop, maxWidth, maxHeight }); // full-res + canvas fallback
await captureBurst(5, { interval: 200 });            // → Blob[]
await captureAfter(3, { onTick: (n) => {} });        // self-timer → Blob
```

## Reactive state

`isSupported`, `isActive`, `error`, `permission`, `resolution`, `aspectRatio`, `isFrontCamera`,
`devices`, `currentDeviceId`, capability flags (`canTorch`, `canZoom`, `canFocus`, `canExposure`,
`canWhiteBalance`, `isImageCaptureSupported`, `isRecordingSupported`, `isBarcodeSupported`) and
current values (`torchOn`, `zoom`, `focusDistance`, …).

See the full [API reference](/api) for every property and method.
