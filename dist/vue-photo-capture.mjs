import { getCurrentInstance as e, onUnmounted as t, ref as n, shallowRef as r } from "vue";
//#region src/index.ts
var i = {
	width: {
		max: 1280,
		ideal: 1280
	},
	height: {
		min: 400,
		ideal: 1080
	},
	facingMode: "user",
	frameRate: {
		min: 15,
		ideal: 24,
		max: 30
	},
	aspectRatio: { ideal: 16 / 9 }
};
function a(a = {}) {
	let { autoCleanup: o = !0 } = a, s = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, c = n(null), l = n(null), u = r(null), d = n(!1), f = r(null), p = n("unknown"), m = async (e = i) => {
		if (f.value = null, !s) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw f.value = e, e;
		}
		try {
			let t = await navigator.mediaDevices.getUserMedia({ video: e }), { width: n, height: r } = t.getVideoTracks()[0].getSettings(), i = document.createElement("video");
			i.setAttribute("autoplay", "true"), i.setAttribute("playsinline", "true"), i.setAttribute("width", String(n || 1280)), i.setAttribute("height", String(r || 1280)), i.srcObject = t, c.value = i, u.value = t, d.value = !0, p.value = "granted";
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (p.value = "denied"), f.value = t, d.value = !1, t;
		}
	}, h = (e = c.value, t = {}) => new Promise((n, r) => {
		let i = (e) => {
			let t = Error(e);
			f.value = t, r(t);
		};
		if (!e) {
			i("The video element can not be null");
			return;
		}
		let a = document.createElement("canvas");
		a.width = e.width, a.height = e.height;
		let o = a.getContext("2d");
		if (!o) {
			i("Unable to get a 2D canvas context");
			return;
		}
		o.drawImage(e, 0, 0, a.width, a.height), a.toBlob((e) => {
			if (!e) {
				i("Failed to capture photo: the canvas produced an empty blob");
				return;
			}
			l.value = e, n(e);
		}, t.type, t.quality);
	}), g = () => {
		u.value?.getTracks().forEach((e) => e.stop()), c.value && (c.value.srcObject = null), u.value = null, c.value = null, d.value = !1;
	};
	return o && e() && t(g), {
		videoForScreenShot: c,
		screenshotVideoBlob: l,
		videoStream: u,
		isSupported: s,
		isActive: d,
		error: f,
		permission: p,
		setUpVideoForScreenshot: m,
		capturePhoto: h,
		stop: g
	};
}
//#endregion
export { a as usePhotoCapture };
