# Vue Photo Capture
A Vue 2 Composition API library for capturing photos using a webcam or camera device. This library simplifies the process of setting up video streams, capturing photos, and managing resources, making it easy to integrate photo capture functionality into your Vue.js applications.

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
    <video playsinline autoplay :srcObject="videoStream"></video>
    <img :src="imgUrl" alt="photo">
    <button @click="capturePhoto()">Capture Photo</button>
  </div>
</template>
```
```vue
<template>
  <div>
    <video width="1280" height="720" ref="videoElement" playsinline autoplay :srcObject="videoStream"></video>
    <img :src="imgUrl" alt="photo">
    <button @click="capturePhoto(videoElement)">Capture Photo</button>
  </div>
</template>
```
```vue
<script setup>
import { onMounted, computed } from 'vue';
import { usePhotoCapture } from 'vue-photo-capture';

const {   
  screenshotVideoBlob, 
  videoStream,
  setUpVideoForScreenshot,
  capturePhoto
} = usePhotoCapture();
const imgUrl = computed(() => screenshotVideoBlob.value ? URL.createObjectURL(screenshotVideoBlob.value) : '')

onMounted(async () => {
  await setUpVideoForScreenshot();
});
</script>
```
## API
The `usePhotoCapture` function provides a set of reactive properties and methods to handle photo capture.

**Properties**:
- `videoForScreenShot`: A reactive reference to the HTML `<video>` element used for capturing photos.
- `screenshotVideoBlob`: A reactive reference to the captured photo as a Blob object.
- `videoStream`: A reactive reference to the MediaStream object representing the video stream.

**Methods**:
- `setUpVideoForScreenshot(videoOptions?: Object)`: Promise<void>: Sets up the video stream with the given options and binds it to the videoForScreenShot element.
 **Default options**:
```javascript
{
  width: {max: 1280, ideal: 1280},
  height: {min: 400, ideal: 1080},
  facingMode: 'user',
  frameRate: {min: 15, ideal: 24, max: 30},
  aspectRatio: {ideal: 1.7777777778},
}
```
- `capturePhoto(videoElement: HTMLVideoElement)`: void: Captures a photo from the provided video element and stores it as a Blob in screenshotVideoBlob.

#### Example with Custom Options
```vue
<script setup>
import { onMounted } from 'vue';
import { usePhotoCapture } from 'vue-photo-capture';

const { setUpVideoForScreenshot, capturePhoto } = usePhotoCapture();

onMounted(async () => {
  const customOptions = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode:  'environment', // Use the rear camera if available
  };
  await setUpVideoForScreenshot(customOptions);
});
</script>
```
If needed to show video:
```vue
<script setup>
import { onMounted } from 'vue';
import { usePhotoCapture } from 'vue-photo-capture';

const { setUpVideoForScreenshot, capturePhoto } = usePhotoCapture();
const video = ref(null);

onMounted(async () => {
  const customOptions = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode:  'environment', // Use the rear camera if available
  };
  await setUpVideoForScreenshot(customOptions);
  
  if (video.value && 'srcObject' in video.value) {
    video.value.srcObject = videoStream.value;
  } else {
     (video.value).src = URL.createObjectURL(videoStream.value);
  }
});
</script>

<template>
    <video ref="video" playsinline autoplay src></video>
</template>
```

#### Cleanup
usePhotoCapture automatically cleans up resources when the component is unmounted, resetting all reactive references to null.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the MIT License.