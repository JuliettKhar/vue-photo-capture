# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-07-26

### Added
- **`<CameraCapture>` component** — a drop-in camera UI wrapping `usePhotoCapture`. Props (`autoStart`, `facingMode`, `constraints`, `audio`, `mirror`, `type`, `quality`), events (`capture`, `recorded`, `error`, `ready`, `switch`), `#controls`/`#overlay` slots with a full capture scope, and exposed methods (`start`, `stop`, `capture`, `switchCamera`, `takePhoto`, `grabFrame`, `startRecording`, `stopRecording`, `camera`). Exported as a named export alongside `usePhotoCapture`.

## [1.3.0] - 2026-07-26

### Added
- **Stream info** — reactive `resolution` (`{ width, height }`) and `aspectRatio`, plus a `mirrorStyle` computed style that mirrors the preview for the front camera.

### Changed
- **`OverconstrainedError` fallback** — `setUpVideoForScreenshot` now retries once with relaxed constraints when the requested ones can't be satisfied, instead of throwing.

### Tests
- Added a mounted-component `onUnmounted` test (real cleanup path), and removed a hidden ordering dependency on `navigator.mediaDevices`.

## [1.2.0] - 2026-07-25

### Added
- **Full-resolution stills** — `takePhoto()` uses the native `ImageCapture.takePhoto()` for full sensor resolution (with an automatic canvas fallback), plus `grabFrame()` and `isImageCaptureSupported`.
- **Video recording** — `startRecording()`, `stopRecording()` (→ `Promise<Blob>`), `pauseRecording()`, `resumeRecording()`, with `isRecording`, `recordedBlob`, and `isRecordingSupported` (`MediaRecorder`). Pass `usePhotoCapture({ audio: true })` to record with sound.
- **Auto-bound video element** — `usePhotoCapture({ videoRef })` binds the stream to your `<video>` automatically (no manual `srcObject`) and uses it as the default capture source.

### Changed
- `setUpVideoForScreenshot` now requests `{ audio }` per the `audio` option (default `false`, so behavior is unchanged unless opted in).
- All additions are backward compatible — no changes required when upgrading from 1.1.x.

## [1.1.0] - 2026-07-24

### Added
- **Camera device management** — `devices`, `currentDeviceId`, `isFrontCamera`, `refreshDevices()`, and `switchCamera(deviceId?)` (switch to a specific camera, or flip front/back with no argument).
- **Output helpers** — `toObjectURL()` (auto-revokes the previous URL), `toDataURL()`, and `toFile(name?)` for uploads.
- **Hardware controls** — `setTorch(on)` and `setZoom(value)`, with `canTorch`, `canZoom`, `zoomRange`, `torchOn`, and `zoom`.
- **Barcode / QR scanning** — `scan()`, `startScanning()`, `stopScanning()`, `detectedCodes`, and `isBarcodeSupported` (native `BarcodeDetector`).
- **Reactive state** — `isSupported`, `isActive`, `error`, and `permission`.
- `capturePhoto` now accepts `{ type, quality, mirror }` options.
- `stop()` method and automatic teardown on component unmount (opt out with `usePhotoCapture({ autoCleanup: false })`).
- Shipped TypeScript declarations, generated from source (previously `types` pointed to a file that was never built).

### Fixed
- Camera tracks are now actually stopped on unmount — previously the stream leaked and the camera light stayed on.
- `capturePhoto()` resolves with the captured `Blob` (it was `void`, and the blob was only set asynchronously after the call returned).
- Capturing from a CSS-sized `<video>` element no longer fails with "canvas produced an empty blob" — falls back to `videoWidth`/`videoHeight`.
- The original `DOMException` (e.g. `NotAllowedError`, `NotFoundError`) is preserved on `error` instead of being swallowed.

### Changed
- **`vue` moved from `dependencies` to `peerDependencies` (`^3.0.0`)** to avoid bundling a second Vue instance in consumer apps.
- Package description corrected to Vue 3; added `"sideEffects": false` for better tree-shaking.
- All existing names and signatures are preserved — upgrading from 1.0.x requires no code changes.

### Demo
- Reworked demo ([`index.html`](./index.html)) showcasing every user-facing feature: live status badges, camera switching, torch/zoom, QR scanning, output helpers, a "photo captured" toast and readiness-gated capture.

### Internal
- Toolchain modernized: ESLint 10 (flat config), Vite 8, generated types via `vite-plugin-dts`, CI on Node 20, and an on-demand AI code-review workflow.

## [1.0.5]

- Baseline release: `usePhotoCapture()` with `setUpVideoForScreenshot()` and `capturePhoto()`.
