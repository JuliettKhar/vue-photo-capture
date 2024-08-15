# Vue Photo Capture
A Vue 2 Composition API library for capturing photos using a webcam or camera device. This library simplifies the process of setting up video streams, capturing photos, and managing resources, making it easy to integrate photo capture functionality into your Vue.js applications.

[//]: # (![Forks]&#40;https://img.shields.io/github/forks/JuliettKhar/reviewer-lib&#41;)
[//]: # (![Stars]&#40;https://img.shields.io/github/stars/JuliettKhar/reviewer-lib&#41;)
[//]: # (![Coverage]&#40;https://img.shields.io/codecov/c/github/JuliettKhar/vue-photo-capture&#41;)
![Build Status](https://img.shields.io/github/actions/workflow/status/JuliettKhar/vue-photo-capture/deploy.yml)
![Downloads](https://img.shields.io/npm/dt/vue-photo-capture)
![NPM Version](https://img.shields.io/npm/v/vue-photo-capture)
![Minified Size](https://img.shields.io/bundlephobia/min/vue-photo-capture)
![Open Issues](https://img.shields.io/github/issues/JuliettKhar/vue-photo-capture)
## Features

- **Easy Video Stream Setup**: Quickly initialize video streams with custom options.
- **Photo Capture**: Capture photos from the video stream and export them as `Blob` objects.
## Installation
```shell
npm install vue-photo-capture
```
## Usage
```vue
<template>
  <div>
    <video ref="videoElement" v-if="videoForScreenShot" autoplay playsinline></video>
    <button @click="capturePhoto(videoElement)">Capture Photo</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { usePhotoCapture } from 'vue-photo-capture';

const { videoForScreenShot, screenshotVideoBlob, setUpVideoForScreenshot, capturePhoto } = usePhotoCapture();

onMounted(async () => {
  await setUpVideoForScreenshot();
});
</script>
```
## API
`usePhotoCapture`.
The usePhotoCapture function provides a set of reactive properties and methods to handle photo capture.

**Properties:**

- videoForScreenShot: A reactive reference to the HTML `<video>` element used for capturing photos.
- screenshotVideoBlob: A reactive reference to the captured photo as a Blob object.
- videoStream: A reactive reference to the MediaStream object representing the video stream.

**Methods:**
- setUpVideoForScreenshot(videoOptions: Object): Promise<void>: Sets up the video stream with the given options and binds it to the videoForScreenShot element.
- capturePhoto(videoElement: HTMLVideoElement): void: Captures a photo from the provided video element and stores it as a Blob in screenshotVideoBlob.

#### Example with Custom Options
```vue
<script setup>
import { onMounted } from 'vue';
import { usePhotoCapture } from 'vue-photo-capture-library';

const { setUpVideoForScreenshot, capturePhoto } = usePhotoCapture();

onMounted(async () => {
  const customOptions = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: { exact: 'environment' }, // Use the rear camera if available
  };
  await setUpVideoForScreenshot(customOptions);
});
</script>
```
#### Cleanup
usePhotoCapture automatically cleans up resources when the component is unmounted, resetting all reactive references to null.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the MIT License.