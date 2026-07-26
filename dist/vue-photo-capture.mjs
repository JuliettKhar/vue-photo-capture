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
		let c = o(null), l = m({
			videoRef: c,
			audio: t.audio
		}), u = o(!1), d = e(() => t.mirror ?? l.isFrontCamera.value), f = (e) => n("error", l.error.value ?? (e instanceof Error ? e : Error(String(e)))), p = async () => {
			try {
				let e = t.constraints ?? (t.facingMode ? { facingMode: t.facingMode } : void 0);
				await l.setUpVideoForScreenshot(e);
			} catch (e) {
				f(e);
			}
		}, h = async () => {
			try {
				let e = await l.takePhoto({
					type: t.type,
					quality: t.quality,
					mirror: d.value
				});
				return n("capture", e), e;
			} catch (e) {
				f(e);
			}
		}, g = async (e) => {
			try {
				await l.switchCamera(e), n("switch", e);
			} catch (e) {
				f(e);
			}
		}, _ = async () => {
			let e = await l.stopRecording();
			return n("recorded", e), e;
		}, v = () => {
			u.value || (u.value = !0, n("ready"));
		};
		i(() => {
			t.autoStart && p();
		}), s({
			start: p,
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
			start: p,
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
				transform: d.value ? "scaleX(-1)" : void 0
			},
			onLoadedmetadata: v,
			onPlaying: v
		}), a.overlay?.(y())]), a.controls ? a.controls(y()) : b()]);
	}
});
//#endregion
//#region src/index.ts
function u(e, t, n) {
	if (!n) return {
		x: 0,
		y: 0,
		width: e,
		height: t
	};
	let r = Math.max(0, Math.min(n.x, e)), i = Math.max(0, Math.min(n.y, t));
	return {
		x: r,
		y: i,
		width: Math.max(1, Math.min(n.width, e - r)),
		height: Math.max(1, Math.min(n.height, t - i))
	};
}
function d(e, t, n, r) {
	let i = 1;
	return n && e > n && (i = Math.min(i, n / e)), r && t > r && (i = Math.min(i, r / t)), {
		width: Math.max(1, Math.round(e * i)),
		height: Math.max(1, Math.round(t * i))
	};
}
async function f(e, t = {}) {
	let n = await createImageBitmap(e, { imageOrientation: "from-image" });
	try {
		let e = u(n.width, n.height, t.crop), { width: r, height: i } = d(e.width, e.height, t.maxWidth, t.maxHeight), a = document.createElement("canvas");
		a.width = r, a.height = i;
		let o = a.getContext("2d");
		if (!o) throw Error("Unable to get a 2D canvas context");
		return t.mirror && (o.translate(r, 0), o.scale(-1, 1)), o.drawImage(n, e.x, e.y, e.width, e.height, 0, 0, r, i), await new Promise((e, n) => {
			a.toBlob((t) => t ? e(t) : n(/* @__PURE__ */ Error("Failed to encode the edited image")), t.type, t.quality);
		});
	} finally {
		n.close();
	}
}
var p = {
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
function m(t = {}) {
	let { autoCleanup: r = !0 } = t, i = typeof navigator < "u" && !!navigator.mediaDevices?.getUserMedia, l = typeof window < "u" && "BarcodeDetector" in window, m = typeof window < "u" && "ImageCapture" in window, h = typeof window < "u" && "MediaRecorder" in window, g = o(null), _ = o(null), v = s(null), y = o(!1), b = s(null), x = o("unknown"), S = o([]), ee = o(null), C = o(!1), w = o(null), T = o(null), te = e(() => ({ transform: C.value ? "scaleX(-1)" : "none" })), E = o(!1), D = o(!1), O = o(null), k = o(!1), A = o(1), j = o(!1), M = o(null), N = o(null), P = o(!1), F = o(null), I = o(null), L = o(!1), R = o(null), z = o(null), B = o([]), V = o(!1), H = o(null), U = null, ne = null, W = null, G = !1, K = null, q = null, J = [], Y = () => v.value?.getVideoTracks()[0] ?? null, X = () => t.videoRef?.value ?? g.value, re = () => {
		Z();
	}, Z = async () => {
		if (!i || !navigator.mediaDevices?.enumerateDevices) return [];
		let e = await navigator.mediaDevices.enumerateDevices();
		return S.value = e.filter((e) => e.kind === "videoinput"), S.value;
	};
	t.videoRef && c([v, t.videoRef], async () => {
		let e = t.videoRef?.value;
		if (e && (e.srcObject !== v.value && (e.srcObject = v.value), v.value)) try {
			await e.play();
		} catch {}
	}, { flush: "post" });
	let ie = async (e = p) => {
		if (b.value = null, !i) {
			let e = /* @__PURE__ */ Error("getUserMedia is not supported in this environment");
			throw b.value = e, e;
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
			a.setAttribute("autoplay", "true"), a.setAttribute("playsinline", "true"), a.setAttribute("width", String(i.width || 1280)), a.setAttribute("height", String(i.height || 1280)), a.srcObject = t, g.value = a, v.value = t, y.value = !0, x.value = "granted", K = null, w.value = i.width && i.height ? {
				width: i.width,
				height: i.height
			} : null, T.value = w.value ? w.value.width / w.value.height : i.aspectRatio ?? null, ee.value = i.deviceId ?? null, C.value = i.facingMode === "user";
			let o = r.getCapabilities?.() ?? {}, s = i, c = (e) => e ? {
				min: e.min,
				max: e.max,
				step: e.step ?? .1
			} : null;
			E.value = !!o.torch, D.value = !!o.zoom, O.value = c(o.zoom), k.value = !1, A.value = s.zoom ?? 1, j.value = !!o.focusDistance, M.value = c(o.focusDistance), N.value = s.focusDistance ?? null, P.value = !!o.exposureCompensation, F.value = c(o.exposureCompensation), I.value = s.exposureCompensation ?? null, L.value = !!o.colorTemperature, R.value = c(o.colorTemperature), z.value = s.colorTemperature ?? null, await Z(), !G && navigator.mediaDevices.addEventListener && (navigator.mediaDevices.addEventListener("devicechange", re), G = !0);
		} catch (e) {
			let t = e instanceof Error ? e : Error(String(e), { cause: e });
			throw (t.name === "NotAllowedError" || t.name === "SecurityError") && (x.value = "denied"), b.value = t, y.value = !1, t;
		}
	}, ae = async (e) => {
		let t = C.value;
		$(), await ie(e ? { deviceId: { exact: e } } : { facingMode: t ? "environment" : "user" });
	}, oe = (e = X(), t = {}) => new Promise((n, r) => {
		let i = (e) => {
			let t = Error(e);
			b.value = t, r(t);
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
		let s = u(a, o, t.crop), { width: c, height: l } = d(s.width, s.height, t.maxWidth, t.maxHeight), f = document.createElement("canvas");
		f.width = c, f.height = l;
		let p = f.getContext("2d");
		if (!p) {
			i("Unable to get a 2D canvas context");
			return;
		}
		t.mirror && (p.translate(c, 0), p.scale(-1, 1)), p.drawImage(e, s.x, s.y, s.width, s.height, 0, 0, c, l), f.toBlob((e) => {
			if (!e) {
				i("Failed to capture photo: the canvas produced an empty blob");
				return;
			}
			_.value = e, n(e);
		}, t.type, t.quality);
	}), se = () => {
		let e = Y();
		if (!e) throw Error("Camera is not active");
		return K ??= new window.ImageCapture(e), K;
	}, ce = async (e = {}) => {
		if (m && Y()) try {
			let t = await se().takePhoto();
			return (e.crop || e.maxWidth != null || e.maxHeight != null || e.mirror) && (t = await f(t, e)), _.value = t, t;
		} catch {}
		return oe(X(), e);
	}, le = async () => {
		if (!m) throw Error("ImageCapture is not supported in this browser");
		return se().grabFrame();
	}, ue = (e = _.value) => {
		if (!e) throw Error("No photo has been captured yet");
		return U && URL.revokeObjectURL(U), U = URL.createObjectURL(e), U;
	}, de = (e = _.value) => new Promise((t, n) => {
		if (!e) {
			n(/* @__PURE__ */ Error("No photo has been captured yet"));
			return;
		}
		let r = new FileReader();
		r.onload = () => t(r.result), r.onerror = () => n(r.error ?? /* @__PURE__ */ Error("Failed to read the photo blob")), r.readAsDataURL(e);
	}), fe = (e = "photo.png", t = _.value) => {
		if (!t) throw Error("No photo has been captured yet");
		return new File([t], e, { type: t.type || "image/png" });
	}, Q = async (e, t, n) => {
		let r = Y();
		if (!r) throw Error("Camera is not active");
		if (!e) throw Error(`${t} is not supported by this camera`);
		await r.applyConstraints({ advanced: [n] });
	}, pe = async (e) => {
		await Q(E.value, "Torch", { torch: e }), k.value = e;
	}, me = async (e) => {
		await Q(D.value, "Zoom", { zoom: e }), A.value = e;
	}, he = async (e) => {
		await Q(j.value, "Manual focus", {
			focusMode: "manual",
			focusDistance: e
		}), N.value = e;
	}, ge = async (e, t) => {
		await Q(j.value, "Focus", {
			focusMode: "single-shot",
			pointsOfInterest: [{
				x: e,
				y: t
			}]
		});
	}, _e = async (e) => {
		await Q(P.value, "Exposure", {
			exposureMode: "manual",
			exposureCompensation: e
		}), I.value = e;
	}, ve = async (e) => {
		await Q(L.value, "White balance", {
			whiteBalanceMode: "manual",
			colorTemperature: e
		}), z.value = e;
	}, ye = (e = {}) => {
		if (!h) throw Error("MediaRecorder is not supported in this browser");
		if (!v.value) throw Error("Camera is not active");
		if (V.value) return;
		let t = e.mimeType && MediaRecorder.isTypeSupported(e.mimeType) ? e.mimeType : void 0;
		J = [];
		let n = new MediaRecorder(v.value, {
			...t ? { mimeType: t } : {},
			...e.audioBitsPerSecond ? { audioBitsPerSecond: e.audioBitsPerSecond } : {},
			...e.videoBitsPerSecond ? { videoBitsPerSecond: e.videoBitsPerSecond } : {}
		});
		n.ondataavailable = (e) => {
			e.data && e.data.size > 0 && J.push(e.data);
		}, q = n, n.start(e.timeslice), V.value = !0;
	}, be = () => new Promise((e, t) => {
		let n = q;
		if (!n || n.state === "inactive") {
			t(/* @__PURE__ */ Error("Not recording"));
			return;
		}
		n.onstop = () => {
			let t = n.mimeType || J[0]?.type || "video/webm", r = new Blob(J, { type: t });
			H.value = r, V.value = !1, q = null, e(r);
		}, n.stop();
	}), xe = () => {
		q?.state === "recording" && q.pause();
	}, Se = () => {
		q?.state === "paused" && q.resume();
	}, Ce = async (e = X()) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		if (!e) return [];
		ne ??= new window.BarcodeDetector();
		let t = await ne.detect(e);
		return B.value = t, t;
	}, we = (e) => {
		if (!l) throw Error("BarcodeDetector is not supported in this browser");
		let t = async () => {
			try {
				let t = await Ce();
				t.length && e && e(t);
			} catch {}
			W = requestAnimationFrame(t);
		};
		t();
	}, Te = () => {
		W !== null && (cancelAnimationFrame(W), W = null);
	}, $ = () => {
		if (Te(), q && q.state !== "inactive") try {
			q.stop();
		} catch {}
		q = null, V.value = !1, K = null, v.value?.getTracks().forEach((e) => e.stop()), g.value && (g.value.srcObject = null), t.videoRef?.value && (t.videoRef.value.srcObject = null), U &&= (URL.revokeObjectURL(U), null), G && navigator.mediaDevices?.removeEventListener && (navigator.mediaDevices.removeEventListener("devicechange", re), G = !1), v.value = null, g.value = null, y.value = !1, E.value = !1, D.value = !1, O.value = null, k.value = !1, j.value = !1, M.value = null, N.value = null, P.value = !1, F.value = null, I.value = null, L.value = !1, R.value = null, z.value = null, w.value = null, T.value = null;
	};
	return r && n() && a($), {
		videoForScreenShot: g,
		screenshotVideoBlob: _,
		videoStream: v,
		isSupported: i,
		isActive: y,
		error: b,
		permission: x,
		setUpVideoForScreenshot: ie,
		capturePhoto: oe,
		stop: $,
		isImageCaptureSupported: m,
		takePhoto: ce,
		grabFrame: le,
		devices: S,
		currentDeviceId: ee,
		isFrontCamera: C,
		refreshDevices: Z,
		switchCamera: ae,
		resolution: w,
		aspectRatio: T,
		mirrorStyle: te,
		toObjectURL: ue,
		toDataURL: de,
		toFile: fe,
		canTorch: E,
		canZoom: D,
		zoomRange: O,
		torchOn: k,
		zoom: A,
		setTorch: pe,
		setZoom: me,
		canFocus: j,
		focusRange: M,
		focusDistance: N,
		setFocusDistance: he,
		focusAt: ge,
		canExposure: P,
		exposureRange: F,
		exposureCompensation: I,
		setExposureCompensation: _e,
		canWhiteBalance: L,
		colorTemperatureRange: R,
		colorTemperature: z,
		setColorTemperature: ve,
		isRecordingSupported: h,
		isRecording: V,
		recordedBlob: H,
		startRecording: ye,
		stopRecording: be,
		pauseRecording: xe,
		resumeRecording: Se,
		isBarcodeSupported: l,
		detectedCodes: B,
		scan: Ce,
		startScanning: we,
		stopScanning: Te
	};
}
//#endregion
export { l as CameraCapture, f as editImage, m as usePhotoCapture };
