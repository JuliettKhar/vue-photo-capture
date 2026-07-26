import { ref, shallowRef, computed, watch, onUnmounted, getCurrentInstance, type Ref } from 'vue';

/** Reactive permission state for the camera. */
export type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unknown';

/** Supported/allowed zoom range reported by the active camera track. */
export interface ZoomRange {
    min: number;
    max: number;
    step: number;
}

/** A barcode/QR code detected by the native `BarcodeDetector`. */
export interface DetectedBarcode {
    rawValue: string;
    format: string;
    boundingBox: DOMRectReadOnly;
    cornerPoints: Array<{ x: number; y: number }>;
}

export interface PhotoCaptureOptions {
    /** Stop tracks and reset state automatically when the host component unmounts. Default: `true`. */
    autoCleanup?: boolean;
    /**
     * A template ref to a `<video>` element. When provided, the stream is bound to it
     * automatically (no manual `srcObject`), and it becomes the default capture source.
     */
    videoRef?: Ref<HTMLVideoElement | null | undefined>;
    /** Also request a microphone track — required to record video with sound. Default: `false`. */
    audio?: boolean;
}

/** A crop rectangle in source-image pixels. */
export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CaptureOptions {
    /** Output image mime type, e.g. `'image/png'` (default), `'image/jpeg'`, `'image/webp'`. */
    type?: string;
    /** Quality `0..1` for lossy formats (`image/jpeg` | `image/webp`). Ignored for PNG. */
    quality?: number;
    /** Mirror the frame horizontally (useful for the front/selfie camera). */
    mirror?: boolean;
    /** Crop rectangle in source pixels. Clamped to the source bounds. */
    crop?: CropRect;
    /** Downscale so the result fits within this width (aspect preserved; never upscales). */
    maxWidth?: number;
    /** Downscale so the result fits within this height (aspect preserved; never upscales). */
    maxHeight?: number;
}

/** Compute a crop rect clamped to `[0..srcW] × [0..srcH]`, defaulting to the whole image. */
function resolveCrop(srcW: number, srcH: number, crop?: CropRect): CropRect {
    if (!crop) return { x: 0, y: 0, width: srcW, height: srcH };
    const x = Math.max(0, Math.min(crop.x, srcW));
    const y = Math.max(0, Math.min(crop.y, srcH));
    return {
        x,
        y,
        width: Math.max(1, Math.min(crop.width, srcW - x)),
        height: Math.max(1, Math.min(crop.height, srcH - y)),
    };
}

/** Fit `w × h` within optional max bounds, downscaling only (aspect preserved). */
function fitWithin(w: number, h: number, maxW?: number, maxH?: number): { width: number; height: number } {
    let scale = 1;
    if (maxW && w > maxW) scale = Math.min(scale, maxW / w);
    if (maxH && h > maxH) scale = Math.min(scale, maxH / h);
    return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/**
 * Post-process an image blob: apply EXIF orientation, optional crop, resize and mirror,
 * then re-encode. Uses `createImageBitmap({ imageOrientation: 'from-image' })` so rotated
 * phone photos come out upright. Handy for editing a captured photo before upload.
 */
export async function editImage(blob: Blob, options: CaptureOptions = {}): Promise<Blob> {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    try {
        const crop = resolveCrop(bitmap.width, bitmap.height, options.crop);
        const { width: tw, height: th } = fitWithin(crop.width, crop.height, options.maxWidth, options.maxHeight);

        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Unable to get a 2D canvas context');

        if (options.mirror) {
            ctx.translate(tw, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, tw, th);

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (out) => (out ? resolve(out) : reject(new Error('Failed to encode the edited image'))),
                options.type,
                options.quality,
            );
        });
    } finally {
        bitmap.close();
    }
}

export interface RecordOptions {
    /** Recording container/codec, e.g. `'video/webm;codecs=vp9'`. Ignored if unsupported. */
    mimeType?: string;
    /** Audio bitrate in bits per second. */
    audioBitsPerSecond?: number;
    /** Video bitrate in bits per second. */
    videoBitsPerSecond?: number;
    /** Emit chunks every `timeslice` ms instead of only at stop. */
    timeslice?: number;
}

const DEFAULT_CONSTRAINTS = {
    width: { max: 1280, ideal: 1280 },
    height: { min: 400, ideal: 1080 },
    facingMode: 'user',
    frameRate: { min: 15, ideal: 24, max: 30 },
    aspectRatio: { ideal: 16 / 9 },
} satisfies MediaTrackConstraints;

export function usePhotoCapture(options: PhotoCaptureOptions = {}) {
    const { autoCleanup = true } = options;

    const isSupported =
        typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    const isBarcodeSupported =
        typeof window !== 'undefined' && 'BarcodeDetector' in window;
    const isImageCaptureSupported =
        typeof window !== 'undefined' && 'ImageCapture' in window;
    const isRecordingSupported =
        typeof window !== 'undefined' && 'MediaRecorder' in window;

    // --- core reactive state -------------------------------------------------
    const videoForScreenShot = ref<HTMLVideoElement | null>(null);
    const screenshotVideoBlob = ref<Blob | null>(null);
    const videoStream = shallowRef<MediaStream | null>(null);
    const isActive = ref(false);
    const error = shallowRef<Error | null>(null);
    const permission = ref<CameraPermission>('unknown');

    // --- devices -------------------------------------------------------------
    const devices = ref<MediaDeviceInfo[]>([]);
    const currentDeviceId = ref<string | null>(null);
    const isFrontCamera = ref(false);

    // --- stream info ---------------------------------------------------------
    const resolution = ref<{ width: number; height: number } | null>(null);
    const aspectRatio = ref<number | null>(null);
    /** Inline style that mirrors the preview for the front/selfie camera. */
    const mirrorStyle = computed(() => ({ transform: isFrontCamera.value ? 'scaleX(-1)' : 'none' }));

    // --- hardware controls ---------------------------------------------------
    const canTorch = ref(false);
    const canZoom = ref(false);
    const zoomRange = ref<ZoomRange | null>(null);
    const torchOn = ref(false);
    const zoom = ref(1);

    // advanced constraints (focus / exposure / white balance)
    const canFocus = ref(false);
    const focusRange = ref<ZoomRange | null>(null);
    const focusDistance = ref<number | null>(null);
    const canExposure = ref(false);
    const exposureRange = ref<ZoomRange | null>(null);
    const exposureCompensation = ref<number | null>(null);
    const canWhiteBalance = ref(false);
    const colorTemperatureRange = ref<ZoomRange | null>(null);
    const colorTemperature = ref<number | null>(null);

    // --- barcode scanning ----------------------------------------------------
    const detectedCodes = ref<DetectedBarcode[]>([]);

    // --- recording -----------------------------------------------------------
    const isRecording = ref(false);
    const recordedBlob = ref<Blob | null>(null);

    let objectUrl: string | null = null;
    let barcodeDetector: { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> } | null = null;
    let scanFrame: number | null = null;
    let deviceListenerAttached = false;
    let imageCapture: { takePhoto: () => Promise<Blob>; grabFrame: () => Promise<ImageBitmap> } | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];

    const activeTrack = (): MediaStreamTrack | null =>
        videoStream.value?.getVideoTracks()[0] ?? null;

    /** The element streams are bound to and captured from: the user-provided ref, else the internal one. */
    const targetVideo = (): HTMLVideoElement | null =>
        options.videoRef?.value ?? videoForScreenShot.value;

    const handleDeviceChange = () => {
        void refreshDevices();
    };

    /** Refresh the reactive list of available video input devices. */
    const refreshDevices = async (): Promise<MediaDeviceInfo[]> => {
        if (!isSupported || !navigator.mediaDevices?.enumerateDevices) return [];
        const all = await navigator.mediaDevices.enumerateDevices();
        devices.value = all.filter((d) => d.kind === 'videoinput');
        return devices.value;
    };

    // Bind the active stream to the user-provided <video> ref whenever either changes.
    const attachToVideoRef = async () => {
        const el = options.videoRef?.value;
        if (!el) return;
        if (el.srcObject !== videoStream.value) el.srcObject = videoStream.value;
        if (videoStream.value) {
            try {
                await el.play();
            } catch {
                /* autoplay may require a user gesture — ignore */
            }
        }
    };
    if (options.videoRef) {
        watch([videoStream, options.videoRef], attachToVideoRef, { flush: 'post' });
    }

    const setUpVideoForScreenshot = async (
        videoOptions: MediaStreamConstraints['video'] = DEFAULT_CONSTRAINTS,
    ): Promise<void> => {
        error.value = null;

        if (!isSupported) {
            const e = new Error('getUserMedia is not supported in this environment');
            error.value = e;
            throw e;
        }

        const audio = options.audio ?? false;
        try {
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: videoOptions, audio });
            } catch (e: unknown) {
                // If the requested constraints can't be satisfied, retry once with
                // relaxed constraints instead of failing outright.
                if ((e as { name?: string })?.name === 'OverconstrainedError') {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio });
                } else {
                    throw e;
                }
            }
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();

            const el = document.createElement('video');
            el.setAttribute('autoplay', 'true');
            el.setAttribute('playsinline', 'true');
            el.setAttribute('width', String(settings.width || 1280));
            el.setAttribute('height', String(settings.height || 1280));
            el.srcObject = stream;

            videoForScreenShot.value = el;
            videoStream.value = stream;
            isActive.value = true;
            permission.value = 'granted';
            imageCapture = null; // recreated lazily for the new track

            // stream info, hardware capabilities & current device
            resolution.value =
                settings.width && settings.height
                    ? { width: settings.width, height: settings.height }
                    : null;
            aspectRatio.value = resolution.value
                ? resolution.value.width / resolution.value.height
                : settings.aspectRatio ?? null;
            currentDeviceId.value = settings.deviceId ?? null;
            isFrontCamera.value = settings.facingMode === 'user';
            type CapRange = { min: number; max: number; step?: number };
            const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
                torch?: boolean;
                zoom?: CapRange;
                focusDistance?: CapRange;
                exposureCompensation?: CapRange;
                colorTemperature?: CapRange;
            };
            const s = settings as MediaTrackSettings & {
                zoom?: number;
                focusDistance?: number;
                exposureCompensation?: number;
                colorTemperature?: number;
            };
            const toRange = (r?: CapRange): ZoomRange | null =>
                r ? { min: r.min, max: r.max, step: r.step ?? 0.1 } : null;

            canTorch.value = !!caps.torch;
            canZoom.value = !!caps.zoom;
            zoomRange.value = toRange(caps.zoom);
            torchOn.value = false;
            zoom.value = s.zoom ?? 1;

            canFocus.value = !!caps.focusDistance;
            focusRange.value = toRange(caps.focusDistance);
            focusDistance.value = s.focusDistance ?? null;
            canExposure.value = !!caps.exposureCompensation;
            exposureRange.value = toRange(caps.exposureCompensation);
            exposureCompensation.value = s.exposureCompensation ?? null;
            canWhiteBalance.value = !!caps.colorTemperature;
            colorTemperatureRange.value = toRange(caps.colorTemperature);
            colorTemperature.value = s.colorTemperature ?? null;

            // device labels/ids become available only after permission is granted
            await refreshDevices();
            if (!deviceListenerAttached && navigator.mediaDevices.addEventListener) {
                navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
                deviceListenerAttached = true;
            }
        } catch (e: unknown) {
            const err = e instanceof Error ? e : new Error(String(e), { cause: e });
            if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
                permission.value = 'denied';
            }
            error.value = err;
            isActive.value = false;
            throw err;
        }
    };

    /**
     * Switch to another camera. Pass a `deviceId` to target a specific one,
     * or call with no argument to flip between the front and back cameras.
     */
    const switchCamera = async (deviceId?: string): Promise<void> => {
        const wasFront = isFrontCamera.value;
        stop();
        await setUpVideoForScreenshot(
            deviceId
                ? { deviceId: { exact: deviceId } }
                : { facingMode: wasFront ? 'environment' : 'user' },
        );
    };

    const capturePhoto = (
        videoElem: HTMLVideoElement | null = targetVideo(),
        captureOptions: CaptureOptions = {},
    ): Promise<Blob> =>
        new Promise((resolve, reject) => {
            const fail = (message: string) => {
                const e = new Error(message);
                error.value = e;
                reject(e);
            };

            if (!videoElem) {
                fail('The video element can not be null');
                return;
            }

            // Prefer the intrinsic media size (videoWidth/videoHeight); fall back to the
            // width/height attributes. CSS-sized <video> elements leave the attributes at 0,
            // which would otherwise produce a 0×0 canvas and an empty blob.
            const srcWidth = videoElem.width || videoElem.videoWidth;
            const srcHeight = videoElem.height || videoElem.videoHeight;
            if (!srcWidth || !srcHeight) {
                fail('Video has no dimensions yet — is the camera stream playing?');
                return;
            }

            const crop = resolveCrop(srcWidth, srcHeight, captureOptions.crop);
            const { width, height } = fitWithin(
                crop.width,
                crop.height,
                captureOptions.maxWidth,
                captureOptions.maxHeight,
            );

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                fail('Unable to get a 2D canvas context');
                return;
            }

            if (captureOptions.mirror) {
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(videoElem, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        fail('Failed to capture photo: the canvas produced an empty blob');
                        return;
                    }
                    screenshotVideoBlob.value = blob;
                    resolve(blob);
                },
                captureOptions.type,
                captureOptions.quality,
            );
        });

    // --- ImageCapture (full-resolution stills) -------------------------------

    const getImageCapture = () => {
        const track = activeTrack();
        if (!track) throw new Error('Camera is not active');
        imageCapture ??= new (window as unknown as {
            ImageCapture: new (t: MediaStreamTrack) => {
                takePhoto: () => Promise<Blob>;
                grabFrame: () => Promise<ImageBitmap>;
            };
        }).ImageCapture(track);
        return imageCapture;
    };

    /**
     * Capture a still. Uses the native `ImageCapture.takePhoto()` for full sensor
     * resolution where available, and falls back to a canvas frame grab otherwise.
     * Updates `screenshotVideoBlob`.
     */
    const takePhoto = async (captureOptions: CaptureOptions = {}): Promise<Blob> => {
        if (isImageCaptureSupported && activeTrack()) {
            try {
                let blob: Blob = await getImageCapture().takePhoto();
                // The ImageCapture blob is full-res and may carry EXIF orientation;
                // post-process only when the caller asked for crop/resize/mirror.
                const needsEdit =
                    !!captureOptions.crop ||
                    captureOptions.maxWidth != null ||
                    captureOptions.maxHeight != null ||
                    !!captureOptions.mirror;
                if (needsEdit) blob = await editImage(blob, captureOptions);
                screenshotVideoBlob.value = blob;
                return blob;
            } catch {
                /* some devices reject takePhoto — fall back to canvas below */
            }
        }
        return capturePhoto(targetVideo(), captureOptions);
    };

    /** Grab the current frame as an `ImageBitmap` via `ImageCapture` (no canvas). */
    const grabFrame = async (): Promise<ImageBitmap> => {
        if (!isImageCaptureSupported) {
            throw new Error('ImageCapture is not supported in this browser');
        }
        return getImageCapture().grabFrame();
    };

    // --- output helpers ------------------------------------------------------

    /** Create a `blob:` object URL for the captured photo, auto-revoking the previous one. */
    const toObjectURL = (blob: Blob | null = screenshotVideoBlob.value): string => {
        if (!blob) throw new Error('No photo has been captured yet');
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob);
        return objectUrl;
    };

    /** Read the captured photo as a base64 `data:` URL. */
    const toDataURL = (blob: Blob | null = screenshotVideoBlob.value): Promise<string> =>
        new Promise((resolve, reject) => {
            if (!blob) {
                reject(new Error('No photo has been captured yet'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error ?? new Error('Failed to read the photo blob'));
            reader.readAsDataURL(blob);
        });

    /** Wrap the captured photo in a `File`, ready for `FormData`/upload. */
    const toFile = (name = 'photo.png', blob: Blob | null = screenshotVideoBlob.value): File => {
        if (!blob) throw new Error('No photo has been captured yet');
        return new File([blob], name, { type: blob.type || 'image/png' });
    };

    // --- hardware controls ---------------------------------------------------

    // Apply a single advanced MediaTrackConstraint to the active track, guarded by a
    // capability flag. Non-standard constraint keys are cast through `unknown`.
    const applyAdvanced = async (
        supported: boolean,
        label: string,
        constraint: Record<string, unknown>,
    ): Promise<void> => {
        const track = activeTrack();
        if (!track) throw new Error('Camera is not active');
        if (!supported) throw new Error(`${label} is not supported by this camera`);
        await track.applyConstraints({ advanced: [constraint] } as unknown as MediaTrackConstraints);
    };

    /** Toggle the camera torch/flashlight (where supported). */
    const setTorch = async (on: boolean): Promise<void> => {
        await applyAdvanced(canTorch.value, 'Torch', { torch: on });
        torchOn.value = on;
    };

    /** Set the optical/digital zoom level within `zoomRange` (where supported). */
    const setZoom = async (value: number): Promise<void> => {
        await applyAdvanced(canZoom.value, 'Zoom', { zoom: value });
        zoom.value = value;
    };

    /** Set the manual focus distance within `focusRange` (where supported). */
    const setFocusDistance = async (value: number): Promise<void> => {
        await applyAdvanced(canFocus.value, 'Manual focus', { focusMode: 'manual', focusDistance: value });
        focusDistance.value = value;
    };

    /**
     * Tap-to-focus at a normalized point (`x`/`y` in `0..1`, top-left origin)
     * using a single-shot autofocus (where supported).
     */
    const focusAt = async (x: number, y: number): Promise<void> => {
        await applyAdvanced(canFocus.value, 'Focus', {
            focusMode: 'single-shot',
            pointsOfInterest: [{ x, y }],
        });
    };

    /** Set the exposure compensation within `exposureRange` (where supported). */
    const setExposureCompensation = async (value: number): Promise<void> => {
        await applyAdvanced(canExposure.value, 'Exposure', {
            exposureMode: 'manual',
            exposureCompensation: value,
        });
        exposureCompensation.value = value;
    };

    /** Set the white-balance color temperature (Kelvin) within range (where supported). */
    const setColorTemperature = async (value: number): Promise<void> => {
        await applyAdvanced(canWhiteBalance.value, 'White balance', {
            whiteBalanceMode: 'manual',
            colorTemperature: value,
        });
        colorTemperature.value = value;
    };

    // --- video recording -----------------------------------------------------

    /** Start recording the live stream (include audio via `usePhotoCapture({ audio: true })`). */
    const startRecording = (recordOptions: RecordOptions = {}): void => {
        if (!isRecordingSupported) {
            throw new Error('MediaRecorder is not supported in this browser');
        }
        if (!videoStream.value) throw new Error('Camera is not active');
        if (isRecording.value) return;

        const mimeType =
            recordOptions.mimeType && MediaRecorder.isTypeSupported(recordOptions.mimeType)
                ? recordOptions.mimeType
                : undefined;
        recordedChunks = [];
        const recorder = new MediaRecorder(videoStream.value, {
            ...(mimeType ? { mimeType } : {}),
            ...(recordOptions.audioBitsPerSecond ? { audioBitsPerSecond: recordOptions.audioBitsPerSecond } : {}),
            ...(recordOptions.videoBitsPerSecond ? { videoBitsPerSecond: recordOptions.videoBitsPerSecond } : {}),
        });
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder = recorder;
        recorder.start(recordOptions.timeslice);
        isRecording.value = true;
    };

    /** Stop recording and resolve with the recorded `Blob`. Also updates `recordedBlob`. */
    const stopRecording = (): Promise<Blob> =>
        new Promise((resolve, reject) => {
            const recorder = mediaRecorder;
            if (!recorder || recorder.state === 'inactive') {
                reject(new Error('Not recording'));
                return;
            }
            recorder.onstop = () => {
                const type = recorder.mimeType || recordedChunks[0]?.type || 'video/webm';
                const blob = new Blob(recordedChunks, { type });
                recordedBlob.value = blob;
                isRecording.value = false;
                mediaRecorder = null;
                resolve(blob);
            };
            recorder.stop();
        });

    /** Pause an in-progress recording. */
    const pauseRecording = (): void => {
        if (mediaRecorder?.state === 'recording') mediaRecorder.pause();
    };

    /** Resume a paused recording. */
    const resumeRecording = (): void => {
        if (mediaRecorder?.state === 'paused') mediaRecorder.resume();
    };

    // --- barcode / QR scanning ----------------------------------------------

    /** Detect barcodes/QR codes in a single frame. Updates `detectedCodes`. */
    const scan = async (
        source: CanvasImageSource | null = targetVideo(),
    ): Promise<DetectedBarcode[]> => {
        if (!isBarcodeSupported) {
            throw new Error('BarcodeDetector is not supported in this browser');
        }
        if (!source) return [];
        barcodeDetector ??= new (window as unknown as {
            BarcodeDetector: new () => { detect: (s: CanvasImageSource) => Promise<DetectedBarcode[]> };
        }).BarcodeDetector();
        const codes = await barcodeDetector.detect(source);
        detectedCodes.value = codes;
        return codes;
    };

    /** Continuously scan the live video for codes until `stopScanning()` is called. */
    const startScanning = (onDetect?: (codes: DetectedBarcode[]) => void): void => {
        if (!isBarcodeSupported) {
            throw new Error('BarcodeDetector is not supported in this browser');
        }
        const loop = async () => {
            try {
                const codes = await scan();
                if (codes.length && onDetect) onDetect(codes);
            } catch {
                /* frame not ready yet — keep scanning */
            }
            scanFrame = requestAnimationFrame(loop);
        };
        void loop();
    };

    /** Stop the continuous scanning loop started by `startScanning()`. */
    const stopScanning = (): void => {
        if (scanFrame !== null) {
            cancelAnimationFrame(scanFrame);
            scanFrame = null;
        }
    };

    // --- teardown ------------------------------------------------------------

    const stop = (): void => {
        stopScanning();
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            try {
                mediaRecorder.stop();
            } catch {
                /* already stopped */
            }
        }
        mediaRecorder = null;
        isRecording.value = false;
        imageCapture = null;
        videoStream.value?.getTracks().forEach((track) => track.stop());
        if (videoForScreenShot.value) {
            videoForScreenShot.value.srcObject = null;
        }
        if (options.videoRef?.value) {
            options.videoRef.value.srcObject = null;
        }
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
        if (deviceListenerAttached && navigator.mediaDevices?.removeEventListener) {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
            deviceListenerAttached = false;
        }
        videoStream.value = null;
        videoForScreenShot.value = null;
        isActive.value = false;
        canTorch.value = false;
        canZoom.value = false;
        zoomRange.value = null;
        torchOn.value = false;
        canFocus.value = false;
        focusRange.value = null;
        focusDistance.value = null;
        canExposure.value = false;
        exposureRange.value = null;
        exposureCompensation.value = null;
        canWhiteBalance.value = false;
        colorTemperatureRange.value = null;
        colorTemperature.value = null;
        resolution.value = null;
        aspectRatio.value = null;
    };

    // Only register the lifecycle hook inside an active component instance,
    // so calling the composable outside a component (e.g. in tests) is safe.
    if (autoCleanup && getCurrentInstance()) {
        onUnmounted(stop);
    }

    return {
        // core state
        videoForScreenShot,
        screenshotVideoBlob,
        videoStream,
        isSupported,
        isActive,
        error,
        permission,
        // core methods
        setUpVideoForScreenshot,
        capturePhoto,
        stop,
        // full-resolution stills
        isImageCaptureSupported,
        takePhoto,
        grabFrame,
        // devices
        devices,
        currentDeviceId,
        isFrontCamera,
        refreshDevices,
        switchCamera,
        // stream info
        resolution,
        aspectRatio,
        mirrorStyle,
        // output helpers
        toObjectURL,
        toDataURL,
        toFile,
        // hardware controls
        canTorch,
        canZoom,
        zoomRange,
        torchOn,
        zoom,
        setTorch,
        setZoom,
        // advanced constraints
        canFocus,
        focusRange,
        focusDistance,
        setFocusDistance,
        focusAt,
        canExposure,
        exposureRange,
        exposureCompensation,
        setExposureCompensation,
        canWhiteBalance,
        colorTemperatureRange,
        colorTemperature,
        setColorTemperature,
        // video recording
        isRecordingSupported,
        isRecording,
        recordedBlob,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        // barcode scanning
        isBarcodeSupported,
        detectedCodes,
        scan,
        startScanning,
        stopScanning,
    } as const;
}

export type UsePhotoCapture = ReturnType<typeof usePhotoCapture>;

export { CameraCapture } from './CameraCapture';
