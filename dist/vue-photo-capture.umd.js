(function(o,n){typeof exports=="object"&&typeof module<"u"?n(exports,require("vue")):typeof define=="function"&&define.amd?define(["exports","vue"],n):(o=typeof globalThis<"u"?globalThis:o||self,n(o["vue-photo-capture"]={},o.Vue))})(this,function(o,n){"use strict";function c(){const t=n.ref(null),s=n.ref(null),u=n.ref(null),d={width:{max:1280,ideal:1280},height:{min:400,ideal:1080},facingMode:"user",frameRate:{min:15,ideal:24,max:30},aspectRatio:{ideal:1.7777777778}};return{videoForScreenShot:t,screenshotVideoBlob:s,videoStream:u,setUpVideoForScreenshot:async(i=d)=>{try{const e=await navigator.mediaDevices.getUserMedia({video:i}),{width:r,height:a}=e.getVideoTracks()[0].getSettings();t.value=document.createElement("video"),t.value.setAttribute("autoplay","true"),t.value.setAttribute("playsinline","true"),t.value.setAttribute("width",String(r||1280)),t.value.setAttribute("height",String(a||1280)),t.value.srcObject=e,u.value=e}catch(e){throw new Error((e==null?void 0:e.message)||e.toString())}},capturePhoto:(i=t.value)=>{if(i){const e=document.createElement("canvas");e.width=i.width,e.height=i.height;const r=e.getContext("2d");r==null||r.drawImage(i,0,0,e.width,e.height),e.toBlob(a=>{s.value=a})}else throw new Error("The video element can not be null")}}}o.usePhotoCapture=c,Object.defineProperty(o,Symbol.toStringTag,{value:"Module"})});
