import { addComponent as e, addImports as t, defineNuxtModule as n } from "@nuxt/kit";
//#region src/nuxt.ts
var r = n({
	meta: {
		name: "vue-photo-capture",
		configKey: "vuePhotoCapture",
		compatibility: { nuxt: ">=3.0.0" }
	},
	defaults: {
		composables: !0,
		component: !0,
		prefix: ""
	},
	setup(n) {
		n.composables !== !1 && t([{
			name: "usePhotoCapture",
			from: "vue-photo-capture"
		}, {
			name: "editImage",
			from: "vue-photo-capture"
		}]), n.component !== !1 && e({
			name: `${n.prefix ?? ""}CameraCapture`,
			export: "CameraCapture",
			filePath: "vue-photo-capture"
		});
	}
});
//#endregion
export { r as default };
