---
layout: home

hero:
  name: Vue Photo Capture
  text: Camera capture for Vue 3
  tagline: Photos, video, cropping, QR scanning and hardware controls — a composable and a drop-in component.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api
    - theme: alt
      text: Live Demo
      link: https://juliettkhar.github.io/vue-photo-capture/demo/

features:
  - title: 📸 Photos & full-res stills
    details: Capture the current frame as a Blob, or full sensor resolution via ImageCapture with a canvas fallback.
  - title: 🎥 Video recording
    details: Record clips with MediaRecorder — optional audio, pause/resume.
  - title: ✂️ Crop, resize & EXIF
    details: Crop and downscale on capture; editImage() applies EXIF orientation to any blob.
  - title: 🔄 Camera switching
    details: List devices, switch by id, or flip front/back. Reactive resolution and mirror style.
  - title: 🔦 Hardware controls
    details: Torch, zoom, focus, exposure and white balance — all capability-guarded.
  - title: 🔍 QR / barcode scanning
    details: Native BarcodeDetector, with a documented ponyfill path for Safari/Firefox.
  - title: 🧩 Drop-in component
    details: <CameraCapture> gives you a ready-made UI with slots, events and exposed methods.
  - title: ♻️ Real cleanup
    details: Tracks stop on unmount, reactive state, SSR-safe support flags, shipped TypeScript types.
---
