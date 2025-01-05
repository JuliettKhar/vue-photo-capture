import { ref as i } from "vue";
function d() {
  const t = i(null), n = i(null), s = i(null), c = {
    width: { max: 1280, ideal: 1280 },
    height: { min: 400, ideal: 1080 },
    facingMode: "user",
    frameRate: { min: 15, ideal: 24, max: 30 },
    aspectRatio: { ideal: 1.7777777778 }
  };
  return {
    videoForScreenShot: t,
    screenshotVideoBlob: n,
    videoStream: s,
    setUpVideoForScreenshot: async (o = c) => {
      try {
        const e = await navigator.mediaDevices.getUserMedia({ video: o }), { width: a, height: r } = e.getVideoTracks()[0].getSettings();
        t.value = document.createElement("video"), t.value.setAttribute("autoplay", "true"), t.value.setAttribute("playsinline", "true"), t.value.setAttribute("width", String(a || 1280)), t.value.setAttribute("height", String(r || 1280)), t.value.srcObject = e, s.value = e;
      } catch (e) {
        throw new Error((e == null ? void 0 : e.message) || e.toString());
      }
    },
    capturePhoto: (o = t.value) => {
      if (o) {
        const e = document.createElement("canvas");
        e.width = o.width, e.height = o.height;
        const a = e.getContext("2d");
        a == null || a.drawImage(o, 0, 0, e.width, e.height), e.toBlob((r) => {
          n.value = r;
        });
      } else
        throw new Error("The video element can not be null");
    }
  };
}
export {
  d as usePhotoCapture
};
