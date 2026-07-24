import { ref, shallowRef, onUnmounted, getCurrentInstance } from 'vue';

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
}

export interface CaptureOptions {
    /** Output image mime type, e.g. `'image/png'` (default), `'image/jpeg'`, `'image/webp'`. */
    type?: string;
    /** Quality `0..1` for lossy formats (`image/jpeg` | `image/webp`). Ignored for PNG. */
    quality?: number;
    /** Mirror the frame horizontally (useful for the front/selfie camera). */
    mirror?: boolean;
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

    // --- hardware controls ---------------------------------------------------
    const canTorch = ref(false);
    const canZoom = ref(false);
    const zoomRange = ref<ZoomRange | null>(null);
    const torchOn = ref(false);
    const zoom = ref(1);

    // --- barcode scanning ----------------------------------------------------
    const detectedCodes = ref<DetectedBarcode[]>([]);

    let objectUrl: string | null = null;
    let barcodeDetector: { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> } | null = null;
    let scanFrame: number | null = null;
    let deviceListenerAttached = false;

    const activeTrack = (): MediaStreamTrack | null =>
        videoStream.value?.getVideoTracks()[0] ?? null;

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

    const setUpVideoForScreenshot = async (
        videoOptions: MediaStreamConstraints['video'] = DEFAULT_CONSTRAINTS,
    ): Promise<void> => {
        error.value = null;

        if (!isSupported) {
            const e = new Error('getUserMedia is not supported in this environment');
            error.value = e;
            throw e;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: videoOptions });
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

            // hardware capabilities & current device
            currentDeviceId.value = settings.deviceId ?? null;
            isFrontCamera.value = settings.facingMode === 'user';
            const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
                torch?: boolean;
                zoom?: { min: number; max: number; step?: number };
            };
            canTorch.value = !!caps.torch;
            canZoom.value = !!caps.zoom;
            zoomRange.value = caps.zoom
                ? { min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step ?? 0.1 }
                : null;
            torchOn.value = false;
            zoom.value = (settings as MediaTrackSettings & { zoom?: number }).zoom ?? 1;

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
        videoElem: HTMLVideoElement | null = videoForScreenShot.value,
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
            const width = videoElem.width || videoElem.videoWidth;
            const height = videoElem.height || videoElem.videoHeight;
            if (!width || !height) {
                fail('Video has no dimensions yet — is the camera stream playing?');
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                fail('Unable to get a 2D canvas context');
                return;
            }

            if (captureOptions.mirror) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
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

    /** Toggle the camera torch/flashlight (where supported). */
    const setTorch = async (on: boolean): Promise<void> => {
        const track = activeTrack();
        if (!track) throw new Error('Camera is not active');
        if (!canTorch.value) throw new Error('Torch is not supported by this camera');
        await track.applyConstraints({ advanced: [{ torch: on }] } as unknown as MediaTrackConstraints);
        torchOn.value = on;
    };

    /** Set the optical/digital zoom level within `zoomRange` (where supported). */
    const setZoom = async (value: number): Promise<void> => {
        const track = activeTrack();
        if (!track) throw new Error('Camera is not active');
        if (!canZoom.value) throw new Error('Zoom is not supported by this camera');
        await track.applyConstraints({ advanced: [{ zoom: value }] } as unknown as MediaTrackConstraints);
        zoom.value = value;
    };

    // --- barcode / QR scanning ----------------------------------------------

    /** Detect barcodes/QR codes in a single frame. Updates `detectedCodes`. */
    const scan = async (
        source: CanvasImageSource | null = videoForScreenShot.value,
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
        videoStream.value?.getTracks().forEach((track) => track.stop());
        if (videoForScreenShot.value) {
            videoForScreenShot.value.srcObject = null;
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
        // devices
        devices,
        currentDeviceId,
        isFrontCamera,
        refreshDevices,
        switchCamera,
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
        // barcode scanning
        isBarcodeSupported,
        detectedCodes,
        scan,
        startScanning,
        stopScanning,
    } as const;
}

export type UsePhotoCapture = ReturnType<typeof usePhotoCapture>;
