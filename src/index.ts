import {ref, UnwrapRef} from 'vue';


export function usePhotoCapture() {
    const videoForScreenShot = ref<null | HTMLVideoElement>(null);
    const screenshotVideoBlob = ref<null | Blob>(null);
    const videoStream = ref<MediaStream | null>(null);
    const streamOptions = {
        width: {max: 1280, ideal: 1280},
        height: {min: 400, ideal: 1080},
        facingMode: {exact: 'user'},
        frameRate: {min: 15, ideal: 24, max: 30},
        aspectRatio: {ideal: 1.7777777778},
    }
    const setUpVideoForScreenshot = async (videoOptions = streamOptions): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({video: videoOptions});

            const {width, height} = stream.getVideoTracks()[0].getSettings();
            videoForScreenShot.value = document.createElement('video');
            videoForScreenShot.value.setAttribute('autoplay', 'true');
            videoForScreenShot.value.setAttribute('playsinline', 'true');
            videoForScreenShot.value.setAttribute('width', String(width || 1280));
            videoForScreenShot.value.setAttribute('height', String(height || 1280));

            videoForScreenShot.value.srcObject = stream;
            videoStream.value = stream;
        } catch (e: Error | any) {
            throw new Error(e?.message || e.toString());
        }
    }

    const capturePhoto = (videoElem: UnwrapRef<HTMLVideoElement | null> = videoForScreenShot.value): void => {
        if (videoElem) {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            canvas.width = videoElem.width;
            canvas.height = videoElem.height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoElem, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                screenshotVideoBlob.value = blob;
            });
        } else {
            throw new Error('The video element can not be null')
        }
    }

    return {
        videoForScreenShot,
        screenshotVideoBlob,
        videoStream,
        setUpVideoForScreenshot,
        capturePhoto
    };
}
