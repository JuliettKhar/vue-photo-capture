import { ref as r } from "vue";
function d() {
  const e = r(null), i = r(null), n = r(null), c = {
    width: { max: 1280, ideal: 1280 },
    height: { min: 400, ideal: 1080 },
    facingMode: "user",
    frameRate: { min: 15, ideal: 24, max: 30 },
    aspectRatio: { ideal: 1.7777777778 }
  };
  return {
    videoForScreenShot: e,
    screenshotVideoBlob: i,
    videoStream: n,
    setUpVideoForScreenshot: async (o = c) => {
      try {
        const t = await navigator.mediaDevices.getUserMedia({ video: o }), { width: s, height: a } = t.getVideoTracks()[0].getSettings();
        e.value = document.createElement("video"), e.value.setAttribute("autoplay", "true"), e.value.setAttribute("playsinline", "true"), e.value.setAttribute("width", String(s || 1280)), e.value.setAttribute("height", String(a || 1280)), e.value.srcObject = t, n.value = t;
      } catch (t) {
        throw new Error(t?.message || t.toString());
      }
    },
    capturePhoto: (o = e.value) => {
      if (o) {
        const t = document.createElement("canvas");
        t.width = o.width, t.height = o.height, t.getContext("2d")?.drawImage(o, 0, 0, t.width, t.height), t.toBlob((a) => {
          i.value = a;
        });
      } else
        throw new Error("The video element can not be null");
    }
  };
}
export {
  d as usePhotoCapture
};
