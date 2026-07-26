# &lt;CameraCapture&gt;

A drop-in camera component wrapping `usePhotoCapture` — a live `<video>` with default
capture/flip controls, slots, events and exposed methods.

```vue
<script setup>
import { CameraCapture } from 'vue-photo-capture';

function onPhoto(blob) { /* upload / preview */ }
</script>

<template>
  <CameraCapture facing-mode="environment" @capture="onPhoto" @error="e => console.error(e)" />
</template>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `autoStart` | `boolean` | `true` | Start the camera on mount. |
| `facingMode` | `'user' \| 'environment'` | — | Initial camera. |
| `constraints` | `MediaStreamConstraints['video']` | — | Custom video constraints (overrides `facingMode`). |
| `audio` | `boolean` | `false` | Request a mic track (for recording with sound). |
| `mirror` | `boolean` | auto | Mirror preview + capture (defaults to the front camera). |
| `type` | `string` | — | Captured image mime type. |
| `quality` | `number` | — | Captured image quality `0..1`. |

## Events

| Event | Payload | When |
|---|---|---|
| `capture` | `Blob` | A photo was captured. |
| `recorded` | `Blob` | A recording finished. |
| `error` | `Error` | Setup/capture failed. |
| `ready` | — | The video has decoded a frame. |
| `switch` | `deviceId?` | The camera was switched. |

## Slots

Both slots receive a **scope** with `{ capture, switchCamera, start, stop, startRecording,
stopRecording, isActive, isRecording, isFrontCamera, ready, error, devices }`.

- `#controls` — replace the default Capture/Flip buttons.
- `#overlay` — render over the video (framing guides, badges…).

```vue
<template>
  <CameraCapture>
    <template #controls="{ capture, switchCamera, isActive }">
      <button :disabled="!isActive" @click="capture">Snap</button>
      <button @click="switchCamera()">Flip</button>
    </template>
  </CameraCapture>
</template>
```

## Exposed methods

Via a template ref: `start`, `stop`, `capture`, `switchCamera`, `takePhoto`, `grabFrame`,
`startRecording`, `stopRecording`, and the full `camera` composable.

```vue
<script setup>
import { ref } from 'vue';
import { CameraCapture } from 'vue-photo-capture';

const cam = ref(null);
async function snap() { await cam.value.capture(); }
</script>

<template>
  <CameraCapture ref="cam" />
  <button @click="snap">Snap via ref</button>
</template>
```
