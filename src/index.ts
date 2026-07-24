import { ref, shallowRef, onUnmounted, getCurrentInstance, type Ref } from 'vue';

/** Reactive permission state for the camera. */
export type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unknown';

export interface PhotoCaptureOptions {
    /** Stop tracks and reset state automatically when the host component unmounts. Default: `true`. */
    autoCleanup?: boolean;
}

export interface CaptureOptions {
    /** Output image mime type, e.g. `'image/png'` (default), `'image/jpeg'`, `'image/webp'`. */
    type?: string;
    /** Quality `0..1` for lossy formats (`image/jpeg` | `image/webp`). Ignored for PNG. */
    quality?: number;
}

export interface UsePhotoCapture {
    /** The `<video>` element bound to the stream, or `null` before setup / after `stop()`. */
    videoForScreenShot: Ref<HTMLVideoElement | null>;
    /** The most recently captured photo as a `Blob`, or `null`. */
    screenshotVideoBlob: Ref<Blob | null>;
    /** The active `MediaStream`, or `null` before setup / after `stop()`. */
    videoStream: Ref<MediaStream | null>;
    /** `true` when `navigator.mediaDevices.getUserMedia` is available (SSR-safe). */
    isSupported: boolean;
    /** `true` while a stream is running. */
    isActive: Ref<boolean>;
    /** The last error thrown by setup/capture (preserves the original `DOMException`), or `null`. */
    error: Ref<Error | null>;
    /** Reactive camera permission state. */
    permission: Ref<CameraPermission>;
    /** Request the camera and bind the stream to an internal `<video>` element. */
    setUpVideoForScreenshot: (videoOptions?: MediaStreamConstraints['video']) => Promise<void>;
    /** Draw the current video frame to a canvas and resolve with a `Blob`. Also updates `screenshotVideoBlob`. */
    capturePhoto: (videoElem?: HTMLVideoElement | null, captureOptions?: CaptureOptions) => Promise<Blob>;
    /** Stop all tracks, detach the stream and reset reactive state. Safe to call multiple times. */
    stop: () => void;
}

const DEFAULT_CONSTRAINTS = {
    width: { max: 1280, ideal: 1280 },
    height: { min: 400, ideal: 1080 },
    facingMode: 'user',
    frameRate: { min: 15, ideal: 24, max: 30 },
    aspectRatio: { ideal: 16 / 9 },
} satisfies MediaTrackConstraints;

export function usePhotoCapture(options: PhotoCaptureOptions = {}): UsePhotoCapture {
    const { autoCleanup = true } = options;

    const isSupported =
        typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

    const videoForScreenShot = ref<HTMLVideoElement | null>(null);
    const screenshotVideoBlob = ref<Blob | null>(null);
    const videoStream = shallowRef<MediaStream | null>(null);
    const isActive = ref(false);
    const error = shallowRef<Error | null>(null);
    const permission = ref<CameraPermission>('unknown');

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

            const { width, height } = stream.getVideoTracks()[0].getSettings();
            const el = document.createElement('video');
            el.setAttribute('autoplay', 'true');
            el.setAttribute('playsinline', 'true');
            el.setAttribute('width', String(width || 1280));
            el.setAttribute('height', String(height || 1280));
            el.srcObject = stream;

            videoForScreenShot.value = el;
            videoStream.value = stream;
            isActive.value = true;
            permission.value = 'granted';
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

            const canvas = document.createElement('canvas');
            canvas.width = videoElem.width;
            canvas.height = videoElem.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                fail('Unable to get a 2D canvas context');
                return;
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

    const stop = (): void => {
        videoStream.value?.getTracks().forEach((track) => track.stop());
        if (videoForScreenShot.value) {
            videoForScreenShot.value.srcObject = null;
        }
        videoStream.value = null;
        videoForScreenShot.value = null;
        isActive.value = false;
    };

    // Only register the lifecycle hook inside an active component instance,
    // so calling the composable outside a component (e.g. in tests) is safe.
    if (autoCleanup && getCurrentInstance()) {
        onUnmounted(stop);
    }

    return {
        videoForScreenShot,
        screenshotVideoBlob,
        videoStream,
        isSupported,
        isActive,
        error,
        permission,
        setUpVideoForScreenshot,
        capturePhoto,
        stop,
    };
}
