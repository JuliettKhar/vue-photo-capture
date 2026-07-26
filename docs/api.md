# API Reference

`usePhotoCapture(options?)` returns the object documented below. `<CameraCapture>` is documented
on its [own page](/guide/camera-capture).

## State

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
| `resolution` | `Ref<{ width, height } \| null>` | Actual stream resolution. |
| `aspectRatio` | `Ref<number \| null>` | Actual stream aspect ratio. |
| `mirrorStyle` | `ComputedRef<{ transform }>` | Inline style that mirrors the front-camera preview. |
| `canTorch` / `canZoom` | `Ref<boolean>` | Torch/zoom capability flags. |
| `zoomRange` | `Ref<{ min, max, step } \| null>` | Allowed zoom range. |
| `torchOn` / `zoom` | `Ref<boolean>` / `Ref<number>` | Current torch/zoom values. |
| `canFocus` / `canExposure` / `canWhiteBalance` | `Ref<boolean>` | Advanced-control capability flags. |
| `focusRange` / `exposureRange` / `colorTemperatureRange` | `Ref<{ min, max, step } \| null>` | Allowed ranges. |
| `focusDistance` / `exposureCompensation` / `colorTemperature` | `Ref<number \| null>` | Current values. |
| `isImageCaptureSupported` | `boolean` | Native `ImageCapture` availability. |
| `isRecordingSupported` | `boolean` | `MediaRecorder` availability. |
| `isRecording` | `Ref<boolean>` | Whether a recording is in progress. |
| `recordedBlob` | `Ref<Blob \| null>` | The last recorded clip. |
| `isBarcodeSupported` | `boolean` | `BarcodeDetector` availability. |
| `detectedCodes` | `Ref<DetectedBarcode[]>` | Codes from the last scan. |

## Methods

| Method | Description |
|---|---|
| `setUpVideoForScreenshot(constraints?)` | Request the camera and start the stream (retries once on `OverconstrainedError`). |
| `capturePhoto(video?, opts?)` | Capture a canvas frame → `Promise<Blob>`. |
| `takePhoto(opts?)` | Full-res `ImageCapture` still, canvas fallback → `Promise<Blob>`. |
| `grabFrame()` | Grab the current frame as an `ImageBitmap`. |
| `captureBurst(count, { interval?, ...opts })` | Rapid burst → `Promise<Blob[]>`. |
| `captureAfter(seconds, { onTick?, ...opts })` | Self-timer countdown then capture → `Promise<Blob>`. |
| `stop()` | Stop all tracks, recording and reset state. |
| `refreshDevices()` | Re-enumerate video devices. |
| `switchCamera(deviceId?)` | Switch device, or flip front/back with no argument. |
| `toObjectURL(blob?)` | Auto-revoking `blob:` URL for `<img>`. |
| `toDataURL(blob?)` | `Promise<string>` base64 data URL. |
| `toFile(name?, blob?)` | Wrap the photo in a `File`. |
| `setTorch(on)` / `setZoom(value)` | Control torch/zoom (throws if unsupported). |
| `setFocusDistance(v)` / `focusAt(x, y)` | Manual focus / tap-to-focus at a normalized point `0..1`. |
| `setExposureCompensation(v)` / `setColorTemperature(kelvin)` | Manual exposure / white balance. |
| `startRecording(opts?)` / `stopRecording()` | Record → `Promise<Blob>`. |
| `pauseRecording()` / `resumeRecording()` | Pause/resume a recording. |
| `scan(source?)` | Detect codes in one frame → `Promise<DetectedBarcode[]>`. |
| `startScanning(onDetect?)` / `stopScanning()` | Continuous scanning loop. |

## `CaptureOptions`

```ts
interface CaptureOptions {
  type?: string;       // output mime, e.g. 'image/jpeg'
  quality?: number;    // 0..1 for lossy formats
  mirror?: boolean;    // flip horizontally
  crop?: { x: number; y: number; width: number; height: number }; // source pixels, clamped
  maxWidth?: number;   // downscale-only, aspect preserved
  maxHeight?: number;
}
```

## Standalone helpers

| Export | Description |
|---|---|
| `editImage(blob, options)` | Apply EXIF orientation, crop, resize and mirror to any blob → `Promise<Blob>`. |
| `CameraCapture` | The drop-in component. |
