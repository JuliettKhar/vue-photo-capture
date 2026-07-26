import { computed as e, defineComponent as t, getCurrentInstance as n, h as r, onMounted as i, onUnmounted as a, ref as o, shallowRef as s, watch as c } from "vue";
//#region src/CameraCapture.ts
var l = t({
	name: "CameraCapture",
	props: {
		autoStart: {
			type: Boolean,
			default: !0
		},
		facingMode: {
			type: String,
			default: void 0
		},
		constraints: {
			type: [Object, Boolean],
			default: void 0
		},
		audio: {
			type: Boolean,
			default: !1
		},
		mirror: {
			type: Boolean,
			default: void 0
		},
		type: {
			type: String,
			default: void 0
		},
		quality: {
			type: Number,
			default: void 0
		}
	},
	emits: {
		capture: (e) => e instanceof Blob,
		recorded: (e) => e instanceof Blob,
		error: (e) => e instanceof Error,
		ready: () => !0,
		switch: (e) => e === void 0 || typeof e == "string"
	},
	setup(t, { emit: n, slots: a, expose: s }) {
		let c = o(null), l = d({
			videoRef: c,
			audio: t.audio
		}), u = o(!1), f = e(() => t.mirror ?? l.isFrontCamera.value), p = (e) => n("error", l.error.value ?? (e instanceof Error ? e : Error(String(e)))), m = async () => {
			try {
				let e = t.constraints ?? (t.facingMode ? { facingMode: t.facingMode } : void 0);
				await l.setUpVideoForScreenshot(e);
			} catch (e) {
				p(e);
			}
		}, h = async () => {
			try {
				let e = await l.takePhoto({
					type: t.type,
					quality: t.quality,
					mirror: f.value
				});
				return n("capture", e), e;
			} catch (e) {
				p(e);
			}
		}, g = async (e) => {
			try {
				await l.switchCamera(e), n("switch", e);
			} catch (e) {
				p(e);
			}
		}, _ = async () => {
			let e = await l.stopRecording();
			return n("recorded", e), e;
		}, v = () => {
			u.value || (u.value = !0, n("ready"));
		};
		i(() => {
			t.autoStart && m();
		}), s({
			start: m,
			stop: l.stop,
			capture: h,
			switchCamera: g,
			takePhoto: l.takePhoto,
			grabFrame: l.grabFrame,
			startRecording: l.startRecording,
			stopRecording: _,
			camera: l
		});
		let y = () => ({
			capture: h,
			start: m,
			stop: l.stop,
			switchCamera: g,
			startRecording: l.startRecording,
			stopRecording: _,
			isActive: l.isActive.value,
			isRecording: l.isRecording.value,
			isFrontCamera: l.isFrontCamera.value,
			ready: u.value,
			error: l.error.value,
			devices: l.devices.value
		}), b = () => r("div", { class: "camera-capture__controls" }, [r("button", {
			type: "button",
			disabled: !l.isActive.value || !u.value,
			onClick: () => void h()
		}, "Capture"), r("button", {
			type: "button",
			disabled: !l.isActive.value,
			onClick: () => void g()
		}, "Flip")]);
		return () => r("div", { class: "camera-capture" }, [r("div", {
			class: "camera-capture__stage",
			style: { position: "relative" }
		}, [r("video", {
			ref: c,
			class: "camera-capture__video",
			playsinline: !0,
			autoplay: !0,
			muted: !0,
			style: {
				width: "100%",
				display: "block",
				objectFit: "cover",
				transform: f.value ? "scaleX(-1)" : void 0
			},
			onLoadedmetadata: v,
			onPlaying: v
		}), a.overlay?.(y())]), a.controls ? a.controls(y()) : b()]);
	}
}), u = {
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
function d(t = {}) {
	let { autoCleanup: r = !0 } = t, i = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, l = typeof window < "u" && "BarcodeDetector" in window, d = typeof window < "u" && "ImageCapture" in window, f = typeof window < "u" && "MediaRecorder" in window, p = o(null), m = o(null), h = s(null), g = o(!1), _ = s(null), v = o("unknown"), y = o([]), b = o(null), x = o(!1), S = o(null), C = o(null), w = e(() => ({ transform: x.value ? "scaleX(-1)" : "none" })), T = o(!1), E = o(!1), D = o(null), O = o(!1), k = o(1), A = o([]), j = o(!1), M = o(null), N = null, P = null, F = null, I = !1, L = null, R = null, z = [], B = () => h.value?.getVideoTracks()[0] ?? null, V = () => t.videoRef?.value ?? p.value, H = () => {
		U();
	}, U = async () => {
		if (!i || !navigator.mediaDevices?.enumerateDevices) return [];
		let e = await navigator.mediaDevices.enumerateDevices();
		return y.value = e.filter((e) => e.kind === "videoinput"), y.value;
	};
	t.videoRef && c([h, t.videoRef], async () => {
		let e = t.videoRef?.value;
		if (e && (e.srcObject !== h.value && (e.srcObject = h.value), h.value)) try {
			await e.play();
		} catch {}
	}, { flush: "post" });
	let W = async (e = u) => {
		if (_.value = null, !i) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw _.value = e, e;
		}
		let n = t.audio ?? !1;
		try {
			let t;
			try {
				t = await navigator.mediaDevices.getUserMedia({
					video: e,
					audio: n
				});
			} catch (e) {
				if (e?.name === "OverconstrainedError") t = await navigator.mediaDevices.getUserMedia({
					video: !0,
					audio: n
				});
				else throw e;
			}
			let r = t.getVideoTracks()[0], i = r.getSettings(), a = document.createElement("video");
			a.setAttribute("autoplay", "true"), a.setAttribute("playsinline", "true"), a.setAttribute("width", String(i.width || 1280)), a.setAttribute("height", String(i.height || 1280)), a.srcObject = t, p.value = a, h.value = t, g.value = !0, v.value = "granted", L = null, S.value = i.width && i.height ? {
				width: i.width,
				height: i.height
			} : null, C.value = S.value ? S.value.width / S.value.height : i.aspectRatio ?? null, b.value = i.deviceId ?? null, x.value = i.facingMode === "user";
			let o = r.getCapabilities?.() ?? {};
			T.value = !!o.torch, E.value = !!o.zoom, D.value = o.zoom ? {
				min: o.zoom.min,
				max: o.zoom.max,
				step: o.zoom.step ?? .1
			} : null, O.value = !1, k.value = i.zoom ?? 1, await U(), !I && navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener("devicechange", H), I = !0);
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (v.value = "denied"), _.value = t, g.value = !1, t;
		}
	}, ee = async (e) => {
		let t = x.value;
		$(), await W(e ? { deviceId: { exact: e } } : { facingMode: t ? "environment" : "user" });
	}, G = (e = V(), t = {}) => new Promise((n, r) => {
		let i = (e) => {
			let t = Error(e);
			_.value = t, r(t);
		};
		if (!e) {
			i("The video element can not be null");
			return;
		}
		let a = e.width || e.videoWidth, o = e.height || e.videoHeight;
		if (!a || !o) {
			i("Video has no dimensions yet — is the camera stream playing?");
			return;
		}
		let s = document.createElement("canvas");
		s.width = a, s.height = o;
		let c = s.getContext("2d");
		if (!c) {
			i("Unable to get a 2D canvas context");
			return;
		}
		t.mirror && (c.translate(s.width, 0), c.scale(-1, 1)), c.drawImage(e, 0, 0, s.width, s.height), s.toBlob((e) => {
			if (!e) {
				i("Failed to capture photo: the canvas produced an empty blob");
				return;
			}
			m.value = e, n(e);
		}, t.type, t.quality);
	}), K = () => {
		let e = B();
		if (!e) throw Error("Camera is not active");
		return L ??= new window.ImageCapture(e), L;
	}, te = async (e = {}) => {
		if (d && B()) try {
			let e = await K().takePhoto();
			return m.value = e, e;
		} catch {}
		return G(V(), e);
	}, ne = async () => {
		if (!d) throw Error("ImageCapture is not supported in this browser");
		return K().grabFrame();
	}, q = (e = m.value) => {
		if (!e) throw Error("No photo has been captured yet");
		return N && URL.revokeObjectURL(N), N = URL.createObjectURL(e), N;
	}, J = (e = m.value) => new Promise((t, n) => {
		if (!e) {
			n(/* @__PURE__ */ Error("No photo has been captured yet"));
			return;
		}
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error ?? /* @__PURE__ */ Error("Failed to read the photo blob")), r.readAsDataURL(e);
	}), Y = (e = "photo.png", t = m.value) => {
		if (!t) throw Error("No photo has been captured yet");
		return new File([t], e, { type: t.type || "image/png" });
	}, X = async (e) => {
		let t = B();
		if (!t) throw Error("Camera is not active");
		if (!T.value) throw Error("Torch is not supported by this camera");
		await t.applyConstraints({ advanced: [{ torch: e }] }), O.value = e;
	}, re = async (e) => {
		let t = B();
		if (!t) throw Error("Camera is not active");
		if (!E.value) throw Error("Zoom is not supported by this camera");
		await t.applyConstraints({ advanced: [{ zoom: e }] }), k.value = e;
	}, ie = (e = {}) => {
		if (!f) throw Error("MediaRecorder is not supported in this browser");
		if (!h.value) throw Error("Camera is not active");
		if (j.value) return;
		let t = e.mimeType && MediaRecorder.isTypeSupported(e.mimeType) ? e.mimeType : void 0;
		z = [];
		let n = new MediaRecorder(h.value, {
			...t ? { mimeType: t } : {},
			...e.audioBitsPerSecond ? { audioBitsPerSecond: e.audioBitsPerSecond } : {},
			...e.videoBitsPerSecond ? { videoBitsPerSecond: e.videoBitsPerSecond } : {}
		});
		n.ondataavailable = (e) => {
			e.data && e.data.size > 0 && z.push(e.data);
		}, R = n, n.start(e.timeslice), j.value = !0;
	}, ae = () => new Promise((e, t) => {
		let n = R;
		if (!n || n.state === "inactive") {
			t(/* @__PURE__ */ Error("Not recording"));
			return;
		}
		n.onstop = () => {
			let t = n.mimeType || z[0]?.type || "video/webm", r = new Blob(z, { type: t });
			M.value = r, j.value = !1, R = null, e(r);
		}, n.stop();
	}), oe = () => {
		R?.state === "recording" && R.pause();
	}, se = () => {
		R?.state === "paused" && R.resume();
	}, Z = async (e = V()) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		if (!e) return [];
		P ??= new window.BarcodeDetector();
		let t = await P.detect(e);
		return A.value = t, t;
	}, ce = (e) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		let t = async () => {
			try {
				let t = await Z();
				t.length && e && e(t);
			} catch {}
			F = requestAnimationFrame(t);
		};
		t();
	}, Q = () => {
		F !== null && (cancelAnimationFrame(F), F = null);
	}, $ = () => {
		if (Q(), R && R.state !== "inactive") try {
			R.stop();
		} catch {}
		R = null, j.value = !1, L = null, h.value?.getTracks().forEach((e) => e.stop()), p.value && (p.value.srcObject = null), t.videoRef?.value && (t.videoRef.value.srcObject = null), N &&= (URL.revokeObjectURL(N), null), I && navigator.mediaDevices?.removeEventListener && (navigator.mediaDevices.removeEventListener("devicechange", H), I = !1), h.value = null, p.value = null, g.value = !1, T.value = !1, E.value = !1, D.value = null, O.value = !1, S.value = null, C.value = null;
	};
	return r && n() && a($), {
		videoForScreenShot: p,
		screenshotVideoBlob: m,
		videoStream: h,
		isSupported: i,
		isActive: g,
		error: _,
		permission: v,
		setUpVideoForScreenshot: W,
		capturePhoto: G,
		stop: $,
		isImageCaptureSupported: d,
		takePhoto: te,
		grabFrame: ne,
		devices: y,
		currentDeviceId: b,
		isFrontCamera: x,
		refreshDevices: U,
		switchCamera: ee,
		resolution: S,
		aspectRatio: C,
		mirrorStyle: w,
		toObjectURL: q,
		toDataURL: J,
		toFile: Y,
		canTorch: T,
		canZoom: E,
		zoomRange: D,
		torchOn: O,
		zoom: k,
		setTorch: X,
		setZoom: re,
		isRecordingSupported: f,
		isRecording: j,
		recordedBlob: M,
		startRecording: ie,
		stopRecording: ae,
		pauseRecording: oe,
		resumeRecording: se,
		isBarcodeSupported: l,
		detectedCodes: A,
		scan: Z,
		startScanning: ce,
		stopScanning: Q
	};
}
//#endregion
export { l as CameraCapture, d as usePhotoCapture };
