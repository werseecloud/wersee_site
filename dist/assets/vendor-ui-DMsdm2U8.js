function qr(t,e){for(var n=0;n<e.length;n++){const s=e[n];if(typeof s!="string"&&!Array.isArray(s)){for(const i in s)if(i!=="default"&&!(i in t)){const r=Object.getOwnPropertyDescriptor(s,i);r&&Object.defineProperty(t,i,r.get?r:{enumerable:!0,get:()=>s[i]})}}}return Object.freeze(Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}))}var Vp=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function Wr(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}function Ep(t){if(Object.prototype.hasOwnProperty.call(t,"__esModule"))return t;var e=t.default;if(typeof e=="function"){var n=function s(){return this instanceof s?Reflect.construct(e,arguments,this.constructor):e.apply(this,arguments)};n.prototype=e.prototype}else n={};return Object.defineProperty(n,"__esModule",{value:!0}),Object.keys(t).forEach(function(s){var i=Object.getOwnPropertyDescriptor(t,s);Object.defineProperty(n,s,i.get?i:{enumerable:!0,get:function(){return t[s]}})}),n}var Ie={exports:{}},Bt={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ps;function Ur(){if(ps)return Bt;ps=1;var t=Symbol.for("react.transitional.element"),e=Symbol.for("react.fragment");function n(s,i,r){var o=null;if(r!==void 0&&(o=""+r),i.key!==void 0&&(o=""+i.key),"key"in i){r={};for(var a in i)a!=="key"&&(r[a]=i[a])}else r=i;return i=r.ref,{$$typeof:t,type:s,key:o,ref:i!==void 0?i:null,props:r}}return Bt.Fragment=e,Bt.jsx=n,Bt.jsxs=n,Bt}var ys;function Gr(){return ys||(ys=1,Ie.exports=Ur()),Ie.exports}var it=Gr(),Be={exports:{}},V={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ms;function Kr(){if(ms)return V;ms=1;var t=Symbol.for("react.transitional.element"),e=Symbol.for("react.portal"),n=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),i=Symbol.for("react.profiler"),r=Symbol.for("react.consumer"),o=Symbol.for("react.context"),a=Symbol.for("react.forward_ref"),c=Symbol.for("react.suspense"),u=Symbol.for("react.memo"),l=Symbol.for("react.lazy"),d=Symbol.for("react.activity"),f=Symbol.iterator;function y(p){return p===null||typeof p!="object"?null:(p=f&&p[f]||p["@@iterator"],typeof p=="function"?p:null)}var m={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},v=Object.assign,k={};function g(p,M,N){this.props=p,this.context=M,this.refs=k,this.updater=N||m}g.prototype.isReactComponent={},g.prototype.setState=function(p,M){if(typeof p!="object"&&typeof p!="function"&&p!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,p,M,"setState")},g.prototype.forceUpdate=function(p){this.updater.enqueueForceUpdate(this,p,"forceUpdate")};function b(){}b.prototype=g.prototype;function x(p,M,N){this.props=p,this.context=M,this.refs=k,this.updater=N||m}var _=x.prototype=new b;_.constructor=x,v(_,g.prototype),_.isPureReactComponent=!0;var A=Array.isArray;function $(){}var C={H:null,A:null,T:null,S:null},P=Object.prototype.hasOwnProperty;function R(p,M,N){var E=N.ref;return{$$typeof:t,type:p,key:M,ref:E!==void 0?E:null,props:N}}function S(p,M){return R(p.type,M,p.props)}function j(p){return typeof p=="object"&&p!==null&&p.$$typeof===t}function q(p){var M={"=":"=0",":":"=2"};return"$"+p.replace(/[=:]/g,function(N){return M[N]})}var nt=/\/+/g;function J(p,M){return typeof p=="object"&&p!==null&&p.key!=null?q(""+p.key):M.toString(36)}function rt(p){switch(p.status){case"fulfilled":return p.value;case"rejected":throw p.reason;default:switch(typeof p.status=="string"?p.then($,$):(p.status="pending",p.then(function(M){p.status==="pending"&&(p.status="fulfilled",p.value=M)},function(M){p.status==="pending"&&(p.status="rejected",p.reason=M)})),p.status){case"fulfilled":return p.value;case"rejected":throw p.reason}}throw p}function K(p,M,N,E,D){var z=typeof p;(z==="undefined"||z==="boolean")&&(p=null);var B=!1;if(p===null)B=!0;else switch(z){case"bigint":case"string":case"number":B=!0;break;case"object":switch(p.$$typeof){case t:case e:B=!0;break;case l:return B=p._init,K(B(p._payload),M,N,E,D)}}if(B)return D=D(p),B=E===""?"."+J(p,0):E,A(D)?(N="",B!=null&&(N=B.replace(nt,"$&/")+"/"),K(D,M,N,"",function(Fr){return Fr})):D!=null&&(j(D)&&(D=S(D,N+(D.key==null||p&&p.key===D.key?"":(""+D.key).replace(nt,"$&/")+"/")+B)),M.push(D)),1;B=0;var ft=E===""?".":E+":";if(A(p))for(var Q=0;Q<p.length;Q++)E=p[Q],z=ft+J(E,Q),B+=K(E,M,N,z,D);else if(Q=y(p),typeof Q=="function")for(p=Q.call(p),Q=0;!(E=p.next()).done;)E=E.value,z=ft+J(E,Q++),B+=K(E,M,N,z,D);else if(z==="object"){if(typeof p.then=="function")return K(rt(p),M,N,E,D);throw M=String(p),Error("Objects are not valid as a React child (found: "+(M==="[object Object]"?"object with keys {"+Object.keys(p).join(", ")+"}":M)+"). If you meant to render a collection of children, use an array instead.")}return B}function It(p,M,N){if(p==null)return p;var E=[],D=0;return K(p,E,"","",function(z){return M.call(N,z,D++)}),E}function W(p){if(p._status===-1){var M=p._result;M=M(),M.then(function(N){(p._status===0||p._status===-1)&&(p._status=1,p._result=N)},function(N){(p._status===0||p._status===-1)&&(p._status=2,p._result=N)}),p._status===-1&&(p._status=0,p._result=M)}if(p._status===1)return p._result.default;throw p._result}var Y=typeof reportError=="function"?reportError:function(p){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var M=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof p=="object"&&p!==null&&typeof p.message=="string"?String(p.message):String(p),error:p});if(!window.dispatchEvent(M))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",p);return}console.error(p)},gt={map:It,forEach:function(p,M,N){It(p,function(){M.apply(this,arguments)},N)},count:function(p){var M=0;return It(p,function(){M++}),M},toArray:function(p){return It(p,function(M){return M})||[]},only:function(p){if(!j(p))throw Error("React.Children.only expected to receive a single React element child.");return p}};return V.Activity=d,V.Children=gt,V.Component=g,V.Fragment=n,V.Profiler=i,V.PureComponent=x,V.StrictMode=s,V.Suspense=c,V.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=C,V.__COMPILER_RUNTIME={__proto__:null,c:function(p){return C.H.useMemoCache(p)}},V.cache=function(p){return function(){return p.apply(null,arguments)}},V.cacheSignal=function(){return null},V.cloneElement=function(p,M,N){if(p==null)throw Error("The argument must be a React element, but you passed "+p+".");var E=v({},p.props),D=p.key;if(M!=null)for(z in M.key!==void 0&&(D=""+M.key),M)!P.call(M,z)||z==="key"||z==="__self"||z==="__source"||z==="ref"&&M.ref===void 0||(E[z]=M[z]);var z=arguments.length-2;if(z===1)E.children=N;else if(1<z){for(var B=Array(z),ft=0;ft<z;ft++)B[ft]=arguments[ft+2];E.children=B}return R(p.type,D,E)},V.createContext=function(p){return p={$$typeof:o,_currentValue:p,_currentValue2:p,_threadCount:0,Provider:null,Consumer:null},p.Provider=p,p.Consumer={$$typeof:r,_context:p},p},V.createElement=function(p,M,N){var E,D={},z=null;if(M!=null)for(E in M.key!==void 0&&(z=""+M.key),M)P.call(M,E)&&E!=="key"&&E!=="__self"&&E!=="__source"&&(D[E]=M[E]);var B=arguments.length-2;if(B===1)D.children=N;else if(1<B){for(var ft=Array(B),Q=0;Q<B;Q++)ft[Q]=arguments[Q+2];D.children=ft}if(p&&p.defaultProps)for(E in B=p.defaultProps,B)D[E]===void 0&&(D[E]=B[E]);return R(p,z,D)},V.createRef=function(){return{current:null}},V.forwardRef=function(p){return{$$typeof:a,render:p}},V.isValidElement=j,V.lazy=function(p){return{$$typeof:l,_payload:{_status:-1,_result:p},_init:W}},V.memo=function(p,M){return{$$typeof:u,type:p,compare:M===void 0?null:M}},V.startTransition=function(p){var M=C.T,N={};C.T=N;try{var E=p(),D=C.S;D!==null&&D(N,E),typeof E=="object"&&E!==null&&typeof E.then=="function"&&E.then($,Y)}catch(z){Y(z)}finally{M!==null&&N.types!==null&&(M.types=N.types),C.T=M}},V.unstable_useCacheRefresh=function(){return C.H.useCacheRefresh()},V.use=function(p){return C.H.use(p)},V.useActionState=function(p,M,N){return C.H.useActionState(p,M,N)},V.useCallback=function(p,M){return C.H.useCallback(p,M)},V.useContext=function(p){return C.H.useContext(p)},V.useDebugValue=function(){},V.useDeferredValue=function(p,M){return C.H.useDeferredValue(p,M)},V.useEffect=function(p,M){return C.H.useEffect(p,M)},V.useEffectEvent=function(p){return C.H.useEffectEvent(p)},V.useId=function(){return C.H.useId()},V.useImperativeHandle=function(p,M,N){return C.H.useImperativeHandle(p,M,N)},V.useInsertionEffect=function(p,M){return C.H.useInsertionEffect(p,M)},V.useLayoutEffect=function(p,M){return C.H.useLayoutEffect(p,M)},V.useMemo=function(p,M){return C.H.useMemo(p,M)},V.useOptimistic=function(p,M){return C.H.useOptimistic(p,M)},V.useReducer=function(p,M,N){return C.H.useReducer(p,M,N)},V.useRef=function(p){return C.H.useRef(p)},V.useState=function(p){return C.H.useState(p)},V.useSyncExternalStore=function(p,M,N){return C.H.useSyncExternalStore(p,M,N)},V.useTransition=function(){return C.H.useTransition()},V.version="19.2.4",V}var gs;function Yr(){return gs||(gs=1,Be.exports=Kr()),Be.exports}var w=Yr();const Xr=Wr(w),Np=qr({__proto__:null,default:Xr},[w]);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zr=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),Jr=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,n,s)=>s?s.toUpperCase():n.toLowerCase()),ks=t=>{const e=Jr(t);return e.charAt(0).toUpperCase()+e.slice(1)},Ki=(...t)=>t.filter((e,n,s)=>!!e&&e.trim()!==""&&s.indexOf(e)===n).join(" ").trim(),Qr=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var ta={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=w.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:n=2,absoluteStrokeWidth:s,className:i="",children:r,iconNode:o,...a},c)=>w.createElement("svg",{ref:c,...ta,width:e,height:e,stroke:t,strokeWidth:s?Number(n)*24/Number(e):n,className:Ki("lucide",i),...!r&&!Qr(a)&&{"aria-hidden":"true"},...a},[...o.map(([u,l])=>w.createElement(u,l)),...Array.isArray(r)?r:[r]]));/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=(t,e)=>{const n=w.forwardRef(({className:s,...i},r)=>w.createElement(ea,{ref:r,iconNode:e,className:Ki(`lucide-${Zr(ks(t))}`,`lucide-${t}`,s),...i}));return n.displayName=ks(t),n};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],Rp=h("activity",na);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=[["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}],["path",{d:"M10 4v4",key:"pp8u80"}],["path",{d:"M2 8h20",key:"d11cs7"}],["path",{d:"M6 4v4",key:"1svtjw"}]],Lp=h("app-window",sa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=[["path",{d:"M12 6.528V3a1 1 0 0 1 1-1h0",key:"11qiee"}],["path",{d:"M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21",key:"110c12"}]],$p=h("apple",ia);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]],Dp=h("arrow-down-left",oa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]],jp=h("arrow-down-right",ra);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=[["path",{d:"M12 17V3",key:"1cwfxf"}],["path",{d:"m6 11 6 6 6-6",key:"12ii2o"}],["path",{d:"M19 21H5",key:"150jfl"}]],zp=h("arrow-down-to-line",aa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],Ip=h("arrow-left",ca);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]],Bp=h("arrow-right-left",la);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],Op=h("arrow-right",ua);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],Hp=h("arrow-up-right",ha);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],Fp=h("arrow-up",da);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8",key:"7n84p3"}]],qp=h("at-sign",fa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]],Wp=h("award",pa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Up=h("badge-check",ya);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=[["path",{d:"M4.929 4.929 19.07 19.071",key:"196cmz"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Gp=h("ban",ma);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"2",key:"9lu3g6"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M6 12h.01M18 12h.01",key:"113zkx"}]],Kp=h("banknote",ga);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=[["path",{d:"M4.5 3h15",key:"c7n0jr"}],["path",{d:"M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3",key:"m1uhx7"}],["path",{d:"M6 14h12",key:"4cwo0f"}]],Yp=h("beaker",ka);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],Xp=h("bell",va);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=[["path",{d:"M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727",key:"yr8idg"}]],Zp=h("bitcoin",xa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ma=[["path",{d:"M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8",key:"mg9rjx"}]],Jp=h("bold",Ma);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],Qp=h("book-open",wa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=[["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",key:"k3hazp"}]],ty=h("book",ba);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]],ey=h("bookmark",_a);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ta=[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]],ny=h("bot",Ta);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]],sy=h("box",Aa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M9 13a4.5 4.5 0 0 0 3-4",key:"10igwf"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M12 13h4",key:"1ku699"}],["path",{d:"M12 18h6a2 2 0 0 1 2 2v1",key:"105ag5"}],["path",{d:"M12 8h8",key:"1lhi5i"}],["path",{d:"M16 8V5a2 2 0 0 1 2-2",key:"u6izg6"}],["circle",{cx:"16",cy:"13",r:".5",key:"ry7gng"}],["circle",{cx:"18",cy:"3",r:".5",key:"1aiba7"}],["circle",{cx:"20",cy:"21",r:".5",key:"yhc1fs"}],["circle",{cx:"20",cy:"8",r:".5",key:"1e43v0"}]],iy=h("brain-circuit",Sa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=[["path",{d:"M12 18V5",key:"adv99a"}],["path",{d:"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",key:"1e3is1"}],["path",{d:"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",key:"1gqd8o"}],["path",{d:"M17.997 5.125a4 4 0 0 1 2.526 5.77",key:"iwvgf7"}],["path",{d:"M18 18a4 4 0 0 0 2-7.464",key:"efp6ie"}],["path",{d:"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",key:"1gq6am"}],["path",{d:"M6 18a4 4 0 0 1-2-7.464",key:"k1g0md"}],["path",{d:"M6.003 5.125a4 4 0 0 0-2.526 5.77",key:"q97ue3"}]],oy=h("brain",Ca);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],ry=h("briefcase",Pa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Va=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],ay=h("building-2",Va);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=[["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",key:"cabbwy"}],["rect",{x:"4",y:"2",width:"16",height:"20",rx:"2",key:"1uxh74"}]],cy=h("building",Ea);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]],ly=h("calculator",Na);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ra=[["path",{d:"M16 14v2.2l1.6 1",key:"fo4ql5"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",key:"1osxxc"}],["path",{d:"M3 10h5",key:"r794hk"}],["path",{d:"M8 2v4",key:"1cmpym"}],["circle",{cx:"16",cy:"16",r:"6",key:"qoo3c4"}]],uy=h("calendar-clock",Ra);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const La=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],hy=h("calendar",La);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $a=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],dy=h("camera",$a);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Da=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],fy=h("chart-column",Da);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ja=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]],py=h("chart-line",ja);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const za=[["path",{d:"M5 21v-6",key:"1hz6c0"}],["path",{d:"M12 21V3",key:"1lcnhd"}],["path",{d:"M19 21V9",key:"unv183"}]],yy=h("chart-no-axes-column",za);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=[["path",{d:"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",key:"pzmjnu"}],["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}]],my=h("chart-pie",Ia);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ba=[["path",{d:"M18 6 7 17l-5-5",key:"116fxf"}],["path",{d:"m22 10-7.5 7.5L13 16",key:"ke71qq"}]],gy=h("check-check",Ba);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oa=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],ky=h("check",Oa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ha=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],vy=h("chevron-down",Ha);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fa=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],xy=h("chevron-left",Fa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qa=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],My=h("chevron-right",qa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wa=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],wy=h("chevron-up",Wa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ua=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],by=h("circle-alert",Ua);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ga=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16 12-4-4-4 4",key:"177agl"}],["path",{d:"M12 16V8",key:"1sbj14"}]],_y=h("circle-arrow-up",Ga);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ka=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Ty=h("circle-check-big",Ka);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Ay=h("circle-check",Ya);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 18V6",key:"zqpxq5"}]],Sy=h("circle-dollar-sign",Xa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=[["path",{d:"M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",key:"kmsa83"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Cy=h("circle-play",Za);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]],Py=h("circle-plus",Ja);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qa=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Vy=h("circle-question-mark",Qa);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tc=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],Ey=h("circle-x",tc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ec=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Ny=h("circle",ec);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nc=[["path",{d:"M12 6v6l4 2",key:"mmk7yg"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Ry=h("clock",nc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sc=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]],Ly=h("cloud",sc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ic=[["path",{d:"m18 16 4-4-4-4",key:"1inbqp"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}],["path",{d:"m14.5 4-5 16",key:"e7oirm"}]],$y=h("code-xml",ic);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oc=[["path",{d:"m16 18 6-6-6-6",key:"eg8j8"}],["path",{d:"m8 6-6 6 6 6",key:"ppft3o"}]],Dy=h("code",oc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rc=[["path",{d:"M14 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1",key:"1l7d7l"}],["path",{d:"M19 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1",key:"9955pe"}],["path",{d:"m7 15 3 3",key:"4hkfgk"}],["path",{d:"m7 21 3-3H5a2 2 0 0 1-2-2v-2",key:"1xljwe"}],["rect",{x:"14",y:"14",width:"7",height:"7",rx:"1",key:"1cdgtw"}],["rect",{x:"3",y:"3",width:"7",height:"7",rx:"1",key:"zi3rio"}]],jy=h("combine",rc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ac=[["path",{d:"M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3",key:"11bfej"}]],zy=h("command",ac);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cc=[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Iy=h("compass",cc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lc=[["path",{d:"M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5",key:"laymnq"}],["path",{d:"M8.5 8.5v.01",key:"ue8clq"}],["path",{d:"M16 15.5v.01",key:"14dtrp"}],["path",{d:"M12 12v.01",key:"u5ubse"}],["path",{d:"M11 17v.01",key:"1hyl5a"}],["path",{d:"M7 14v.01",key:"uct60s"}]],By=h("cookie",lc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uc=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],Oy=h("copy",uc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hc=[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]],Hy=h("cpu",hc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dc=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],Fy=h("credit-card",dc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fc=[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]],qy=h("crown",fc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pc=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],Wy=h("database",pc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yc=[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]],Uy=h("dollar-sign",yc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mc=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],Gy=h("download",mc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gc=[["path",{d:"M21.54 15H17a2 2 0 0 0-2 2v4.54",key:"1djwo0"}],["path",{d:"M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17",key:"1tzkfa"}],["path",{d:"M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05",key:"14pb5j"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Ky=h("earth",gc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kc=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]],Yy=h("ellipsis-vertical",kc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vc=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]],Xy=h("ellipsis",vc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xc=[["path",{d:"M4 10h12",key:"1y6xl8"}],["path",{d:"M4 14h9",key:"1loblj"}],["path",{d:"M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2",key:"1j6lzo"}]],Zy=h("euro",xc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mc=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],Jy=h("external-link",Mc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wc=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],Qy=h("eye-off",wc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bc=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],tm=h("eye",bc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _c=[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]],em=h("file-archive",_c);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tc=[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]],nm=h("file-code",Tc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ac=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]],sm=h("file-down",Ac);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sc=[["path",{d:"m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2",key:"142zxg"}],["path",{d:"M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",key:"2t3380"}],["path",{d:"M8 18h1",key:"13wk12"}]],im=h("file-pen-line",Sc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cc=[["path",{d:"M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5",key:"1couwa"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",key:"1y4qbx"}]],om=h("file-pen",Cc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pc=[["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3",key:"ms7g94"}],["path",{d:"m9 18-1.5-1.5",key:"1j6qii"}],["circle",{cx:"5",cy:"14",r:"3",key:"ufru5t"}]],rm=h("file-search",Pc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vc=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]],am=h("file-spreadsheet",Vc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ec=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],cm=h("file-text",Ec);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nc=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 12v6",key:"3ahymv"}],["path",{d:"m15 15-3-3-3 3",key:"15xj92"}]],lm=h("file-up",Nc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rc=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}]],um=h("file",Rc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lc=[["path",{d:"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",key:"1nerag"}],["path",{d:"M14 13.12c0 2.38 0 6.38-1 8.88",key:"o46ks0"}],["path",{d:"M17.29 21.02c.12-.6.43-2.3.5-3.02",key:"ptglia"}],["path",{d:"M2 12a10 10 0 0 1 18-6",key:"ydlgp0"}],["path",{d:"M2 16h.01",key:"1gqxmh"}],["path",{d:"M21.8 16c.2-2 .131-5.354 0-6",key:"drycrb"}],["path",{d:"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",key:"1tidbn"}],["path",{d:"M8.65 22c.21-.66.45-1.32.57-2",key:"13wd9y"}],["path",{d:"M9 6.8a6 6 0 0 1 9 5.2v2",key:"1fr1j5"}]],hm=h("fingerprint",Lc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $c=[["path",{d:"M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",key:"1jaruq"}]],dm=h("flag",$c);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dc=[["path",{d:"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",key:"1slcih"}]],fm=h("flame",Dc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jc=[["path",{d:"M12 10v6",key:"1bos4e"}],["path",{d:"M9 13h6",key:"1uhe8q"}],["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]],pm=h("folder-plus",jc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zc=[["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]],ym=h("folder",zc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ic=[["path",{d:"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",key:"sc7q7i"}]],mm=h("funnel",Ic);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bc=[["line",{x1:"6",x2:"10",y1:"11",y2:"11",key:"1gktln"}],["line",{x1:"8",x2:"8",y1:"9",y2:"13",key:"qnk9ow"}],["line",{x1:"15",x2:"15.01",y1:"12",y2:"12",key:"krot7o"}],["line",{x1:"18",x2:"18.01",y1:"10",y2:"10",key:"1lcuu1"}],["path",{d:"M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z",key:"mfqc10"}]],gm=h("gamepad-2",Bc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oc=[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]],km=h("gauge",Oc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hc=[["path",{d:"M10.5 3 8 9l4 13 4-13-2.5-6",key:"b3dvk1"}],["path",{d:"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z",key:"7w4byz"}],["path",{d:"M2 9h20",key:"16fsjt"}]],vm=h("gem",Hc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fc=[["path",{d:"M9 10h.01",key:"qbtxuw"}],["path",{d:"M15 10h.01",key:"1qmjsl"}],["path",{d:"M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z",key:"uwwb07"}]],xm=h("ghost",Fc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qc=[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]],Mm=h("gift",qc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wc=[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]],wm=h("github",Wc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uc=[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]],bm=h("graduation-cap",Uc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gc=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],_m=h("globe",Gc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kc=[["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 12h18",key:"1i2n21"}],["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}]],Tm=h("grid-2x2",Kc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yc=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]],Am=h("grid-3x3",Yc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xc=[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]],Sm=h("grip-vertical",Xc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zc=[["path",{d:"m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9",key:"1hayfq"}],["path",{d:"m18 15 4-4",key:"16gjal"}],["path",{d:"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",key:"15ts47"}]],Cm=h("hammer",Zc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jc=[["path",{d:"m11 17 2 2a1 1 0 1 0 3-3",key:"efffak"}],["path",{d:"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4",key:"9pr0kb"}],["path",{d:"m21 3 1 11h-2",key:"1tisrp"}],["path",{d:"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3",key:"1uvwmv"}],["path",{d:"M3 4h8",key:"1ep09j"}]],Pm=h("handshake",Jc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qc=[["line",{x1:"22",x2:"2",y1:"12",y2:"12",key:"1y58io"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}],["line",{x1:"6",x2:"6.01",y1:"16",y2:"16",key:"sgf278"}],["line",{x1:"10",x2:"10.01",y1:"16",y2:"16",key:"1l4acy"}]],Vm=h("hard-drive",Qc);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tl=[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"m17 12 3-2v8",key:"1hhhft"}]],Em=h("heading-1",tl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const el=[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",key:"9jr5yi"}]],Nm=h("heading-2",el);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nl=[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}]],Rm=h("heart",nl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sl=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],Lm=h("history",sl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const il=[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]],$m=h("house",il);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ol=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],Dm=h("image",ol);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rl=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],jm=h("info",rl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const al=[["rect",{width:"20",height:"20",x:"2",y:"2",rx:"5",ry:"5",key:"2e1cvw"}],["path",{d:"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z",key:"9exkf1"}],["line",{x1:"17.5",x2:"17.51",y1:"6.5",y2:"6.5",key:"r4j83e"}]],zm=h("instagram",al);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cl=[["line",{x1:"19",x2:"10",y1:"4",y2:"4",key:"15jd3p"}],["line",{x1:"14",x2:"5",y1:"20",y2:"20",key:"bu0au3"}],["line",{x1:"15",x2:"9",y1:"4",y2:"20",key:"uljnxc"}]],Im=h("italic",cl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ll=[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]],Bm=h("key-round",ll);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ul=[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",key:"g0fldk"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}]],Om=h("key",ul);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hl=[["path",{d:"M10 18v-7",key:"wt116b"}],["path",{d:"M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z",key:"1m329m"}],["path",{d:"M14 18v-7",key:"vav6t3"}],["path",{d:"M18 18v-7",key:"aexdmj"}],["path",{d:"M3 22h18",key:"8prr45"}],["path",{d:"M6 18v-7",key:"1ivflk"}]],Hm=h("landmark",hl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dl=[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]],Fm=h("languages",dl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fl=[["rect",{width:"18",height:"12",x:"3",y:"4",rx:"2",ry:"2",key:"1qhy41"}],["line",{x1:"2",x2:"22",y1:"20",y2:"20",key:"ni3hll"}]],qm=h("laptop-minimal",fl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pl=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Wm=h("layers",pl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yl=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],Um=h("layout-dashboard",yl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ml=[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]],Gm=h("layout-grid",ml);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gl=[["rect",{width:"18",height:"7",x:"3",y:"3",rx:"1",key:"f1a2em"}],["rect",{width:"9",height:"7",x:"3",y:"14",rx:"1",key:"jqznyg"}],["rect",{width:"5",height:"7",x:"16",y:"14",rx:"1",key:"q5h2i8"}]],Km=h("layout-template",gl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kl=[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]],Ym=h("lightbulb",kl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vl=[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]],Xm=h("link-2",vl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xl=[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]],Zm=h("link",xl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ml=[["path",{d:"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",key:"c2jq9f"}],["rect",{width:"4",height:"12",x:"2",y:"9",key:"mk3on5"}],["circle",{cx:"4",cy:"4",r:"2",key:"bt5ra8"}]],Jm=h("linkedin",Ml);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wl=[["path",{d:"M11 5h10",key:"1cz7ny"}],["path",{d:"M11 12h10",key:"1438ji"}],["path",{d:"M11 19h10",key:"11t30w"}],["path",{d:"M4 4h1v5",key:"10yrso"}],["path",{d:"M4 9h2",key:"r1h2o0"}],["path",{d:"M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02",key:"xtkcd5"}]],Qm=h("list-ordered",wl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bl=[["path",{d:"M3 5h.01",key:"18ugdj"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 19h.01",key:"noohij"}],["path",{d:"M8 5h13",key:"1pao27"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 19h13",key:"m83p4d"}]],tg=h("list",bl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _l=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],eg=h("loader-circle",_l);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tl=[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]],ng=h("lock-keyhole",Tl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Al=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]],sg=h("lock-open",Al);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sl=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],ig=h("lock",Sl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cl=[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]],og=h("log-in",Cl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pl=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],rg=h("log-out",Pl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vl=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],ag=h("mail",Vl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const El=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],cg=h("map-pin",El);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nl=[["path",{d:"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",key:"169xi5"}],["path",{d:"M15 5.764v15",key:"1pn4in"}],["path",{d:"M9 3.236v15",key:"1uimfh"}]],lg=h("map",Nl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rl=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"m21 3-7 7",key:"1l2asr"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M9 21H3v-6",key:"wtvkvv"}]],ug=h("maximize-2",Rl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ll=[["path",{d:"M8 3H5a2 2 0 0 0-2 2v3",key:"1dcmit"}],["path",{d:"M21 8V5a2 2 0 0 0-2-2h-3",key:"1e4gt3"}],["path",{d:"M3 16v3a2 2 0 0 0 2 2h3",key:"wsl5sc"}],["path",{d:"M16 21h3a2 2 0 0 0 2-2v-3",key:"18trek"}]],hg=h("maximize",Ll);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $l=[["path",{d:"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",key:"q8bfy3"}],["path",{d:"M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14",key:"1853fq"}],["path",{d:"M8 6v8",key:"15ugcq"}]],dg=h("megaphone",$l);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dl=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],fg=h("menu",Dl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jl=[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]],pg=h("message-circle",jl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zl=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}],["path",{d:"M12 8v6",key:"1ib9pf"}],["path",{d:"M9 11h6",key:"1fldmi"}]],yg=h("message-square-plus",zl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Il=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}]],mg=h("message-square",Il);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bl=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M15 9.34V5a3 3 0 0 0-5.68-1.33",key:"1gzdoj"}],["path",{d:"M16.95 16.95A7 7 0 0 1 5 12v-2",key:"cqa7eg"}],["path",{d:"M18.89 13.23A7 7 0 0 0 19 12v-2",key:"16hl24"}],["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M9 9v3a3 3 0 0 0 5.12 2.12",key:"r2i35w"}]],gg=h("mic-off",Bl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ol=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["rect",{x:"9",y:"2",width:"6",height:"13",rx:"3",key:"s6n7sd"}]],kg=h("mic",Ol);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hl=[["path",{d:"m14 10 7-7",key:"oa77jy"}],["path",{d:"M20 10h-6V4",key:"mjg0md"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M4 14h6v6",key:"rmj7iw"}]],vg=h("minimize-2",Hl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fl=[["path",{d:"M8 3v3a2 2 0 0 1-2 2H3",key:"hohbtr"}],["path",{d:"M21 8h-3a2 2 0 0 1-2-2V3",key:"5jw1f3"}],["path",{d:"M3 16h3a2 2 0 0 1 2 2v3",key:"198tvr"}],["path",{d:"M16 21v-3a2 2 0 0 1 2-2h3",key:"ph8mxp"}]],xg=h("minimize",Fl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ql=[["path",{d:"M5 12h14",key:"1ays0h"}]],Mg=h("minus",ql);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wl=[["path",{d:"M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8",key:"10dyio"}],["path",{d:"M10 19v-3.96 3.15",key:"1irgej"}],["path",{d:"M7 19h5",key:"qswx4l"}],["rect",{width:"6",height:"10",x:"16",y:"12",rx:"2",key:"1egngj"}]],wg=h("monitor-smartphone",Wl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ul=[["path",{d:"m9 10 3-3 3 3",key:"11gsxs"}],["path",{d:"M12 13V7",key:"h0r20n"}],["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["path",{d:"M12 17v4",key:"1riwvh"}],["path",{d:"M8 21h8",key:"1ev6f3"}]],bg=h("monitor-up",Ul);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gl=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],_g=h("monitor",Gl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kl=[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]],Tg=h("moon",Kl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yl=[["path",{d:"M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",key:"edeuup"}]],Ag=h("mouse-pointer-2",Yl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xl=[["path",{d:"M14 4.1 12 6",key:"ita8i4"}],["path",{d:"m5.1 8-2.9-.8",key:"1go3kf"}],["path",{d:"m6 12-1.9 2",key:"mnht97"}],["path",{d:"M7.2 2.2 8 5.1",key:"1cfko1"}],["path",{d:"M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z",key:"s0h3yz"}]],Sg=h("mouse-pointer-click",Xl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zl=[["path",{d:"M12 2v20",key:"t6zp3m"}],["path",{d:"m15 19-3 3-3-3",key:"11eu04"}],["path",{d:"m19 9 3 3-3 3",key:"1mg7y2"}],["path",{d:"M2 12h20",key:"9i4pu4"}],["path",{d:"m5 9-3 3 3 3",key:"j64kie"}],["path",{d:"m9 5 3-3 3 3",key:"l8vdw6"}]],Cg=h("move",Zl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jl=[["path",{d:"M9 18V5l12-2v13",key:"1jmyc2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["circle",{cx:"18",cy:"16",r:"3",key:"1hluhg"}]],Pg=h("music",Jl);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ql=[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1",key:"4q2zg0"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1",key:"8cvhb9"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1",key:"1egb70"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",key:"1jsf9p"}],["path",{d:"M12 12V8",key:"2874zd"}]],Vg=h("network",Ql);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t1=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],Eg=h("package",t1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const e1=[["path",{d:"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",key:"e79jfc"}],["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}]],Ng=h("palette",e1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n1=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M9 21V9",key:"1oto5p"}]],Rg=h("panels-top-left",n1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s1=[["path",{d:"m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551",key:"1miecu"}]],Lg=h("paperclip",s1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i1=[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]],$g=h("pause",i1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o1=[["path",{d:"M13 21h8",key:"1jsn5i"}],["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],Dg=h("pen-line",o1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r1=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],jg=h("pen",r1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a1=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]],zg=h("pencil",a1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c1=[["line",{x1:"19",x2:"5",y1:"5",y2:"19",key:"1x9vlm"}],["circle",{cx:"6.5",cy:"6.5",r:"2.5",key:"4mh3h7"}],["circle",{cx:"17.5",cy:"17.5",r:"2.5",key:"1mdrzq"}]],Ig=h("percent",c1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l1=[["path",{d:"M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272",key:"1wngk7"}],["path",{d:"M22 2 2 22",key:"y4kqgn"}],["path",{d:"M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473",key:"10hv5p"}]],Bg=h("phone-off",l1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u1=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],Og=h("phone",u1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h1=[["path",{d:"M2 10h6V4",key:"zwrco"}],["path",{d:"m2 4 6 6",key:"ug085t"}],["path",{d:"M21 10V7a2 2 0 0 0-2-2h-7",key:"git5jr"}],["path",{d:"M3 14v2a2 2 0 0 0 2 2h3",key:"1f7fh3"}],["rect",{x:"12",y:"14",width:"10",height:"7",rx:"1",key:"1wjs3o"}]],Hg=h("picture-in-picture",h1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d1=[["path",{d:"M12 17v5",key:"bb1du9"}],["path",{d:"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",key:"1nkz8b"}]],Fg=h("pin",d1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f1=[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]],qg=h("play",f1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p1=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],Wg=h("plus",p1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y1=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],Ug=h("printer",y1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m1=[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]],Gg=h("qr-code",m1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g1=[["path",{d:"M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"rib7q0"}],["path",{d:"M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"1ymkrd"}]],Kg=h("quote",g1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k1=[["path",{d:"M16.247 7.761a6 6 0 0 1 0 8.478",key:"1fwjs5"}],["path",{d:"M19.075 4.933a10 10 0 0 1 0 14.134",key:"ehdyv1"}],["path",{d:"M4.925 19.067a10 10 0 0 1 0-14.134",key:"1q22gi"}],["path",{d:"M7.753 16.239a6 6 0 0 1 0-8.478",key:"r2q7qm"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],Yg=h("radio",k1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v1=[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",key:"q3az6g"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17.5v-11",key:"1jc1ny"}]],Xg=h("receipt",v1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x1=[["path",{d:"M21 7v6h-6",key:"3ptur4"}],["path",{d:"M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7",key:"1kgawr"}]],Zg=h("redo",x1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M1=[["path",{d:"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"14sxne"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",key:"1hlbsb"}],["path",{d:"M16 16h5v5",key:"ccwih5"}]],Jg=h("refresh-ccw",M1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w1=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],Qg=h("refresh-cw",w1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b1=[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]],tk=h("repeat",b1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _1=[["path",{d:"M20 18v-2a4 4 0 0 0-4-4H4",key:"5vmcpk"}],["path",{d:"m9 17-5-5 5-5",key:"nvlc11"}]],ek=h("reply",_1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T1=[["path",{d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",key:"m3kijz"}],["path",{d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",key:"1fmvmk"}],["path",{d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",key:"1f8sc4"}],["path",{d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",key:"qeys4"}]],nk=h("rocket",T1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A1=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],sk=h("rotate-ccw",A1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S1=[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]],ik=h("rotate-cw",S1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C1=[["circle",{cx:"6",cy:"19",r:"3",key:"1kj8tv"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",key:"1d8sl"}],["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}]],ok=h("route",C1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P1=[["path",{d:"M4 11a9 9 0 0 1 9 9",key:"pv89mb"}],["path",{d:"M4 4a16 16 0 0 1 16 16",key:"k0647b"}],["circle",{cx:"5",cy:"19",r:"1",key:"bfqh0e"}]],rk=h("rss",P1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V1=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],ak=h("save",V1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E1=[["path",{d:"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"7g6ntu"}],["path",{d:"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"ijws7r"}],["path",{d:"M7 21h10",key:"1b0cd5"}],["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",key:"3gwbw2"}]],ck=h("scale",E1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N1=[["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M18 5v16",key:"1ethyx"}],["path",{d:"m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6",key:"zywc2d"}],["path",{d:"m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11",key:"1d4ql0"}],["path",{d:"M6 5v16",key:"1sn0nx"}],["circle",{cx:"12",cy:"9",r:"2",key:"1092wv"}]],lk=h("school",N1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R1=[["path",{d:"M15 12h-5",key:"r7krc0"}],["path",{d:"M15 8h-5",key:"1khuty"}],["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",key:"1ph1d7"}]],uk=h("scroll-text",R1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L1=[["path",{d:"m8 11 2 2 4-4",key:"1sed1v"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],hk=h("search-check",L1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $1=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],dk=h("search",$1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D1=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],fk=h("send",D1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j1=[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]],pk=h("server",j1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z1=[["path",{d:"M14 17H5",key:"gfn3mx"}],["path",{d:"M19 7h-9",key:"6i9tg"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]],yk=h("settings-2",z1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I1=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],mk=h("settings",I1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B1=[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]],gk=h("share-2",B1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O1=[["path",{d:"M12 2v13",key:"1km8f5"}],["path",{d:"m16 6-4-4-4 4",key:"13yo43"}],["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}]],kk=h("share",O1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H1=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],vk=h("shield-alert",H1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F1=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],xk=h("shield-check",F1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q1=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 22V2",key:"zs6s6o"}]],Mk=h("shield-half",q1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W1=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],wk=h("shield",W1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U1=[["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}],["path",{d:"M3.103 6.034h17.794",key:"awc11p"}],["path",{d:"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z",key:"o988cm"}]],bk=h("shopping-bag",U1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G1=[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]],_k=h("shopping-cart",G1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K1=[["path",{d:"M10 5H3",key:"1qgfaw"}],["path",{d:"M12 19H3",key:"yhmn1j"}],["path",{d:"M14 3v4",key:"1sua03"}],["path",{d:"M16 17v4",key:"1q0r14"}],["path",{d:"M21 12h-9",key:"1o4lsq"}],["path",{d:"M21 19h-5",key:"1rlt1p"}],["path",{d:"M21 5h-7",key:"1oszz2"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M8 12H3",key:"a7s4jb"}]],Tk=h("sliders-horizontal",K1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y1=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],Ak=h("smartphone",Y1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X1=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]],Sk=h("smile",X1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z1=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Ck=h("sparkles",Z1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J1=[["path",{d:"M16 3h5v5",key:"1806ms"}],["path",{d:"M8 3H3v5",key:"15dfkv"}],["path",{d:"M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3",key:"1qrqzj"}],["path",{d:"m15 9 6-6",key:"ko1vev"}]],Pk=h("split",J1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q1=[["path",{d:"M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344",key:"2acyp4"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Vk=h("square-check-big",Q1);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tu=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],Ek=h("square-pen",tu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const eu=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]],Nk=h("square",eu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nu=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],Rk=h("star",nu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const su=[["path",{d:"M11 2v2",key:"1539x4"}],["path",{d:"M5 2v2",key:"1yf1q8"}],["path",{d:"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1",key:"rb5t3r"}],["path",{d:"M8 15a6 6 0 0 0 12 0v-3",key:"x18d4x"}],["circle",{cx:"20",cy:"10",r:"2",key:"ts1r5v"}]],Lk=h("stethoscope",su);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const iu=[["path",{d:"M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z",key:"qazsjp"}],["path",{d:"M15 3v4a2 2 0 0 0 2 2h4",key:"40519r"}]],$k=h("sticky-note",iu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ou=[["path",{d:"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5",key:"slp6dd"}],["path",{d:"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",key:"o0xfot"}],["path",{d:"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05",key:"wn3emo"}]],Dk=h("store",ou);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ru=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],jk=h("sun",ru);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const au=[["path",{d:"m11 19-6-6",key:"s7kpr"}],["path",{d:"m5 21-2-2",key:"1kw20b"}],["path",{d:"m8 16-4 4",key:"1oqv8h"}],["path",{d:"M9.5 17.5 21 6V3h-3L6.5 14.5",key:"pkxemp"}]],zk=h("sword",au);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cu=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["line",{x1:"12",x2:"12.01",y1:"18",y2:"18",key:"1dp563"}]],Ik=h("tablet",cu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lu=[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",key:"vktsd0"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor",key:"kqv944"}]],Bk=h("tag",lu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uu=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],Ok=h("target",uu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hu=[["path",{d:"M12 19h8",key:"baeox8"}],["path",{d:"m4 17 6-6-6-6",key:"1yngyt"}]],Hk=h("terminal",hu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const du=[["path",{d:"M7 10v12",key:"1qc93n"}],["path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",key:"emmmcr"}]],Fk=h("thumbs-up",du);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fu=[["path",{d:"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",key:"qn84l0"}],["path",{d:"M13 5v2",key:"dyzc3o"}],["path",{d:"M13 17v2",key:"1ont0d"}],["path",{d:"M13 11v2",key:"1wjjxi"}]],qk=h("ticket",fu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pu=[["line",{x1:"10",x2:"14",y1:"2",y2:"2",key:"14vaq8"}],["line",{x1:"12",x2:"15",y1:"14",y2:"11",key:"17fdiu"}],["circle",{cx:"12",cy:"14",r:"8",key:"1e1u0o"}]],Wk=h("timer",pu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yu=[["circle",{cx:"9",cy:"12",r:"3",key:"u3jwor"}],["rect",{width:"20",height:"14",x:"2",y:"5",rx:"7",key:"g7kal2"}]],Uk=h("toggle-left",yu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mu=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],Gk=h("trash-2",mu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gu=[["path",{d:"M16 17h6v-6",key:"t6n2it"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7",key:"x473p"}]],Kk=h("trending-down",gu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ku=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],Yk=h("trending-up",ku);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vu=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Xk=h("triangle-alert",vu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xu=[["path",{d:"M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"14u9p9"}]],Zk=h("triangle",xu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mu=[["path",{d:"M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978",key:"1n3hpd"}],["path",{d:"M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978",key:"rfe1zi"}],["path",{d:"M18 9h1.5a1 1 0 0 0 0-5H18",key:"7xy6bh"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z",key:"1mhfuq"}],["path",{d:"M6 9H4.5a1 1 0 0 1 0-5H6",key:"tex48p"}]],Jk=h("trophy",Mu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wu=[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]],Qk=h("truck",wu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bu=[["path",{d:"M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",key:"pff0z6"}]],t5=h("twitter",bu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _u=[["path",{d:"M12 4v16",key:"1654pz"}],["path",{d:"M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2",key:"e0r10z"}],["path",{d:"M9 20h6",key:"s66wpe"}]],e5=h("type",_u);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tu=[["path",{d:"M3 7v6h6",key:"1v2h90"}],["path",{d:"M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",key:"1r6uu6"}]],n5=h("undo",Tu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Au=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],s5=h("upload",Au);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Su=[["path",{d:"m16 11 2 2 4-4",key:"9rsbq5"}],["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],i5=h("user-check",Su);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cu=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],o5=h("user-plus",Cu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pu=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],r5=h("user-minus",Pu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vu=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],a5=h("user-round",Vu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Eu=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"17",x2:"22",y1:"8",y2:"13",key:"3nzzx3"}],["line",{x1:"22",x2:"17",y1:"8",y2:"13",key:"1swrse"}]],c5=h("user-x",Eu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nu=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],l5=h("user",Nu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ru=[["path",{d:"M18 21a8 8 0 0 0-16 0",key:"3ypg7q"}],["circle",{cx:"10",cy:"8",r:"5",key:"o932ke"}],["path",{d:"M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3",key:"10s06x"}]],u5=h("users-round",Ru);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lu=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],h5=h("users",Lu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $u=[["path",{d:"M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196",key:"w8jjjt"}],["path",{d:"M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2",key:"1xawa7"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],d5=h("video-off",$u);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Du=[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]],f5=h("video",Du);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ju=[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]],p5=h("volume-2",ju);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zu=[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["line",{x1:"22",x2:"16",y1:"9",y2:"15",key:"1ewh16"}],["line",{x1:"16",x2:"22",y1:"9",y2:"15",key:"5ykzw1"}]],y5=h("volume-x",zu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Iu=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2",key:"4125el"}],["path",{d:"M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21",key:"1dpki6"}]],m5=h("wallet-cards",Iu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bu=[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]],g5=h("wallet",Bu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ou=[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",key:"ul74o6"}],["path",{d:"m14 7 3 3",key:"1r5n42"}],["path",{d:"M5 6v4",key:"ilb8ba"}],["path",{d:"M19 14v4",key:"blhpug"}],["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M7 8H3",key:"zfb6yr"}],["path",{d:"M21 16h-4",key:"1cnmox"}],["path",{d:"M11 3H9",key:"1obp7u"}]],k5=h("wand-sparkles",Ou);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hu=[["path",{d:"M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2",key:"q3hayz"}],["path",{d:"m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06",key:"1go1hn"}],["path",{d:"m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8",key:"qlwsc0"}]],v5=h("webhook",Hu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fu=[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]],x5=h("wifi",Fu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qu=[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",key:"1ngwbx"}]],M5=h("wrench",qu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wu=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],w5=h("x",Wu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uu=[["path",{d:"M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17",key:"1q2vi4"}],["path",{d:"m10 15 5-3-5-3z",key:"1jp15x"}]],b5=h("youtube",Uu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gu=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],_5=h("zap",Gu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ku=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],T5=h("zoom-in",Ku);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yu=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],A5=h("zoom-out",Yu),Ln=w.createContext({});function ht(t){const e=w.useRef(null);return e.current===null&&(e.current=t()),e.current}const Xu=typeof window<"u",ie=Xu?w.useLayoutEffect:w.useEffect,Le=w.createContext(null);function $n(t,e){t.indexOf(e)===-1&&t.push(e)}function Te(t,e){const n=t.indexOf(e);n>-1&&t.splice(n,1)}function Zu([...t],e,n){const s=e<0?t.length+e:e;if(s>=0&&s<t.length){const i=n<0?t.length+n:n,[r]=t.splice(e,1);t.splice(i,0,r)}return t}const dt=(t,e,n)=>n>e?e:n<t?t:n;let Qt=()=>{};const Mt={},Yi=t=>/^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t);function Xi(t){return typeof t=="object"&&t!==null}const Zi=t=>/^0[^.\s]+$/u.test(t);function Ji(t){let e;return()=>(e===void 0&&(e=t()),e)}const tt=t=>t,Ju=(t,e)=>n=>e(t(n)),oe=(...t)=>t.reduce(Ju),Lt=(t,e,n)=>{const s=e-t;return s===0?1:(n-t)/s};class Dn{constructor(){this.subscriptions=[]}add(e){return $n(this.subscriptions,e),()=>Te(this.subscriptions,e)}notify(e,n,s){const i=this.subscriptions.length;if(i)if(i===1)this.subscriptions[0](e,n,s);else for(let r=0;r<i;r++){const o=this.subscriptions[r];o&&o(e,n,s)}}getSize(){return this.subscriptions.length}clear(){this.subscriptions.length=0}}const et=t=>t*1e3,st=t=>t/1e3;function jn(t,e){return e?t*(1e3/e):0}const Qi=(t,e,n)=>(((1-3*n+3*e)*t+(3*n-6*e))*t+3*e)*t,Qu=1e-7,th=12;function eh(t,e,n,s,i){let r,o,a=0;do o=e+(n-e)/2,r=Qi(o,s,i)-t,r>0?n=o:e=o;while(Math.abs(r)>Qu&&++a<th);return o}function re(t,e,n,s){if(t===e&&n===s)return tt;const i=r=>eh(r,0,1,t,n);return r=>r===0||r===1?r:Qi(i(r),e,s)}const to=t=>e=>e<=.5?t(2*e)/2:(2-t(2*(1-e)))/2,eo=t=>e=>1-t(1-e),no=re(.33,1.53,.69,.99),zn=eo(no),so=to(zn),io=t=>t>=1?1:(t*=2)<1?.5*zn(t):.5*(2-Math.pow(2,-10*(t-1))),In=t=>1-Math.sin(Math.acos(t)),oo=eo(In),ro=to(In),nh=re(.42,0,1,1),sh=re(0,0,.58,1),ao=re(.42,0,.58,1),ih=t=>Array.isArray(t)&&typeof t[0]!="number",co=t=>Array.isArray(t)&&typeof t[0]=="number",oh={linear:tt,easeIn:nh,easeInOut:ao,easeOut:sh,circIn:In,circInOut:ro,circOut:oo,backIn:zn,backInOut:so,backOut:no,anticipate:io},rh=t=>typeof t=="string",vs=t=>{if(co(t)){Qt(t.length===4);const[e,n,s,i]=t;return re(e,n,s,i)}else if(rh(t))return oh[t];return t},ue=["setup","read","resolveKeyframes","preUpdate","update","preRender","render","postRender"];function ah(t,e){let n=new Set,s=new Set,i=!1,r=!1;const o=new WeakSet;let a={delta:0,timestamp:0,isProcessing:!1};function c(l){o.has(l)&&(u.schedule(l),t()),l(a)}const u={schedule:(l,d=!1,f=!1)=>{const m=f&&i?n:s;return d&&o.add(l),m.add(l),l},cancel:l=>{s.delete(l),o.delete(l)},process:l=>{if(a=l,i){r=!0;return}i=!0;const d=n;n=s,s=d,n.forEach(c),n.clear(),i=!1,r&&(r=!1,u.process(l))}};return u}const ch=40;function lo(t,e){let n=!1,s=!0;const i={delta:0,timestamp:0,isProcessing:!1},r=()=>n=!0,o=ue.reduce((x,_)=>(x[_]=ah(r),x),{}),{setup:a,read:c,resolveKeyframes:u,preUpdate:l,update:d,preRender:f,render:y,postRender:m}=o,v=()=>{const x=Mt.useManualTiming,_=x?i.timestamp:performance.now();n=!1,x||(i.delta=s?1e3/60:Math.max(Math.min(_-i.timestamp,ch),1)),i.timestamp=_,i.isProcessing=!0,a.process(i),c.process(i),u.process(i),l.process(i),d.process(i),f.process(i),y.process(i),m.process(i),i.isProcessing=!1,n&&e&&(s=!1,t(v))},k=()=>{n=!0,s=!0,i.isProcessing||t(v)};return{schedule:ue.reduce((x,_)=>{const A=o[_];return x[_]=($,C=!1,P=!1)=>(n||k(),A.schedule($,C,P)),x},{}),cancel:x=>{for(let _=0;_<ue.length;_++)o[ue[_]].cancel(x)},state:i,steps:o}}const{schedule:L,cancel:ot,state:G,steps:Oe}=lo(typeof requestAnimationFrame<"u"?requestAnimationFrame:tt,!0);let ke;function lh(){ke=void 0}const X={now:()=>(ke===void 0&&X.set(G.isProcessing||Mt.useManualTiming?G.timestamp:performance.now()),ke),set:t=>{ke=t,queueMicrotask(lh)}},uo=t=>e=>typeof e=="string"&&e.startsWith(t),ho=uo("--"),uh=uo("var(--"),Bn=t=>uh(t)?hh.test(t.split("/*")[0].trim()):!1,hh=/var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;function xs(t){return typeof t!="string"?!1:t.split("/*")[0].includes("var(--")}const Dt={test:t=>typeof t=="number",parse:parseFloat,transform:t=>t},te={...Dt,transform:t=>dt(0,1,t)},he={...Dt,default:1},Wt=t=>Math.round(t*1e5)/1e5,On=/-?(?:\d+(?:\.\d+)?|\.\d+)/gu;function dh(t){return t==null}const fh=/^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,Hn=(t,e)=>n=>!!(typeof n=="string"&&fh.test(n)&&n.startsWith(t)||e&&!dh(n)&&Object.prototype.hasOwnProperty.call(n,e)),fo=(t,e,n)=>s=>{if(typeof s!="string")return s;const[i,r,o,a]=s.match(On);return{[t]:parseFloat(i),[e]:parseFloat(r),[n]:parseFloat(o),alpha:a!==void 0?parseFloat(a):1}},ph=t=>dt(0,255,t),He={...Dt,transform:t=>Math.round(ph(t))},Tt={test:Hn("rgb","red"),parse:fo("red","green","blue"),transform:({red:t,green:e,blue:n,alpha:s=1})=>"rgba("+He.transform(t)+", "+He.transform(e)+", "+He.transform(n)+", "+Wt(te.transform(s))+")"};function yh(t){let e="",n="",s="",i="";return t.length>5?(e=t.substring(1,3),n=t.substring(3,5),s=t.substring(5,7),i=t.substring(7,9)):(e=t.substring(1,2),n=t.substring(2,3),s=t.substring(3,4),i=t.substring(4,5),e+=e,n+=n,s+=s,i+=i),{red:parseInt(e,16),green:parseInt(n,16),blue:parseInt(s,16),alpha:i?parseInt(i,16)/255:1}}const rn={test:Hn("#"),parse:yh,transform:Tt.transform},ae=t=>({test:e=>typeof e=="string"&&e.endsWith(t)&&e.split(" ").length===1,parse:parseFloat,transform:e=>`${e}${t}`}),kt=ae("deg"),mt=ae("%"),T=ae("px"),mh=ae("vh"),gh=ae("vw"),Ms={...mt,parse:t=>mt.parse(t)/100,transform:t=>mt.transform(t*100)},Et={test:Hn("hsl","hue"),parse:fo("hue","saturation","lightness"),transform:({hue:t,saturation:e,lightness:n,alpha:s=1})=>"hsla("+Math.round(t)+", "+mt.transform(Wt(e))+", "+mt.transform(Wt(n))+", "+Wt(te.transform(s))+")"},H={test:t=>Tt.test(t)||rn.test(t)||Et.test(t),parse:t=>Tt.test(t)?Tt.parse(t):Et.test(t)?Et.parse(t):rn.parse(t),transform:t=>typeof t=="string"?t:t.hasOwnProperty("red")?Tt.transform(t):Et.transform(t),getAnimatableNone:t=>{const e=H.parse(t);return e.alpha=0,H.transform(e)}},kh=/(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;function vh(t){var e,n;return isNaN(t)&&typeof t=="string"&&(((e=t.match(On))==null?void 0:e.length)||0)+(((n=t.match(kh))==null?void 0:n.length)||0)>0}const po="number",yo="color",xh="var",Mh="var(",ws="${}",wh=/var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;function $t(t){const e=t.toString(),n=[],s={color:[],number:[],var:[]},i=[];let r=0;const a=e.replace(wh,c=>(H.test(c)?(s.color.push(r),i.push(yo),n.push(H.parse(c))):c.startsWith(Mh)?(s.var.push(r),i.push(xh),n.push(c)):(s.number.push(r),i.push(po),n.push(parseFloat(c))),++r,ws)).split(ws);return{values:n,split:a,indexes:s,types:i}}function bh(t){return $t(t).values}function mo({split:t,types:e}){const n=t.length;return s=>{let i="";for(let r=0;r<n;r++)if(i+=t[r],s[r]!==void 0){const o=e[r];o===po?i+=Wt(s[r]):o===yo?i+=H.transform(s[r]):i+=s[r]}return i}}function _h(t){return mo($t(t))}const Th=t=>typeof t=="number"?0:H.test(t)?H.getAnimatableNone(t):t,Ah=(t,e)=>typeof t=="number"?e!=null&&e.trim().endsWith("/")?t:0:Th(t);function Sh(t){const e=$t(t);return mo(e)(e.values.map((s,i)=>Ah(s,e.split[i])))}const ut={test:vh,parse:bh,createTransformer:_h,getAnimatableNone:Sh};function Fe(t,e,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?t+(e-t)*6*n:n<1/2?e:n<2/3?t+(e-t)*(2/3-n)*6:t}function Ch({hue:t,saturation:e,lightness:n,alpha:s}){t/=360,e/=100,n/=100;let i=0,r=0,o=0;if(!e)i=r=o=n;else{const a=n<.5?n*(1+e):n+e-n*e,c=2*n-a;i=Fe(c,a,t+1/3),r=Fe(c,a,t),o=Fe(c,a,t-1/3)}return{red:Math.round(i*255),green:Math.round(r*255),blue:Math.round(o*255),alpha:s}}function Ae(t,e){return n=>n>0?e:t}const I=(t,e,n)=>t+(e-t)*n,qe=(t,e,n)=>{const s=t*t,i=n*(e*e-s)+s;return i<0?0:Math.sqrt(i)},Ph=[rn,Tt,Et],Vh=t=>Ph.find(e=>e.test(t));function bs(t){const e=Vh(t);if(!e)return!1;let n=e.parse(t);return e===Et&&(n=Ch(n)),n}const _s=(t,e)=>{const n=bs(t),s=bs(e);if(!n||!s)return Ae(t,e);const i={...n};return r=>(i.red=qe(n.red,s.red,r),i.green=qe(n.green,s.green,r),i.blue=qe(n.blue,s.blue,r),i.alpha=I(n.alpha,s.alpha,r),Tt.transform(i))},an=new Set(["none","hidden"]);function Eh(t,e){return an.has(t)?n=>n<=0?t:e:n=>n>=1?e:t}function Nh(t,e){return n=>I(t,e,n)}function Fn(t){return typeof t=="number"?Nh:typeof t=="string"?Bn(t)?Ae:H.test(t)?_s:$h:Array.isArray(t)?go:typeof t=="object"?H.test(t)?_s:Rh:Ae}function go(t,e){const n=[...t],s=n.length,i=t.map((r,o)=>Fn(r)(r,e[o]));return r=>{for(let o=0;o<s;o++)n[o]=i[o](r);return n}}function Rh(t,e){const n={...t,...e},s={};for(const i in n)t[i]!==void 0&&e[i]!==void 0&&(s[i]=Fn(t[i])(t[i],e[i]));return i=>{for(const r in s)n[r]=s[r](i);return n}}function Lh(t,e){const n=[],s={color:0,var:0,number:0};for(let i=0;i<e.values.length;i++){const r=e.types[i],o=t.indexes[r][s[r]],a=t.values[o]??0;n[i]=a,s[r]++}return n}const $h=(t,e)=>{const n=ut.createTransformer(e),s=$t(t),i=$t(e);return s.indexes.var.length===i.indexes.var.length&&s.indexes.color.length===i.indexes.color.length&&s.indexes.number.length>=i.indexes.number.length?an.has(t)&&!i.values.length||an.has(e)&&!s.values.length?Eh(t,e):oe(go(Lh(s,i),i.values),n):Ae(t,e)};function ko(t,e,n){return typeof t=="number"&&typeof e=="number"&&typeof n=="number"?I(t,e,n):Fn(t)(t,e)}const Dh=t=>{const e=({timestamp:n})=>t(n);return{start:(n=!0)=>L.update(e,n),stop:()=>ot(e),now:()=>G.isProcessing?G.timestamp:X.now()}},vo=(t,e,n=10)=>{let s="";const i=Math.max(Math.round(e/n),2);for(let r=0;r<i;r++)s+=Math.round(t(r/(i-1))*1e4)/1e4+", ";return`linear(${s.substring(0,s.length-2)})`},Se=2e4;function qn(t){let e=0;const n=50;let s=t.next(e);for(;!s.done&&e<Se;)e+=n,s=t.next(e);return e>=Se?1/0:e}function jh(t,e=100,n){const s=n({...t,keyframes:[0,e]}),i=Math.min(qn(s),Se);return{type:"keyframes",ease:r=>s.next(i*r).value/e,duration:st(i)}}const O={stiffness:100,damping:10,mass:1,velocity:0,duration:800,bounce:.3,visualDuration:.3,restSpeed:{granular:.01,default:2},restDelta:{granular:.005,default:.5},minDuration:.01,maxDuration:10,minDamping:.05,maxDamping:1};function cn(t,e){return t*Math.sqrt(1-e*e)}const zh=12;function Ih(t,e,n){let s=n;for(let i=1;i<zh;i++)s=s-t(s)/e(s);return s}const We=.001;function Bh({duration:t=O.duration,bounce:e=O.bounce,velocity:n=O.velocity,mass:s=O.mass}){let i,r,o=1-e;o=dt(O.minDamping,O.maxDamping,o),t=dt(O.minDuration,O.maxDuration,st(t)),o<1?(i=u=>{const l=u*o,d=l*t,f=l-n,y=cn(u,o),m=Math.exp(-d);return We-f/y*m},r=u=>{const d=u*o*t,f=d*n+n,y=Math.pow(o,2)*Math.pow(u,2)*t,m=Math.exp(-d),v=cn(Math.pow(u,2),o);return(-i(u)+We>0?-1:1)*((f-y)*m)/v}):(i=u=>{const l=Math.exp(-u*t),d=(u-n)*t+1;return-We+l*d},r=u=>{const l=Math.exp(-u*t),d=(n-u)*(t*t);return l*d});const a=5/t,c=Ih(i,r,a);if(t=et(t),isNaN(c))return{stiffness:O.stiffness,damping:O.damping,duration:t};{const u=Math.pow(c,2)*s;return{stiffness:u,damping:o*2*Math.sqrt(s*u),duration:t}}}const Oh=["duration","bounce"],Hh=["stiffness","damping","mass"];function Ts(t,e){return e.some(n=>t[n]!==void 0)}function Fh(t){let e={velocity:O.velocity,stiffness:O.stiffness,damping:O.damping,mass:O.mass,isResolvedFromDuration:!1,...t};if(!Ts(t,Hh)&&Ts(t,Oh))if(e.velocity=0,t.visualDuration){const n=t.visualDuration,s=2*Math.PI/(n*1.2),i=s*s,r=2*dt(.05,1,1-(t.bounce||0))*Math.sqrt(i);e={...e,mass:O.mass,stiffness:i,damping:r}}else{const n=Bh({...t,velocity:0});e={...e,...n,mass:O.mass},e.isResolvedFromDuration=!0}return e}function Ce(t=O.visualDuration,e=O.bounce){const n=typeof t!="object"?{visualDuration:t,keyframes:[0,1],bounce:e}:t;let{restSpeed:s,restDelta:i}=n;const r=n.keyframes[0],o=n.keyframes[n.keyframes.length-1],a={done:!1,value:r},{stiffness:c,damping:u,mass:l,duration:d,velocity:f,isResolvedFromDuration:y}=Fh({...n,velocity:-st(n.velocity||0)}),m=f||0,v=u/(2*Math.sqrt(c*l)),k=o-r,g=st(Math.sqrt(c/l)),b=Math.abs(k)<5;s||(s=b?O.restSpeed.granular:O.restSpeed.default),i||(i=b?O.restDelta.granular:O.restDelta.default);let x,_,A,$,C,P;if(v<1)A=cn(g,v),$=(m+v*g*k)/A,x=S=>{const j=Math.exp(-v*g*S);return o-j*($*Math.sin(A*S)+k*Math.cos(A*S))},C=v*g*$+k*A,P=v*g*k-$*A,_=S=>Math.exp(-v*g*S)*(C*Math.sin(A*S)+P*Math.cos(A*S));else if(v===1){x=j=>o-Math.exp(-g*j)*(k+(m+g*k)*j);const S=m+g*k;_=j=>Math.exp(-g*j)*(g*S*j-m)}else{const S=g*Math.sqrt(v*v-1);x=J=>{const rt=Math.exp(-v*g*J),K=Math.min(S*J,300);return o-rt*((m+v*g*k)*Math.sinh(K)+S*k*Math.cosh(K))/S};const j=(m+v*g*k)/S,q=v*g*j-k*S,nt=v*g*k-j*S;_=J=>{const rt=Math.exp(-v*g*J),K=Math.min(S*J,300);return rt*(q*Math.sinh(K)+nt*Math.cosh(K))}}const R={calculatedDuration:y&&d||null,velocity:S=>et(_(S)),next:S=>{if(!y&&v<1){const q=Math.exp(-v*g*S),nt=Math.sin(A*S),J=Math.cos(A*S),rt=o-q*($*nt+k*J),K=et(q*(C*nt+P*J));return a.done=Math.abs(K)<=s&&Math.abs(o-rt)<=i,a.value=a.done?o:rt,a}const j=x(S);if(y)a.done=S>=d;else{const q=et(_(S));a.done=Math.abs(q)<=s&&Math.abs(o-j)<=i}return a.value=a.done?o:j,a},toString:()=>{const S=Math.min(qn(R),Se),j=vo(q=>R.next(S*q).value,S,30);return S+"ms "+j},toTransition:()=>{}};return R}Ce.applyToOptions=t=>{const e=jh(t,100,Ce);return t.ease=e.ease,t.duration=et(e.duration),t.type="keyframes",t};const qh=5;function xo(t,e,n){const s=Math.max(e-qh,0);return jn(n-t(s),e-s)}function ln({keyframes:t,velocity:e=0,power:n=.8,timeConstant:s=325,bounceDamping:i=10,bounceStiffness:r=500,modifyTarget:o,min:a,max:c,restDelta:u=.5,restSpeed:l}){const d=t[0],f={done:!1,value:d},y=P=>a!==void 0&&P<a||c!==void 0&&P>c,m=P=>a===void 0?c:c===void 0||Math.abs(a-P)<Math.abs(c-P)?a:c;let v=n*e;const k=d+v,g=o===void 0?k:o(k);g!==k&&(v=g-d);const b=P=>-v*Math.exp(-P/s),x=P=>g+b(P),_=P=>{const R=b(P),S=x(P);f.done=Math.abs(R)<=u,f.value=f.done?g:S};let A,$;const C=P=>{y(f.value)&&(A=P,$=Ce({keyframes:[f.value,m(f.value)],velocity:xo(x,P,f.value),damping:i,stiffness:r,restDelta:u,restSpeed:l}))};return C(0),{calculatedDuration:null,next:P=>{let R=!1;return!$&&A===void 0&&(R=!0,_(P),C(P)),A!==void 0&&P>=A?$.next(P-A):(!R&&_(P),f)}}}function Wh(t,e,n){const s=[],i=n||Mt.mix||ko,r=t.length-1;for(let o=0;o<r;o++){let a=i(t[o],t[o+1]);if(e){const c=Array.isArray(e)?e[o]||tt:e;a=oe(c,a)}s.push(a)}return s}function Wn(t,e,{clamp:n=!0,ease:s,mixer:i}={}){const r=t.length;if(Qt(r===e.length),r===1)return()=>e[0];if(r===2&&e[0]===e[1])return()=>e[1];const o=t[0]===t[1];t[0]>t[r-1]&&(t=[...t].reverse(),e=[...e].reverse());const a=Wh(e,s,i),c=a.length,u=l=>{if(o&&l<t[0])return e[0];let d=0;if(c>1)for(;d<t.length-2&&!(l<t[d+1]);d++);const f=Lt(t[d],t[d+1],l);return a[d](f)};return n?l=>u(dt(t[0],t[r-1],l)):u}function Uh(t,e){const n=t[t.length-1];for(let s=1;s<=e;s++){const i=Lt(0,e,s);t.push(I(n,1,i))}}function Mo(t){const e=[0];return Uh(e,t.length-1),e}function Gh(t,e){return t.map(n=>n*e)}function Kh(t,e){return t.map(()=>e||ao).splice(0,t.length-1)}function Ut({duration:t=300,keyframes:e,times:n,ease:s="easeInOut"}){const i=ih(s)?s.map(vs):vs(s),r={done:!1,value:e[0]},o=Gh(n&&n.length===e.length?n:Mo(e),t),a=Wn(o,e,{ease:Array.isArray(i)?i:Kh(e,i)});return{calculatedDuration:t,next:c=>(r.value=a(c),r.done=c>=t,r)}}const Yh=t=>t!==null;function $e(t,{repeat:e,repeatType:n="loop"},s,i=1){const r=t.filter(Yh),a=i<0||e&&n!=="loop"&&e%2===1?0:r.length-1;return!a||s===void 0?r[a]:s}const Xh={decay:ln,inertia:ln,tween:Ut,keyframes:Ut,spring:Ce};function wo(t){typeof t.type=="string"&&(t.type=Xh[t.type])}class Un{constructor(){this.updateFinished()}get finished(){return this._finished}updateFinished(){this._finished=new Promise(e=>{this.resolve=e})}notifyFinished(){this.resolve()}then(e,n){return this.finished.then(e,n)}}const Zh=t=>t/100;class ee extends Un{constructor(e){super(),this.state="idle",this.startTime=null,this.isStopped=!1,this.currentTime=0,this.holdTime=null,this.playbackSpeed=1,this.delayState={done:!1,value:void 0},this.stop=()=>{var s,i;const{motionValue:n}=this.options;n&&n.updatedAt!==X.now()&&this.tick(X.now()),this.isStopped=!0,this.state!=="idle"&&(this.teardown(),(i=(s=this.options).onStop)==null||i.call(s))},this.options=e,this.initAnimation(),this.play(),e.autoplay===!1&&this.pause()}initAnimation(){const{options:e}=this;wo(e);const{type:n=Ut,repeat:s=0,repeatDelay:i=0,repeatType:r,velocity:o=0}=e;let{keyframes:a}=e;const c=n||Ut;c!==Ut&&typeof a[0]!="number"&&(this.mixKeyframes=oe(Zh,ko(a[0],a[1])),a=[0,100]);const u=c({...e,keyframes:a});r==="mirror"&&(this.mirroredGenerator=c({...e,keyframes:[...a].reverse(),velocity:-o})),u.calculatedDuration===null&&(u.calculatedDuration=qn(u));const{calculatedDuration:l}=u;this.calculatedDuration=l,this.resolvedDuration=l+i,this.totalDuration=this.resolvedDuration*(s+1)-i,this.generator=u}updateTime(e){const n=Math.round(e-this.startTime)*this.playbackSpeed;this.holdTime!==null?this.currentTime=this.holdTime:this.currentTime=n}tick(e,n=!1){const{generator:s,totalDuration:i,mixKeyframes:r,mirroredGenerator:o,resolvedDuration:a,calculatedDuration:c}=this;if(this.startTime===null)return s.next(0);const{delay:u=0,keyframes:l,repeat:d,repeatType:f,repeatDelay:y,type:m,onUpdate:v,finalKeyframe:k}=this.options;this.speed>0?this.startTime=Math.min(this.startTime,e):this.speed<0&&(this.startTime=Math.min(e-i/this.speed,this.startTime)),n?this.currentTime=e:this.updateTime(e);const g=this.currentTime-u*(this.playbackSpeed>=0?1:-1),b=this.playbackSpeed>=0?g<0:g>i;this.currentTime=Math.max(g,0),this.state==="finished"&&this.holdTime===null&&(this.currentTime=i);let x=this.currentTime,_=s;if(d){const P=Math.min(this.currentTime,i)/a;let R=Math.floor(P),S=P%1;!S&&P>=1&&(S=1),S===1&&R--,R=Math.min(R,d+1),!!(R%2)&&(f==="reverse"?(S=1-S,y&&(S-=y/a)):f==="mirror"&&(_=o)),x=dt(0,1,S)*a}let A;b?(this.delayState.value=l[0],A=this.delayState):A=_.next(x),r&&!b&&(A.value=r(A.value));let{done:$}=A;!b&&c!==null&&($=this.playbackSpeed>=0?this.currentTime>=i:this.currentTime<=0);const C=this.holdTime===null&&(this.state==="finished"||this.state==="running"&&$);return C&&m!==ln&&(A.value=$e(l,this.options,k,this.speed)),v&&v(A.value),C&&this.finish(),A}then(e,n){return this.finished.then(e,n)}get duration(){return st(this.calculatedDuration)}get iterationDuration(){const{delay:e=0}=this.options||{};return this.duration+st(e)}get time(){return st(this.currentTime)}set time(e){e=et(e),this.currentTime=e,this.startTime===null||this.holdTime!==null||this.playbackSpeed===0?this.holdTime=e:this.driver&&(this.startTime=this.driver.now()-e/this.playbackSpeed),this.driver?this.driver.start(!1):(this.startTime=0,this.state="paused",this.holdTime=e,this.tick(e))}getGeneratorVelocity(){const e=this.currentTime;if(e<=0)return this.options.velocity||0;if(this.generator.velocity)return this.generator.velocity(e);const n=this.generator.next(e).value;return xo(s=>this.generator.next(s).value,e,n)}get speed(){return this.playbackSpeed}set speed(e){const n=this.playbackSpeed!==e;n&&this.driver&&this.updateTime(X.now()),this.playbackSpeed=e,n&&this.driver&&(this.time=st(this.currentTime))}play(){var i,r;if(this.isStopped)return;const{driver:e=Dh,startTime:n}=this.options;this.driver||(this.driver=e(o=>this.tick(o))),(r=(i=this.options).onPlay)==null||r.call(i);const s=this.driver.now();this.state==="finished"?(this.updateFinished(),this.startTime=s):this.holdTime!==null?this.startTime=s-this.holdTime:this.startTime||(this.startTime=n??s),this.state==="finished"&&this.speed<0&&(this.startTime+=this.calculatedDuration),this.holdTime=null,this.state="running",this.driver.start()}pause(){this.state="paused",this.updateTime(X.now()),this.holdTime=this.currentTime}complete(){this.state!=="running"&&this.play(),this.state="finished",this.holdTime=null}finish(){var e,n;this.notifyFinished(),this.teardown(),this.state="finished",(n=(e=this.options).onComplete)==null||n.call(e)}cancel(){var e,n;this.holdTime=null,this.startTime=0,this.tick(0),this.teardown(),(n=(e=this.options).onCancel)==null||n.call(e)}teardown(){this.state="idle",this.stopDriver(),this.startTime=this.holdTime=null}stopDriver(){this.driver&&(this.driver.stop(),this.driver=void 0)}sample(e){return this.startTime=0,this.tick(e,!0)}attachTimeline(e){var n;return this.options.allowFlatten&&(this.options.type="keyframes",this.options.ease="linear",this.initAnimation()),(n=this.driver)==null||n.stop(),e.observe(this)}}function Jh(t){for(let e=1;e<t.length;e++)t[e]??(t[e]=t[e-1])}const At=t=>t*180/Math.PI,un=t=>{const e=At(Math.atan2(t[1],t[0]));return hn(e)},Qh={x:4,y:5,translateX:4,translateY:5,scaleX:0,scaleY:3,scale:t=>(Math.abs(t[0])+Math.abs(t[3]))/2,rotate:un,rotateZ:un,skewX:t=>At(Math.atan(t[1])),skewY:t=>At(Math.atan(t[2])),skew:t=>(Math.abs(t[1])+Math.abs(t[2]))/2},hn=t=>(t=t%360,t<0&&(t+=360),t),As=un,Ss=t=>Math.sqrt(t[0]*t[0]+t[1]*t[1]),Cs=t=>Math.sqrt(t[4]*t[4]+t[5]*t[5]),td={x:12,y:13,z:14,translateX:12,translateY:13,translateZ:14,scaleX:Ss,scaleY:Cs,scale:t=>(Ss(t)+Cs(t))/2,rotateX:t=>hn(At(Math.atan2(t[6],t[5]))),rotateY:t=>hn(At(Math.atan2(-t[2],t[0]))),rotateZ:As,rotate:As,skewX:t=>At(Math.atan(t[4])),skewY:t=>At(Math.atan(t[1])),skew:t=>(Math.abs(t[1])+Math.abs(t[4]))/2};function dn(t){return t.includes("scale")?1:0}function fn(t,e){if(!t||t==="none")return dn(e);const n=t.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);let s,i;if(n)s=td,i=n;else{const a=t.match(/^matrix\(([-\d.e\s,]+)\)$/u);s=Qh,i=a}if(!i)return dn(e);const r=s[e],o=i[1].split(",").map(nd);return typeof r=="function"?r(o):o[r]}const ed=(t,e)=>{const{transform:n="none"}=getComputedStyle(t);return fn(n,e)};function nd(t){return parseFloat(t.trim())}const jt=["transformPerspective","x","y","z","translateX","translateY","translateZ","scale","scaleX","scaleY","rotate","rotateX","rotateY","rotateZ","skew","skewX","skewY"],zt=new Set(jt),Ps=t=>t===Dt||t===T,sd=new Set(["x","y","z"]),id=jt.filter(t=>!sd.has(t));function od(t){const e=[];return id.forEach(n=>{const s=t.getValue(n);s!==void 0&&(e.push([n,s.get()]),s.set(n.startsWith("scale")?1:0))}),e}const xt={width:({x:t},{paddingLeft:e="0",paddingRight:n="0",boxSizing:s})=>{const i=t.max-t.min;return s==="border-box"?i:i-parseFloat(e)-parseFloat(n)},height:({y:t},{paddingTop:e="0",paddingBottom:n="0",boxSizing:s})=>{const i=t.max-t.min;return s==="border-box"?i:i-parseFloat(e)-parseFloat(n)},top:(t,{top:e})=>parseFloat(e),left:(t,{left:e})=>parseFloat(e),bottom:({y:t},{top:e})=>parseFloat(e)+(t.max-t.min),right:({x:t},{left:e})=>parseFloat(e)+(t.max-t.min),x:(t,{transform:e})=>fn(e,"x"),y:(t,{transform:e})=>fn(e,"y")};xt.translateX=xt.x;xt.translateY=xt.y;const St=new Set;let pn=!1,yn=!1,mn=!1;function bo(){if(yn){const t=Array.from(St).filter(s=>s.needsMeasurement),e=new Set(t.map(s=>s.element)),n=new Map;e.forEach(s=>{const i=od(s);i.length&&(n.set(s,i),s.render())}),t.forEach(s=>s.measureInitialState()),e.forEach(s=>{s.render();const i=n.get(s);i&&i.forEach(([r,o])=>{var a;(a=s.getValue(r))==null||a.set(o)})}),t.forEach(s=>s.measureEndState()),t.forEach(s=>{s.suspendedScrollY!==void 0&&window.scrollTo(0,s.suspendedScrollY)})}yn=!1,pn=!1,St.forEach(t=>t.complete(mn)),St.clear()}function _o(){St.forEach(t=>{t.readKeyframes(),t.needsMeasurement&&(yn=!0)})}function rd(){mn=!0,_o(),bo(),mn=!1}class Gn{constructor(e,n,s,i,r,o=!1){this.state="pending",this.isAsync=!1,this.needsMeasurement=!1,this.unresolvedKeyframes=[...e],this.onComplete=n,this.name=s,this.motionValue=i,this.element=r,this.isAsync=o}scheduleResolve(){this.state="scheduled",this.isAsync?(St.add(this),pn||(pn=!0,L.read(_o),L.resolveKeyframes(bo))):(this.readKeyframes(),this.complete())}readKeyframes(){const{unresolvedKeyframes:e,name:n,element:s,motionValue:i}=this;if(e[0]===null){const r=i==null?void 0:i.get(),o=e[e.length-1];if(r!==void 0)e[0]=r;else if(s&&n){const a=s.readValue(n,o);a!=null&&(e[0]=a)}e[0]===void 0&&(e[0]=o),i&&r===void 0&&i.set(e[0])}Jh(e)}setFinalKeyframe(){}measureInitialState(){}renderEndStyles(){}measureEndState(){}complete(e=!1){this.state="complete",this.onComplete(this.unresolvedKeyframes,this.finalKeyframe,e),St.delete(this)}cancel(){this.state==="scheduled"&&(St.delete(this),this.state="pending")}resume(){this.state==="pending"&&this.scheduleResolve()}}const ad=t=>t.startsWith("--");function To(t,e,n){ad(e)?t.style.setProperty(e,n):t.style[e]=n}const cd={};function Kn(t,e){const n=Ji(t);return()=>cd[e]??n()}const Yn=Kn(()=>window.ScrollTimeline!==void 0,"scrollTimeline"),Ao=Kn(()=>window.ViewTimeline!==void 0,"viewTimeline"),So=Kn(()=>{try{document.createElement("div").animate({opacity:0},{easing:"linear(0, 1)"})}catch{return!1}return!0},"linearEasing"),Ht=([t,e,n,s])=>`cubic-bezier(${t}, ${e}, ${n}, ${s})`,Vs={linear:"linear",ease:"ease",easeIn:"ease-in",easeOut:"ease-out",easeInOut:"ease-in-out",circIn:Ht([0,.65,.55,1]),circOut:Ht([.55,0,1,.45]),backIn:Ht([.31,.01,.66,-.59]),backOut:Ht([.33,1.53,.69,.99])};function Co(t,e){if(t)return typeof t=="function"?So()?vo(t,e):"ease-out":co(t)?Ht(t):Array.isArray(t)?t.map(n=>Co(n,e)||Vs.easeOut):Vs[t]}function ld(t,e,n,{delay:s=0,duration:i=300,repeat:r=0,repeatType:o="loop",ease:a="easeOut",times:c}={},u=void 0){const l={[e]:n};c&&(l.offset=c);const d=Co(a,i);Array.isArray(d)&&(l.easing=d);const f={delay:s,duration:i,easing:Array.isArray(d)?"linear":d,fill:"both",iterations:r+1,direction:o==="reverse"?"alternate":"normal"};return u&&(f.pseudoElement=u),t.animate(l,f)}function Po(t){return typeof t=="function"&&"applyToOptions"in t}function ud({type:t,...e}){return Po(t)&&So()?t.applyToOptions(e):(e.duration??(e.duration=300),e.ease??(e.ease="easeOut"),e)}class Vo extends Un{constructor(e){if(super(),this.finishedTime=null,this.isStopped=!1,this.manualStartTime=null,!e)return;const{element:n,name:s,keyframes:i,pseudoElement:r,allowFlatten:o=!1,finalKeyframe:a,onComplete:c}=e;this.isPseudoElement=!!r,this.allowFlatten=o,this.options=e,Qt(typeof e.type!="string");const u=ud(e);this.animation=ld(n,s,i,u,r),u.autoplay===!1&&this.animation.pause(),this.animation.onfinish=()=>{if(this.finishedTime=this.time,!r){const l=$e(i,this.options,a,this.speed);this.updateMotionValue&&this.updateMotionValue(l),To(n,s,l),this.animation.cancel()}c==null||c(),this.notifyFinished()}}play(){this.isStopped||(this.manualStartTime=null,this.animation.play(),this.state==="finished"&&this.updateFinished())}pause(){this.animation.pause()}complete(){var e,n;(n=(e=this.animation).finish)==null||n.call(e)}cancel(){try{this.animation.cancel()}catch{}}stop(){if(this.isStopped)return;this.isStopped=!0;const{state:e}=this;e==="idle"||e==="finished"||(this.updateMotionValue?this.updateMotionValue():this.commitStyles(),this.isPseudoElement||this.cancel())}commitStyles(){var n,s,i;const e=(n=this.options)==null?void 0:n.element;!this.isPseudoElement&&(e!=null&&e.isConnected)&&((i=(s=this.animation).commitStyles)==null||i.call(s))}get duration(){var n,s;const e=((s=(n=this.animation.effect)==null?void 0:n.getComputedTiming)==null?void 0:s.call(n).duration)||0;return st(Number(e))}get iterationDuration(){const{delay:e=0}=this.options||{};return this.duration+st(e)}get time(){return st(Number(this.animation.currentTime)||0)}set time(e){const n=this.finishedTime!==null;this.manualStartTime=null,this.finishedTime=null,this.animation.currentTime=et(e),n&&this.animation.pause()}get speed(){return this.animation.playbackRate}set speed(e){e<0&&(this.finishedTime=null),this.animation.playbackRate=e}get state(){return this.finishedTime!==null?"finished":this.animation.playState}get startTime(){return this.manualStartTime??Number(this.animation.startTime)}set startTime(e){this.manualStartTime=this.animation.startTime=e}attachTimeline({timeline:e,rangeStart:n,rangeEnd:s,observe:i}){var r;return this.allowFlatten&&((r=this.animation.effect)==null||r.updateTiming({easing:"linear"})),this.animation.onfinish=null,e&&Yn()?(this.animation.timeline=e,n&&(this.animation.rangeStart=n),s&&(this.animation.rangeEnd=s),tt):i(this)}}const Eo={anticipate:io,backInOut:so,circInOut:ro};function hd(t){return t in Eo}function dd(t){typeof t.ease=="string"&&hd(t.ease)&&(t.ease=Eo[t.ease])}const Ue=10;class fd extends Vo{constructor(e){dd(e),wo(e),super(e),e.startTime!==void 0&&e.autoplay!==!1&&(this.startTime=e.startTime),this.options=e}updateMotionValue(e){const{motionValue:n,onUpdate:s,onComplete:i,element:r,...o}=this.options;if(!n)return;if(e!==void 0){n.set(e);return}const a=new ee({...o,autoplay:!1}),c=Math.max(Ue,X.now()-this.startTime),u=dt(0,Ue,c-Ue),l=a.sample(c).value,{name:d}=this.options;r&&d&&To(r,d,l),n.setWithVelocity(a.sample(Math.max(0,c-u)).value,l,u),a.stop()}}const Es=(t,e)=>e==="zIndex"?!1:!!(typeof t=="number"||Array.isArray(t)||typeof t=="string"&&(ut.test(t)||t==="0")&&!t.startsWith("url("));function pd(t){const e=t[0];if(t.length===1)return!0;for(let n=0;n<t.length;n++)if(t[n]!==e)return!0}function yd(t,e,n,s){const i=t[0];if(i===null)return!1;if(e==="display"||e==="visibility")return!0;const r=t[t.length-1],o=Es(i,e),a=Es(r,e);return!o||!a?!1:pd(t)||(n==="spring"||Po(n))&&s}function gn(t){t.duration=0,t.type="keyframes"}const No=new Set(["opacity","clipPath","filter","transform"]),md=/^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;function gd(t){for(let e=0;e<t.length;e++)if(typeof t[e]=="string"&&md.test(t[e]))return!0;return!1}const kd=new Set(["color","backgroundColor","outlineColor","fill","stroke","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor"]),vd=Ji(()=>Object.hasOwnProperty.call(Element.prototype,"animate"));function xd(t){var d;const{motionValue:e,name:n,repeatDelay:s,repeatType:i,damping:r,type:o,keyframes:a}=t;if(!(((d=e==null?void 0:e.owner)==null?void 0:d.current)instanceof HTMLElement))return!1;const{onUpdate:u,transformTemplate:l}=e.owner.getProps();return vd()&&n&&(No.has(n)||kd.has(n)&&gd(a))&&(n!=="transform"||!l)&&!u&&!s&&i!=="mirror"&&r!==0&&o!=="inertia"}const Md=40;class wd extends Un{constructor({autoplay:e=!0,delay:n=0,type:s="keyframes",repeat:i=0,repeatDelay:r=0,repeatType:o="loop",keyframes:a,name:c,motionValue:u,element:l,...d}){var m;super(),this.stop=()=>{var v,k;this._animation&&(this._animation.stop(),(v=this.stopTimeline)==null||v.call(this)),(k=this.keyframeResolver)==null||k.cancel()},this.createdAt=X.now();const f={autoplay:e,delay:n,type:s,repeat:i,repeatDelay:r,repeatType:o,name:c,motionValue:u,element:l,...d},y=(l==null?void 0:l.KeyframeResolver)||Gn;this.keyframeResolver=new y(a,(v,k,g)=>this.onKeyframesResolved(v,k,f,!g),c,u,l),(m=this.keyframeResolver)==null||m.scheduleResolve()}onKeyframesResolved(e,n,s,i){var g,b;this.keyframeResolver=void 0;const{name:r,type:o,velocity:a,delay:c,isHandoff:u,onUpdate:l}=s;this.resolvedAt=X.now();let d=!0;yd(e,r,o,a)||(d=!1,(Mt.instantAnimations||!c)&&(l==null||l($e(e,s,n))),e[0]=e[e.length-1],gn(s),s.repeat=0);const y={startTime:i?this.resolvedAt?this.resolvedAt-this.createdAt>Md?this.resolvedAt:this.createdAt:this.createdAt:void 0,finalKeyframe:n,...s,keyframes:e},m=d&&!u&&xd(y),v=(b=(g=y.motionValue)==null?void 0:g.owner)==null?void 0:b.current;let k;if(m)try{k=new fd({...y,element:v})}catch{k=new ee(y)}else k=new ee(y);k.finished.then(()=>{this.notifyFinished()}).catch(tt),this.pendingTimeline&&(this.stopTimeline=k.attachTimeline(this.pendingTimeline),this.pendingTimeline=void 0),this._animation=k}get finished(){return this._animation?this.animation.finished:this._finished}then(e,n){return this.finished.finally(e).then(()=>{})}get animation(){var e;return this._animation||((e=this.keyframeResolver)==null||e.resume(),rd()),this._animation}get duration(){return this.animation.duration}get iterationDuration(){return this.animation.iterationDuration}get time(){return this.animation.time}set time(e){this.animation.time=e}get speed(){return this.animation.speed}get state(){return this.animation.state}set speed(e){this.animation.speed=e}get startTime(){return this.animation.startTime}attachTimeline(e){return this._animation?this.stopTimeline=this.animation.attachTimeline(e):this.pendingTimeline=e,()=>this.stop()}play(){this.animation.play()}pause(){this.animation.pause()}complete(){this.animation.complete()}cancel(){var e;this._animation&&this.animation.cancel(),(e=this.keyframeResolver)==null||e.cancel()}}function Ro(t,e,n,s=0,i=1){const r=Array.from(t).sort((u,l)=>u.sortNodePosition(l)).indexOf(e),o=t.size,a=(o-1)*s;return typeof n=="function"?n(r,o):i===1?r*s:a-r*s}const bd=/^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;function _d(t){const e=bd.exec(t);if(!e)return[,];const[,n,s,i]=e;return[`--${n??s}`,i]}function Lo(t,e,n=1){const[s,i]=_d(t);if(!s)return;const r=window.getComputedStyle(e).getPropertyValue(s);if(r){const o=r.trim();return Yi(o)?parseFloat(o):o}return Bn(i)?Lo(i,e,n+1):i}const Td={type:"spring",stiffness:500,damping:25,restSpeed:10},Ad=t=>({type:"spring",stiffness:550,damping:t===0?2*Math.sqrt(550):30,restSpeed:10}),Sd={type:"keyframes",duration:.8},Cd={type:"keyframes",ease:[.25,.1,.35,1],duration:.3},Pd=(t,{keyframes:e})=>e.length>2?Sd:zt.has(t)?t.startsWith("scale")?Ad(e[1]):Td:Cd;function $o(t,e){if(t!=null&&t.inherit&&e){const{inherit:n,...s}=t;return{...e,...s}}return t}function Xn(t,e){const n=(t==null?void 0:t[e])??(t==null?void 0:t.default)??t;return n!==t?$o(n,t):n}const Vd=new Set(["when","delay","delayChildren","staggerChildren","staggerDirection","repeat","repeatType","repeatDelay","from","elapsed"]);function Ed(t){for(const e in t)if(!Vd.has(e))return!0;return!1}const Zn=(t,e,n,s={},i,r)=>o=>{const a=Xn(s,t)||{},c=a.delay||s.delay||0;let{elapsed:u=0}=s;u=u-et(c);const l={keyframes:Array.isArray(n)?n:[null,n],ease:"easeOut",velocity:e.getVelocity(),...a,delay:-u,onUpdate:f=>{e.set(f),a.onUpdate&&a.onUpdate(f)},onComplete:()=>{o(),a.onComplete&&a.onComplete()},name:t,motionValue:e,element:r?void 0:i};Ed(a)||Object.assign(l,Pd(t,l)),l.duration&&(l.duration=et(l.duration)),l.repeatDelay&&(l.repeatDelay=et(l.repeatDelay)),l.from!==void 0&&(l.keyframes[0]=l.from);let d=!1;if((l.type===!1||l.duration===0&&!l.repeatDelay)&&(gn(l),l.delay===0&&(d=!0)),(Mt.instantAnimations||Mt.skipAnimations||i!=null&&i.shouldSkipAnimations)&&(d=!0,gn(l),l.delay=0),l.allowFlatten=!a.type&&!a.ease,d&&!r&&e.get()!==void 0){const f=$e(l.keyframes,a);if(f!==void 0){L.update(()=>{l.onUpdate(f),l.onComplete()});return}}return a.isSync?new ee(l):new wd(l)};function Ns(t){const e=[{},{}];return t==null||t.values.forEach((n,s)=>{e[0][s]=n.get(),e[1][s]=n.getVelocity()}),e}function Jn(t,e,n,s){if(typeof e=="function"){const[i,r]=Ns(s);e=e(n!==void 0?n:t.custom,i,r)}if(typeof e=="string"&&(e=t.variants&&t.variants[e]),typeof e=="function"){const[i,r]=Ns(s);e=e(n!==void 0?n:t.custom,i,r)}return e}function Ct(t,e,n){const s=t.getProps();return Jn(s,e,n!==void 0?n:s.custom,t)}const Do=new Set(["width","height","top","left","right","bottom",...jt]),Rs=30,Nd=t=>!isNaN(parseFloat(t)),Gt={current:void 0};class Rd{constructor(e,n={}){this.canTrackVelocity=null,this.events={},this.updateAndNotify=s=>{var r;const i=X.now();if(this.updatedAt!==i&&this.setPrevFrameValue(),this.prev=this.current,this.setCurrent(s),this.current!==this.prev&&((r=this.events.change)==null||r.notify(this.current),this.dependents))for(const o of this.dependents)o.dirty()},this.hasAnimated=!1,this.setCurrent(e),this.owner=n.owner}setCurrent(e){this.current=e,this.updatedAt=X.now(),this.canTrackVelocity===null&&e!==void 0&&(this.canTrackVelocity=Nd(this.current))}setPrevFrameValue(e=this.current){this.prevFrameValue=e,this.prevUpdatedAt=this.updatedAt}onChange(e){return this.on("change",e)}on(e,n){this.events[e]||(this.events[e]=new Dn);const s=this.events[e].add(n);return e==="change"?()=>{s(),L.read(()=>{this.events.change.getSize()||this.stop()})}:s}clearListeners(){for(const e in this.events)this.events[e].clear()}attach(e,n){this.passiveEffect=e,this.stopPassiveEffect=n}set(e){this.passiveEffect?this.passiveEffect(e,this.updateAndNotify):this.updateAndNotify(e)}setWithVelocity(e,n,s){this.set(n),this.prev=void 0,this.prevFrameValue=e,this.prevUpdatedAt=this.updatedAt-s}jump(e,n=!0){this.updateAndNotify(e),this.prev=e,this.prevUpdatedAt=this.prevFrameValue=void 0,n&&this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}dirty(){var e;(e=this.events.change)==null||e.notify(this.current)}addDependent(e){this.dependents||(this.dependents=new Set),this.dependents.add(e)}removeDependent(e){this.dependents&&this.dependents.delete(e)}get(){return Gt.current&&Gt.current.push(this),this.current}getPrevious(){return this.prev}getVelocity(){const e=X.now();if(!this.canTrackVelocity||this.prevFrameValue===void 0||e-this.updatedAt>Rs)return 0;const n=Math.min(this.updatedAt-this.prevUpdatedAt,Rs);return jn(parseFloat(this.current)-parseFloat(this.prevFrameValue),n)}start(e){return this.stop(),new Promise(n=>{this.hasAnimated=!0,this.animation=e(n),this.events.animationStart&&this.events.animationStart.notify()}).then(()=>{this.events.animationComplete&&this.events.animationComplete.notify(),this.clearAnimation()})}stop(){this.animation&&(this.animation.stop(),this.events.animationCancel&&this.events.animationCancel.notify()),this.clearAnimation()}isAnimating(){return!!this.animation}clearAnimation(){delete this.animation}destroy(){var e,n;(e=this.dependents)==null||e.clear(),(n=this.events.destroy)==null||n.notify(),this.clearListeners(),this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}}function lt(t,e){return new Rd(t,e)}const kn=t=>Array.isArray(t);function Ld(t,e,n){t.hasValue(e)?t.getValue(e).set(n):t.addValue(e,lt(n))}function $d(t){return kn(t)?t[t.length-1]||0:t}function Qn(t,e){const n=Ct(t,e);let{transitionEnd:s={},transition:i={},...r}=n||{};r={...r,...s};for(const o in r){const a=$d(r[o]);Ld(t,o,a)}}const F=t=>!!(t&&t.getVelocity);function Dd(t){return!!(F(t)&&t.add)}function vn(t,e){const n=t.getValue("willChange");if(Dd(n))return n.add(e);if(!n&&Mt.WillChange){const s=new Mt.WillChange("auto");t.addValue("willChange",s),s.add(e)}}function ts(t){return t.replace(/([A-Z])/g,e=>`-${e.toLowerCase()}`)}const jd="framerAppearId",jo="data-"+ts(jd);function zo(t){return t.props[jo]}function zd({protectedKeys:t,needsAnimating:e},n){const s=t.hasOwnProperty(n)&&e[n]!==!0;return e[n]=!1,s}function Io(t,e,{delay:n=0,transitionOverride:s,type:i}={}){let{transition:r,transitionEnd:o,...a}=e;const c=t.getDefaultTransition();r=r?$o(r,c):c;const u=r==null?void 0:r.reduceMotion;s&&(r=s);const l=[],d=i&&t.animationState&&t.animationState.getState()[i];for(const f in a){const y=t.getValue(f,t.latestValues[f]??null),m=a[f];if(m===void 0||d&&zd(d,f))continue;const v={delay:n,...Xn(r||{},f)},k=y.get();if(k!==void 0&&!y.isAnimating()&&!Array.isArray(m)&&m===k&&!v.velocity){L.update(()=>y.set(m));continue}let g=!1;if(window.MotionHandoffAnimation){const _=zo(t);if(_){const A=window.MotionHandoffAnimation(_,f,L);A!==null&&(v.startTime=A,g=!0)}}vn(t,f);const b=u??t.shouldReduceMotion;y.start(Zn(f,y,m,b&&Do.has(f)?{type:!1}:v,t,g));const x=y.animation;x&&l.push(x)}if(o){const f=()=>L.update(()=>{o&&Qn(t,o)});l.length?Promise.all(l).then(f):f()}return l}function xn(t,e,n={}){var c;const s=Ct(t,e,n.type==="exit"?(c=t.presenceContext)==null?void 0:c.custom:void 0);let{transition:i=t.getDefaultTransition()||{}}=s||{};n.transitionOverride&&(i=n.transitionOverride);const r=s?()=>Promise.all(Io(t,s,n)):()=>Promise.resolve(),o=t.variantChildren&&t.variantChildren.size?(u=0)=>{const{delayChildren:l=0,staggerChildren:d,staggerDirection:f}=i;return Id(t,e,u,l,d,f,n)}:()=>Promise.resolve(),{when:a}=i;if(a){const[u,l]=a==="beforeChildren"?[r,o]:[o,r];return u().then(()=>l())}else return Promise.all([r(),o(n.delay)])}function Id(t,e,n=0,s=0,i=0,r=1,o){const a=[];for(const c of t.variantChildren)c.notify("AnimationStart",e),a.push(xn(c,e,{...o,delay:n+(typeof s=="function"?0:s)+Ro(t.variantChildren,c,s,i,r)}).then(()=>c.notify("AnimationComplete",e)));return Promise.all(a)}function Bo(t,e,n={}){t.notify("AnimationStart",e);let s;if(Array.isArray(e)){const i=e.map(r=>xn(t,r,n));s=Promise.all(i)}else if(typeof e=="string")s=xn(t,e,n);else{const i=typeof e=="function"?Ct(t,e,n.custom):e;s=Promise.all(Io(t,i,n))}return s.then(()=>{t.notify("AnimationComplete",e)})}const Bd={test:t=>t==="auto",parse:t=>t},Oo=t=>e=>e.test(t),Ho=[Dt,T,mt,kt,gh,mh,Bd],Ls=t=>Ho.find(Oo(t));function Od(t){return typeof t=="number"?t===0:t!==null?t==="none"||t==="0"||Zi(t):!0}const Hd=new Set(["brightness","contrast","saturate","opacity"]);function Fd(t){const[e,n]=t.slice(0,-1).split("(");if(e==="drop-shadow")return t;const[s]=n.match(On)||[];if(!s)return t;const i=n.replace(s,"");let r=Hd.has(e)?1:0;return s!==n&&(r*=100),e+"("+r+i+")"}const qd=/\b([a-z-]*)\(.*?\)/gu,Mn={...ut,getAnimatableNone:t=>{const e=t.match(qd);return e?e.map(Fd).join(" "):t}},wn={...ut,getAnimatableNone:t=>{const e=ut.parse(t);return ut.createTransformer(t)(e.map(s=>typeof s=="number"?0:typeof s=="object"?{...s,alpha:1}:s))}},$s={...Dt,transform:Math.round},Wd={rotate:kt,rotateX:kt,rotateY:kt,rotateZ:kt,scale:he,scaleX:he,scaleY:he,scaleZ:he,skew:kt,skewX:kt,skewY:kt,distance:T,translateX:T,translateY:T,translateZ:T,x:T,y:T,z:T,perspective:T,transformPerspective:T,opacity:te,originX:Ms,originY:Ms,originZ:T},es={borderWidth:T,borderTopWidth:T,borderRightWidth:T,borderBottomWidth:T,borderLeftWidth:T,borderRadius:T,borderTopLeftRadius:T,borderTopRightRadius:T,borderBottomRightRadius:T,borderBottomLeftRadius:T,width:T,maxWidth:T,height:T,maxHeight:T,top:T,right:T,bottom:T,left:T,inset:T,insetBlock:T,insetBlockStart:T,insetBlockEnd:T,insetInline:T,insetInlineStart:T,insetInlineEnd:T,padding:T,paddingTop:T,paddingRight:T,paddingBottom:T,paddingLeft:T,paddingBlock:T,paddingBlockStart:T,paddingBlockEnd:T,paddingInline:T,paddingInlineStart:T,paddingInlineEnd:T,margin:T,marginTop:T,marginRight:T,marginBottom:T,marginLeft:T,marginBlock:T,marginBlockStart:T,marginBlockEnd:T,marginInline:T,marginInlineStart:T,marginInlineEnd:T,fontSize:T,backgroundPositionX:T,backgroundPositionY:T,...Wd,zIndex:$s,fillOpacity:te,strokeOpacity:te,numOctaves:$s},Ud={...es,color:H,backgroundColor:H,outlineColor:H,fill:H,stroke:H,borderColor:H,borderTopColor:H,borderRightColor:H,borderBottomColor:H,borderLeftColor:H,filter:Mn,WebkitFilter:Mn,mask:wn,WebkitMask:wn},Fo=t=>Ud[t],Gd=new Set([Mn,wn]);function qo(t,e){let n=Fo(t);return Gd.has(n)||(n=ut),n.getAnimatableNone?n.getAnimatableNone(e):void 0}const Kd=new Set(["auto","none","0"]);function Yd(t,e,n){let s=0,i;for(;s<t.length&&!i;){const r=t[s];typeof r=="string"&&!Kd.has(r)&&$t(r).values.length&&(i=t[s]),s++}if(i&&n)for(const r of e)t[r]=qo(n,i)}class Xd extends Gn{constructor(e,n,s,i,r){super(e,n,s,i,r,!0)}readKeyframes(){const{unresolvedKeyframes:e,element:n,name:s}=this;if(!n||!n.current)return;super.readKeyframes();for(let l=0;l<e.length;l++){let d=e[l];if(typeof d=="string"&&(d=d.trim(),Bn(d))){const f=Lo(d,n.current);f!==void 0&&(e[l]=f),l===e.length-1&&(this.finalKeyframe=d)}}if(this.resolveNoneKeyframes(),!Do.has(s)||e.length!==2)return;const[i,r]=e,o=Ls(i),a=Ls(r),c=xs(i),u=xs(r);if(c!==u&&xt[s]){this.needsMeasurement=!0;return}if(o!==a)if(Ps(o)&&Ps(a))for(let l=0;l<e.length;l++){const d=e[l];typeof d=="string"&&(e[l]=parseFloat(d))}else xt[s]&&(this.needsMeasurement=!0)}resolveNoneKeyframes(){const{unresolvedKeyframes:e,name:n}=this,s=[];for(let i=0;i<e.length;i++)(e[i]===null||Od(e[i]))&&s.push(i);s.length&&Yd(e,s,n)}measureInitialState(){const{element:e,unresolvedKeyframes:n,name:s}=this;if(!e||!e.current)return;s==="height"&&(this.suspendedScrollY=window.pageYOffset),this.measuredOrigin=xt[s](e.measureViewportBox(),window.getComputedStyle(e.current)),n[0]=this.measuredOrigin;const i=n[n.length-1];i!==void 0&&e.getValue(s,i).jump(i,!1)}measureEndState(){var a;const{element:e,name:n,unresolvedKeyframes:s}=this;if(!e||!e.current)return;const i=e.getValue(n);i&&i.jump(this.measuredOrigin,!1);const r=s.length-1,o=s[r];s[r]=xt[n](e.measureViewportBox(),window.getComputedStyle(e.current)),o!==null&&this.finalKeyframe===void 0&&(this.finalKeyframe=o),(a=this.removedTransforms)!=null&&a.length&&this.removedTransforms.forEach(([c,u])=>{e.getValue(c).set(u)}),this.resolveNoneKeyframes()}}function Wo(t,e,n){if(t==null)return[];if(t instanceof EventTarget)return[t];if(typeof t=="string"){const i=document.querySelectorAll(t);return i?Array.from(i):[]}return Array.from(t).filter(s=>s!=null)}const Uo=(t,e)=>e&&typeof t=="number"?e.transform(t):t;function Kt(t){return Xi(t)&&"offsetHeight"in t&&!("ownerSVGElement"in t)}const{schedule:ns}=lo(queueMicrotask,!1),ct={x:!1,y:!1};function Go(){return ct.x||ct.y}function Zd(t){return t==="x"||t==="y"?ct[t]?null:(ct[t]=!0,()=>{ct[t]=!1}):ct.x||ct.y?null:(ct.x=ct.y=!0,()=>{ct.x=ct.y=!1})}function Ko(t,e){const n=Wo(t),s=new AbortController,i={passive:!0,...e,signal:s.signal};return[n,i,()=>s.abort()]}function Jd(t){return!(t.pointerType==="touch"||Go())}function Qd(t,e,n={}){const[s,i,r]=Ko(t,n);return s.forEach(o=>{let a=!1,c=!1,u;const l=()=>{o.removeEventListener("pointerleave",m)},d=k=>{u&&(u(k),u=void 0),l()},f=k=>{a=!1,window.removeEventListener("pointerup",f),window.removeEventListener("pointercancel",f),c&&(c=!1,d(k))},y=()=>{a=!0,window.addEventListener("pointerup",f,i),window.addEventListener("pointercancel",f,i)},m=k=>{if(k.pointerType!=="touch"){if(a){c=!0;return}d(k)}},v=k=>{if(!Jd(k))return;c=!1;const g=e(o,k);typeof g=="function"&&(u=g,o.addEventListener("pointerleave",m,i))};o.addEventListener("pointerenter",v,i),o.addEventListener("pointerdown",y,i)}),r}const Yo=(t,e)=>e?t===e?!0:Yo(t,e.parentElement):!1,ss=t=>t.pointerType==="mouse"?typeof t.button!="number"||t.button<=0:t.isPrimary!==!1,t0=new Set(["BUTTON","INPUT","SELECT","TEXTAREA","A"]);function e0(t){return t0.has(t.tagName)||t.isContentEditable===!0}const n0=new Set(["INPUT","SELECT","TEXTAREA"]);function s0(t){return n0.has(t.tagName)||t.isContentEditable===!0}const ve=new WeakSet;function Ds(t){return e=>{e.key==="Enter"&&t(e)}}function Ge(t,e){t.dispatchEvent(new PointerEvent("pointer"+e,{isPrimary:!0,bubbles:!0}))}const i0=(t,e)=>{const n=t.currentTarget;if(!n)return;const s=Ds(()=>{if(ve.has(n))return;Ge(n,"down");const i=Ds(()=>{Ge(n,"up")}),r=()=>Ge(n,"cancel");n.addEventListener("keyup",i,e),n.addEventListener("blur",r,e)});n.addEventListener("keydown",s,e),n.addEventListener("blur",()=>n.removeEventListener("keydown",s),e)};function js(t){return ss(t)&&!Go()}const zs=new WeakSet;function o0(t,e,n={}){const[s,i,r]=Ko(t,n),o=a=>{const c=a.currentTarget;if(!js(a)||zs.has(a))return;ve.add(c),n.stopPropagation&&zs.add(a);const u=e(c,a),l=(y,m)=>{window.removeEventListener("pointerup",d),window.removeEventListener("pointercancel",f),ve.has(c)&&ve.delete(c),js(y)&&typeof u=="function"&&u(y,{success:m})},d=y=>{l(y,c===window||c===document||n.useGlobalTarget||Yo(c,y.target))},f=y=>{l(y,!1)};window.addEventListener("pointerup",d,i),window.addEventListener("pointercancel",f,i)};return s.forEach(a=>{(n.useGlobalTarget?window:a).addEventListener("pointerdown",o,i),Kt(a)&&(a.addEventListener("focus",u=>i0(u,i)),!e0(a)&&!a.hasAttribute("tabindex")&&(a.tabIndex=0))}),r}function is(t){return Xi(t)&&"ownerSVGElement"in t}const xe=new WeakMap;let vt;const Xo=(t,e,n)=>(s,i)=>i&&i[0]?i[0][t+"Size"]:is(s)&&"getBBox"in s?s.getBBox()[e]:s[n],r0=Xo("inline","width","offsetWidth"),a0=Xo("block","height","offsetHeight");function c0({target:t,borderBoxSize:e}){var n;(n=xe.get(t))==null||n.forEach(s=>{s(t,{get width(){return r0(t,e)},get height(){return a0(t,e)}})})}function l0(t){t.forEach(c0)}function u0(){typeof ResizeObserver>"u"||(vt=new ResizeObserver(l0))}function h0(t,e){vt||u0();const n=Wo(t);return n.forEach(s=>{let i=xe.get(s);i||(i=new Set,xe.set(s,i)),i.add(e),vt==null||vt.observe(s)}),()=>{n.forEach(s=>{const i=xe.get(s);i==null||i.delete(e),i!=null&&i.size||vt==null||vt.unobserve(s)})}}const Me=new Set;let Nt;function d0(){Nt=()=>{const t={get width(){return window.innerWidth},get height(){return window.innerHeight}};Me.forEach(e=>e(t))},window.addEventListener("resize",Nt)}function f0(t){return Me.add(t),Nt||d0(),()=>{Me.delete(t),!Me.size&&typeof Nt=="function"&&(window.removeEventListener("resize",Nt),Nt=void 0)}}function bn(t,e){return typeof t=="function"?f0(t):h0(t,e)}function Zo(t,e){let n;const s=()=>{const{currentTime:i}=e,o=(i===null?0:i.value)/100;n!==o&&t(o),n=o};return L.preUpdate(s,!0),()=>ot(s)}function p0(t){return is(t)&&t.tagName==="svg"}function y0(...t){const e=!Array.isArray(t[0]),n=e?0:-1,s=t[0+n],i=t[1+n],r=t[2+n],o=t[3+n],a=Wn(i,r,o);return e?a(s):a}function m0(t,e,n={}){const s=t.get();let i=null,r=s,o;const a=typeof s=="string"?s.replace(/[\d.-]/g,""):void 0,c=()=>{i&&(i.stop(),i=null),t.animation=void 0},u=()=>{const d=Is(t.get()),f=Is(r);if(d===f){c();return}const y=i?i.getGeneratorVelocity():t.getVelocity();c(),i=new ee({keyframes:[d,f],velocity:y,type:"spring",restDelta:.001,restSpeed:.01,...n,onUpdate:o})},l=()=>{var d;u(),t.animation=i??void 0,(d=t.events.animationStart)==null||d.notify(),i==null||i.then(()=>{var f;t.animation=void 0,(f=t.events.animationComplete)==null||f.notify()})};if(t.attach((d,f)=>{r=d,o=y=>f(Ke(y,a)),L.postRender(l)},c),F(e)){let d=n.skipInitialAnimation===!0;const f=e.on("change",m=>{d?(d=!1,t.jump(Ke(m,a),!1)):t.set(Ke(m,a))}),y=t.on("destroy",f);return()=>{f(),y()}}return c}function Ke(t,e){return e?t+e:t}function Is(t){return typeof t=="number"?t:parseFloat(t)}const g0=[...Ho,H,ut],k0=t=>g0.find(Oo(t)),Bs=()=>({translate:0,scale:1,origin:0,originPoint:0}),Rt=()=>({x:Bs(),y:Bs()}),Os=()=>({min:0,max:0}),U=()=>({x:Os(),y:Os()}),v0=new WeakMap;function De(t){return t!==null&&typeof t=="object"&&typeof t.start=="function"}function ne(t){return typeof t=="string"||Array.isArray(t)}const os=["animate","whileInView","whileFocus","whileHover","whileTap","whileDrag","exit"],rs=["initial",...os];function je(t){return De(t.animate)||rs.some(e=>ne(t[e]))}function Jo(t){return!!(je(t)||t.variants)}function x0(t,e,n){for(const s in e){const i=e[s],r=n[s];if(F(i))t.addValue(s,i);else if(F(r))t.addValue(s,lt(i,{owner:t}));else if(r!==i)if(t.hasValue(s)){const o=t.getValue(s);o.liveStyle===!0?o.jump(i):o.hasAnimated||o.set(i)}else{const o=t.getStaticValue(s);t.addValue(s,lt(o!==void 0?o:i,{owner:t}))}}for(const s in n)e[s]===void 0&&t.removeValue(s);return e}const _n={current:null},Qo={current:!1},M0=typeof window<"u";function w0(){if(Qo.current=!0,!!M0)if(window.matchMedia){const t=window.matchMedia("(prefers-reduced-motion)"),e=()=>_n.current=t.matches;t.addEventListener("change",e),e()}else _n.current=!1}const Hs=["AnimationStart","AnimationComplete","Update","BeforeLayoutMeasure","LayoutMeasure","LayoutAnimationStart","LayoutAnimationComplete"];let Pe={};function tr(t){Pe=t}function b0(){return Pe}class _0{scrapeMotionValuesFromProps(e,n,s){return{}}constructor({parent:e,props:n,presenceContext:s,reducedMotionConfig:i,skipAnimations:r,blockInitialAnimation:o,visualState:a},c={}){this.current=null,this.children=new Set,this.isVariantNode=!1,this.isControllingVariants=!1,this.shouldReduceMotion=null,this.shouldSkipAnimations=!1,this.values=new Map,this.KeyframeResolver=Gn,this.features={},this.valueSubscriptions=new Map,this.prevMotionValues={},this.hasBeenMounted=!1,this.events={},this.propEventSubscriptions={},this.notifyUpdate=()=>this.notify("Update",this.latestValues),this.render=()=>{this.current&&(this.triggerBuild(),this.renderInstance(this.current,this.renderState,this.props.style,this.projection))},this.renderScheduledAt=0,this.scheduleRender=()=>{const y=X.now();this.renderScheduledAt<y&&(this.renderScheduledAt=y,L.render(this.render,!1,!0))};const{latestValues:u,renderState:l}=a;this.latestValues=u,this.baseTarget={...u},this.initialValues=n.initial?{...u}:{},this.renderState=l,this.parent=e,this.props=n,this.presenceContext=s,this.depth=e?e.depth+1:0,this.reducedMotionConfig=i,this.skipAnimationsConfig=r,this.options=c,this.blockInitialAnimation=!!o,this.isControllingVariants=je(n),this.isVariantNode=Jo(n),this.isVariantNode&&(this.variantChildren=new Set),this.manuallyAnimateOnMount=!!(e&&e.current);const{willChange:d,...f}=this.scrapeMotionValuesFromProps(n,{},this);for(const y in f){const m=f[y];u[y]!==void 0&&F(m)&&m.set(u[y])}}mount(e){var n,s;if(this.hasBeenMounted)for(const i in this.initialValues)(n=this.values.get(i))==null||n.jump(this.initialValues[i]),this.latestValues[i]=this.initialValues[i];this.current=e,v0.set(e,this),this.projection&&!this.projection.instance&&this.projection.mount(e),this.parent&&this.isVariantNode&&!this.isControllingVariants&&(this.removeFromVariantTree=this.parent.addVariantChild(this)),this.values.forEach((i,r)=>this.bindToMotionValue(r,i)),this.reducedMotionConfig==="never"?this.shouldReduceMotion=!1:this.reducedMotionConfig==="always"?this.shouldReduceMotion=!0:(Qo.current||w0(),this.shouldReduceMotion=_n.current),this.shouldSkipAnimations=this.skipAnimationsConfig??!1,(s=this.parent)==null||s.addChild(this),this.update(this.props,this.presenceContext),this.hasBeenMounted=!0}unmount(){var e;this.projection&&this.projection.unmount(),ot(this.notifyUpdate),ot(this.render),this.valueSubscriptions.forEach(n=>n()),this.valueSubscriptions.clear(),this.removeFromVariantTree&&this.removeFromVariantTree(),(e=this.parent)==null||e.removeChild(this);for(const n in this.events)this.events[n].clear();for(const n in this.features){const s=this.features[n];s&&(s.unmount(),s.isMounted=!1)}this.current=null}addChild(e){this.children.add(e),this.enteringChildren??(this.enteringChildren=new Set),this.enteringChildren.add(e)}removeChild(e){this.children.delete(e),this.enteringChildren&&this.enteringChildren.delete(e)}bindToMotionValue(e,n){if(this.valueSubscriptions.has(e)&&this.valueSubscriptions.get(e)(),n.accelerate&&No.has(e)&&this.current instanceof HTMLElement){const{factory:o,keyframes:a,times:c,ease:u,duration:l}=n.accelerate,d=new Vo({element:this.current,name:e,keyframes:a,times:c,ease:u,duration:et(l)}),f=o(d);this.valueSubscriptions.set(e,()=>{f(),d.cancel()});return}const s=zt.has(e);s&&this.onBindTransform&&this.onBindTransform();const i=n.on("change",o=>{this.latestValues[e]=o,this.props.onUpdate&&L.preRender(this.notifyUpdate),s&&this.projection&&(this.projection.isTransformDirty=!0),this.scheduleRender()});let r;typeof window<"u"&&window.MotionCheckAppearSync&&(r=window.MotionCheckAppearSync(this,e,n)),this.valueSubscriptions.set(e,()=>{i(),r&&r(),n.owner&&n.stop()})}sortNodePosition(e){return!this.current||!this.sortInstanceNodePosition||this.type!==e.type?0:this.sortInstanceNodePosition(this.current,e.current)}updateFeatures(){let e="animation";for(e in Pe){const n=Pe[e];if(!n)continue;const{isEnabled:s,Feature:i}=n;if(!this.features[e]&&i&&s(this.props)&&(this.features[e]=new i(this)),this.features[e]){const r=this.features[e];r.isMounted?r.update():(r.mount(),r.isMounted=!0)}}}triggerBuild(){this.build(this.renderState,this.latestValues,this.props)}measureViewportBox(){return this.current?this.measureInstanceViewportBox(this.current,this.props):U()}getStaticValue(e){return this.latestValues[e]}setStaticValue(e,n){this.latestValues[e]=n}update(e,n){(e.transformTemplate||this.props.transformTemplate)&&this.scheduleRender(),this.prevProps=this.props,this.props=e,this.prevPresenceContext=this.presenceContext,this.presenceContext=n;for(let s=0;s<Hs.length;s++){const i=Hs[s];this.propEventSubscriptions[i]&&(this.propEventSubscriptions[i](),delete this.propEventSubscriptions[i]);const r="on"+i,o=e[r];o&&(this.propEventSubscriptions[i]=this.on(i,o))}this.prevMotionValues=x0(this,this.scrapeMotionValuesFromProps(e,this.prevProps||{},this),this.prevMotionValues),this.handleChildMotionValue&&this.handleChildMotionValue()}getProps(){return this.props}getVariant(e){return this.props.variants?this.props.variants[e]:void 0}getDefaultTransition(){return this.props.transition}getTransformPagePoint(){return this.props.transformPagePoint}getClosestVariantNode(){return this.isVariantNode?this:this.parent?this.parent.getClosestVariantNode():void 0}addVariantChild(e){const n=this.getClosestVariantNode();if(n)return n.variantChildren&&n.variantChildren.add(e),()=>n.variantChildren.delete(e)}addValue(e,n){const s=this.values.get(e);n!==s&&(s&&this.removeValue(e),this.bindToMotionValue(e,n),this.values.set(e,n),this.latestValues[e]=n.get())}removeValue(e){this.values.delete(e);const n=this.valueSubscriptions.get(e);n&&(n(),this.valueSubscriptions.delete(e)),delete this.latestValues[e],this.removeValueFromRenderState(e,this.renderState)}hasValue(e){return this.values.has(e)}getValue(e,n){if(this.props.values&&this.props.values[e])return this.props.values[e];let s=this.values.get(e);return s===void 0&&n!==void 0&&(s=lt(n===null?void 0:n,{owner:this}),this.addValue(e,s)),s}readValue(e,n){let s=this.latestValues[e]!==void 0||!this.current?this.latestValues[e]:this.getBaseTargetFromProps(this.props,e)??this.readValueFromInstance(this.current,e,this.options);return s!=null&&(typeof s=="string"&&(Yi(s)||Zi(s))?s=parseFloat(s):!k0(s)&&ut.test(n)&&(s=qo(e,n)),this.setBaseTarget(e,F(s)?s.get():s)),F(s)?s.get():s}setBaseTarget(e,n){this.baseTarget[e]=n}getBaseTarget(e){var r;const{initial:n}=this.props;let s;if(typeof n=="string"||typeof n=="object"){const o=Jn(this.props,n,(r=this.presenceContext)==null?void 0:r.custom);o&&(s=o[e])}if(n&&s!==void 0)return s;const i=this.getBaseTargetFromProps(this.props,e);return i!==void 0&&!F(i)?i:this.initialValues[e]!==void 0&&s===void 0?void 0:this.baseTarget[e]}on(e,n){return this.events[e]||(this.events[e]=new Dn),this.events[e].add(n)}notify(e,...n){this.events[e]&&this.events[e].notify(...n)}scheduleRenderMicrotask(){ns.render(this.render)}}class er extends _0{constructor(){super(...arguments),this.KeyframeResolver=Xd}sortInstanceNodePosition(e,n){return e.compareDocumentPosition(n)&2?1:-1}getBaseTargetFromProps(e,n){const s=e.style;return s?s[n]:void 0}removeValueFromRenderState(e,{vars:n,style:s}){delete n[e],delete s[e]}handleChildMotionValue(){this.childSubscription&&(this.childSubscription(),delete this.childSubscription);const{children:e}=this.props;F(e)&&(this.childSubscription=e.on("change",n=>{this.current&&(this.current.textContent=`${n}`)}))}}class wt{constructor(e){this.isMounted=!1,this.node=e}update(){}}function nr({top:t,left:e,right:n,bottom:s}){return{x:{min:e,max:n},y:{min:t,max:s}}}function T0({x:t,y:e}){return{top:e.min,right:t.max,bottom:e.max,left:t.min}}function A0(t,e){if(!e)return t;const n=e({x:t.left,y:t.top}),s=e({x:t.right,y:t.bottom});return{top:n.y,left:n.x,bottom:s.y,right:s.x}}function Ye(t){return t===void 0||t===1}function Tn({scale:t,scaleX:e,scaleY:n}){return!Ye(t)||!Ye(e)||!Ye(n)}function _t(t){return Tn(t)||sr(t)||t.z||t.rotate||t.rotateX||t.rotateY||t.skewX||t.skewY}function sr(t){return Fs(t.x)||Fs(t.y)}function Fs(t){return t&&t!=="0%"}function Ve(t,e,n){const s=t-n,i=e*s;return n+i}function qs(t,e,n,s,i){return i!==void 0&&(t=Ve(t,i,s)),Ve(t,n,s)+e}function An(t,e=0,n=1,s,i){t.min=qs(t.min,e,n,s,i),t.max=qs(t.max,e,n,s,i)}function ir(t,{x:e,y:n}){An(t.x,e.translate,e.scale,e.originPoint),An(t.y,n.translate,n.scale,n.originPoint)}const Ws=.999999999999,Us=1.0000000000001;function S0(t,e,n,s=!1){var a;const i=n.length;if(!i)return;e.x=e.y=1;let r,o;for(let c=0;c<i;c++){r=n[c],o=r.projectionDelta;const{visualElement:u}=r.options;u&&u.props.style&&u.props.style.display==="contents"||(s&&r.options.layoutScroll&&r.scroll&&r!==r.root&&(yt(t.x,-r.scroll.offset.x),yt(t.y,-r.scroll.offset.y)),o&&(e.x*=o.x.scale,e.y*=o.y.scale,ir(t,o)),s&&_t(r.latestValues)&&we(t,r.latestValues,(a=r.layout)==null?void 0:a.layoutBox))}e.x<Us&&e.x>Ws&&(e.x=1),e.y<Us&&e.y>Ws&&(e.y=1)}function yt(t,e){t.min+=e,t.max+=e}function Gs(t,e,n,s,i=.5){const r=I(t.min,t.max,i);An(t,e,n,r,s)}function Ks(t,e){return typeof t=="string"?parseFloat(t)/100*(e.max-e.min):t}function we(t,e,n){const s=n??t;Gs(t.x,Ks(e.x,s.x),e.scaleX,e.scale,e.originX),Gs(t.y,Ks(e.y,s.y),e.scaleY,e.scale,e.originY)}function or(t,e){return nr(A0(t.getBoundingClientRect(),e))}function C0(t,e,n){const s=or(t,n),{scroll:i}=e;return i&&(yt(s.x,i.offset.x),yt(s.y,i.offset.y)),s}const P0={x:"translateX",y:"translateY",z:"translateZ",transformPerspective:"perspective"},V0=jt.length;function E0(t,e,n){let s="",i=!0;for(let r=0;r<V0;r++){const o=jt[r],a=t[o];if(a===void 0)continue;let c=!0;if(typeof a=="number")c=a===(o.startsWith("scale")?1:0);else{const u=parseFloat(a);c=o.startsWith("scale")?u===1:u===0}if(!c||n){const u=Uo(a,es[o]);if(!c){i=!1;const l=P0[o]||o;s+=`${l}(${u}) `}n&&(e[o]=u)}}return s=s.trim(),n?s=n(e,i?"":s):i&&(s="none"),s}function as(t,e,n){const{style:s,vars:i,transformOrigin:r}=t;let o=!1,a=!1;for(const c in e){const u=e[c];if(zt.has(c)){o=!0;continue}else if(ho(c)){i[c]=u;continue}else{const l=Uo(u,es[c]);c.startsWith("origin")?(a=!0,r[c]=l):s[c]=l}}if(e.transform||(o||n?s.transform=E0(e,t.transform,n):s.transform&&(s.transform="none")),a){const{originX:c="50%",originY:u="50%",originZ:l=0}=r;s.transformOrigin=`${c} ${u} ${l}`}}function rr(t,{style:e,vars:n},s,i){const r=t.style;let o;for(o in e)r[o]=e[o];i==null||i.applyProjectionStyles(r,s);for(o in n)r.setProperty(o,n[o])}function Ys(t,e){return e.max===e.min?0:t/(e.max-e.min)*100}const Ot={correct:(t,e)=>{if(!e.target)return t;if(typeof t=="string")if(T.test(t))t=parseFloat(t);else return t;const n=Ys(t,e.target.x),s=Ys(t,e.target.y);return`${n}% ${s}%`}},N0={correct:(t,{treeScale:e,projectionDelta:n})=>{const s=t,i=ut.parse(t);if(i.length>5)return s;const r=ut.createTransformer(t),o=typeof i[0]!="number"?1:0,a=n.x.scale*e.x,c=n.y.scale*e.y;i[0+o]/=a,i[1+o]/=c;const u=I(a,c,.5);return typeof i[2+o]=="number"&&(i[2+o]/=u),typeof i[3+o]=="number"&&(i[3+o]/=u),r(i)}},Sn={borderRadius:{...Ot,applyTo:["borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius"]},borderTopLeftRadius:Ot,borderTopRightRadius:Ot,borderBottomLeftRadius:Ot,borderBottomRightRadius:Ot,boxShadow:N0};function ar(t,{layout:e,layoutId:n}){return zt.has(t)||t.startsWith("origin")||(e||n!==void 0)&&(!!Sn[t]||t==="opacity")}function cs(t,e,n){var o;const s=t.style,i=e==null?void 0:e.style,r={};if(!s)return r;for(const a in s)(F(s[a])||i&&F(i[a])||ar(a,t)||((o=n==null?void 0:n.getValue(a))==null?void 0:o.liveStyle)!==void 0)&&(r[a]=s[a]);return r}function R0(t){return window.getComputedStyle(t)}class L0 extends er{constructor(){super(...arguments),this.type="html",this.renderInstance=rr}readValueFromInstance(e,n){var s;if(zt.has(n))return(s=this.projection)!=null&&s.isProjecting?dn(n):ed(e,n);{const i=R0(e),r=(ho(n)?i.getPropertyValue(n):i[n])||0;return typeof r=="string"?r.trim():r}}measureInstanceViewportBox(e,{transformPagePoint:n}){return or(e,n)}build(e,n,s){as(e,n,s.transformTemplate)}scrapeMotionValuesFromProps(e,n,s){return cs(e,n,s)}}const $0={offset:"stroke-dashoffset",array:"stroke-dasharray"},D0={offset:"strokeDashoffset",array:"strokeDasharray"};function j0(t,e,n=1,s=0,i=!0){t.pathLength=1;const r=i?$0:D0;t[r.offset]=`${-s}`,t[r.array]=`${e} ${n}`}const z0=["offsetDistance","offsetPath","offsetRotate","offsetAnchor"];function cr(t,{attrX:e,attrY:n,attrScale:s,pathLength:i,pathSpacing:r=1,pathOffset:o=0,...a},c,u,l){if(as(t,a,u),c){t.style.viewBox&&(t.attrs.viewBox=t.style.viewBox);return}t.attrs=t.style,t.style={};const{attrs:d,style:f}=t;d.transform&&(f.transform=d.transform,delete d.transform),(f.transform||d.transformOrigin)&&(f.transformOrigin=d.transformOrigin??"50% 50%",delete d.transformOrigin),f.transform&&(f.transformBox=(l==null?void 0:l.transformBox)??"fill-box",delete d.transformBox);for(const y of z0)d[y]!==void 0&&(f[y]=d[y],delete d[y]);e!==void 0&&(d.x=e),n!==void 0&&(d.y=n),s!==void 0&&(d.scale=s),i!==void 0&&j0(d,i,r,o,!1)}const lr=new Set(["baseFrequency","diffuseConstant","kernelMatrix","kernelUnitLength","keySplines","keyTimes","limitingConeAngle","markerHeight","markerWidth","numOctaves","targetX","targetY","surfaceScale","specularConstant","specularExponent","stdDeviation","tableValues","viewBox","gradientTransform","pathLength","startOffset","textLength","lengthAdjust"]),ur=t=>typeof t=="string"&&t.toLowerCase()==="svg";function I0(t,e,n,s){rr(t,e,void 0,s);for(const i in e.attrs)t.setAttribute(lr.has(i)?i:ts(i),e.attrs[i])}function hr(t,e,n){const s=cs(t,e,n);for(const i in t)if(F(t[i])||F(e[i])){const r=jt.indexOf(i)!==-1?"attr"+i.charAt(0).toUpperCase()+i.substring(1):i;s[r]=t[i]}return s}class B0 extends er{constructor(){super(...arguments),this.type="svg",this.isSVGTag=!1,this.measureInstanceViewportBox=U}getBaseTargetFromProps(e,n){return e[n]}readValueFromInstance(e,n){if(zt.has(n)){const s=Fo(n);return s&&s.default||0}return n=lr.has(n)?n:ts(n),e.getAttribute(n)}scrapeMotionValuesFromProps(e,n,s){return hr(e,n,s)}build(e,n,s){cr(e,n,this.isSVGTag,s.transformTemplate,s.style)}renderInstance(e,n,s,i){I0(e,n,s,i)}mount(e){this.isSVGTag=ur(e.tagName),super.mount(e)}}const O0=rs.length;function dr(t){if(!t)return;if(!t.isControllingVariants){const n=t.parent?dr(t.parent)||{}:{};return t.props.initial!==void 0&&(n.initial=t.props.initial),n}const e={};for(let n=0;n<O0;n++){const s=rs[n],i=t.props[s];(ne(i)||i===!1)&&(e[s]=i)}return e}function fr(t,e){if(!Array.isArray(e))return!1;const n=e.length;if(n!==t.length)return!1;for(let s=0;s<n;s++)if(e[s]!==t[s])return!1;return!0}const H0=[...os].reverse(),F0=os.length;function q0(t){return e=>Promise.all(e.map(({animation:n,options:s})=>Bo(t,n,s)))}function W0(t){let e=q0(t),n=Xs(),s=!0,i=!1;const r=u=>(l,d)=>{var y;const f=Ct(t,d,u==="exit"?(y=t.presenceContext)==null?void 0:y.custom:void 0);if(f){const{transition:m,transitionEnd:v,...k}=f;l={...l,...k,...v}}return l};function o(u){e=u(t)}function a(u){const{props:l}=t,d=dr(t.parent)||{},f=[],y=new Set;let m={},v=1/0;for(let g=0;g<F0;g++){const b=H0[g],x=n[b],_=l[b]!==void 0?l[b]:d[b],A=ne(_),$=b===u?x.isActive:null;$===!1&&(v=g);let C=_===d[b]&&_!==l[b]&&A;if(C&&(s||i)&&t.manuallyAnimateOnMount&&(C=!1),x.protectedKeys={...m},!x.isActive&&$===null||!_&&!x.prevProp||De(_)||typeof _=="boolean")continue;if(b==="exit"&&x.isActive&&$!==!0){x.prevResolvedValues&&(m={...m,...x.prevResolvedValues});continue}const P=U0(x.prevProp,_);let R=P||b===u&&x.isActive&&!C&&A||g>v&&A,S=!1;const j=Array.isArray(_)?_:[_];let q=j.reduce(r(b),{});$===!1&&(q={});const{prevResolvedValues:nt={}}=x,J={...nt,...q},rt=W=>{R=!0,y.has(W)&&(S=!0,y.delete(W)),x.needsAnimating[W]=!0;const Y=t.getValue(W);Y&&(Y.liveStyle=!1)};for(const W in J){const Y=q[W],gt=nt[W];if(m.hasOwnProperty(W))continue;let p=!1;kn(Y)&&kn(gt)?p=!fr(Y,gt):p=Y!==gt,p?Y!=null?rt(W):y.add(W):Y!==void 0&&y.has(W)?rt(W):x.protectedKeys[W]=!0}x.prevProp=_,x.prevResolvedValues=q,x.isActive&&(m={...m,...q}),(s||i)&&t.blockInitialAnimation&&(R=!1);const K=C&&P;R&&(!K||S)&&f.push(...j.map(W=>{const Y={type:b};if(typeof W=="string"&&(s||i)&&!K&&t.manuallyAnimateOnMount&&t.parent){const{parent:gt}=t,p=Ct(gt,W);if(gt.enteringChildren&&p){const{delayChildren:M}=p.transition||{};Y.delay=Ro(gt.enteringChildren,t,M)}}return{animation:W,options:Y}}))}if(y.size){const g={};if(typeof l.initial!="boolean"){const b=Ct(t,Array.isArray(l.initial)?l.initial[0]:l.initial);b&&b.transition&&(g.transition=b.transition)}y.forEach(b=>{const x=t.getBaseTarget(b),_=t.getValue(b);_&&(_.liveStyle=!0),g[b]=x??null}),f.push({animation:g})}let k=!!f.length;return s&&(l.initial===!1||l.initial===l.animate)&&!t.manuallyAnimateOnMount&&(k=!1),s=!1,i=!1,k?e(f):Promise.resolve()}function c(u,l){var f;if(n[u].isActive===l)return Promise.resolve();(f=t.variantChildren)==null||f.forEach(y=>{var m;return(m=y.animationState)==null?void 0:m.setActive(u,l)}),n[u].isActive=l;const d=a(u);for(const y in n)n[y].protectedKeys={};return d}return{animateChanges:a,setActive:c,setAnimateFunction:o,getState:()=>n,reset:()=>{n=Xs(),i=!0}}}function U0(t,e){return typeof e=="string"?e!==t:Array.isArray(e)?!fr(e,t):!1}function bt(t=!1){return{isActive:t,protectedKeys:{},needsAnimating:{},prevResolvedValues:{}}}function Xs(){return{animate:bt(!0),whileInView:bt(),whileHover:bt(),whileTap:bt(),whileDrag:bt(),whileFocus:bt(),exit:bt()}}function Cn(t,e){t.min=e.min,t.max=e.max}function at(t,e){Cn(t.x,e.x),Cn(t.y,e.y)}function Zs(t,e){t.translate=e.translate,t.scale=e.scale,t.originPoint=e.originPoint,t.origin=e.origin}const pr=1e-4,G0=1-pr,K0=1+pr,yr=.01,Y0=0-yr,X0=0+yr;function Z(t){return t.max-t.min}function Z0(t,e,n){return Math.abs(t-e)<=n}function Js(t,e,n,s=.5){t.origin=s,t.originPoint=I(e.min,e.max,t.origin),t.scale=Z(n)/Z(e),t.translate=I(n.min,n.max,t.origin)-t.originPoint,(t.scale>=G0&&t.scale<=K0||isNaN(t.scale))&&(t.scale=1),(t.translate>=Y0&&t.translate<=X0||isNaN(t.translate))&&(t.translate=0)}function Yt(t,e,n,s){Js(t.x,e.x,n.x,s?s.originX:void 0),Js(t.y,e.y,n.y,s?s.originY:void 0)}function Qs(t,e,n,s=0){const i=s?I(n.min,n.max,s):n.min;t.min=i+e.min,t.max=t.min+Z(e)}function J0(t,e,n,s){Qs(t.x,e.x,n.x,s==null?void 0:s.x),Qs(t.y,e.y,n.y,s==null?void 0:s.y)}function ti(t,e,n,s=0){const i=s?I(n.min,n.max,s):n.min;t.min=e.min-i,t.max=t.min+Z(e)}function Ee(t,e,n,s){ti(t.x,e.x,n.x,s==null?void 0:s.x),ti(t.y,e.y,n.y,s==null?void 0:s.y)}function ei(t,e,n,s,i){return t-=e,t=Ve(t,1/n,s),i!==void 0&&(t=Ve(t,1/i,s)),t}function Q0(t,e=0,n=1,s=.5,i,r=t,o=t){if(mt.test(e)&&(e=parseFloat(e),e=I(o.min,o.max,e/100)-o.min),typeof e!="number")return;let a=I(r.min,r.max,s);t===r&&(a-=e),t.min=ei(t.min,e,n,a,i),t.max=ei(t.max,e,n,a,i)}function ni(t,e,[n,s,i],r,o){Q0(t,e[n],e[s],e[i],e.scale,r,o)}const tf=["x","scaleX","originX"],ef=["y","scaleY","originY"];function si(t,e,n,s){ni(t.x,e,tf,n?n.x:void 0,s?s.x:void 0),ni(t.y,e,ef,n?n.y:void 0,s?s.y:void 0)}function ii(t){return t.translate===0&&t.scale===1}function mr(t){return ii(t.x)&&ii(t.y)}function oi(t,e){return t.min===e.min&&t.max===e.max}function nf(t,e){return oi(t.x,e.x)&&oi(t.y,e.y)}function ri(t,e){return Math.round(t.min)===Math.round(e.min)&&Math.round(t.max)===Math.round(e.max)}function gr(t,e){return ri(t.x,e.x)&&ri(t.y,e.y)}function ai(t){return Z(t.x)/Z(t.y)}function ci(t,e){return t.translate===e.translate&&t.scale===e.scale&&t.originPoint===e.originPoint}function pt(t){return[t("x"),t("y")]}function sf(t,e,n){let s="";const i=t.x.translate/e.x,r=t.y.translate/e.y,o=(n==null?void 0:n.z)||0;if((i||r||o)&&(s=`translate3d(${i}px, ${r}px, ${o}px) `),(e.x!==1||e.y!==1)&&(s+=`scale(${1/e.x}, ${1/e.y}) `),n){const{transformPerspective:u,rotate:l,rotateX:d,rotateY:f,skewX:y,skewY:m}=n;u&&(s=`perspective(${u}px) ${s}`),l&&(s+=`rotate(${l}deg) `),d&&(s+=`rotateX(${d}deg) `),f&&(s+=`rotateY(${f}deg) `),y&&(s+=`skewX(${y}deg) `),m&&(s+=`skewY(${m}deg) `)}const a=t.x.scale*e.x,c=t.y.scale*e.y;return(a!==1||c!==1)&&(s+=`scale(${a}, ${c})`),s||"none"}const kr=["borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius"],of=kr.length,li=t=>typeof t=="string"?parseFloat(t):t,ui=t=>typeof t=="number"||T.test(t);function rf(t,e,n,s,i,r){i?(t.opacity=I(0,n.opacity??1,af(s)),t.opacityExit=I(e.opacity??1,0,cf(s))):r&&(t.opacity=I(e.opacity??1,n.opacity??1,s));for(let o=0;o<of;o++){const a=kr[o];let c=hi(e,a),u=hi(n,a);if(c===void 0&&u===void 0)continue;c||(c=0),u||(u=0),c===0||u===0||ui(c)===ui(u)?(t[a]=Math.max(I(li(c),li(u),s),0),(mt.test(u)||mt.test(c))&&(t[a]+="%")):t[a]=u}(e.rotate||n.rotate)&&(t.rotate=I(e.rotate||0,n.rotate||0,s))}function hi(t,e){return t[e]!==void 0?t[e]:t.borderRadius}const af=vr(0,.5,oo),cf=vr(.5,.95,tt);function vr(t,e,n){return s=>s<t?0:s>e?1:n(Lt(t,e,s))}function lf(t,e,n){const s=F(t)?t:lt(t);return s.start(Zn("",s,e,n)),s.animation}function se(t,e,n,s={passive:!0}){return t.addEventListener(e,n,s),()=>t.removeEventListener(e,n)}const uf=(t,e)=>t.depth-e.depth;class hf{constructor(){this.children=[],this.isDirty=!1}add(e){$n(this.children,e),this.isDirty=!0}remove(e){Te(this.children,e),this.isDirty=!0}forEach(e){this.isDirty&&this.children.sort(uf),this.isDirty=!1,this.children.forEach(e)}}function df(t,e){const n=X.now(),s=({timestamp:i})=>{const r=i-n;r>=e&&(ot(s),t(r-e))};return L.setup(s,!0),()=>ot(s)}function be(t){return F(t)?t.get():t}class ff{constructor(){this.members=[]}add(e){$n(this.members,e);for(let n=this.members.length-1;n>=0;n--){const s=this.members[n];if(s===e||s===this.lead||s===this.prevLead)continue;const i=s.instance;(!i||i.isConnected===!1)&&!s.snapshot&&(Te(this.members,s),s.unmount())}e.scheduleRender()}remove(e){if(Te(this.members,e),e===this.prevLead&&(this.prevLead=void 0),e===this.lead){const n=this.members[this.members.length-1];n&&this.promote(n)}}relegate(e){var n;for(let s=this.members.indexOf(e)-1;s>=0;s--){const i=this.members[s];if(i.isPresent!==!1&&((n=i.instance)==null?void 0:n.isConnected)!==!1)return this.promote(i),!0}return!1}promote(e,n){var i;const s=this.lead;if(e!==s&&(this.prevLead=s,this.lead=e,e.show(),s)){s.updateSnapshot(),e.scheduleRender();const{layoutDependency:r}=s.options,{layoutDependency:o}=e.options;(r===void 0||r!==o)&&(e.resumeFrom=s,n&&(s.preserveOpacity=!0),s.snapshot&&(e.snapshot=s.snapshot,e.snapshot.latestValues=s.animationValues||s.latestValues),(i=e.root)!=null&&i.isUpdating&&(e.isLayoutDirty=!0)),e.options.crossfade===!1&&s.hide()}}exitAnimationComplete(){this.members.forEach(e=>{var n,s,i,r,o;(s=(n=e.options).onExitComplete)==null||s.call(n),(o=(i=e.resumingFrom)==null?void 0:(r=i.options).onExitComplete)==null||o.call(r)})}scheduleRender(){this.members.forEach(e=>e.instance&&e.scheduleRender(!1))}removeLeadSnapshot(){var e;(e=this.lead)!=null&&e.snapshot&&(this.lead.snapshot=void 0)}}const _e={hasAnimatedSinceResize:!0,hasEverUpdated:!1},Xe=["","X","Y","Z"],pf=1e3;let yf=0;function Ze(t,e,n,s){const{latestValues:i}=e;i[t]&&(n[t]=i[t],e.setStaticValue(t,0),s&&(s[t]=0))}function xr(t){if(t.hasCheckedOptimisedAppear=!0,t.root===t)return;const{visualElement:e}=t.options;if(!e)return;const n=zo(e);if(window.MotionHasOptimisedAnimation(n,"transform")){const{layout:i,layoutId:r}=t.options;window.MotionCancelOptimisedAnimation(n,"transform",L,!(i||r))}const{parent:s}=t;s&&!s.hasCheckedOptimisedAppear&&xr(s)}function Mr({attachResizeListener:t,defaultParent:e,measureScroll:n,checkIsScrollRoot:s,resetTransform:i}){return class{constructor(o={},a=e==null?void 0:e()){this.id=yf++,this.animationId=0,this.animationCommitId=0,this.children=new Set,this.options={},this.isTreeAnimating=!1,this.isAnimationBlocked=!1,this.isLayoutDirty=!1,this.isProjectionDirty=!1,this.isSharedProjectionDirty=!1,this.isTransformDirty=!1,this.updateManuallyBlocked=!1,this.updateBlockedByResize=!1,this.isUpdating=!1,this.isSVG=!1,this.needsReset=!1,this.shouldResetTransform=!1,this.hasCheckedOptimisedAppear=!1,this.treeScale={x:1,y:1},this.eventHandlers=new Map,this.hasTreeAnimated=!1,this.layoutVersion=0,this.updateScheduled=!1,this.scheduleUpdate=()=>this.update(),this.projectionUpdateScheduled=!1,this.checkUpdateFailed=()=>{this.isUpdating&&(this.isUpdating=!1,this.clearAllSnapshots())},this.updateProjection=()=>{this.projectionUpdateScheduled=!1,this.nodes.forEach(kf),this.nodes.forEach(_f),this.nodes.forEach(Tf),this.nodes.forEach(vf)},this.resolvedRelativeTargetAt=0,this.linkedParentVersion=0,this.hasProjected=!1,this.isVisible=!0,this.animationProgress=0,this.sharedNodes=new Map,this.latestValues=o,this.root=a?a.root||a:this,this.path=a?[...a.path,a]:[],this.parent=a,this.depth=a?a.depth+1:0;for(let c=0;c<this.path.length;c++)this.path[c].shouldResetTransform=!0;this.root===this&&(this.nodes=new hf)}addEventListener(o,a){return this.eventHandlers.has(o)||this.eventHandlers.set(o,new Dn),this.eventHandlers.get(o).add(a)}notifyListeners(o,...a){const c=this.eventHandlers.get(o);c&&c.notify(...a)}hasListeners(o){return this.eventHandlers.has(o)}mount(o){if(this.instance)return;this.isSVG=is(o)&&!p0(o),this.instance=o;const{layoutId:a,layout:c,visualElement:u}=this.options;if(u&&!u.current&&u.mount(o),this.root.nodes.add(this),this.parent&&this.parent.children.add(this),this.root.hasTreeAnimated&&(c||a)&&(this.isLayoutDirty=!0),t){let l,d=0;const f=()=>this.root.updateBlockedByResize=!1;L.read(()=>{d=window.innerWidth}),t(o,()=>{const y=window.innerWidth;y!==d&&(d=y,this.root.updateBlockedByResize=!0,l&&l(),l=df(f,250),_e.hasAnimatedSinceResize&&(_e.hasAnimatedSinceResize=!1,this.nodes.forEach(pi)))})}a&&this.root.registerSharedNode(a,this),this.options.animate!==!1&&u&&(a||c)&&this.addEventListener("didUpdate",({delta:l,hasLayoutChanged:d,hasRelativeLayoutChanged:f,layout:y})=>{if(this.isTreeAnimationBlocked()){this.target=void 0,this.relativeTarget=void 0;return}const m=this.options.transition||u.getDefaultTransition()||Vf,{onLayoutAnimationStart:v,onLayoutAnimationComplete:k}=u.getProps(),g=!this.targetLayout||!gr(this.targetLayout,y),b=!d&&f;if(this.options.layoutRoot||this.resumeFrom||b||d&&(g||!this.currentAnimation)){this.resumeFrom&&(this.resumingFrom=this.resumeFrom,this.resumingFrom.resumingFrom=void 0);const x={...Xn(m,"layout"),onPlay:v,onComplete:k};(u.shouldReduceMotion||this.options.layoutRoot)&&(x.delay=0,x.type=!1),this.startAnimation(x),this.setAnimationOrigin(l,b)}else d||pi(this),this.isLead()&&this.options.onExitComplete&&this.options.onExitComplete();this.targetLayout=y})}unmount(){this.options.layoutId&&this.willUpdate(),this.root.nodes.remove(this);const o=this.getStack();o&&o.remove(this),this.parent&&this.parent.children.delete(this),this.instance=void 0,this.eventHandlers.clear(),ot(this.updateProjection)}blockUpdate(){this.updateManuallyBlocked=!0}unblockUpdate(){this.updateManuallyBlocked=!1}isUpdateBlocked(){return this.updateManuallyBlocked||this.updateBlockedByResize}isTreeAnimationBlocked(){return this.isAnimationBlocked||this.parent&&this.parent.isTreeAnimationBlocked()||!1}startUpdate(){this.isUpdateBlocked()||(this.isUpdating=!0,this.nodes&&this.nodes.forEach(Af),this.animationId++)}getTransformTemplate(){const{visualElement:o}=this.options;return o&&o.getProps().transformTemplate}willUpdate(o=!0){if(this.root.hasTreeAnimated=!0,this.root.isUpdateBlocked()){this.options.onExitComplete&&this.options.onExitComplete();return}if(window.MotionCancelOptimisedAnimation&&!this.hasCheckedOptimisedAppear&&xr(this),!this.root.isUpdating&&this.root.startUpdate(),this.isLayoutDirty)return;this.isLayoutDirty=!0;for(let l=0;l<this.path.length;l++){const d=this.path[l];d.shouldResetTransform=!0,(typeof d.latestValues.x=="string"||typeof d.latestValues.y=="string")&&(d.isLayoutDirty=!0),d.updateScroll("snapshot"),d.options.layoutRoot&&d.willUpdate(!1)}const{layoutId:a,layout:c}=this.options;if(a===void 0&&!c)return;const u=this.getTransformTemplate();this.prevTransformTemplateValue=u?u(this.latestValues,""):void 0,this.updateSnapshot(),o&&this.notifyListeners("willUpdate")}update(){if(this.updateScheduled=!1,this.isUpdateBlocked()){const c=this.updateBlockedByResize;this.unblockUpdate(),this.updateBlockedByResize=!1,this.clearAllSnapshots(),c&&this.nodes.forEach(Mf),this.nodes.forEach(di);return}if(this.animationId<=this.animationCommitId){this.nodes.forEach(fi);return}this.animationCommitId=this.animationId,this.isUpdating?(this.isUpdating=!1,this.nodes.forEach(wf),this.nodes.forEach(bf),this.nodes.forEach(mf),this.nodes.forEach(gf)):this.nodes.forEach(fi),this.clearAllSnapshots();const a=X.now();G.delta=dt(0,1e3/60,a-G.timestamp),G.timestamp=a,G.isProcessing=!0,Oe.update.process(G),Oe.preRender.process(G),Oe.render.process(G),G.isProcessing=!1}didUpdate(){this.updateScheduled||(this.updateScheduled=!0,ns.read(this.scheduleUpdate))}clearAllSnapshots(){this.nodes.forEach(xf),this.sharedNodes.forEach(Sf)}scheduleUpdateProjection(){this.projectionUpdateScheduled||(this.projectionUpdateScheduled=!0,L.preRender(this.updateProjection,!1,!0))}scheduleCheckAfterUnmount(){L.postRender(()=>{this.isLayoutDirty?this.root.didUpdate():this.root.checkUpdateFailed()})}updateSnapshot(){this.snapshot||!this.instance||(this.snapshot=this.measure(),this.snapshot&&!Z(this.snapshot.measuredBox.x)&&!Z(this.snapshot.measuredBox.y)&&(this.snapshot=void 0))}updateLayout(){if(!this.instance||(this.updateScroll(),!(this.options.alwaysMeasureLayout&&this.isLead())&&!this.isLayoutDirty))return;if(this.resumeFrom&&!this.resumeFrom.instance)for(let c=0;c<this.path.length;c++)this.path[c].updateScroll();const o=this.layout;this.layout=this.measure(!1),this.layoutVersion++,this.layoutCorrected||(this.layoutCorrected=U()),this.isLayoutDirty=!1,this.projectionDelta=void 0,this.notifyListeners("measure",this.layout.layoutBox);const{visualElement:a}=this.options;a&&a.notify("LayoutMeasure",this.layout.layoutBox,o?o.layoutBox:void 0)}updateScroll(o="measure"){let a=!!(this.options.layoutScroll&&this.instance);if(this.scroll&&this.scroll.animationId===this.root.animationId&&this.scroll.phase===o&&(a=!1),a&&this.instance){const c=s(this.instance);this.scroll={animationId:this.root.animationId,phase:o,isRoot:c,offset:n(this.instance),wasRoot:this.scroll?this.scroll.isRoot:c}}}resetTransform(){if(!i)return;const o=this.isLayoutDirty||this.shouldResetTransform||this.options.alwaysMeasureLayout,a=this.projectionDelta&&!mr(this.projectionDelta),c=this.getTransformTemplate(),u=c?c(this.latestValues,""):void 0,l=u!==this.prevTransformTemplateValue;o&&this.instance&&(a||_t(this.latestValues)||l)&&(i(this.instance,u),this.shouldResetTransform=!1,this.scheduleRender())}measure(o=!0){const a=this.measurePageBox();let c=this.removeElementScroll(a);return o&&(c=this.removeTransform(c)),Ef(c),{animationId:this.root.animationId,measuredBox:a,layoutBox:c,latestValues:{},source:this.id}}measurePageBox(){var u;const{visualElement:o}=this.options;if(!o)return U();const a=o.measureViewportBox();if(!(((u=this.scroll)==null?void 0:u.wasRoot)||this.path.some(Nf))){const{scroll:l}=this.root;l&&(yt(a.x,l.offset.x),yt(a.y,l.offset.y))}return a}removeElementScroll(o){var c;const a=U();if(at(a,o),(c=this.scroll)!=null&&c.wasRoot)return a;for(let u=0;u<this.path.length;u++){const l=this.path[u],{scroll:d,options:f}=l;l!==this.root&&d&&f.layoutScroll&&(d.wasRoot&&at(a,o),yt(a.x,d.offset.x),yt(a.y,d.offset.y))}return a}applyTransform(o,a=!1,c){var l,d;const u=c||U();at(u,o);for(let f=0;f<this.path.length;f++){const y=this.path[f];!a&&y.options.layoutScroll&&y.scroll&&y!==y.root&&(yt(u.x,-y.scroll.offset.x),yt(u.y,-y.scroll.offset.y)),_t(y.latestValues)&&we(u,y.latestValues,(l=y.layout)==null?void 0:l.layoutBox)}return _t(this.latestValues)&&we(u,this.latestValues,(d=this.layout)==null?void 0:d.layoutBox),u}removeTransform(o){var c;const a=U();at(a,o);for(let u=0;u<this.path.length;u++){const l=this.path[u];if(!_t(l.latestValues))continue;let d;l.instance&&(Tn(l.latestValues)&&l.updateSnapshot(),d=U(),at(d,l.measurePageBox())),si(a,l.latestValues,(c=l.snapshot)==null?void 0:c.layoutBox,d)}return _t(this.latestValues)&&si(a,this.latestValues),a}setTargetDelta(o){this.targetDelta=o,this.root.scheduleUpdateProjection(),this.isProjectionDirty=!0}setOptions(o){this.options={...this.options,...o,crossfade:o.crossfade!==void 0?o.crossfade:!0}}clearMeasurements(){this.scroll=void 0,this.layout=void 0,this.snapshot=void 0,this.prevTransformTemplateValue=void 0,this.targetDelta=void 0,this.target=void 0,this.isLayoutDirty=!1}forceRelativeParentToResolveTarget(){this.relativeParent&&this.relativeParent.resolvedRelativeTargetAt!==G.timestamp&&this.relativeParent.resolveTargetDelta(!0)}resolveTargetDelta(o=!1){var y;const a=this.getLead();this.isProjectionDirty||(this.isProjectionDirty=a.isProjectionDirty),this.isTransformDirty||(this.isTransformDirty=a.isTransformDirty),this.isSharedProjectionDirty||(this.isSharedProjectionDirty=a.isSharedProjectionDirty);const c=!!this.resumingFrom||this!==a;if(!(o||c&&this.isSharedProjectionDirty||this.isProjectionDirty||(y=this.parent)!=null&&y.isProjectionDirty||this.attemptToResolveRelativeTarget||this.root.updateBlockedByResize))return;const{layout:l,layoutId:d}=this.options;if(!this.layout||!(l||d))return;this.resolvedRelativeTargetAt=G.timestamp;const f=this.getClosestProjectingParent();f&&this.linkedParentVersion!==f.layoutVersion&&!f.options.layoutRoot&&this.removeRelativeTarget(),!this.targetDelta&&!this.relativeTarget&&(this.options.layoutAnchor!==!1&&f&&f.layout?this.createRelativeTarget(f,this.layout.layoutBox,f.layout.layoutBox):this.removeRelativeTarget()),!(!this.relativeTarget&&!this.targetDelta)&&(this.target||(this.target=U(),this.targetWithTransforms=U()),this.relativeTarget&&this.relativeTargetOrigin&&this.relativeParent&&this.relativeParent.target?(this.forceRelativeParentToResolveTarget(),J0(this.target,this.relativeTarget,this.relativeParent.target,this.options.layoutAnchor||void 0)):this.targetDelta?(this.resumingFrom?this.applyTransform(this.layout.layoutBox,!1,this.target):at(this.target,this.layout.layoutBox),ir(this.target,this.targetDelta)):at(this.target,this.layout.layoutBox),this.attemptToResolveRelativeTarget&&(this.attemptToResolveRelativeTarget=!1,this.options.layoutAnchor!==!1&&f&&!!f.resumingFrom==!!this.resumingFrom&&!f.options.layoutScroll&&f.target&&this.animationProgress!==1?this.createRelativeTarget(f,this.target,f.target):this.relativeParent=this.relativeTarget=void 0))}getClosestProjectingParent(){if(!(!this.parent||Tn(this.parent.latestValues)||sr(this.parent.latestValues)))return this.parent.isProjecting()?this.parent:this.parent.getClosestProjectingParent()}isProjecting(){return!!((this.relativeTarget||this.targetDelta||this.options.layoutRoot)&&this.layout)}createRelativeTarget(o,a,c){this.relativeParent=o,this.linkedParentVersion=o.layoutVersion,this.forceRelativeParentToResolveTarget(),this.relativeTarget=U(),this.relativeTargetOrigin=U(),Ee(this.relativeTargetOrigin,a,c,this.options.layoutAnchor||void 0),at(this.relativeTarget,this.relativeTargetOrigin)}removeRelativeTarget(){this.relativeParent=this.relativeTarget=void 0}calcProjection(){var m;const o=this.getLead(),a=!!this.resumingFrom||this!==o;let c=!0;if((this.isProjectionDirty||(m=this.parent)!=null&&m.isProjectionDirty)&&(c=!1),a&&(this.isSharedProjectionDirty||this.isTransformDirty)&&(c=!1),this.resolvedRelativeTargetAt===G.timestamp&&(c=!1),c)return;const{layout:u,layoutId:l}=this.options;if(this.isTreeAnimating=!!(this.parent&&this.parent.isTreeAnimating||this.currentAnimation||this.pendingAnimation),this.isTreeAnimating||(this.targetDelta=this.relativeTarget=void 0),!this.layout||!(u||l))return;at(this.layoutCorrected,this.layout.layoutBox);const d=this.treeScale.x,f=this.treeScale.y;S0(this.layoutCorrected,this.treeScale,this.path,a),o.layout&&!o.target&&(this.treeScale.x!==1||this.treeScale.y!==1)&&(o.target=o.layout.layoutBox,o.targetWithTransforms=U());const{target:y}=o;if(!y){this.prevProjectionDelta&&(this.createProjectionDeltas(),this.scheduleRender());return}!this.projectionDelta||!this.prevProjectionDelta?this.createProjectionDeltas():(Zs(this.prevProjectionDelta.x,this.projectionDelta.x),Zs(this.prevProjectionDelta.y,this.projectionDelta.y)),Yt(this.projectionDelta,this.layoutCorrected,y,this.latestValues),(this.treeScale.x!==d||this.treeScale.y!==f||!ci(this.projectionDelta.x,this.prevProjectionDelta.x)||!ci(this.projectionDelta.y,this.prevProjectionDelta.y))&&(this.hasProjected=!0,this.scheduleRender(),this.notifyListeners("projectionUpdate",y))}hide(){this.isVisible=!1}show(){this.isVisible=!0}scheduleRender(o=!0){var a;if((a=this.options.visualElement)==null||a.scheduleRender(),o){const c=this.getStack();c&&c.scheduleRender()}this.resumingFrom&&!this.resumingFrom.instance&&(this.resumingFrom=void 0)}createProjectionDeltas(){this.prevProjectionDelta=Rt(),this.projectionDelta=Rt(),this.projectionDeltaWithTransform=Rt()}setAnimationOrigin(o,a=!1){const c=this.snapshot,u=c?c.latestValues:{},l={...this.latestValues},d=Rt();(!this.relativeParent||!this.relativeParent.options.layoutRoot)&&(this.relativeTarget=this.relativeTargetOrigin=void 0),this.attemptToResolveRelativeTarget=!a;const f=U(),y=c?c.source:void 0,m=this.layout?this.layout.source:void 0,v=y!==m,k=this.getStack(),g=!k||k.members.length<=1,b=!!(v&&!g&&this.options.crossfade===!0&&!this.path.some(Pf));this.animationProgress=0;let x;this.mixTargetDelta=_=>{const A=_/1e3;yi(d.x,o.x,A),yi(d.y,o.y,A),this.setTargetDelta(d),this.relativeTarget&&this.relativeTargetOrigin&&this.layout&&this.relativeParent&&this.relativeParent.layout&&(Ee(f,this.layout.layoutBox,this.relativeParent.layout.layoutBox,this.options.layoutAnchor||void 0),Cf(this.relativeTarget,this.relativeTargetOrigin,f,A),x&&nf(this.relativeTarget,x)&&(this.isProjectionDirty=!1),x||(x=U()),at(x,this.relativeTarget)),v&&(this.animationValues=l,rf(l,u,this.latestValues,A,b,g)),this.root.scheduleUpdateProjection(),this.scheduleRender(),this.animationProgress=A},this.mixTargetDelta(this.options.layoutRoot?1e3:0)}startAnimation(o){var a,c,u;this.notifyListeners("animationStart"),(a=this.currentAnimation)==null||a.stop(),(u=(c=this.resumingFrom)==null?void 0:c.currentAnimation)==null||u.stop(),this.pendingAnimation&&(ot(this.pendingAnimation),this.pendingAnimation=void 0),this.pendingAnimation=L.update(()=>{_e.hasAnimatedSinceResize=!0,this.motionValue||(this.motionValue=lt(0)),this.motionValue.jump(0,!1),this.currentAnimation=lf(this.motionValue,[0,1e3],{...o,velocity:0,isSync:!0,onUpdate:l=>{this.mixTargetDelta(l),o.onUpdate&&o.onUpdate(l)},onStop:()=>{},onComplete:()=>{o.onComplete&&o.onComplete(),this.completeAnimation()}}),this.resumingFrom&&(this.resumingFrom.currentAnimation=this.currentAnimation),this.pendingAnimation=void 0})}completeAnimation(){this.resumingFrom&&(this.resumingFrom.currentAnimation=void 0,this.resumingFrom.preserveOpacity=void 0);const o=this.getStack();o&&o.exitAnimationComplete(),this.resumingFrom=this.currentAnimation=this.animationValues=void 0,this.notifyListeners("animationComplete")}finishAnimation(){this.currentAnimation&&(this.mixTargetDelta&&this.mixTargetDelta(pf),this.currentAnimation.stop()),this.completeAnimation()}applyTransformsToTarget(){const o=this.getLead();let{targetWithTransforms:a,target:c,layout:u,latestValues:l}=o;if(!(!a||!c||!u)){if(this!==o&&this.layout&&u&&wr(this.options.animationType,this.layout.layoutBox,u.layoutBox)){c=this.target||U();const d=Z(this.layout.layoutBox.x);c.x.min=o.target.x.min,c.x.max=c.x.min+d;const f=Z(this.layout.layoutBox.y);c.y.min=o.target.y.min,c.y.max=c.y.min+f}at(a,c),we(a,l),Yt(this.projectionDeltaWithTransform,this.layoutCorrected,a,l)}}registerSharedNode(o,a){this.sharedNodes.has(o)||this.sharedNodes.set(o,new ff),this.sharedNodes.get(o).add(a);const u=a.options.initialPromotionConfig;a.promote({transition:u?u.transition:void 0,preserveFollowOpacity:u&&u.shouldPreserveFollowOpacity?u.shouldPreserveFollowOpacity(a):void 0})}isLead(){const o=this.getStack();return o?o.lead===this:!0}getLead(){var a;const{layoutId:o}=this.options;return o?((a=this.getStack())==null?void 0:a.lead)||this:this}getPrevLead(){var a;const{layoutId:o}=this.options;return o?(a=this.getStack())==null?void 0:a.prevLead:void 0}getStack(){const{layoutId:o}=this.options;if(o)return this.root.sharedNodes.get(o)}promote({needsReset:o,transition:a,preserveFollowOpacity:c}={}){const u=this.getStack();u&&u.promote(this,c),o&&(this.projectionDelta=void 0,this.needsReset=!0),a&&this.setOptions({transition:a})}relegate(){const o=this.getStack();return o?o.relegate(this):!1}resetSkewAndRotation(){const{visualElement:o}=this.options;if(!o)return;let a=!1;const{latestValues:c}=o;if((c.z||c.rotate||c.rotateX||c.rotateY||c.rotateZ||c.skewX||c.skewY)&&(a=!0),!a)return;const u={};c.z&&Ze("z",o,u,this.animationValues);for(let l=0;l<Xe.length;l++)Ze(`rotate${Xe[l]}`,o,u,this.animationValues),Ze(`skew${Xe[l]}`,o,u,this.animationValues);o.render();for(const l in u)o.setStaticValue(l,u[l]),this.animationValues&&(this.animationValues[l]=u[l]);o.scheduleRender()}applyProjectionStyles(o,a){if(!this.instance||this.isSVG)return;if(!this.isVisible){o.visibility="hidden";return}const c=this.getTransformTemplate();if(this.needsReset){this.needsReset=!1,o.visibility="",o.opacity="",o.pointerEvents=be(a==null?void 0:a.pointerEvents)||"",o.transform=c?c(this.latestValues,""):"none";return}const u=this.getLead();if(!this.projectionDelta||!this.layout||!u.target){this.options.layoutId&&(o.opacity=this.latestValues.opacity!==void 0?this.latestValues.opacity:1,o.pointerEvents=be(a==null?void 0:a.pointerEvents)||""),this.hasProjected&&!_t(this.latestValues)&&(o.transform=c?c({},""):"none",this.hasProjected=!1);return}o.visibility="";const l=u.animationValues||u.latestValues;this.applyTransformsToTarget();let d=sf(this.projectionDeltaWithTransform,this.treeScale,l);c&&(d=c(l,d)),o.transform=d;const{x:f,y}=this.projectionDelta;o.transformOrigin=`${f.origin*100}% ${y.origin*100}% 0`,u.animationValues?o.opacity=u===this?l.opacity??this.latestValues.opacity??1:this.preserveOpacity?this.latestValues.opacity:l.opacityExit:o.opacity=u===this?l.opacity!==void 0?l.opacity:"":l.opacityExit!==void 0?l.opacityExit:0;for(const m in Sn){if(l[m]===void 0)continue;const{correct:v,applyTo:k,isCSSVariable:g}=Sn[m],b=d==="none"?l[m]:v(l[m],u);if(k){const x=k.length;for(let _=0;_<x;_++)o[k[_]]=b}else g?this.options.visualElement.renderState.vars[m]=b:o[m]=b}this.options.layoutId&&(o.pointerEvents=u===this?be(a==null?void 0:a.pointerEvents)||"":"none")}clearSnapshot(){this.resumeFrom=this.snapshot=void 0}resetTree(){this.root.nodes.forEach(o=>{var a;return(a=o.currentAnimation)==null?void 0:a.stop()}),this.root.nodes.forEach(di),this.root.sharedNodes.clear()}}}function mf(t){t.updateLayout()}function gf(t){var n;const e=((n=t.resumeFrom)==null?void 0:n.snapshot)||t.snapshot;if(t.isLead()&&t.layout&&e&&t.hasListeners("didUpdate")){const{layoutBox:s,measuredBox:i}=t.layout,{animationType:r}=t.options,o=e.source!==t.layout.source;if(r==="size")pt(d=>{const f=o?e.measuredBox[d]:e.layoutBox[d],y=Z(f);f.min=s[d].min,f.max=f.min+y});else if(r==="x"||r==="y"){const d=r==="x"?"y":"x";Cn(o?e.measuredBox[d]:e.layoutBox[d],s[d])}else wr(r,e.layoutBox,s)&&pt(d=>{const f=o?e.measuredBox[d]:e.layoutBox[d],y=Z(s[d]);f.max=f.min+y,t.relativeTarget&&!t.currentAnimation&&(t.isProjectionDirty=!0,t.relativeTarget[d].max=t.relativeTarget[d].min+y)});const a=Rt();Yt(a,s,e.layoutBox);const c=Rt();o?Yt(c,t.applyTransform(i,!0),e.measuredBox):Yt(c,s,e.layoutBox);const u=!mr(a);let l=!1;if(!t.resumeFrom){const d=t.getClosestProjectingParent();if(d&&!d.resumeFrom){const{snapshot:f,layout:y}=d;if(f&&y){const m=t.options.layoutAnchor||void 0,v=U();Ee(v,e.layoutBox,f.layoutBox,m);const k=U();Ee(k,s,y.layoutBox,m),gr(v,k)||(l=!0),d.options.layoutRoot&&(t.relativeTarget=k,t.relativeTargetOrigin=v,t.relativeParent=d)}}}t.notifyListeners("didUpdate",{layout:s,snapshot:e,delta:c,layoutDelta:a,hasLayoutChanged:u,hasRelativeLayoutChanged:l})}else if(t.isLead()){const{onExitComplete:s}=t.options;s&&s()}t.options.transition=void 0}function kf(t){t.parent&&(t.isProjecting()||(t.isProjectionDirty=t.parent.isProjectionDirty),t.isSharedProjectionDirty||(t.isSharedProjectionDirty=!!(t.isProjectionDirty||t.parent.isProjectionDirty||t.parent.isSharedProjectionDirty)),t.isTransformDirty||(t.isTransformDirty=t.parent.isTransformDirty))}function vf(t){t.isProjectionDirty=t.isSharedProjectionDirty=t.isTransformDirty=!1}function xf(t){t.clearSnapshot()}function di(t){t.clearMeasurements()}function Mf(t){t.isLayoutDirty=!0,t.updateLayout()}function fi(t){t.isLayoutDirty=!1}function wf(t){t.isAnimationBlocked&&t.layout&&!t.isLayoutDirty&&(t.snapshot=t.layout,t.isLayoutDirty=!0)}function bf(t){const{visualElement:e}=t.options;e&&e.getProps().onBeforeLayoutMeasure&&e.notify("BeforeLayoutMeasure"),t.resetTransform()}function pi(t){t.finishAnimation(),t.targetDelta=t.relativeTarget=t.target=void 0,t.isProjectionDirty=!0}function _f(t){t.resolveTargetDelta()}function Tf(t){t.calcProjection()}function Af(t){t.resetSkewAndRotation()}function Sf(t){t.removeLeadSnapshot()}function yi(t,e,n){t.translate=I(e.translate,0,n),t.scale=I(e.scale,1,n),t.origin=e.origin,t.originPoint=e.originPoint}function mi(t,e,n,s){t.min=I(e.min,n.min,s),t.max=I(e.max,n.max,s)}function Cf(t,e,n,s){mi(t.x,e.x,n.x,s),mi(t.y,e.y,n.y,s)}function Pf(t){return t.animationValues&&t.animationValues.opacityExit!==void 0}const Vf={duration:.45,ease:[.4,0,.1,1]},gi=t=>typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().includes(t),ki=gi("applewebkit/")&&!gi("chrome/")?Math.round:tt;function vi(t){t.min=ki(t.min),t.max=ki(t.max)}function Ef(t){vi(t.x),vi(t.y)}function wr(t,e,n){return t==="position"||t==="preserve-aspect"&&!Z0(ai(e),ai(n),.2)}function Nf(t){var e;return t!==t.root&&((e=t.scroll)==null?void 0:e.wasRoot)}const Rf=Mr({attachResizeListener:(t,e)=>se(t,"resize",e),measureScroll:()=>{var t,e;return{x:document.documentElement.scrollLeft||((t=document.body)==null?void 0:t.scrollLeft)||0,y:document.documentElement.scrollTop||((e=document.body)==null?void 0:e.scrollTop)||0}},checkIsScrollRoot:()=>!0}),Je={current:void 0},br=Mr({measureScroll:t=>({x:t.scrollLeft,y:t.scrollTop}),defaultParent:()=>{if(!Je.current){const t=new Rf({});t.mount(window),t.setOptions({layoutScroll:!0}),Je.current=t}return Je.current},resetTransform:(t,e)=>{t.style.transform=e!==void 0?e:"none"},checkIsScrollRoot:t=>window.getComputedStyle(t).position==="fixed"}),ce=w.createContext({transformPagePoint:t=>t,isStatic:!1,reducedMotion:"never"});function xi(t,e){if(typeof t=="function")return t(e);t!=null&&(t.current=e)}function Lf(...t){return e=>{let n=!1;const s=t.map(i=>{const r=xi(i,e);return!n&&typeof r=="function"&&(n=!0),r});if(n)return()=>{for(let i=0;i<s.length;i++){const r=s[i];typeof r=="function"?r():xi(t[i],null)}}}}function $f(...t){return w.useCallback(Lf(...t),t)}class Df extends w.Component{getSnapshotBeforeUpdate(e){const n=this.props.childRef.current;if(Kt(n)&&e.isPresent&&!this.props.isPresent&&this.props.pop!==!1){const s=n.offsetParent,i=Kt(s)&&s.offsetWidth||0,r=Kt(s)&&s.offsetHeight||0,o=getComputedStyle(n),a=this.props.sizeRef.current;a.height=parseFloat(o.height),a.width=parseFloat(o.width),a.top=n.offsetTop,a.left=n.offsetLeft,a.right=i-a.width-a.left,a.bottom=r-a.height-a.top}return null}componentDidUpdate(){}render(){return this.props.children}}function jf({children:t,isPresent:e,anchorX:n,anchorY:s,root:i,pop:r}){var f;const o=w.useId(),a=w.useRef(null),c=w.useRef({width:0,height:0,top:0,left:0,right:0,bottom:0}),{nonce:u}=w.useContext(ce),l=((f=t.props)==null?void 0:f.ref)??(t==null?void 0:t.ref),d=$f(a,l);return w.useInsertionEffect(()=>{const{width:y,height:m,top:v,left:k,right:g,bottom:b}=c.current;if(e||r===!1||!a.current||!y||!m)return;const x=n==="left"?`left: ${k}`:`right: ${g}`,_=s==="bottom"?`bottom: ${b}`:`top: ${v}`;a.current.dataset.motionPopId=o;const A=document.createElement("style");u&&(A.nonce=u);const $=i??document.head;return $.appendChild(A),A.sheet&&A.sheet.insertRule(`
          [data-motion-pop-id="${o}"] {
            position: absolute !important;
            width: ${y}px !important;
            height: ${m}px !important;
            ${x}px !important;
            ${_}px !important;
          }
        `),()=>{var C;(C=a.current)==null||C.removeAttribute("data-motion-pop-id"),$.contains(A)&&$.removeChild(A)}},[e]),it.jsx(Df,{isPresent:e,childRef:a,sizeRef:c,pop:r,children:r===!1?t:w.cloneElement(t,{ref:d})})}const zf=({children:t,initial:e,isPresent:n,onExitComplete:s,custom:i,presenceAffectsLayout:r,mode:o,anchorX:a,anchorY:c,root:u})=>{const l=ht(If),d=w.useId();let f=!0,y=w.useMemo(()=>(f=!1,{id:d,initial:e,isPresent:n,custom:i,onExitComplete:m=>{l.set(m,!0);for(const v of l.values())if(!v)return;s&&s()},register:m=>(l.set(m,!1),()=>l.delete(m))}),[n,l,s]);return r&&f&&(y={...y}),w.useMemo(()=>{l.forEach((m,v)=>l.set(v,!1))},[n]),w.useEffect(()=>{!n&&!l.size&&s&&s()},[n]),t=it.jsx(jf,{pop:o==="popLayout",isPresent:n,anchorX:a,anchorY:c,root:u,children:t}),it.jsx(Le.Provider,{value:y,children:t})};function If(){return new Map}function _r(t=!0){const e=w.useContext(Le);if(e===null)return[!0,null];const{isPresent:n,onExitComplete:s,register:i}=e,r=w.useId();w.useEffect(()=>{if(t)return i(r)},[t]);const o=w.useCallback(()=>t&&s&&s(r),[r,s,t]);return!n&&s?[!1,o]:[!0]}const de=t=>t.key||"";function Mi(t){const e=[];return w.Children.forEach(t,n=>{w.isValidElement(n)&&e.push(n)}),e}const C5=({children:t,custom:e,initial:n=!0,onExitComplete:s,presenceAffectsLayout:i=!0,mode:r="sync",propagate:o=!1,anchorX:a="left",anchorY:c="top",root:u})=>{const[l,d]=_r(o),f=w.useMemo(()=>Mi(t),[t]),y=o&&!l?[]:f.map(de),m=w.useRef(!0),v=w.useRef(f),k=ht(()=>new Map),g=w.useRef(new Set),[b,x]=w.useState(f),[_,A]=w.useState(f);ie(()=>{m.current=!1,v.current=f;for(let P=0;P<_.length;P++){const R=de(_[P]);y.includes(R)?(k.delete(R),g.current.delete(R)):k.get(R)!==!0&&k.set(R,!1)}},[_,y.length,y.join("-")]);const $=[];if(f!==b){let P=[...f];for(let R=0;R<_.length;R++){const S=_[R],j=de(S);y.includes(j)||(P.splice(R,0,S),$.push(S))}return r==="wait"&&$.length&&(P=$),A(Mi(P)),x(f),null}const{forceRender:C}=w.useContext(Ln);return it.jsx(it.Fragment,{children:_.map(P=>{const R=de(P),S=o&&!l?!1:f===_||y.includes(R),j=()=>{if(g.current.has(R))return;if(k.has(R))g.current.add(R),k.set(R,!0);else return;let q=!0;k.forEach(nt=>{nt||(q=!1)}),q&&(C==null||C(),A(v.current),o&&(d==null||d()),s&&s())};return it.jsx(zf,{isPresent:S,initial:!m.current||n?void 0:!1,custom:e,presenceAffectsLayout:i,mode:r,root:u,onExitComplete:S?void 0:j,anchorX:a,anchorY:c,children:P},R)})})},Tr=w.createContext({strict:!1}),wi={animation:["animate","variants","whileHover","whileTap","exit","whileInView","whileFocus","whileDrag"],exit:["exit"],drag:["drag","dragControls"],focus:["whileFocus"],hover:["whileHover","onHoverStart","onHoverEnd"],tap:["whileTap","onTap","onTapStart","onTapCancel"],pan:["onPan","onPanStart","onPanSessionStart","onPanEnd"],inView:["whileInView","onViewportEnter","onViewportLeave"],layout:["layout","layoutId"]};let bi=!1;function Bf(){if(bi)return;const t={};for(const e in wi)t[e]={isEnabled:n=>wi[e].some(s=>!!n[s])};tr(t),bi=!0}function Ar(){return Bf(),b0()}function Of(t){const e=Ar();for(const n in t)e[n]={...e[n],...t[n]};tr(e)}const Hf=new Set(["animate","exit","variants","initial","style","values","variants","transition","transformTemplate","custom","inherit","onBeforeLayoutMeasure","onAnimationStart","onAnimationComplete","onUpdate","onDragStart","onDrag","onDragEnd","onMeasureDragConstraints","onDirectionLock","onDragTransitionEnd","_dragX","_dragY","onHoverStart","onHoverEnd","onViewportEnter","onViewportLeave","globalTapTarget","propagate","ignoreStrict","viewport"]);function Ne(t){return t.startsWith("while")||t.startsWith("drag")&&t!=="draggable"||t.startsWith("layout")||t.startsWith("onTap")||t.startsWith("onPan")||t.startsWith("onLayout")||Hf.has(t)}let Sr=t=>!Ne(t);function Ff(t){typeof t=="function"&&(Sr=e=>e.startsWith("on")?!Ne(e):t(e))}try{Ff(require("@emotion/is-prop-valid").default)}catch{}function qf(t,e,n){const s={};for(const i in t)i==="values"&&typeof t.values=="object"||F(t[i])||(Sr(i)||n===!0&&Ne(i)||!e&&!Ne(i)||t.draggable&&i.startsWith("onDrag"))&&(s[i]=t[i]);return s}const ze=w.createContext({});function Wf(t,e){if(je(t)){const{initial:n,animate:s}=t;return{initial:n===!1||ne(n)?n:void 0,animate:ne(s)?s:void 0}}return t.inherit!==!1?e:{}}function Uf(t){const{initial:e,animate:n}=Wf(t,w.useContext(ze));return w.useMemo(()=>({initial:e,animate:n}),[_i(e),_i(n)])}function _i(t){return Array.isArray(t)?t.join(" "):t}const ls=()=>({style:{},transform:{},transformOrigin:{},vars:{}});function Cr(t,e,n){for(const s in e)!F(e[s])&&!ar(s,n)&&(t[s]=e[s])}function Gf({transformTemplate:t},e){return w.useMemo(()=>{const n=ls();return as(n,e,t),Object.assign({},n.vars,n.style)},[e])}function Kf(t,e){const n=t.style||{},s={};return Cr(s,n,t),Object.assign(s,Gf(t,e)),s}function Yf(t,e){const n={},s=Kf(t,e);return t.drag&&t.dragListener!==!1&&(n.draggable=!1,s.userSelect=s.WebkitUserSelect=s.WebkitTouchCallout="none",s.touchAction=t.drag===!0?"none":`pan-${t.drag==="x"?"y":"x"}`),t.tabIndex===void 0&&(t.onTap||t.onTapStart||t.whileTap)&&(n.tabIndex=0),n.style=s,n}const Pr=()=>({...ls(),attrs:{}});function Xf(t,e,n,s){const i=w.useMemo(()=>{const r=Pr();return cr(r,e,ur(s),t.transformTemplate,t.style),{...r.attrs,style:{...r.style}}},[e]);if(t.style){const r={};Cr(r,t.style,t),i.style={...r,...i.style}}return i}const Zf=["animate","circle","defs","desc","ellipse","g","image","line","filter","marker","mask","metadata","path","pattern","polygon","polyline","rect","stop","switch","symbol","svg","text","tspan","use","view"];function us(t){return typeof t!="string"||t.includes("-")?!1:!!(Zf.indexOf(t)>-1||/[A-Z]/u.test(t))}function Jf(t,e,n,{latestValues:s},i,r=!1,o){const c=(o??us(t)?Xf:Yf)(e,s,i,t),u=qf(e,typeof t=="string",r),l=t!==w.Fragment?{...u,...c,ref:n}:{},{children:d}=e,f=w.useMemo(()=>F(d)?d.get():d,[d]);return w.createElement(t,{...l,children:f})}function Qf({scrapeMotionValuesFromProps:t,createRenderState:e},n,s,i){return{latestValues:t2(n,s,i,t),renderState:e()}}function t2(t,e,n,s){const i={},r=s(t,{});for(const f in r)i[f]=be(r[f]);let{initial:o,animate:a}=t;const c=je(t),u=Jo(t);e&&u&&!c&&t.inherit!==!1&&(o===void 0&&(o=e.initial),a===void 0&&(a=e.animate));let l=n?n.initial===!1:!1;l=l||o===!1;const d=l?a:o;if(d&&typeof d!="boolean"&&!De(d)){const f=Array.isArray(d)?d:[d];for(let y=0;y<f.length;y++){const m=Jn(t,f[y]);if(m){const{transitionEnd:v,transition:k,...g}=m;for(const b in g){let x=g[b];if(Array.isArray(x)){const _=l?x.length-1:0;x=x[_]}x!==null&&(i[b]=x)}for(const b in v)i[b]=v[b]}}}return i}const Vr=t=>(e,n)=>{const s=w.useContext(ze),i=w.useContext(Le),r=()=>Qf(t,e,s,i);return n?r():ht(r)},e2=Vr({scrapeMotionValuesFromProps:cs,createRenderState:ls}),n2=Vr({scrapeMotionValuesFromProps:hr,createRenderState:Pr}),s2=Symbol.for("motionComponentSymbol");function i2(t,e,n){const s=w.useRef(n);w.useInsertionEffect(()=>{s.current=n});const i=w.useRef(null);return w.useCallback(r=>{var a;r&&((a=t.onMount)==null||a.call(t,r));const o=s.current;if(typeof o=="function")if(r){const c=o(r);typeof c=="function"&&(i.current=c)}else i.current?(i.current(),i.current=null):o(r);else o&&(o.current=r);e&&(r?e.mount(r):e.unmount())},[e])}const Er=w.createContext({});function Vt(t){return t&&typeof t=="object"&&Object.prototype.hasOwnProperty.call(t,"current")}function o2(t,e,n,s,i,r){var x,_;const{visualElement:o}=w.useContext(ze),a=w.useContext(Tr),c=w.useContext(Le),u=w.useContext(ce),l=u.reducedMotion,d=u.skipAnimations,f=w.useRef(null),y=w.useRef(!1);s=s||a.renderer,!f.current&&s&&(f.current=s(t,{visualState:e,parent:o,props:n,presenceContext:c,blockInitialAnimation:c?c.initial===!1:!1,reducedMotionConfig:l,skipAnimations:d,isSVG:r}),y.current&&f.current&&(f.current.manuallyAnimateOnMount=!0));const m=f.current,v=w.useContext(Er);m&&!m.projection&&i&&(m.type==="html"||m.type==="svg")&&r2(f.current,n,i,v);const k=w.useRef(!1);w.useInsertionEffect(()=>{m&&k.current&&m.update(n,c)});const g=n[jo],b=w.useRef(!!g&&typeof window<"u"&&!((x=window.MotionHandoffIsComplete)!=null&&x.call(window,g))&&((_=window.MotionHasOptimisedAnimation)==null?void 0:_.call(window,g)));return ie(()=>{y.current=!0,m&&(k.current=!0,window.MotionIsMounted=!0,m.updateFeatures(),m.scheduleRenderMicrotask(),b.current&&m.animationState&&m.animationState.animateChanges())}),w.useEffect(()=>{m&&(!b.current&&m.animationState&&m.animationState.animateChanges(),b.current&&(queueMicrotask(()=>{var A;(A=window.MotionHandoffMarkAsComplete)==null||A.call(window,g)}),b.current=!1),m.enteringChildren=void 0)}),m}function r2(t,e,n,s){const{layoutId:i,layout:r,drag:o,dragConstraints:a,layoutScroll:c,layoutRoot:u,layoutAnchor:l,layoutCrossfade:d}=e;t.projection=new n(t.latestValues,e["data-framer-portal-id"]?void 0:Nr(t.parent)),t.projection.setOptions({layoutId:i,layout:r,alwaysMeasureLayout:!!o||a&&Vt(a),visualElement:t,animationType:typeof r=="string"?r:"both",initialPromotionConfig:s,crossfade:d,layoutScroll:c,layoutRoot:u,layoutAnchor:l})}function Nr(t){if(t)return t.options.allowProjection!==!1?t.projection:Nr(t.parent)}function Qe(t,{forwardMotionProps:e=!1,type:n}={},s,i){s&&Of(s);const r=n?n==="svg":us(t),o=r?n2:e2;function a(u,l){let d;const f={...w.useContext(ce),...u,layoutId:a2(u)},{isStatic:y}=f,m=Uf(u),v=o(u,y);if(!y&&typeof window<"u"){c2();const k=l2(f);d=k.MeasureLayout,m.visualElement=o2(t,v,f,i,k.ProjectionNode,r)}return it.jsxs(ze.Provider,{value:m,children:[d&&m.visualElement?it.jsx(d,{visualElement:m.visualElement,...f}):null,Jf(t,u,i2(v,m.visualElement,l),v,y,e,r)]})}a.displayName=`motion.${typeof t=="string"?t:`create(${t.displayName??t.name??""})`}`;const c=w.forwardRef(a);return c[s2]=t,c}function a2({layoutId:t}){const e=w.useContext(Ln).id;return e&&t!==void 0?e+"-"+t:t}function c2(t,e){w.useContext(Tr).strict}function l2(t){const e=Ar(),{drag:n,layout:s}=e;if(!n&&!s)return{};const i={...n,...s};return{MeasureLayout:n!=null&&n.isEnabled(t)||s!=null&&s.isEnabled(t)?i.MeasureLayout:void 0,ProjectionNode:i.ProjectionNode}}function u2(t,e){if(typeof Proxy>"u")return Qe;const n=new Map,s=(r,o)=>Qe(r,o,t,e),i=(r,o)=>s(r,o);return new Proxy(i,{get:(r,o)=>o==="create"?s:(n.has(o)||n.set(o,Qe(o,void 0,t,e)),n.get(o))})}const h2=(t,e)=>e.isSVG??us(t)?new B0(e):new L0(e,{allowProjection:t!==w.Fragment});class d2 extends wt{constructor(e){super(e),e.animationState||(e.animationState=W0(e))}updateAnimationControlsSubscription(){const{animate:e}=this.node.getProps();De(e)&&(this.unmountControls=e.subscribe(this.node))}mount(){this.updateAnimationControlsSubscription()}update(){const{animate:e}=this.node.getProps(),{animate:n}=this.node.prevProps||{};e!==n&&this.updateAnimationControlsSubscription()}unmount(){var e;this.node.animationState.reset(),(e=this.unmountControls)==null||e.call(this)}}let f2=0;class p2 extends wt{constructor(){super(...arguments),this.id=f2++,this.isExitComplete=!1}update(){var r;if(!this.node.presenceContext)return;const{isPresent:e,onExitComplete:n}=this.node.presenceContext,{isPresent:s}=this.node.prevPresenceContext||{};if(!this.node.animationState||e===s)return;if(e&&s===!1){if(this.isExitComplete){const{initial:o,custom:a}=this.node.getProps();if(typeof o=="string"){const c=Ct(this.node,o,a);if(c){const{transition:u,transitionEnd:l,...d}=c;for(const f in d)(r=this.node.getValue(f))==null||r.jump(d[f])}}this.node.animationState.reset(),this.node.animationState.animateChanges()}else this.node.animationState.setActive("exit",!1);this.isExitComplete=!1;return}const i=this.node.animationState.setActive("exit",!e);n&&!e&&i.then(()=>{this.isExitComplete=!0,n(this.id)})}mount(){const{register:e,onExitComplete:n}=this.node.presenceContext||{};n&&n(this.id),e&&(this.unmount=e(this.id))}unmount(){}}const y2={animation:{Feature:d2},exit:{Feature:p2}};function le(t){return{point:{x:t.pageX,y:t.pageY}}}const m2=t=>e=>ss(e)&&t(e,le(e));function Xt(t,e,n,s){return se(t,e,m2(n),s)}const Rr=({current:t})=>t?t.ownerDocument.defaultView:null,Ti=(t,e)=>Math.abs(t-e);function g2(t,e){const n=Ti(t.x,e.x),s=Ti(t.y,e.y);return Math.sqrt(n**2+s**2)}const Ai=new Set(["auto","scroll"]);class Lr{constructor(e,n,{transformPagePoint:s,contextWindow:i=window,dragSnapToOrigin:r=!1,distanceThreshold:o=3,element:a}={}){if(this.startEvent=null,this.lastMoveEvent=null,this.lastMoveEventInfo=null,this.lastRawMoveEventInfo=null,this.handlers={},this.contextWindow=window,this.scrollPositions=new Map,this.removeScrollListeners=null,this.onElementScroll=y=>{this.handleScroll(y.target)},this.onWindowScroll=()=>{this.handleScroll(window)},this.updatePoint=()=>{if(!(this.lastMoveEvent&&this.lastMoveEventInfo))return;this.lastRawMoveEventInfo&&(this.lastMoveEventInfo=fe(this.lastRawMoveEventInfo,this.transformPagePoint));const y=tn(this.lastMoveEventInfo,this.history),m=this.startEvent!==null,v=g2(y.offset,{x:0,y:0})>=this.distanceThreshold;if(!m&&!v)return;const{point:k}=y,{timestamp:g}=G;this.history.push({...k,timestamp:g});const{onStart:b,onMove:x}=this.handlers;m||(b&&b(this.lastMoveEvent,y),this.startEvent=this.lastMoveEvent),x&&x(this.lastMoveEvent,y)},this.handlePointerMove=(y,m)=>{this.lastMoveEvent=y,this.lastRawMoveEventInfo=m,this.lastMoveEventInfo=fe(m,this.transformPagePoint),L.update(this.updatePoint,!0)},this.handlePointerUp=(y,m)=>{this.end();const{onEnd:v,onSessionEnd:k,resumeAnimation:g}=this.handlers;if((this.dragSnapToOrigin||!this.startEvent)&&g&&g(),!(this.lastMoveEvent&&this.lastMoveEventInfo))return;const b=tn(y.type==="pointercancel"?this.lastMoveEventInfo:fe(m,this.transformPagePoint),this.history);this.startEvent&&v&&v(y,b),k&&k(y,b)},!ss(e))return;this.dragSnapToOrigin=r,this.handlers=n,this.transformPagePoint=s,this.distanceThreshold=o,this.contextWindow=i||window;const c=le(e),u=fe(c,this.transformPagePoint),{point:l}=u,{timestamp:d}=G;this.history=[{...l,timestamp:d}];const{onSessionStart:f}=n;f&&f(e,tn(u,this.history)),this.removeListeners=oe(Xt(this.contextWindow,"pointermove",this.handlePointerMove),Xt(this.contextWindow,"pointerup",this.handlePointerUp),Xt(this.contextWindow,"pointercancel",this.handlePointerUp)),a&&this.startScrollTracking(a)}startScrollTracking(e){let n=e.parentElement;for(;n;){const s=getComputedStyle(n);(Ai.has(s.overflowX)||Ai.has(s.overflowY))&&this.scrollPositions.set(n,{x:n.scrollLeft,y:n.scrollTop}),n=n.parentElement}this.scrollPositions.set(window,{x:window.scrollX,y:window.scrollY}),window.addEventListener("scroll",this.onElementScroll,{capture:!0}),window.addEventListener("scroll",this.onWindowScroll),this.removeScrollListeners=()=>{window.removeEventListener("scroll",this.onElementScroll,{capture:!0}),window.removeEventListener("scroll",this.onWindowScroll)}}handleScroll(e){const n=this.scrollPositions.get(e);if(!n)return;const s=e===window,i=s?{x:window.scrollX,y:window.scrollY}:{x:e.scrollLeft,y:e.scrollTop},r={x:i.x-n.x,y:i.y-n.y};r.x===0&&r.y===0||(s?this.lastMoveEventInfo&&(this.lastMoveEventInfo.point.x+=r.x,this.lastMoveEventInfo.point.y+=r.y):this.history.length>0&&(this.history[0].x-=r.x,this.history[0].y-=r.y),this.scrollPositions.set(e,i),L.update(this.updatePoint,!0))}updateHandlers(e){this.handlers=e}end(){this.removeListeners&&this.removeListeners(),this.removeScrollListeners&&this.removeScrollListeners(),this.scrollPositions.clear(),ot(this.updatePoint)}}function fe(t,e){return e?{point:e(t.point)}:t}function Si(t,e){return{x:t.x-e.x,y:t.y-e.y}}function tn({point:t},e){return{point:t,delta:Si(t,$r(e)),offset:Si(t,k2(e)),velocity:v2(e,.1)}}function k2(t){return t[0]}function $r(t){return t[t.length-1]}function v2(t,e){if(t.length<2)return{x:0,y:0};let n=t.length-1,s=null;const i=$r(t);for(;n>=0&&(s=t[n],!(i.timestamp-s.timestamp>et(e)));)n--;if(!s)return{x:0,y:0};s===t[0]&&t.length>2&&i.timestamp-s.timestamp>et(e)*2&&(s=t[1]);const r=st(i.timestamp-s.timestamp);if(r===0)return{x:0,y:0};const o={x:(i.x-s.x)/r,y:(i.y-s.y)/r};return o.x===1/0&&(o.x=0),o.y===1/0&&(o.y=0),o}function x2(t,{min:e,max:n},s){return e!==void 0&&t<e?t=s?I(e,t,s.min):Math.max(t,e):n!==void 0&&t>n&&(t=s?I(n,t,s.max):Math.min(t,n)),t}function Ci(t,e,n){return{min:e!==void 0?t.min+e:void 0,max:n!==void 0?t.max+n-(t.max-t.min):void 0}}function M2(t,{top:e,left:n,bottom:s,right:i}){return{x:Ci(t.x,n,i),y:Ci(t.y,e,s)}}function Pi(t,e){let n=e.min-t.min,s=e.max-t.max;return e.max-e.min<t.max-t.min&&([n,s]=[s,n]),{min:n,max:s}}function w2(t,e){return{x:Pi(t.x,e.x),y:Pi(t.y,e.y)}}function b2(t,e){let n=.5;const s=Z(t),i=Z(e);return i>s?n=Lt(e.min,e.max-s,t.min):s>i&&(n=Lt(t.min,t.max-i,e.min)),dt(0,1,n)}function _2(t,e){const n={};return e.min!==void 0&&(n.min=e.min-t.min),e.max!==void 0&&(n.max=e.max-t.min),n}const Pn=.35;function T2(t=Pn){return t===!1?t=0:t===!0&&(t=Pn),{x:Vi(t,"left","right"),y:Vi(t,"top","bottom")}}function Vi(t,e,n){return{min:Ei(t,e),max:Ei(t,n)}}function Ei(t,e){return typeof t=="number"?t:t[e]||0}const A2=new WeakMap;class S2{constructor(e){this.openDragLock=null,this.isDragging=!1,this.currentDirection=null,this.originPoint={x:0,y:0},this.constraints=!1,this.hasMutatedConstraints=!1,this.elastic=U(),this.latestPointerEvent=null,this.latestPanInfo=null,this.visualElement=e}start(e,{snapToCursor:n=!1,distanceThreshold:s}={}){const{presenceContext:i}=this.visualElement;if(i&&i.isPresent===!1)return;const r=d=>{n&&this.snapToCursor(le(d).point),this.stopAnimation()},o=(d,f)=>{const{drag:y,dragPropagation:m,onDragStart:v}=this.getProps();if(y&&!m&&(this.openDragLock&&this.openDragLock(),this.openDragLock=Zd(y),!this.openDragLock))return;this.latestPointerEvent=d,this.latestPanInfo=f,this.isDragging=!0,this.currentDirection=null,this.resolveConstraints(),this.visualElement.projection&&(this.visualElement.projection.isAnimationBlocked=!0,this.visualElement.projection.target=void 0),pt(g=>{let b=this.getAxisMotionValue(g).get()||0;if(mt.test(b)){const{projection:x}=this.visualElement;if(x&&x.layout){const _=x.layout.layoutBox[g];_&&(b=Z(_)*(parseFloat(b)/100))}}this.originPoint[g]=b}),v&&L.update(()=>v(d,f),!1,!0),vn(this.visualElement,"transform");const{animationState:k}=this.visualElement;k&&k.setActive("whileDrag",!0)},a=(d,f)=>{this.latestPointerEvent=d,this.latestPanInfo=f;const{dragPropagation:y,dragDirectionLock:m,onDirectionLock:v,onDrag:k}=this.getProps();if(!y&&!this.openDragLock)return;const{offset:g}=f;if(m&&this.currentDirection===null){this.currentDirection=P2(g),this.currentDirection!==null&&v&&v(this.currentDirection);return}this.updateAxis("x",f.point,g),this.updateAxis("y",f.point,g),this.visualElement.render(),k&&L.update(()=>k(d,f),!1,!0)},c=(d,f)=>{this.latestPointerEvent=d,this.latestPanInfo=f,this.stop(d,f),this.latestPointerEvent=null,this.latestPanInfo=null},u=()=>{const{dragSnapToOrigin:d}=this.getProps();(d||this.constraints)&&this.startAnimation({x:0,y:0})},{dragSnapToOrigin:l}=this.getProps();this.panSession=new Lr(e,{onSessionStart:r,onStart:o,onMove:a,onSessionEnd:c,resumeAnimation:u},{transformPagePoint:this.visualElement.getTransformPagePoint(),dragSnapToOrigin:l,distanceThreshold:s,contextWindow:Rr(this.visualElement),element:this.visualElement.current})}stop(e,n){const s=e||this.latestPointerEvent,i=n||this.latestPanInfo,r=this.isDragging;if(this.cancel(),!r||!i||!s)return;const{velocity:o}=i;this.startAnimation(o);const{onDragEnd:a}=this.getProps();a&&L.postRender(()=>a(s,i))}cancel(){this.isDragging=!1;const{projection:e,animationState:n}=this.visualElement;e&&(e.isAnimationBlocked=!1),this.endPanSession();const{dragPropagation:s}=this.getProps();!s&&this.openDragLock&&(this.openDragLock(),this.openDragLock=null),n&&n.setActive("whileDrag",!1)}endPanSession(){this.panSession&&this.panSession.end(),this.panSession=void 0}updateAxis(e,n,s){const{drag:i}=this.getProps();if(!s||!pe(e,i,this.currentDirection))return;const r=this.getAxisMotionValue(e);let o=this.originPoint[e]+s[e];this.constraints&&this.constraints[e]&&(o=x2(o,this.constraints[e],this.elastic[e])),r.set(o)}resolveConstraints(){var r;const{dragConstraints:e,dragElastic:n}=this.getProps(),s=this.visualElement.projection&&!this.visualElement.projection.layout?this.visualElement.projection.measure(!1):(r=this.visualElement.projection)==null?void 0:r.layout,i=this.constraints;e&&Vt(e)?this.constraints||(this.constraints=this.resolveRefConstraints()):e&&s?this.constraints=M2(s.layoutBox,e):this.constraints=!1,this.elastic=T2(n),i!==this.constraints&&!Vt(e)&&s&&this.constraints&&!this.hasMutatedConstraints&&pt(o=>{this.constraints!==!1&&this.getAxisMotionValue(o)&&(this.constraints[o]=_2(s.layoutBox[o],this.constraints[o]))})}resolveRefConstraints(){const{dragConstraints:e,onMeasureDragConstraints:n}=this.getProps();if(!e||!Vt(e))return!1;const s=e.current,{projection:i}=this.visualElement;if(!i||!i.layout)return!1;const r=C0(s,i.root,this.visualElement.getTransformPagePoint());let o=w2(i.layout.layoutBox,r);if(n){const a=n(T0(o));this.hasMutatedConstraints=!!a,a&&(o=nr(a))}return o}startAnimation(e){const{drag:n,dragMomentum:s,dragElastic:i,dragTransition:r,dragSnapToOrigin:o,onDragTransitionEnd:a}=this.getProps(),c=this.constraints||{},u=pt(l=>{if(!pe(l,n,this.currentDirection))return;let d=c&&c[l]||{};(o===!0||o===l)&&(d={min:0,max:0});const f=i?200:1e6,y=i?40:1e7,m={type:"inertia",velocity:s?e[l]:0,bounceStiffness:f,bounceDamping:y,timeConstant:750,restDelta:1,restSpeed:10,...r,...d};return this.startAxisValueAnimation(l,m)});return Promise.all(u).then(a)}startAxisValueAnimation(e,n){const s=this.getAxisMotionValue(e);return vn(this.visualElement,e),s.start(Zn(e,s,0,n,this.visualElement,!1))}stopAnimation(){pt(e=>this.getAxisMotionValue(e).stop())}getAxisMotionValue(e){const n=`_drag${e.toUpperCase()}`,s=this.visualElement.getProps(),i=s[n];return i||this.visualElement.getValue(e,(s.initial?s.initial[e]:void 0)||0)}snapToCursor(e){pt(n=>{const{drag:s}=this.getProps();if(!pe(n,s,this.currentDirection))return;const{projection:i}=this.visualElement,r=this.getAxisMotionValue(n);if(i&&i.layout){const{min:o,max:a}=i.layout.layoutBox[n],c=r.get()||0;r.set(e[n]-I(o,a,.5)+c)}})}scalePositionWithinConstraints(){if(!this.visualElement.current)return;const{drag:e,dragConstraints:n}=this.getProps(),{projection:s}=this.visualElement;if(!Vt(n)||!s||!this.constraints)return;this.stopAnimation();const i={x:0,y:0};pt(o=>{const a=this.getAxisMotionValue(o);if(a&&this.constraints!==!1){const c=a.get();i[o]=b2({min:c,max:c},this.constraints[o])}});const{transformTemplate:r}=this.visualElement.getProps();this.visualElement.current.style.transform=r?r({},""):"none",s.root&&s.root.updateScroll(),s.updateLayout(),this.constraints=!1,this.resolveConstraints(),pt(o=>{if(!pe(o,e,null))return;const a=this.getAxisMotionValue(o),{min:c,max:u}=this.constraints[o];a.set(I(c,u,i[o]))}),this.visualElement.render()}addListeners(){if(!this.visualElement.current)return;A2.set(this.visualElement,this);const e=this.visualElement.current,n=Xt(e,"pointerdown",u=>{const{drag:l,dragListener:d=!0}=this.getProps(),f=u.target,y=f!==e&&s0(f);l&&d&&!y&&this.start(u)});let s;const i=()=>{const{dragConstraints:u}=this.getProps();Vt(u)&&u.current&&(this.constraints=this.resolveRefConstraints(),s||(s=C2(e,u.current,()=>this.scalePositionWithinConstraints())))},{projection:r}=this.visualElement,o=r.addEventListener("measure",i);r&&!r.layout&&(r.root&&r.root.updateScroll(),r.updateLayout()),L.read(i);const a=se(window,"resize",()=>this.scalePositionWithinConstraints()),c=r.addEventListener("didUpdate",(({delta:u,hasLayoutChanged:l})=>{this.isDragging&&l&&(pt(d=>{const f=this.getAxisMotionValue(d);f&&(this.originPoint[d]+=u[d].translate,f.set(f.get()+u[d].translate))}),this.visualElement.render())}));return()=>{a(),n(),o(),c&&c(),s&&s()}}getProps(){const e=this.visualElement.getProps(),{drag:n=!1,dragDirectionLock:s=!1,dragPropagation:i=!1,dragConstraints:r=!1,dragElastic:o=Pn,dragMomentum:a=!0}=e;return{...e,drag:n,dragDirectionLock:s,dragPropagation:i,dragConstraints:r,dragElastic:o,dragMomentum:a}}}function Ni(t){let e=!0;return()=>{if(e){e=!1;return}t()}}function C2(t,e,n){const s=bn(t,Ni(n)),i=bn(e,Ni(n));return()=>{s(),i()}}function pe(t,e,n){return(e===!0||e===t)&&(n===null||n===t)}function P2(t,e=10){let n=null;return Math.abs(t.y)>e?n="y":Math.abs(t.x)>e&&(n="x"),n}class V2 extends wt{constructor(e){super(e),this.removeGroupControls=tt,this.removeListeners=tt,this.controls=new S2(e)}mount(){const{dragControls:e}=this.node.getProps();e&&(this.removeGroupControls=e.subscribe(this.controls)),this.removeListeners=this.controls.addListeners()||tt}update(){const{dragControls:e}=this.node.getProps(),{dragControls:n}=this.node.prevProps||{};e!==n&&(this.removeGroupControls(),e&&(this.removeGroupControls=e.subscribe(this.controls)))}unmount(){this.removeGroupControls(),this.removeListeners(),this.controls.isDragging||this.controls.endPanSession()}}const en=t=>(e,n)=>{t&&L.update(()=>t(e,n),!1,!0)};class E2 extends wt{constructor(){super(...arguments),this.removePointerDownListener=tt}onPointerDown(e){this.session=new Lr(e,this.createPanHandlers(),{transformPagePoint:this.node.getTransformPagePoint(),contextWindow:Rr(this.node)})}createPanHandlers(){const{onPanSessionStart:e,onPanStart:n,onPan:s,onPanEnd:i}=this.node.getProps();return{onSessionStart:en(e),onStart:en(n),onMove:en(s),onEnd:(r,o)=>{delete this.session,i&&L.postRender(()=>i(r,o))}}}mount(){this.removePointerDownListener=Xt(this.node.current,"pointerdown",e=>this.onPointerDown(e))}update(){this.session&&this.session.updateHandlers(this.createPanHandlers())}unmount(){this.removePointerDownListener(),this.session&&this.session.end()}}let nn=!1;class N2 extends w.Component{componentDidMount(){const{visualElement:e,layoutGroup:n,switchLayoutGroup:s,layoutId:i}=this.props,{projection:r}=e;r&&(n.group&&n.group.add(r),s&&s.register&&i&&s.register(r),nn&&r.root.didUpdate(),r.addEventListener("animationComplete",()=>{this.safeToRemove()}),r.setOptions({...r.options,layoutDependency:this.props.layoutDependency,onExitComplete:()=>this.safeToRemove()})),_e.hasEverUpdated=!0}getSnapshotBeforeUpdate(e){const{layoutDependency:n,visualElement:s,drag:i,isPresent:r}=this.props,{projection:o}=s;return o&&(o.isPresent=r,e.layoutDependency!==n&&o.setOptions({...o.options,layoutDependency:n}),nn=!0,i||e.layoutDependency!==n||n===void 0||e.isPresent!==r?o.willUpdate():this.safeToRemove(),e.isPresent!==r&&(r?o.promote():o.relegate()||L.postRender(()=>{const a=o.getStack();(!a||!a.members.length)&&this.safeToRemove()}))),null}componentDidUpdate(){const{visualElement:e,layoutAnchor:n}=this.props,{projection:s}=e;s&&(s.options.layoutAnchor=n,s.root.didUpdate(),ns.postRender(()=>{!s.currentAnimation&&s.isLead()&&this.safeToRemove()}))}componentWillUnmount(){const{visualElement:e,layoutGroup:n,switchLayoutGroup:s}=this.props,{projection:i}=e;nn=!0,i&&(i.scheduleCheckAfterUnmount(),n&&n.group&&n.group.remove(i),s&&s.deregister&&s.deregister(i))}safeToRemove(){const{safeToRemove:e}=this.props;e&&e()}render(){return null}}function Dr(t){const[e,n]=_r(),s=w.useContext(Ln);return it.jsx(N2,{...t,layoutGroup:s,switchLayoutGroup:w.useContext(Er),isPresent:e,safeToRemove:n})}const R2={pan:{Feature:E2},drag:{Feature:V2,ProjectionNode:br,MeasureLayout:Dr}};function Ri(t,e,n){const{props:s}=t;t.animationState&&s.whileHover&&t.animationState.setActive("whileHover",n==="Start");const i="onHover"+n,r=s[i];r&&L.postRender(()=>r(e,le(e)))}class L2 extends wt{mount(){const{current:e}=this.node;e&&(this.unmount=Qd(e,(n,s)=>(Ri(this.node,s,"Start"),i=>Ri(this.node,i,"End"))))}unmount(){}}class $2 extends wt{constructor(){super(...arguments),this.isActive=!1}onFocus(){let e=!1;try{e=this.node.current.matches(":focus-visible")}catch{e=!0}!e||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!0),this.isActive=!0)}onBlur(){!this.isActive||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!1),this.isActive=!1)}mount(){this.unmount=oe(se(this.node.current,"focus",()=>this.onFocus()),se(this.node.current,"blur",()=>this.onBlur()))}unmount(){}}function Li(t,e,n){const{props:s}=t;if(t.current instanceof HTMLButtonElement&&t.current.disabled)return;t.animationState&&s.whileTap&&t.animationState.setActive("whileTap",n==="Start");const i="onTap"+(n==="End"?"":n),r=s[i];r&&L.postRender(()=>r(e,le(e)))}class D2 extends wt{mount(){const{current:e}=this.node;if(!e)return;const{globalTapTarget:n,propagate:s}=this.node.props;this.unmount=o0(e,(i,r)=>(Li(this.node,r,"Start"),(o,{success:a})=>Li(this.node,o,a?"End":"Cancel")),{useGlobalTarget:n,stopPropagation:(s==null?void 0:s.tap)===!1})}unmount(){}}const Vn=new WeakMap,sn=new WeakMap,j2=t=>{const e=Vn.get(t.target);e&&e(t)},z2=t=>{t.forEach(j2)};function I2({root:t,...e}){const n=t||document;sn.has(n)||sn.set(n,{});const s=sn.get(n),i=JSON.stringify(e);return s[i]||(s[i]=new IntersectionObserver(z2,{root:t,...e})),s[i]}function B2(t,e,n){const s=I2(e);return Vn.set(t,n),s.observe(t),()=>{Vn.delete(t),s.unobserve(t)}}const O2={some:0,all:1};class H2 extends wt{constructor(){super(...arguments),this.hasEnteredView=!1,this.isInView=!1}startObserver(){var c;(c=this.stopObserver)==null||c.call(this);const{viewport:e={}}=this.node.getProps(),{root:n,margin:s,amount:i="some",once:r}=e,o={root:n?n.current:void 0,rootMargin:s,threshold:typeof i=="number"?i:O2[i]},a=u=>{const{isIntersecting:l}=u;if(this.isInView===l||(this.isInView=l,r&&!l&&this.hasEnteredView))return;l&&(this.hasEnteredView=!0),this.node.animationState&&this.node.animationState.setActive("whileInView",l);const{onViewportEnter:d,onViewportLeave:f}=this.node.getProps(),y=l?d:f;y&&y(u)};this.stopObserver=B2(this.node.current,o,a)}mount(){this.startObserver()}update(){if(typeof IntersectionObserver>"u")return;const{props:e,prevProps:n}=this.node;["amount","margin","root"].some(F2(e,n))&&this.startObserver()}unmount(){var e;(e=this.stopObserver)==null||e.call(this),this.hasEnteredView=!1,this.isInView=!1}}function F2({viewport:t={}},{viewport:e={}}={}){return n=>t[n]!==e[n]}const q2={inView:{Feature:H2},tap:{Feature:D2},focus:{Feature:$2},hover:{Feature:L2}},W2={layout:{ProjectionNode:br,MeasureLayout:Dr}},U2={...y2,...q2,...R2,...W2},jr=u2(U2,h2);function Re(t){return typeof window>"u"?!1:t?Ao():Yn()}const G2=50,$i=()=>({current:0,offset:[],progress:0,scrollLength:0,targetOffset:0,targetLength:0,containerLength:0,velocity:0}),K2=()=>({time:0,x:$i(),y:$i()}),Y2={x:{length:"Width",position:"Left"},y:{length:"Height",position:"Top"}};function Di(t,e,n,s){const i=n[e],{length:r,position:o}=Y2[e],a=i.current,c=n.time;i.current=Math.abs(t[`scroll${o}`]),i.scrollLength=t[`scroll${r}`]-t[`client${r}`],i.offset.length=0,i.offset[0]=0,i.offset[1]=i.scrollLength,i.progress=Lt(0,i.scrollLength,i.current);const u=s-c;i.velocity=u>G2?0:jn(i.current-a,u)}function X2(t,e,n){Di(t,"x",e,n),Di(t,"y",e,n),e.time=n}function Z2(t,e){const n={x:0,y:0};let s=t;for(;s&&s!==e;)if(Kt(s))n.x+=s.offsetLeft,n.y+=s.offsetTop,s=s.offsetParent;else if(s.tagName==="svg"){const i=s.getBoundingClientRect();s=s.parentElement;const r=s.getBoundingClientRect();n.x+=i.left-r.left,n.y+=i.top-r.top}else if(s instanceof SVGGraphicsElement){const{x:i,y:r}=s.getBBox();n.x+=i,n.y+=r;let o=null,a=s.parentNode;for(;!o;)a.tagName==="svg"&&(o=a),a=s.parentNode;s=o}else break;return n}const En={start:0,center:.5,end:1};function ji(t,e,n=0){let s=0;if(t in En&&(t=En[t]),typeof t=="string"){const i=parseFloat(t);t.endsWith("px")?s=i:t.endsWith("%")?t=i/100:t.endsWith("vw")?s=i/100*document.documentElement.clientWidth:t.endsWith("vh")?s=i/100*document.documentElement.clientHeight:t=i}return typeof t=="number"&&(s=e*t),n+s}const J2=[0,0];function Q2(t,e,n,s){let i=Array.isArray(t)?t:J2,r=0,o=0;return typeof t=="number"?i=[t,t]:typeof t=="string"&&(t=t.trim(),t.includes(" ")?i=t.split(" "):i=[t,En[t]?t:"0"]),r=ji(i[0],n,s),o=ji(i[1],e),r-o}const Ft={Enter:[[0,1],[1,1]],Exit:[[0,0],[1,0]],Any:[[1,0],[0,1]],All:[[0,0],[1,1]]},tp={x:0,y:0};function ep(t){return"getBBox"in t&&t.tagName!=="svg"?t.getBBox():{width:t.clientWidth,height:t.clientHeight}}function np(t,e,n){const{offset:s=Ft.All}=n,{target:i=t,axis:r="y"}=n,o=r==="y"?"height":"width",a=i!==t?Z2(i,t):tp,c=i===t?{width:t.scrollWidth,height:t.scrollHeight}:ep(i),u={width:t.clientWidth,height:t.clientHeight};e[r].offset.length=0;let l=!e[r].interpolate;const d=s.length;for(let f=0;f<d;f++){const y=Q2(s[f],u[o],c[o],a[r]);!l&&y!==e[r].interpolatorOffsets[f]&&(l=!0),e[r].offset[f]=y}l&&(e[r].interpolate=Wn(e[r].offset,Mo(s),{clamp:!1}),e[r].interpolatorOffsets=[...e[r].offset]),e[r].progress=dt(0,1,e[r].interpolate(e[r].current))}function sp(t,e=t,n){if(n.x.targetOffset=0,n.y.targetOffset=0,e!==t){let s=e;for(;s&&s!==t;)n.x.targetOffset+=s.offsetLeft,n.y.targetOffset+=s.offsetTop,s=s.offsetParent}n.x.targetLength=e===t?e.scrollWidth:e.clientWidth,n.y.targetLength=e===t?e.scrollHeight:e.clientHeight,n.x.containerLength=t.clientWidth,n.y.containerLength=t.clientHeight}function ip(t,e,n,s={}){return{measure:i=>{sp(t,s.target,n),X2(t,n,i),(s.offset||s.target)&&np(t,n,s)},notify:()=>e(n)}}const Pt=new WeakMap,zi=new WeakMap,on=new WeakMap,Ii=new WeakMap,ye=new WeakMap,Bi=t=>t===document.scrollingElement?window:t;function zr(t,{container:e=document.scrollingElement,trackContentSize:n=!1,...s}={}){if(!e)return tt;let i=on.get(e);i||(i=new Set,on.set(e,i));const r=K2(),o=ip(e,t,r,s);if(i.add(o),!Pt.has(e)){const c=()=>{for(const f of i)f.measure(G.timestamp);L.preUpdate(u)},u=()=>{for(const f of i)f.notify()},l=()=>L.read(c);Pt.set(e,l);const d=Bi(e);window.addEventListener("resize",l),e!==document.documentElement&&zi.set(e,bn(e,l)),d.addEventListener("scroll",l),l()}if(n&&!ye.has(e)){const c=Pt.get(e),u={width:e.scrollWidth,height:e.scrollHeight};Ii.set(e,u);const l=()=>{const f=e.scrollWidth,y=e.scrollHeight;(u.width!==f||u.height!==y)&&(c(),u.width=f,u.height=y)},d=L.read(l,!0);ye.set(e,d)}const a=Pt.get(e);return L.read(a,!1,!0),()=>{var d;ot(a);const c=on.get(e);if(!c||(c.delete(o),c.size))return;const u=Pt.get(e);Pt.delete(e),u&&(Bi(e).removeEventListener("scroll",u),(d=zi.get(e))==null||d(),window.removeEventListener("resize",u));const l=ye.get(e);l&&(ot(l),ye.delete(e)),Ii.delete(e)}}const op=[[Ft.Enter,"entry"],[Ft.Exit,"exit"],[Ft.Any,"cover"],[Ft.All,"contain"]],Oi={start:0,end:1};function rp(t){const e=t.trim().split(/\s+/);if(e.length!==2)return;const n=Oi[e[0]],s=Oi[e[1]];if(!(n===void 0||s===void 0))return[n,s]}function ap(t){if(t.length!==2)return;const e=[];for(const n of t)if(Array.isArray(n))e.push(n);else if(typeof n=="string"){const s=rp(n);if(!s)return;e.push(s)}else return;return e}function cp(t,e){const n=ap(t);if(!n)return!1;for(let s=0;s<2;s++){const i=n[s],r=e[s];if(i[0]!==r[0]||i[1]!==r[1])return!1}return!0}function hs(t){if(!t)return{rangeStart:"contain 0%",rangeEnd:"contain 100%"};for(const[e,n]of op)if(cp(t,e))return{rangeStart:`${n} 0%`,rangeEnd:`${n} 100%`}}const Hi=new Map;function Fi(t){const e={value:0},n=zr(s=>{e.value=s[t.axis].progress*100},t);return{currentTime:e,cancel:n}}function Ir({source:t,container:e,...n}){const{axis:s}=n;t&&(e=t);let i=Hi.get(e);i||(i=new Map,Hi.set(e,i));const r=n.target??"self";let o=i.get(r);o||(o={},i.set(r,o));const a=s+(n.offset??[]).join(",");return o[a]||(n.target&&Re(n.target)?hs(n.offset)?o[a]=new ViewTimeline({subject:n.target,axis:s}):o[a]=Fi({container:e,...n}):Re()?o[a]=new ScrollTimeline({source:e,axis:s}):o[a]=Fi({container:e,...n})),o[a]}function lp(t,e){const n=Ir(e),s=e.target?hs(e.offset):void 0,i=e.target?Re(e.target)&&!!s:Re();return t.attachTimeline({timeline:i?n:void 0,...s&&i&&{rangeStart:s.rangeStart,rangeEnd:s.rangeEnd},observe:r=>(r.pause(),Zo(o=>{r.time=r.iterationDuration*o},n))})}function up(t){return t.length===2}function hp(t,e){return up(t)?zr(n=>{t(n[e.axis].progress,n)},e):Zo(t,Ir(e))}function Br(t,{axis:e="y",container:n=document.scrollingElement,...s}={}){if(!n)return tt;const i={axis:e,container:n,...s};return typeof t=="function"?hp(t,i):lp(t,i)}const dp=()=>({scrollX:lt(0),scrollY:lt(0),scrollXProgress:lt(0),scrollYProgress:lt(0)}),me=t=>t?!t.current:!1;function qi(t,e,n,s){return{factory:i=>Br(i,{...e,axis:t,container:(n==null?void 0:n.current)||void 0,target:(s==null?void 0:s.current)||void 0}),times:[0,1],keyframes:[0,1],ease:i=>i,duration:1}}function fp(t,e){return typeof window>"u"?!1:t?Ao()&&!!hs(e):Yn()}function P5({container:t,target:e,...n}={}){const s=ht(dp);fp(e,n.offset)&&(s.scrollXProgress.accelerate=qi("x",n,t,e),s.scrollYProgress.accelerate=qi("y",n,t,e));const i=w.useRef(null),r=w.useRef(!1),o=w.useCallback(()=>(i.current=Br((a,{x:c,y:u})=>{s.scrollX.set(c.current),s.scrollXProgress.set(c.progress),s.scrollY.set(u.current),s.scrollYProgress.set(u.progress)},{...n,container:(t==null?void 0:t.current)||void 0,target:(e==null?void 0:e.current)||void 0}),()=>{var a;(a=i.current)==null||a.call(i)}),[t,e,JSON.stringify(n.offset)]);return ie(()=>{if(r.current=!1,me(t)||me(e)){r.current=!0;return}else return o()},[o]),w.useEffect(()=>{if(r.current)return Qt(!me(t)),Qt(!me(e)),o()},[o]),s}function ds(t){const e=ht(()=>lt(t)),{isStatic:n}=w.useContext(ce);if(n){const[,s]=w.useState(t);w.useEffect(()=>e.on("change",s),[])}return e}function Or(t,e){const n=ds(e()),s=()=>n.set(e());return s(),ie(()=>{const i=()=>L.preRender(s,!1,!0),r=t.map(o=>o.on("change",i));return()=>{r.forEach(o=>o()),ot(s)}}),n}function pp(t){Gt.current=[],t();const e=Or(Gt.current,t);return Gt.current=void 0,e}function fs(t,e,n,s){if(typeof t=="function")return pp(t);if(n!==void 0&&!Array.isArray(n)&&typeof e!="function")return yp(t,e,n,s);const o=typeof e=="function"?e:y0(e,n,s),a=Array.isArray(t)?Wi(t,o):Wi([t],([u])=>o(u)),c=Array.isArray(t)?void 0:t.accelerate;return c&&!c.isTransformed&&typeof e!="function"&&Array.isArray(n)&&(s==null?void 0:s.clamp)!==!1&&(a.accelerate={...c,times:e,keyframes:n,isTransformed:!0}),a}function Wi(t,e){const n=ht(()=>[]);return Or(t,()=>{n.length=0;const s=t.length;for(let i=0;i<s;i++)n[i]=t[i].get();return e(n)})}function yp(t,e,n,s){const i=ht(()=>Object.keys(n)),r=ht(()=>({}));for(const o of i)r[o]=fs(t,e,n[o],s);return r}function mp(t,e={}){const{isStatic:n}=w.useContext(ce),s=()=>F(t)?t.get():t;if(n)return fs(s);const i=ds(s());return w.useInsertionEffect(()=>m0(i,t,e),[i,JSON.stringify(e)]),i}function V5(t,e={}){return mp(t,{type:"spring",...e})}function gp(t){t.values.forEach(e=>e.stop())}function Nn(t,e){[...e].reverse().forEach(s=>{const i=t.getVariant(s);i&&Qn(t,i),t.variantChildren&&t.variantChildren.forEach(r=>{Nn(r,e)})})}function kp(t,e){if(Array.isArray(e))return Nn(t,e);if(typeof e=="string")return Nn(t,[e]);Qn(t,e)}function vp(){const t=new Set,e={subscribe(n){return t.add(n),()=>void t.delete(n)},start(n,s){const i=[];return t.forEach(r=>{i.push(Bo(r,n,{transitionOverride:s}))}),Promise.all(i)},set(n){return t.forEach(s=>{kp(s,n)})},stop(){t.forEach(n=>{gp(n)})},mount(){return()=>{e.stop()}}};return e}function xp(){const t=ht(vp);return ie(t.mount,[]),t}const E5=xp,Hr=w.createContext(null);function Mp(t,e,n,s){if(!s)return t;const i=t.findIndex(l=>l.value===e);if(i===-1)return t;const r=s>0?1:-1,o=t[i+r];if(!o)return t;const a=t[i],c=o.layout,u=I(c.min,c.max,.5);return r===1&&a.layout.max+n>u||r===-1&&a.layout.min+n<u?Zu(t,i,i+r):t}function wp({children:t,as:e="ul",axis:n="y",onReorder:s,values:i,...r},o){const a=ht(()=>jr[e]),c=[],u=w.useRef(!1),l=w.useRef(null),d={axis:n,groupRef:l,registerItem:(m,v)=>{const k=c.findIndex(g=>m===g.value);k!==-1?c[k].layout=v[n]:c.push({value:m,layout:v[n]}),c.sort(bp)},updateOrder:(m,v,k)=>{if(u.current)return;const g=Mp(c,m,v,k);if(c!==g){u.current=!0;const b=[...i];for(let x=0;x<g.length;x++)if(c[x].value!==g[x].value){const _=i.indexOf(c[x].value),A=i.indexOf(g[x].value);_!==-1&&A!==-1&&([b[_],b[A]]=[b[A],b[_]]);break}s(b)}}};w.useEffect(()=>{u.current=!1});const f=m=>{l.current=m,typeof o=="function"?o(m):o&&(o.current=m)},y={overflowAnchor:"none",...r.style};return it.jsx(a,{...r,style:y,ref:f,ignoreStrict:!0,children:it.jsx(Hr.Provider,{value:d,children:t})})}const N5=w.forwardRef(wp);function bp(t,e){return t.layout.min-e.layout.min}const ge=50,Ui=25,_p=new Set(["auto","scroll"]),Zt=new WeakMap,Jt=new WeakMap;let qt=null;function Tp(){if(qt){const t=Rn(qt,"y");t&&(Jt.delete(t),Zt.delete(t));const e=Rn(qt,"x");e&&e!==t&&(Jt.delete(e),Zt.delete(e)),qt=null}}function Ap(t,e){const n=getComputedStyle(t),s=e==="x"?n.overflowX:n.overflowY,i=t===document.body||t===document.documentElement;return _p.has(s)||i}function Rn(t,e){let n=t==null?void 0:t.parentElement;for(;n;){if(Ap(n,e))return n;n=n.parentElement}return null}function Sp(t,e,n){const s=e.getBoundingClientRect(),i=n==="x"?Math.max(0,s.left):Math.max(0,s.top),r=n==="x"?Math.min(window.innerWidth,s.right):Math.min(window.innerHeight,s.bottom),o=t-i,a=r-t;if(o<ge){const c=1-o/ge;return{amount:-Ui*c*c,edge:"start"}}else if(a<ge){const c=1-a/ge;return{amount:Ui*c*c,edge:"end"}}return{amount:0,edge:null}}function Cp(t,e,n,s){if(!t)return;qt=t;const i=Rn(t,n);if(!i)return;const r=e-(n==="x"?window.scrollX:window.scrollY),{amount:o,edge:a}=Sp(r,i,n);if(a===null){Jt.delete(i),Zt.delete(i);return}const c=Jt.get(i),u=i===document.body||i===document.documentElement;if(c!==a){if(!(a==="start"&&s<0||a==="end"&&s>0))return;Jt.set(i,a);const d=n==="x"?i.scrollWidth-(u?window.innerWidth:i.clientWidth):i.scrollHeight-(u?window.innerHeight:i.clientHeight);Zt.set(i,d)}if(o>0){const l=Zt.get(i);if((n==="x"?u?window.scrollX:i.scrollLeft:u?window.scrollY:i.scrollTop)>=l)return}n==="x"?u?window.scrollBy({left:o}):i.scrollLeft+=o:u?window.scrollBy({top:o}):i.scrollTop+=o}function Gi(t,e=0){return F(t)?t:ds(e)}function Pp({children:t,style:e={},value:n,as:s="li",onDrag:i,onDragEnd:r,layout:o=!0,...a},c){const u=ht(()=>jr[s]),l=w.useContext(Hr),d={x:Gi(e.x),y:Gi(e.y)},f=fs([d.x,d.y],([g,b])=>g||b?1:"unset"),{axis:y,registerItem:m,updateOrder:v,groupRef:k}=l;return it.jsx(u,{drag:y,...a,dragSnapToOrigin:!0,style:{...e,x:d.x,y:d.y,zIndex:f},layout:o,onDrag:(g,b)=>{const{velocity:x,point:_}=b,A=d[y].get();v(n,A,x[y]),Cp(k.current,_[y],y,x[y]),i&&i(g,b)},onDragEnd:(g,b)=>{Tp(),r&&r(g,b)},onLayoutMeasure:g=>{m(n,g)},ref:c,ignoreStrict:!0,children:t})}const R5=w.forwardRef(Pp);export{wm as $,C5 as A,ry as B,by as C,ay as D,ky as E,cm as F,_m as G,$m as H,Fy as I,tk as J,Rg as K,Wm as L,dg as M,nm as N,eg as O,Eg as P,My as Q,Xr as R,Ck as S,Yk as T,h5 as U,By as V,M5 as W,w5 as X,t5 as Y,_5 as Z,zm as _,w as a,Qk as a$,Jm as a0,Gm as a1,Rm as a2,ds as a3,E5 as a4,fs as a5,xk as a6,ig as a7,ag as a8,Ip as a9,cg as aA,b5 as aB,Dg as aC,pg as aD,rg as aE,hy as aF,Xy as aG,ey as aH,kg as aI,Fp as aJ,ny as aK,Ym as aL,Xm as aM,_y as aN,xy as aO,Jy as aP,mk as aQ,Uy as aR,Zm as aS,Wk as aT,Vy as aU,Ny as aV,f5 as aW,uy as aX,Gy as aY,sk as aZ,ok as a_,hm as aa,Qy as ab,tm as ac,Ey as ad,Ty as ae,Wy as af,i5 as ag,mg as ah,Vm as ai,Hy as aj,Xp as ak,gk as al,Xk as am,fk as an,Tk as ao,Tm as ap,zy as aq,Sy as ar,Up as as,qg as at,Ry as au,_k as av,s5 as aw,jm as ax,ak as ay,Dm as az,Ep as b,um as b$,Wp as b0,Bm as b1,wg as b2,Lm as b3,kk as b4,ug as b5,yk as b6,$g as b7,Am as b8,Zk as b9,Bg as bA,Ng as bB,r5 as bC,Gp as bD,qp as bE,Lp as bF,jg as bG,fg as bH,uk as bI,pm as bJ,y5 as bK,p5 as bL,Og as bM,o5 as bN,Fg as bO,Fk as bP,ek as bQ,Py as bR,zg as bS,e5 as bT,A5 as bU,T5 as bV,hg as bW,Hg as bX,xg as bY,Om as bZ,Jk as b_,Bk as ba,em as bb,Cy as bc,zk as bd,gm as be,Ky as bf,Oy as bg,fy as bh,mm as bi,Yy as bj,Ek as bk,Gk as bl,Km as bm,_g as bn,g5 as bo,Hm as bp,Rp as bq,Hp as br,jp as bs,Sm as bt,Nk as bu,d5 as bv,Yg as bw,gg as bx,bg as by,Sk as bz,Vp as c,Iy as c$,fm as c0,Lg as c1,$k as c2,km as c3,Yp as c4,Mm as c5,Pm as c6,Bp as c7,Jg as c8,Dp as c9,Nm as cA,tg as cB,Qm as cC,Vk as cD,Kg as cE,n5 as cF,Zg as cG,ty as cH,vg as cI,Zy as cJ,Uk as cK,lm as cL,cy as cM,iy as cN,oy as cO,wy as cP,Kk as cQ,ck as cR,sg as cS,a5 as cT,ng as cU,vk as cV,rm as cW,Ag as cX,Pk as cY,Cg as cZ,lk as c_,qk as ca,im as cb,Xg as cc,Zp as cd,Ok as ce,jy as cf,dm as cg,zp as ch,am as ci,Hk as cj,Gg as ck,Sg as cl,hk as cm,k5 as cn,om as co,v5 as cp,Ik as cq,Dy as cr,pk as cs,nk as ct,Ig as cu,Kp as cv,ym as cw,Jp as cx,Im as cy,Em as cz,Np as d,yy as d0,Ly as d1,gy as d2,lg as d3,qy as d4,rk as d5,jk as d6,Tg as d7,Ug as d8,Fm as d9,c5 as da,ik as db,dy as dc,x5 as dd,vm as de,P5 as df,Cm as dg,Lk as dh,$y as di,Vg as dj,u5 as dk,yg as dl,Mk as dm,V5 as dn,Mg as dp,xm as dq,qm as dr,$p as ds,N5 as dt,R5 as du,Pg as dv,sm as dw,m5 as dx,py as dy,og as dz,Qg as e,sy as f,Wr as g,ly as h,Ak as i,it as j,Op as k,dk as l,jr as m,Rk as n,Qp as o,Ay as p,Wg as q,Yr as r,l5 as s,Dk as t,Um as u,my as v,vy as w,wk as x,bk as y,bm as z};
