import { Ref } from 'vue';

/** Reactive permission state for the camera. */
export declare type CameraPermission = 'prompt' | 'granted' | 'denied' | 'unknown';

export declare interface CaptureOptions {
    /** Output image mime type, e.g. `'image/png'` (default), `'image/jpeg'`, `'image/webp'`. */
    type?: string;
    /** Quality `0..1` for lossy formats (`image/jpeg` | `image/webp`). Ignored for PNG. */
    quality?: number;
}

export declare interface PhotoCaptureOptions {
    /** Stop tracks and reset state automatically when the host component unmounts. Default: `true`. */
    autoCleanup?: boolean;
}

export declare interface UsePhotoCapture {
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

export declare function usePhotoCapture(options?: PhotoCaptureOptions): UsePhotoCapture;

export { }
