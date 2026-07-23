import{r as v,j as U}from"./vendor-react-2DI8nfEr.js";const xn=v.createContext({});function it(t){const e=v.useRef(null);return e.current===null&&(e.current=t()),e.current}const Ta=typeof window<"u",be=Ta?v.useLayoutEffect:v.useEffect,_e=v.createContext(null);function Mn(t,e){t.indexOf(e)===-1&&t.push(e)}function fe(t,e){const n=t.indexOf(e);n>-1&&t.splice(n,1)}function Aa([...t],e,n){const s=e<0?t.length+e:e;if(s>=0&&s<t.length){const i=n<0?t.length+n:n,[a]=t.splice(e,1);t.splice(i,0,a)}return t}const J=(t,e,n)=>n>e?e:n<t?t:n;let Ht=()=>{};const ht={},Pi=t=>/^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t);function Ni(t){return typeof t=="object"&&t!==null}const $i=t=>/^0[^.\s]+$/u.test(t);function Ei(t){let e;return()=>(e===void 0&&(e=t()),e)}const H=t=>t,Sa=(t,e)=>n=>e(t(n)),Kt=(...t)=>t.reduce(Sa),Tt=(t,e,n)=>{const s=e-t;return s===0?1:(n-t)/s};class wn{constructor(){this.subscriptions=[]}add(e){return Mn(this.subscriptions,e),()=>fe(this.subscriptions,e)}notify(e,n,s){const i=this.subscriptions.length;if(i)if(i===1)this.subscriptions[0](e,n,s);else for(let a=0;a<i;a++){const o=this.subscriptions[a];o&&o(e,n,s)}}getSize(){return this.subscriptions.length}clear(){this.subscriptions.length=0}}const q=t=>t*1e3,W=t=>t/1e3;function bn(t,e){return e?t*(1e3/e):0}const Li=(t,e,n)=>(((1-3*n+3*e)*t+(3*n-6*e))*t+3*e)*t,Va=1e-7,Ca=12;function Pa(t,e,n,s,i){let a,o,r=0;do o=e+(n-e)/2,a=Li(o,s,i)-t,a>0?n=o:e=o;while(Math.abs(a)>Va&&++r<Ca);return o}function Gt(t,e,n,s){if(t===e&&n===s)return H;const i=a=>Pa(a,0,1,t,n);return a=>a===0||a===1?a:Li(i(a),e,s)}const Di=t=>e=>e<=.5?t(2*e)/2:(2-t(2*(1-e)))/2,Ri=t=>e=>1-t(1-e),ji=Gt(.33,1.53,.69,.99),_n=Ri(ji),zi=Di(_n),Bi=t=>t>=1?1:(t*=2)<1?.5*_n(t):.5*(2-Math.pow(2,-10*(t-1))),Tn=t=>1-Math.sin(Math.acos(t)),Fi=Ri(Tn),Ii=Di(Tn),Na=Gt(.42,0,1,1),$a=Gt(0,0,.58,1),Hi=Gt(.42,0,.58,1),Ea=t=>Array.isArray(t)&&typeof t[0]!="number",qi=t=>Array.isArray(t)&&typeof t[0]=="number",La={linear:H,easeIn:Na,easeInOut:Hi,easeOut:$a,circIn:Tn,circInOut:Ii,circOut:Fi,backIn:_n,backInOut:zi,backOut:ji,anticipate:Bi},Da=t=>typeof t=="string",ts=t=>{if(qi(t)){Ht(t.length===4);const[e,n,s,i]=t;return Gt(e,n,s,i)}else if(Da(t))return La[t];return t},Jt=["setup","read","resolveKeyframes","preUpdate","update","preRender","render","postRender"];function Ra(t,e){let n=new Set,s=new Set,i=!1,a=!1;const o=new WeakSet;let r={delta:0,timestamp:0,isProcessing:!1};function c(l){o.has(l)&&(h.schedule(l),t()),l(r)}const h={schedule:(l,u=!1,f=!1)=>{const y=f&&i?n:s;return u&&o.add(l),y.add(l),l},cancel:l=>{s.delete(l),o.delete(l)},process:l=>{if(r=l,i){a=!0;return}i=!0;const u=n;n=s,s=u,n.forEach(c),n.clear(),i=!1,a&&(a=!1,h.process(l))}};return h}const ja=40;function Oi(t,e){let n=!1,s=!0;const i={delta:0,timestamp:0,isProcessing:!1},a=()=>n=!0,o=Jt.reduce((x,w)=>(x[w]=Ra(a),x),{}),{setup:r,read:c,resolveKeyframes:h,preUpdate:l,update:u,preRender:f,render:p,postRender:y}=o,k=()=>{const x=ht.useManualTiming,w=x?i.timestamp:performance.now();n=!1,x||(i.delta=s?1e3/60:Math.max(Math.min(w-i.timestamp,ja),1)),i.timestamp=w,i.isProcessing=!0,r.process(i),c.process(i),h.process(i),l.process(i),u.process(i),f.process(i),p.process(i),y.process(i),i.isProcessing=!1,n&&e&&(s=!1,t(k))},m=()=>{n=!0,s=!0,i.isProcessing||t(k)};return{schedule:Jt.reduce((x,w)=>{const _=o[w];return x[w]=(C,$=!1,A=!1)=>(n||m(),_.schedule(C,$,A)),x},{}),cancel:x=>{for(let w=0;w<Jt.length;w++)o[Jt[w]].cancel(x)},state:i,steps:o}}const{schedule:V,cancel:K,state:j,steps:Ce}=Oi(typeof requestAnimationFrame<"u"?requestAnimationFrame:H,!0);let ae;function za(){ae=void 0}const F={now:()=>(ae===void 0&&F.set(j.isProcessing||ht.useManualTiming?j.timestamp:performance.now()),ae),set:t=>{ae=t,queueMicrotask(za)}},Wi=t=>e=>typeof e=="string"&&e.startsWith(t),Ui=Wi("--"),Ba=Wi("var(--"),An=t=>Ba(t)?Fa.test(t.split("/*")[0].trim()):!1,Fa=/var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;function es(t){return typeof t!="string"?!1:t.split("/*")[0].includes("var(--")}const St={test:t=>typeof t=="number",parse:parseFloat,transform:t=>t},qt={...St,transform:t=>J(0,1,t)},Qt={...St,default:1},Lt=t=>Math.round(t*1e5)/1e5,Sn=/-?(?:\d+(?:\.\d+)?|\.\d+)/gu;function Ia(t){return t==null}const Ha=/^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,Vn=(t,e)=>n=>!!(typeof n=="string"&&Ha.test(n)&&n.startsWith(t)||e&&!Ia(n)&&Object.prototype.hasOwnProperty.call(n,e)),Ki=(t,e,n)=>s=>{if(typeof s!="string")return s;const[i,a,o,r]=s.match(Sn);return{[t]:parseFloat(i),[e]:parseFloat(a),[n]:parseFloat(o),alpha:r!==void 0?parseFloat(r):1}},qa=t=>J(0,255,t),Pe={...St,transform:t=>Math.round(qa(t))},yt={test:Vn("rgb","red"),parse:Ki("red","green","blue"),transform:({red:t,green:e,blue:n,alpha:s=1})=>"rgba("+Pe.transform(t)+", "+Pe.transform(e)+", "+Pe.transform(n)+", "+Lt(qt.transform(s))+")"};function Oa(t){let e="",n="",s="",i="";return t.length>5?(e=t.substring(1,3),n=t.substring(3,5),s=t.substring(5,7),i=t.substring(7,9)):(e=t.substring(1,2),n=t.substring(2,3),s=t.substring(3,4),i=t.substring(4,5),e+=e,n+=n,s+=s,i+=i),{red:parseInt(e,16),green:parseInt(n,16),blue:parseInt(s,16),alpha:i?parseInt(i,16)/255:1}}const Ke={test:Vn("#"),parse:Oa,transform:yt.transform},Xt=t=>({test:e=>typeof e=="string"&&e.endsWith(t)&&e.split(" ").length===1,parse:parseFloat,transform:e=>`${e}${t}`}),rt=Xt("deg"),st=Xt("%"),b=Xt("px"),Wa=Xt("vh"),Ua=Xt("vw"),ns={...st,parse:t=>st.parse(t)/100,transform:t=>st.transform(t*100)},wt={test:Vn("hsl","hue"),parse:Ki("hue","saturation","lightness"),transform:({hue:t,saturation:e,lightness:n,alpha:s=1})=>"hsla("+Math.round(t)+", "+st.transform(Lt(e))+", "+st.transform(Lt(n))+", "+Lt(qt.transform(s))+")"},L={test:t=>yt.test(t)||Ke.test(t)||wt.test(t),parse:t=>yt.test(t)?yt.parse(t):wt.test(t)?wt.parse(t):Ke.parse(t),transform:t=>typeof t=="string"?t:t.hasOwnProperty("red")?yt.transform(t):wt.transform(t),getAnimatableNone:t=>{const e=L.parse(t);return e.alpha=0,L.transform(e)}},Ka=/(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;function Ga(t){var e,n;return isNaN(t)&&typeof t=="string"&&(((e=t.match(Sn))==null?void 0:e.length)||0)+(((n=t.match(Ka))==null?void 0:n.length)||0)>0}const Gi="number",Xi="color",Xa="var",Ya="var(",ss="${}",Za=/var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;function At(t){const e=t.toString(),n=[],s={color:[],number:[],var:[]},i=[];let a=0;const r=e.replace(Za,c=>(L.test(c)?(s.color.push(a),i.push(Xi),n.push(L.parse(c))):c.startsWith(Ya)?(s.var.push(a),i.push(Xa),n.push(c)):(s.number.push(a),i.push(Gi),n.push(parseFloat(c))),++a,ss)).split(ss);return{values:n,split:r,indexes:s,types:i}}function Ja(t){return At(t).values}function Yi({split:t,types:e}){const n=t.length;return s=>{let i="";for(let a=0;a<n;a++)if(i+=t[a],s[a]!==void 0){const o=e[a];o===Gi?i+=Lt(s[a]):o===Xi?i+=L.transform(s[a]):i+=s[a]}return i}}function Qa(t){return Yi(At(t))}const tr=t=>typeof t=="number"?0:L.test(t)?L.getAnimatableNone(t):t,er=(t,e)=>typeof t=="number"?e!=null&&e.trim().endsWith("/")?t:0:tr(t);function nr(t){const e=At(t);return Yi(e)(e.values.map((s,i)=>er(s,e.split[i])))}const Z={test:Ga,parse:Ja,createTransformer:Qa,getAnimatableNone:nr};function Ne(t,e,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?t+(e-t)*6*n:n<1/2?e:n<2/3?t+(e-t)*(2/3-n)*6:t}function sr({hue:t,saturation:e,lightness:n,alpha:s}){t/=360,e/=100,n/=100;let i=0,a=0,o=0;if(!e)i=a=o=n;else{const r=n<.5?n*(1+e):n+e-n*e,c=2*n-r;i=Ne(c,r,t+1/3),a=Ne(c,r,t),o=Ne(c,r,t-1/3)}return{red:Math.round(i*255),green:Math.round(a*255),blue:Math.round(o*255),alpha:s}}function pe(t,e){return n=>n>0?e:t}const P=(t,e,n)=>t+(e-t)*n,$e=(t,e,n)=>{const s=t*t,i=n*(e*e-s)+s;return i<0?0:Math.sqrt(i)},ir=[Ke,yt,wt],or=t=>ir.find(e=>e.test(t));function is(t){const e=or(t);if(!e)return!1;let n=e.parse(t);return e===wt&&(n=sr(n)),n}const os=(t,e)=>{const n=is(t),s=is(e);if(!n||!s)return pe(t,e);const i={...n};return a=>(i.red=$e(n.red,s.red,a),i.green=$e(n.green,s.green,a),i.blue=$e(n.blue,s.blue,a),i.alpha=P(n.alpha,s.alpha,a),yt.transform(i))},Ge=new Set(["none","hidden"]);function ar(t,e){return Ge.has(t)?n=>n<=0?t:e:n=>n>=1?e:t}function rr(t,e){return n=>P(t,e,n)}function Cn(t){return typeof t=="number"?rr:typeof t=="string"?An(t)?pe:L.test(t)?os:hr:Array.isArray(t)?Zi:typeof t=="object"?L.test(t)?os:cr:pe}function Zi(t,e){const n=[...t],s=n.length,i=t.map((a,o)=>Cn(a)(a,e[o]));return a=>{for(let o=0;o<s;o++)n[o]=i[o](a);return n}}function cr(t,e){const n={...t,...e},s={};for(const i in n)t[i]!==void 0&&e[i]!==void 0&&(s[i]=Cn(t[i])(t[i],e[i]));return i=>{for(const a in s)n[a]=s[a](i);return n}}function lr(t,e){const n=[],s={color:0,var:0,number:0};for(let i=0;i<e.values.length;i++){const a=e.types[i],o=t.indexes[a][s[a]],r=t.values[o]??0;n[i]=r,s[a]++}return n}const hr=(t,e)=>{const n=Z.createTransformer(e),s=At(t),i=At(e);return s.indexes.var.length===i.indexes.var.length&&s.indexes.color.length===i.indexes.color.length&&s.indexes.number.length>=i.indexes.number.length?Ge.has(t)&&!i.values.length||Ge.has(e)&&!s.values.length?ar(t,e):Kt(Zi(lr(s,i),i.values),n):pe(t,e)};function Ji(t,e,n){return typeof t=="number"&&typeof e=="number"&&typeof n=="number"?P(t,e,n):Cn(t)(t,e)}const dr=t=>{const e=({timestamp:n})=>t(n);return{start:(n=!0)=>V.update(e,n),stop:()=>K(e),now:()=>j.isProcessing?j.timestamp:F.now()}},Qi=(t,e,n=10)=>{let s="";const i=Math.max(Math.round(e/n),2);for(let a=0;a<i;a++)s+=Math.round(t(a/(i-1))*1e4)/1e4+", ";return`linear(${s.substring(0,s.length-2)})`},ye=2e4;function Pn(t){let e=0;const n=50;let s=t.next(e);for(;!s.done&&e<ye;)e+=n,s=t.next(e);return e>=ye?1/0:e}function ur(t,e=100,n){const s=n({...t,keyframes:[0,e]}),i=Math.min(Pn(s),ye);return{type:"keyframes",ease:a=>s.next(i*a).value/e,duration:W(i)}}const E={stiffness:100,damping:10,mass:1,velocity:0,duration:800,bounce:.3,visualDuration:.3,restSpeed:{granular:.01,default:2},restDelta:{granular:.005,default:.5},minDuration:.01,maxDuration:10,minDamping:.05,maxDamping:1};function Xe(t,e){return t*Math.sqrt(1-e*e)}const fr=12;function pr(t,e,n){let s=n;for(let i=1;i<fr;i++)s=s-t(s)/e(s);return s}const Ee=.001;function yr({duration:t=E.duration,bounce:e=E.bounce,velocity:n=E.velocity,mass:s=E.mass}){let i,a,o=1-e;o=J(E.minDamping,E.maxDamping,o),t=J(E.minDuration,E.maxDuration,W(t)),o<1?(i=h=>{const l=h*o,u=l*t,f=l-n,p=Xe(h,o),y=Math.exp(-u);return Ee-f/p*y},a=h=>{const u=h*o*t,f=u*n+n,p=Math.pow(o,2)*Math.pow(h,2)*t,y=Math.exp(-u),k=Xe(Math.pow(h,2),o);return(-i(h)+Ee>0?-1:1)*((f-p)*y)/k}):(i=h=>{const l=Math.exp(-h*t),u=(h-n)*t+1;return-Ee+l*u},a=h=>{const l=Math.exp(-h*t),u=(n-h)*(t*t);return l*u});const r=5/t,c=pr(i,a,r);if(t=q(t),isNaN(c))return{stiffness:E.stiffness,damping:E.damping,duration:t};{const h=Math.pow(c,2)*s;return{stiffness:h,damping:o*2*Math.sqrt(s*h),duration:t}}}const mr=["duration","bounce"],gr=["stiffness","damping","mass"];function as(t,e){return e.some(n=>t[n]!==void 0)}function kr(t){let e={velocity:E.velocity,stiffness:E.stiffness,damping:E.damping,mass:E.mass,isResolvedFromDuration:!1,...t};if(!as(t,gr)&&as(t,mr))if(e.velocity=0,t.visualDuration){const n=t.visualDuration,s=2*Math.PI/(n*1.2),i=s*s,a=2*J(.05,1,1-(t.bounce||0))*Math.sqrt(i);e={...e,mass:E.mass,stiffness:i,damping:a}}else{const n=yr({...t,velocity:0});e={...e,...n,mass:E.mass},e.isResolvedFromDuration=!0}return e}function me(t=E.visualDuration,e=E.bounce){const n=typeof t!="object"?{visualDuration:t,keyframes:[0,1],bounce:e}:t;let{restSpeed:s,restDelta:i}=n;const a=n.keyframes[0],o=n.keyframes[n.keyframes.length-1],r={done:!1,value:a},{stiffness:c,damping:h,mass:l,duration:u,velocity:f,isResolvedFromDuration:p}=kr({...n,velocity:-W(n.velocity||0)}),y=f||0,k=h/(2*Math.sqrt(c*l)),m=o-a,g=W(Math.sqrt(c/l)),M=Math.abs(m)<5;s||(s=M?E.restSpeed.granular:E.restSpeed.default),i||(i=M?E.restDelta.granular:E.restDelta.default);let x,w,_,C,$,A;if(k<1)_=Xe(g,k),C=(y+k*g*m)/_,x=T=>{const N=Math.exp(-k*g*T);return o-N*(C*Math.sin(_*T)+m*Math.cos(_*T))},$=k*g*C+m*_,A=k*g*m-C*_,w=T=>Math.exp(-k*g*T)*($*Math.sin(_*T)+A*Math.cos(_*T));else if(k===1){x=N=>o-Math.exp(-g*N)*(m+(y+g*m)*N);const T=y+g*m;w=N=>Math.exp(-g*N)*(g*T*N-y)}else{const T=g*Math.sqrt(k*k-1);x=Q=>{const at=Math.exp(-k*g*Q),tt=Math.min(T*Q,300);return o-at*((y+k*g*m)*Math.sinh(tt)+T*m*Math.cosh(tt))/T};const N=(y+k*g*m)/T,z=k*g*N-m*T,ot=k*g*m-N*T;w=Q=>{const at=Math.exp(-k*g*Q),tt=Math.min(T*Q,300);return at*(z*Math.sinh(tt)+ot*Math.cosh(tt))}}const S={calculatedDuration:p&&u||null,velocity:T=>q(w(T)),next:T=>{if(!p&&k<1){const z=Math.exp(-k*g*T),ot=Math.sin(_*T),Q=Math.cos(_*T),at=o-z*(C*ot+m*Q),tt=q(z*($*ot+A*Q));return r.done=Math.abs(tt)<=s&&Math.abs(o-at)<=i,r.value=r.done?o:at,r}const N=x(T);if(p)r.done=T>=u;else{const z=q(w(T));r.done=Math.abs(z)<=s&&Math.abs(o-N)<=i}return r.value=r.done?o:N,r},toString:()=>{const T=Math.min(Pn(S),ye),N=Qi(z=>S.next(T*z).value,T,30);return T+"ms "+N},toTransition:()=>{}};return S}me.applyToOptions=t=>{const e=ur(t,100,me);return t.ease=e.ease,t.duration=q(e.duration),t.type="keyframes",t};const vr=5;function to(t,e,n){const s=Math.max(e-vr,0);return bn(n-t(s),e-s)}function Ye({keyframes:t,velocity:e=0,power:n=.8,timeConstant:s=325,bounceDamping:i=10,bounceStiffness:a=500,modifyTarget:o,min:r,max:c,restDelta:h=.5,restSpeed:l}){const u=t[0],f={done:!1,value:u},p=A=>r!==void 0&&A<r||c!==void 0&&A>c,y=A=>r===void 0?c:c===void 0||Math.abs(r-A)<Math.abs(c-A)?r:c;let k=n*e;const m=u+k,g=o===void 0?m:o(m);g!==m&&(k=g-u);const M=A=>-k*Math.exp(-A/s),x=A=>g+M(A),w=A=>{const S=M(A),T=x(A);f.done=Math.abs(S)<=h,f.value=f.done?g:T};let _,C;const $=A=>{p(f.value)&&(_=A,C=me({keyframes:[f.value,y(f.value)],velocity:to(x,A,f.value),damping:i,stiffness:a,restDelta:h,restSpeed:l}))};return $(0),{calculatedDuration:null,next:A=>{let S=!1;return!C&&_===void 0&&(S=!0,w(A),$(A)),_!==void 0&&A>=_?C.next(A-_):(!S&&w(A),f)}}}function xr(t,e,n){const s=[],i=n||ht.mix||Ji,a=t.length-1;for(let o=0;o<a;o++){let r=i(t[o],t[o+1]);if(e){const c=Array.isArray(e)?e[o]||H:e;r=Kt(c,r)}s.push(r)}return s}function Nn(t,e,{clamp:n=!0,ease:s,mixer:i}={}){const a=t.length;if(Ht(a===e.length),a===1)return()=>e[0];if(a===2&&e[0]===e[1])return()=>e[1];const o=t[0]===t[1];t[0]>t[a-1]&&(t=[...t].reverse(),e=[...e].reverse());const r=xr(e,s,i),c=r.length,h=l=>{if(o&&l<t[0])return e[0];let u=0;if(c>1)for(;u<t.length-2&&!(l<t[u+1]);u++);const f=Tt(t[u],t[u+1],l);return r[u](f)};return n?l=>h(J(t[0],t[a-1],l)):h}function Mr(t,e){const n=t[t.length-1];for(let s=1;s<=e;s++){const i=Tt(0,e,s);t.push(P(n,1,i))}}function eo(t){const e=[0];return Mr(e,t.length-1),e}function wr(t,e){return t.map(n=>n*e)}function br(t,e){return t.map(()=>e||Hi).splice(0,t.length-1)}function Dt({duration:t=300,keyframes:e,times:n,ease:s="easeInOut"}){const i=Ea(s)?s.map(ts):ts(s),a={done:!1,value:e[0]},o=wr(n&&n.length===e.length?n:eo(e),t),r=Nn(o,e,{ease:Array.isArray(i)?i:br(e,i)});return{calculatedDuration:t,next:c=>(a.value=r(c),a.done=c>=t,a)}}const _r=t=>t!==null;function Te(t,{repeat:e,repeatType:n="loop"},s,i=1){const a=t.filter(_r),r=i<0||e&&n!=="loop"&&e%2===1?0:a.length-1;return!r||s===void 0?a[r]:s}const Tr={decay:Ye,inertia:Ye,tween:Dt,keyframes:Dt,spring:me};function no(t){typeof t.type=="string"&&(t.type=Tr[t.type])}class $n{constructor(){this.updateFinished()}get finished(){return this._finished}updateFinished(){this._finished=new Promise(e=>{this.resolve=e})}notifyFinished(){this.resolve()}then(e,n){return this.finished.then(e,n)}}const Ar=t=>t/100;class Ot extends $n{constructor(e){super(),this.state="idle",this.startTime=null,this.isStopped=!1,this.currentTime=0,this.holdTime=null,this.playbackSpeed=1,this.delayState={done:!1,value:void 0},this.stop=()=>{var s,i;const{motionValue:n}=this.options;n&&n.updatedAt!==F.now()&&this.tick(F.now()),this.isStopped=!0,this.state!=="idle"&&(this.teardown(),(i=(s=this.options).onStop)==null||i.call(s))},this.options=e,this.initAnimation(),this.play(),e.autoplay===!1&&this.pause()}initAnimation(){const{options:e}=this;no(e);const{type:n=Dt,repeat:s=0,repeatDelay:i=0,repeatType:a,velocity:o=0}=e;let{keyframes:r}=e;const c=n||Dt;c!==Dt&&typeof r[0]!="number"&&(this.mixKeyframes=Kt(Ar,Ji(r[0],r[1])),r=[0,100]);const h=c({...e,keyframes:r});a==="mirror"&&(this.mirroredGenerator=c({...e,keyframes:[...r].reverse(),velocity:-o})),h.calculatedDuration===null&&(h.calculatedDuration=Pn(h));const{calculatedDuration:l}=h;this.calculatedDuration=l,this.resolvedDuration=l+i,this.totalDuration=this.resolvedDuration*(s+1)-i,this.generator=h}updateTime(e){const n=Math.round(e-this.startTime)*this.playbackSpeed;this.holdTime!==null?this.currentTime=this.holdTime:this.currentTime=n}tick(e,n=!1){const{generator:s,totalDuration:i,mixKeyframes:a,mirroredGenerator:o,resolvedDuration:r,calculatedDuration:c}=this;if(this.startTime===null)return s.next(0);const{delay:h=0,keyframes:l,repeat:u,repeatType:f,repeatDelay:p,type:y,onUpdate:k,finalKeyframe:m}=this.options;this.speed>0?this.startTime=Math.min(this.startTime,e):this.speed<0&&(this.startTime=Math.min(e-i/this.speed,this.startTime)),n?this.currentTime=e:this.updateTime(e);const g=this.currentTime-h*(this.playbackSpeed>=0?1:-1),M=this.playbackSpeed>=0?g<0:g>i;this.currentTime=Math.max(g,0),this.state==="finished"&&this.holdTime===null&&(this.currentTime=i);let x=this.currentTime,w=s;if(u){const A=Math.min(this.currentTime,i)/r;let S=Math.floor(A),T=A%1;!T&&A>=1&&(T=1),T===1&&S--,S=Math.min(S,u+1),!!(S%2)&&(f==="reverse"?(T=1-T,p&&(T-=p/r)):f==="mirror"&&(w=o)),x=J(0,1,T)*r}let _;M?(this.delayState.value=l[0],_=this.delayState):_=w.next(x),a&&!M&&(_.value=a(_.value));let{done:C}=_;!M&&c!==null&&(C=this.playbackSpeed>=0?this.currentTime>=i:this.currentTime<=0);const $=this.holdTime===null&&(this.state==="finished"||this.state==="running"&&C);return $&&y!==Ye&&(_.value=Te(l,this.options,m,this.speed)),k&&k(_.value),$&&this.finish(),_}then(e,n){return this.finished.then(e,n)}get duration(){return W(this.calculatedDuration)}get iterationDuration(){const{delay:e=0}=this.options||{};return this.duration+W(e)}get time(){return W(this.currentTime)}set time(e){e=q(e),this.currentTime=e,this.startTime===null||this.holdTime!==null||this.playbackSpeed===0?this.holdTime=e:this.driver&&(this.startTime=this.driver.now()-e/this.playbackSpeed),this.driver?this.driver.start(!1):(this.startTime=0,this.state="paused",this.holdTime=e,this.tick(e))}getGeneratorVelocity(){const e=this.currentTime;if(e<=0)return this.options.velocity||0;if(this.generator.velocity)return this.generator.velocity(e);const n=this.generator.next(e).value;return to(s=>this.generator.next(s).value,e,n)}get speed(){return this.playbackSpeed}set speed(e){const n=this.playbackSpeed!==e;n&&this.driver&&this.updateTime(F.now()),this.playbackSpeed=e,n&&this.driver&&(this.time=W(this.currentTime))}play(){var i,a;if(this.isStopped)return;const{driver:e=dr,startTime:n}=this.options;this.driver||(this.driver=e(o=>this.tick(o))),(a=(i=this.options).onPlay)==null||a.call(i);const s=this.driver.now();this.state==="finished"?(this.updateFinished(),this.startTime=s):this.holdTime!==null?this.startTime=s-this.holdTime:this.startTime||(this.startTime=n??s),this.state==="finished"&&this.speed<0&&(this.startTime+=this.calculatedDuration),this.holdTime=null,this.state="running",this.driver.start()}pause(){this.state="paused",this.updateTime(F.now()),this.holdTime=this.currentTime}complete(){this.state!=="running"&&this.play(),this.state="finished",this.holdTime=null}finish(){var e,n;this.notifyFinished(),this.teardown(),this.state="finished",(n=(e=this.options).onComplete)==null||n.call(e)}cancel(){var e,n;this.holdTime=null,this.startTime=0,this.tick(0),this.teardown(),(n=(e=this.options).onCancel)==null||n.call(e)}teardown(){this.state="idle",this.stopDriver(),this.startTime=this.holdTime=null}stopDriver(){this.driver&&(this.driver.stop(),this.driver=void 0)}sample(e){return this.startTime=0,this.tick(e,!0)}attachTimeline(e){var n;return this.options.allowFlatten&&(this.options.type="keyframes",this.options.ease="linear",this.initAnimation()),(n=this.driver)==null||n.stop(),e.observe(this)}}function Sr(t){for(let e=1;e<t.length;e++)t[e]??(t[e]=t[e-1])}const mt=t=>t*180/Math.PI,Ze=t=>{const e=mt(Math.atan2(t[1],t[0]));return Je(e)},Vr={x:4,y:5,translateX:4,translateY:5,scaleX:0,scaleY:3,scale:t=>(Math.abs(t[0])+Math.abs(t[3]))/2,rotate:Ze,rotateZ:Ze,skewX:t=>mt(Math.atan(t[1])),skewY:t=>mt(Math.atan(t[2])),skew:t=>(Math.abs(t[1])+Math.abs(t[2]))/2},Je=t=>(t=t%360,t<0&&(t+=360),t),rs=Ze,cs=t=>Math.sqrt(t[0]*t[0]+t[1]*t[1]),ls=t=>Math.sqrt(t[4]*t[4]+t[5]*t[5]),Cr={x:12,y:13,z:14,translateX:12,translateY:13,translateZ:14,scaleX:cs,scaleY:ls,scale:t=>(cs(t)+ls(t))/2,rotateX:t=>Je(mt(Math.atan2(t[6],t[5]))),rotateY:t=>Je(mt(Math.atan2(-t[2],t[0]))),rotateZ:rs,rotate:rs,skewX:t=>mt(Math.atan(t[4])),skewY:t=>mt(Math.atan(t[1])),skew:t=>(Math.abs(t[1])+Math.abs(t[4]))/2};function Qe(t){return t.includes("scale")?1:0}function tn(t,e){if(!t||t==="none")return Qe(e);const n=t.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);let s,i;if(n)s=Cr,i=n;else{const r=t.match(/^matrix\(([-\d.e\s,]+)\)$/u);s=Vr,i=r}if(!i)return Qe(e);const a=s[e],o=i[1].split(",").map(Nr);return typeof a=="function"?a(o):o[a]}const Pr=(t,e)=>{const{transform:n="none"}=getComputedStyle(t);return tn(n,e)};function Nr(t){return parseFloat(t.trim())}const Vt=["transformPerspective","x","y","z","translateX","translateY","translateZ","scale","scaleX","scaleY","rotate","rotateX","rotateY","rotateZ","skew","skewX","skewY"],Ct=new Set(Vt),hs=t=>t===St||t===b,$r=new Set(["x","y","z"]),Er=Vt.filter(t=>!$r.has(t));function Lr(t){const e=[];return Er.forEach(n=>{const s=t.getValue(n);s!==void 0&&(e.push([n,s.get()]),s.set(n.startsWith("scale")?1:0))}),e}const lt={width:({x:t},{paddingLeft:e="0",paddingRight:n="0",boxSizing:s})=>{const i=t.max-t.min;return s==="border-box"?i:i-parseFloat(e)-parseFloat(n)},height:({y:t},{paddingTop:e="0",paddingBottom:n="0",boxSizing:s})=>{const i=t.max-t.min;return s==="border-box"?i:i-parseFloat(e)-parseFloat(n)},top:(t,{top:e})=>parseFloat(e),left:(t,{left:e})=>parseFloat(e),bottom:({y:t},{top:e})=>parseFloat(e)+(t.max-t.min),right:({x:t},{left:e})=>parseFloat(e)+(t.max-t.min),x:(t,{transform:e})=>tn(e,"x"),y:(t,{transform:e})=>tn(e,"y")};lt.translateX=lt.x;lt.translateY=lt.y;const gt=new Set;let en=!1,nn=!1,sn=!1;function so(){if(nn){const t=Array.from(gt).filter(s=>s.needsMeasurement),e=new Set(t.map(s=>s.element)),n=new Map;e.forEach(s=>{const i=Lr(s);i.length&&(n.set(s,i),s.render())}),t.forEach(s=>s.measureInitialState()),e.forEach(s=>{s.render();const i=n.get(s);i&&i.forEach(([a,o])=>{var r;(r=s.getValue(a))==null||r.set(o)})}),t.forEach(s=>s.measureEndState()),t.forEach(s=>{s.suspendedScrollY!==void 0&&window.scrollTo(0,s.suspendedScrollY)})}nn=!1,en=!1,gt.forEach(t=>t.complete(sn)),gt.clear()}function io(){gt.forEach(t=>{t.readKeyframes(),t.needsMeasurement&&(nn=!0)})}function Dr(){sn=!0,io(),so(),sn=!1}class En{constructor(e,n,s,i,a,o=!1){this.state="pending",this.isAsync=!1,this.needsMeasurement=!1,this.unresolvedKeyframes=[...e],this.onComplete=n,this.name=s,this.motionValue=i,this.element=a,this.isAsync=o}scheduleResolve(){this.state="scheduled",this.isAsync?(gt.add(this),en||(en=!0,V.read(io),V.resolveKeyframes(so))):(this.readKeyframes(),this.complete())}readKeyframes(){const{unresolvedKeyframes:e,name:n,element:s,motionValue:i}=this;if(e[0]===null){const a=i==null?void 0:i.get(),o=e[e.length-1];if(a!==void 0)e[0]=a;else if(s&&n){const r=s.readValue(n,o);r!=null&&(e[0]=r)}e[0]===void 0&&(e[0]=o),i&&a===void 0&&i.set(e[0])}Sr(e)}setFinalKeyframe(){}measureInitialState(){}renderEndStyles(){}measureEndState(){}complete(e=!1){this.state="complete",this.onComplete(this.unresolvedKeyframes,this.finalKeyframe,e),gt.delete(this)}cancel(){this.state==="scheduled"&&(gt.delete(this),this.state="pending")}resume(){this.state==="pending"&&this.scheduleResolve()}}const Rr=t=>t.startsWith("--");function oo(t,e,n){Rr(e)?t.style.setProperty(e,n):t.style[e]=n}const jr={};function Ln(t,e){const n=Ei(t);return()=>jr[e]??n()}const Dn=Ln(()=>window.ScrollTimeline!==void 0,"scrollTimeline"),ao=Ln(()=>window.ViewTimeline!==void 0,"viewTimeline"),ro=Ln(()=>{try{document.createElement("div").animate({opacity:0},{easing:"linear(0, 1)"})}catch{return!1}return!0},"linearEasing"),Nt=([t,e,n,s])=>`cubic-bezier(${t}, ${e}, ${n}, ${s})`,ds={linear:"linear",ease:"ease",easeIn:"ease-in",easeOut:"ease-out",easeInOut:"ease-in-out",circIn:Nt([0,.65,.55,1]),circOut:Nt([.55,0,1,.45]),backIn:Nt([.31,.01,.66,-.59]),backOut:Nt([.33,1.53,.69,.99])};function co(t,e){if(t)return typeof t=="function"?ro()?Qi(t,e):"ease-out":qi(t)?Nt(t):Array.isArray(t)?t.map(n=>co(n,e)||ds.easeOut):ds[t]}function zr(t,e,n,{delay:s=0,duration:i=300,repeat:a=0,repeatType:o="loop",ease:r="easeOut",times:c}={},h=void 0){const l={[e]:n};c&&(l.offset=c);const u=co(r,i);Array.isArray(u)&&(l.easing=u);const f={delay:s,duration:i,easing:Array.isArray(u)?"linear":u,fill:"both",iterations:a+1,direction:o==="reverse"?"alternate":"normal"};return h&&(f.pseudoElement=h),t.animate(l,f)}function lo(t){return typeof t=="function"&&"applyToOptions"in t}function Br({type:t,...e}){return lo(t)&&ro()?t.applyToOptions(e):(e.duration??(e.duration=300),e.ease??(e.ease="easeOut"),e)}class ho extends $n{constructor(e){if(super(),this.finishedTime=null,this.isStopped=!1,this.manualStartTime=null,!e)return;const{element:n,name:s,keyframes:i,pseudoElement:a,allowFlatten:o=!1,finalKeyframe:r,onComplete:c}=e;this.isPseudoElement=!!a,this.allowFlatten=o,this.options=e,Ht(typeof e.type!="string");const h=Br(e);this.animation=zr(n,s,i,h,a),h.autoplay===!1&&this.animation.pause(),this.animation.onfinish=()=>{if(this.finishedTime=this.time,!a){const l=Te(i,this.options,r,this.speed);this.updateMotionValue&&this.updateMotionValue(l),oo(n,s,l),this.animation.cancel()}c==null||c(),this.notifyFinished()}}play(){this.isStopped||(this.manualStartTime=null,this.animation.play(),this.state==="finished"&&this.updateFinished())}pause(){this.animation.pause()}complete(){var e,n;(n=(e=this.animation).finish)==null||n.call(e)}cancel(){try{this.animation.cancel()}catch{}}stop(){if(this.isStopped)return;this.isStopped=!0;const{state:e}=this;e==="idle"||e==="finished"||(this.updateMotionValue?this.updateMotionValue():this.commitStyles(),this.isPseudoElement||this.cancel())}commitStyles(){var n,s,i;const e=(n=this.options)==null?void 0:n.element;!this.isPseudoElement&&(e!=null&&e.isConnected)&&((i=(s=this.animation).commitStyles)==null||i.call(s))}get duration(){var n,s;const e=((s=(n=this.animation.effect)==null?void 0:n.getComputedTiming)==null?void 0:s.call(n).duration)||0;return W(Number(e))}get iterationDuration(){const{delay:e=0}=this.options||{};return this.duration+W(e)}get time(){return W(Number(this.animation.currentTime)||0)}set time(e){const n=this.finishedTime!==null;this.manualStartTime=null,this.finishedTime=null,this.animation.currentTime=q(e),n&&this.animation.pause()}get speed(){return this.animation.playbackRate}set speed(e){e<0&&(this.finishedTime=null),this.animation.playbackRate=e}get state(){return this.finishedTime!==null?"finished":this.animation.playState}get startTime(){return this.manualStartTime??Number(this.animation.startTime)}set startTime(e){this.manualStartTime=this.animation.startTime=e}attachTimeline({timeline:e,rangeStart:n,rangeEnd:s,observe:i}){var a;return this.allowFlatten&&((a=this.animation.effect)==null||a.updateTiming({easing:"linear"})),this.animation.onfinish=null,e&&Dn()?(this.animation.timeline=e,n&&(this.animation.rangeStart=n),s&&(this.animation.rangeEnd=s),H):i(this)}}const uo={anticipate:Bi,backInOut:zi,circInOut:Ii};function Fr(t){return t in uo}function Ir(t){typeof t.ease=="string"&&Fr(t.ease)&&(t.ease=uo[t.ease])}const Le=10;class Hr extends ho{constructor(e){Ir(e),no(e),super(e),e.startTime!==void 0&&e.autoplay!==!1&&(this.startTime=e.startTime),this.options=e}updateMotionValue(e){const{motionValue:n,onUpdate:s,onComplete:i,element:a,...o}=this.options;if(!n)return;if(e!==void 0){n.set(e);return}const r=new Ot({...o,autoplay:!1}),c=Math.max(Le,F.now()-this.startTime),h=J(0,Le,c-Le),l=r.sample(c).value,{name:u}=this.options;a&&u&&oo(a,u,l),n.setWithVelocity(r.sample(Math.max(0,c-h)).value,l,h),r.stop()}}const us=(t,e)=>e==="zIndex"?!1:!!(typeof t=="number"||Array.isArray(t)||typeof t=="string"&&(Z.test(t)||t==="0")&&!t.startsWith("url("));function qr(t){const e=t[0];if(t.length===1)return!0;for(let n=0;n<t.length;n++)if(t[n]!==e)return!0}function Or(t,e,n,s){const i=t[0];if(i===null)return!1;if(e==="display"||e==="visibility")return!0;const a=t[t.length-1],o=us(i,e),r=us(a,e);return!o||!r?!1:qr(t)||(n==="spring"||lo(n))&&s}function on(t){t.duration=0,t.type="keyframes"}const fo=new Set(["opacity","clipPath","filter","transform"]),Wr=/^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;function Ur(t){for(let e=0;e<t.length;e++)if(typeof t[e]=="string"&&Wr.test(t[e]))return!0;return!1}const Kr=new Set(["color","backgroundColor","outlineColor","fill","stroke","borderColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor"]),Gr=Ei(()=>Object.hasOwnProperty.call(Element.prototype,"animate"));function Xr(t){var u;const{motionValue:e,name:n,repeatDelay:s,repeatType:i,damping:a,type:o,keyframes:r}=t;if(!(((u=e==null?void 0:e.owner)==null?void 0:u.current)instanceof HTMLElement))return!1;const{onUpdate:h,transformTemplate:l}=e.owner.getProps();return Gr()&&n&&(fo.has(n)||Kr.has(n)&&Ur(r))&&(n!=="transform"||!l)&&!h&&!s&&i!=="mirror"&&a!==0&&o!=="inertia"}const Yr=40;class Zr extends $n{constructor({autoplay:e=!0,delay:n=0,type:s="keyframes",repeat:i=0,repeatDelay:a=0,repeatType:o="loop",keyframes:r,name:c,motionValue:h,element:l,...u}){var y;super(),this.stop=()=>{var k,m;this._animation&&(this._animation.stop(),(k=this.stopTimeline)==null||k.call(this)),(m=this.keyframeResolver)==null||m.cancel()},this.createdAt=F.now();const f={autoplay:e,delay:n,type:s,repeat:i,repeatDelay:a,repeatType:o,name:c,motionValue:h,element:l,...u},p=(l==null?void 0:l.KeyframeResolver)||En;this.keyframeResolver=new p(r,(k,m,g)=>this.onKeyframesResolved(k,m,f,!g),c,h,l),(y=this.keyframeResolver)==null||y.scheduleResolve()}onKeyframesResolved(e,n,s,i){var g,M;this.keyframeResolver=void 0;const{name:a,type:o,velocity:r,delay:c,isHandoff:h,onUpdate:l}=s;this.resolvedAt=F.now();let u=!0;Or(e,a,o,r)||(u=!1,(ht.instantAnimations||!c)&&(l==null||l(Te(e,s,n))),e[0]=e[e.length-1],on(s),s.repeat=0);const p={startTime:i?this.resolvedAt?this.resolvedAt-this.createdAt>Yr?this.resolvedAt:this.createdAt:this.createdAt:void 0,finalKeyframe:n,...s,keyframes:e},y=u&&!h&&Xr(p),k=(M=(g=p.motionValue)==null?void 0:g.owner)==null?void 0:M.current;let m;if(y)try{m=new Hr({...p,element:k})}catch{m=new Ot(p)}else m=new Ot(p);m.finished.then(()=>{this.notifyFinished()}).catch(H),this.pendingTimeline&&(this.stopTimeline=m.attachTimeline(this.pendingTimeline),this.pendingTimeline=void 0),this._animation=m}get finished(){return this._animation?this.animation.finished:this._finished}then(e,n){return this.finished.finally(e).then(()=>{})}get animation(){var e;return this._animation||((e=this.keyframeResolver)==null||e.resume(),Dr()),this._animation}get duration(){return this.animation.duration}get iterationDuration(){return this.animation.iterationDuration}get time(){return this.animation.time}set time(e){this.animation.time=e}get speed(){return this.animation.speed}get state(){return this.animation.state}set speed(e){this.animation.speed=e}get startTime(){return this.animation.startTime}attachTimeline(e){return this._animation?this.stopTimeline=this.animation.attachTimeline(e):this.pendingTimeline=e,()=>this.stop()}play(){this.animation.play()}pause(){this.animation.pause()}complete(){this.animation.complete()}cancel(){var e;this._animation&&this.animation.cancel(),(e=this.keyframeResolver)==null||e.cancel()}}function po(t,e,n,s=0,i=1){const a=Array.from(t).sort((h,l)=>h.sortNodePosition(l)).indexOf(e),o=t.size,r=(o-1)*s;return typeof n=="function"?n(a,o):i===1?a*s:r-a*s}const Jr=/^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;function Qr(t){const e=Jr.exec(t);if(!e)return[,];const[,n,s,i]=e;return[`--${n??s}`,i]}function yo(t,e,n=1){const[s,i]=Qr(t);if(!s)return;const a=window.getComputedStyle(e).getPropertyValue(s);if(a){const o=a.trim();return Pi(o)?parseFloat(o):o}return An(i)?yo(i,e,n+1):i}const tc={type:"spring",stiffness:500,damping:25,restSpeed:10},ec=t=>({type:"spring",stiffness:550,damping:t===0?2*Math.sqrt(550):30,restSpeed:10}),nc={type:"keyframes",duration:.8},sc={type:"keyframes",ease:[.25,.1,.35,1],duration:.3},ic=(t,{keyframes:e})=>e.length>2?nc:Ct.has(t)?t.startsWith("scale")?ec(e[1]):tc:sc;function mo(t,e){if(t!=null&&t.inherit&&e){const{inherit:n,...s}=t;return{...e,...s}}return t}function Rn(t,e){const n=(t==null?void 0:t[e])??(t==null?void 0:t.default)??t;return n!==t?mo(n,t):n}const oc=new Set(["when","delay","delayChildren","staggerChildren","staggerDirection","repeat","repeatType","repeatDelay","from","elapsed"]);function ac(t){for(const e in t)if(!oc.has(e))return!0;return!1}const jn=(t,e,n,s={},i,a)=>o=>{const r=Rn(s,t)||{},c=r.delay||s.delay||0;let{elapsed:h=0}=s;h=h-q(c);const l={keyframes:Array.isArray(n)?n:[null,n],ease:"easeOut",velocity:e.getVelocity(),...r,delay:-h,onUpdate:f=>{e.set(f),r.onUpdate&&r.onUpdate(f)},onComplete:()=>{o(),r.onComplete&&r.onComplete()},name:t,motionValue:e,element:a?void 0:i};ac(r)||Object.assign(l,ic(t,l)),l.duration&&(l.duration=q(l.duration)),l.repeatDelay&&(l.repeatDelay=q(l.repeatDelay)),l.from!==void 0&&(l.keyframes[0]=l.from);let u=!1;if((l.type===!1||l.duration===0&&!l.repeatDelay)&&(on(l),l.delay===0&&(u=!0)),(ht.instantAnimations||ht.skipAnimations||i!=null&&i.shouldSkipAnimations)&&(u=!0,on(l),l.delay=0),l.allowFlatten=!r.type&&!r.ease,u&&!a&&e.get()!==void 0){const f=Te(l.keyframes,r);if(f!==void 0){V.update(()=>{l.onUpdate(f),l.onComplete()});return}}return r.isSync?new Ot(l):new Zr(l)};function fs(t){const e=[{},{}];return t==null||t.values.forEach((n,s)=>{e[0][s]=n.get(),e[1][s]=n.getVelocity()}),e}function zn(t,e,n,s){if(typeof e=="function"){const[i,a]=fs(s);e=e(n!==void 0?n:t.custom,i,a)}if(typeof e=="string"&&(e=t.variants&&t.variants[e]),typeof e=="function"){const[i,a]=fs(s);e=e(n!==void 0?n:t.custom,i,a)}return e}function kt(t,e,n){const s=t.getProps();return zn(s,e,n!==void 0?n:s.custom,t)}const go=new Set(["width","height","top","left","right","bottom",...Vt]),ps=30,rc=t=>!isNaN(parseFloat(t)),Rt={current:void 0};class cc{constructor(e,n={}){this.canTrackVelocity=null,this.events={},this.updateAndNotify=s=>{var a;const i=F.now();if(this.updatedAt!==i&&this.setPrevFrameValue(),this.prev=this.current,this.setCurrent(s),this.current!==this.prev&&((a=this.events.change)==null||a.notify(this.current),this.dependents))for(const o of this.dependents)o.dirty()},this.hasAnimated=!1,this.setCurrent(e),this.owner=n.owner}setCurrent(e){this.current=e,this.updatedAt=F.now(),this.canTrackVelocity===null&&e!==void 0&&(this.canTrackVelocity=rc(this.current))}setPrevFrameValue(e=this.current){this.prevFrameValue=e,this.prevUpdatedAt=this.updatedAt}onChange(e){return this.on("change",e)}on(e,n){this.events[e]||(this.events[e]=new wn);const s=this.events[e].add(n);return e==="change"?()=>{s(),V.read(()=>{this.events.change.getSize()||this.stop()})}:s}clearListeners(){for(const e in this.events)this.events[e].clear()}attach(e,n){this.passiveEffect=e,this.stopPassiveEffect=n}set(e){this.passiveEffect?this.passiveEffect(e,this.updateAndNotify):this.updateAndNotify(e)}setWithVelocity(e,n,s){this.set(n),this.prev=void 0,this.prevFrameValue=e,this.prevUpdatedAt=this.updatedAt-s}jump(e,n=!0){this.updateAndNotify(e),this.prev=e,this.prevUpdatedAt=this.prevFrameValue=void 0,n&&this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}dirty(){var e;(e=this.events.change)==null||e.notify(this.current)}addDependent(e){this.dependents||(this.dependents=new Set),this.dependents.add(e)}removeDependent(e){this.dependents&&this.dependents.delete(e)}get(){return Rt.current&&Rt.current.push(this),this.current}getPrevious(){return this.prev}getVelocity(){const e=F.now();if(!this.canTrackVelocity||this.prevFrameValue===void 0||e-this.updatedAt>ps)return 0;const n=Math.min(this.updatedAt-this.prevUpdatedAt,ps);return bn(parseFloat(this.current)-parseFloat(this.prevFrameValue),n)}start(e){return this.stop(),new Promise(n=>{this.hasAnimated=!0,this.animation=e(n),this.events.animationStart&&this.events.animationStart.notify()}).then(()=>{this.events.animationComplete&&this.events.animationComplete.notify(),this.clearAnimation()})}stop(){this.animation&&(this.animation.stop(),this.events.animationCancel&&this.events.animationCancel.notify()),this.clearAnimation()}isAnimating(){return!!this.animation}clearAnimation(){delete this.animation}destroy(){var e,n;(e=this.dependents)==null||e.clear(),(n=this.events.destroy)==null||n.notify(),this.clearListeners(),this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}}function Y(t,e){return new cc(t,e)}const an=t=>Array.isArray(t);function lc(t,e,n){t.hasValue(e)?t.getValue(e).set(n):t.addValue(e,Y(n))}function hc(t){return an(t)?t[t.length-1]||0:t}function dc(t,e){const n=kt(t,e);let{transitionEnd:s={},transition:i={},...a}=n||{};a={...a,...s};for(const o in a){const r=hc(a[o]);lc(t,o,r)}}const D=t=>!!(t&&t.getVelocity);function uc(t){return!!(D(t)&&t.add)}function rn(t,e){const n=t.getValue("willChange");if(uc(n))return n.add(e);if(!n&&ht.WillChange){const s=new ht.WillChange("auto");t.addValue("willChange",s),s.add(e)}}function Bn(t){return t.replace(/([A-Z])/g,e=>`-${e.toLowerCase()}`)}const fc="framerAppearId",ko="data-"+Bn(fc);function vo(t){return t.props[ko]}function pc({protectedKeys:t,needsAnimating:e},n){const s=t.hasOwnProperty(n)&&e[n]!==!0;return e[n]=!1,s}function xo(t,e,{delay:n=0,transitionOverride:s,type:i}={}){let{transition:a,transitionEnd:o,...r}=e;const c=t.getDefaultTransition();a=a?mo(a,c):c;const h=a==null?void 0:a.reduceMotion;s&&(a=s);const l=[],u=i&&t.animationState&&t.animationState.getState()[i];for(const f in r){const p=t.getValue(f,t.latestValues[f]??null),y=r[f];if(y===void 0||u&&pc(u,f))continue;const k={delay:n,...Rn(a||{},f)},m=p.get();if(m!==void 0&&!p.isAnimating()&&!Array.isArray(y)&&y===m&&!k.velocity){V.update(()=>p.set(y));continue}let g=!1;if(window.MotionHandoffAnimation){const w=vo(t);if(w){const _=window.MotionHandoffAnimation(w,f,V);_!==null&&(k.startTime=_,g=!0)}}rn(t,f);const M=h??t.shouldReduceMotion;p.start(jn(f,p,y,M&&go.has(f)?{type:!1}:k,t,g));const x=p.animation;x&&l.push(x)}if(o){const f=()=>V.update(()=>{o&&dc(t,o)});l.length?Promise.all(l).then(f):f()}return l}function cn(t,e,n={}){var c;const s=kt(t,e,n.type==="exit"?(c=t.presenceContext)==null?void 0:c.custom:void 0);let{transition:i=t.getDefaultTransition()||{}}=s||{};n.transitionOverride&&(i=n.transitionOverride);const a=s?()=>Promise.all(xo(t,s,n)):()=>Promise.resolve(),o=t.variantChildren&&t.variantChildren.size?(h=0)=>{const{delayChildren:l=0,staggerChildren:u,staggerDirection:f}=i;return yc(t,e,h,l,u,f,n)}:()=>Promise.resolve(),{when:r}=i;if(r){const[h,l]=r==="beforeChildren"?[a,o]:[o,a];return h().then(()=>l())}else return Promise.all([a(),o(n.delay)])}function yc(t,e,n=0,s=0,i=0,a=1,o){const r=[];for(const c of t.variantChildren)c.notify("AnimationStart",e),r.push(cn(c,e,{...o,delay:n+(typeof s=="function"?0:s)+po(t.variantChildren,c,s,i,a)}).then(()=>c.notify("AnimationComplete",e)));return Promise.all(r)}function mc(t,e,n={}){t.notify("AnimationStart",e);let s;if(Array.isArray(e)){const i=e.map(a=>cn(t,a,n));s=Promise.all(i)}else if(typeof e=="string")s=cn(t,e,n);else{const i=typeof e=="function"?kt(t,e,n.custom):e;s=Promise.all(xo(t,i,n))}return s.then(()=>{t.notify("AnimationComplete",e)})}const gc={test:t=>t==="auto",parse:t=>t},Mo=t=>e=>e.test(t),wo=[St,b,st,rt,Ua,Wa,gc],ys=t=>wo.find(Mo(t));function kc(t){return typeof t=="number"?t===0:t!==null?t==="none"||t==="0"||$i(t):!0}const vc=new Set(["brightness","contrast","saturate","opacity"]);function xc(t){const[e,n]=t.slice(0,-1).split("(");if(e==="drop-shadow")return t;const[s]=n.match(Sn)||[];if(!s)return t;const i=n.replace(s,"");let a=vc.has(e)?1:0;return s!==n&&(a*=100),e+"("+a+i+")"}const Mc=/\b([a-z-]*)\(.*?\)/gu,ln={...Z,getAnimatableNone:t=>{const e=t.match(Mc);return e?e.map(xc).join(" "):t}},hn={...Z,getAnimatableNone:t=>{const e=Z.parse(t);return Z.createTransformer(t)(e.map(s=>typeof s=="number"?0:typeof s=="object"?{...s,alpha:1}:s))}},ms={...St,transform:Math.round},wc={rotate:rt,rotateX:rt,rotateY:rt,rotateZ:rt,scale:Qt,scaleX:Qt,scaleY:Qt,scaleZ:Qt,skew:rt,skewX:rt,skewY:rt,distance:b,translateX:b,translateY:b,translateZ:b,x:b,y:b,z:b,perspective:b,transformPerspective:b,opacity:qt,originX:ns,originY:ns,originZ:b},Fn={borderWidth:b,borderTopWidth:b,borderRightWidth:b,borderBottomWidth:b,borderLeftWidth:b,borderRadius:b,borderTopLeftRadius:b,borderTopRightRadius:b,borderBottomRightRadius:b,borderBottomLeftRadius:b,width:b,maxWidth:b,height:b,maxHeight:b,top:b,right:b,bottom:b,left:b,inset:b,insetBlock:b,insetBlockStart:b,insetBlockEnd:b,insetInline:b,insetInlineStart:b,insetInlineEnd:b,padding:b,paddingTop:b,paddingRight:b,paddingBottom:b,paddingLeft:b,paddingBlock:b,paddingBlockStart:b,paddingBlockEnd:b,paddingInline:b,paddingInlineStart:b,paddingInlineEnd:b,margin:b,marginTop:b,marginRight:b,marginBottom:b,marginLeft:b,marginBlock:b,marginBlockStart:b,marginBlockEnd:b,marginInline:b,marginInlineStart:b,marginInlineEnd:b,fontSize:b,backgroundPositionX:b,backgroundPositionY:b,...wc,zIndex:ms,fillOpacity:qt,strokeOpacity:qt,numOctaves:ms},bc={...Fn,color:L,backgroundColor:L,outlineColor:L,fill:L,stroke:L,borderColor:L,borderTopColor:L,borderRightColor:L,borderBottomColor:L,borderLeftColor:L,filter:ln,WebkitFilter:ln,mask:hn,WebkitMask:hn},bo=t=>bc[t],_c=new Set([ln,hn]);function _o(t,e){let n=bo(t);return _c.has(n)||(n=Z),n.getAnimatableNone?n.getAnimatableNone(e):void 0}const Tc=new Set(["auto","none","0"]);function Ac(t,e,n){let s=0,i;for(;s<t.length&&!i;){const a=t[s];typeof a=="string"&&!Tc.has(a)&&At(a).values.length&&(i=t[s]),s++}if(i&&n)for(const a of e)t[a]=_o(n,i)}class Sc extends En{constructor(e,n,s,i,a){super(e,n,s,i,a,!0)}readKeyframes(){const{unresolvedKeyframes:e,element:n,name:s}=this;if(!n||!n.current)return;super.readKeyframes();for(let l=0;l<e.length;l++){let u=e[l];if(typeof u=="string"&&(u=u.trim(),An(u))){const f=yo(u,n.current);f!==void 0&&(e[l]=f),l===e.length-1&&(this.finalKeyframe=u)}}if(this.resolveNoneKeyframes(),!go.has(s)||e.length!==2)return;const[i,a]=e,o=ys(i),r=ys(a),c=es(i),h=es(a);if(c!==h&&lt[s]){this.needsMeasurement=!0;return}if(o!==r)if(hs(o)&&hs(r))for(let l=0;l<e.length;l++){const u=e[l];typeof u=="string"&&(e[l]=parseFloat(u))}else lt[s]&&(this.needsMeasurement=!0)}resolveNoneKeyframes(){const{unresolvedKeyframes:e,name:n}=this,s=[];for(let i=0;i<e.length;i++)(e[i]===null||kc(e[i]))&&s.push(i);s.length&&Ac(e,s,n)}measureInitialState(){const{element:e,unresolvedKeyframes:n,name:s}=this;if(!e||!e.current)return;s==="height"&&(this.suspendedScrollY=window.pageYOffset),this.measuredOrigin=lt[s](e.measureViewportBox(),window.getComputedStyle(e.current)),n[0]=this.measuredOrigin;const i=n[n.length-1];i!==void 0&&e.getValue(s,i).jump(i,!1)}measureEndState(){var r;const{element:e,name:n,unresolvedKeyframes:s}=this;if(!e||!e.current)return;const i=e.getValue(n);i&&i.jump(this.measuredOrigin,!1);const a=s.length-1,o=s[a];s[a]=lt[n](e.measureViewportBox(),window.getComputedStyle(e.current)),o!==null&&this.finalKeyframe===void 0&&(this.finalKeyframe=o),(r=this.removedTransforms)!=null&&r.length&&this.removedTransforms.forEach(([c,h])=>{e.getValue(c).set(h)}),this.resolveNoneKeyframes()}}function To(t,e,n){if(t==null)return[];if(t instanceof EventTarget)return[t];if(typeof t=="string"){const i=document.querySelectorAll(t);return i?Array.from(i):[]}return Array.from(t).filter(s=>s!=null)}const Ao=(t,e)=>e&&typeof t=="number"?e.transform(t):t;function jt(t){return Ni(t)&&"offsetHeight"in t&&!("ownerSVGElement"in t)}const{schedule:In}=Oi(queueMicrotask,!1),X={x:!1,y:!1};function So(){return X.x||X.y}function Vc(t){return t==="x"||t==="y"?X[t]?null:(X[t]=!0,()=>{X[t]=!1}):X.x||X.y?null:(X.x=X.y=!0,()=>{X.x=X.y=!1})}function Vo(t,e){const n=To(t),s=new AbortController,i={passive:!0,...e,signal:s.signal};return[n,i,()=>s.abort()]}function Cc(t){return!(t.pointerType==="touch"||So())}function Pc(t,e,n={}){const[s,i,a]=Vo(t,n);return s.forEach(o=>{let r=!1,c=!1,h;const l=()=>{o.removeEventListener("pointerleave",y)},u=m=>{h&&(h(m),h=void 0),l()},f=m=>{r=!1,window.removeEventListener("pointerup",f),window.removeEventListener("pointercancel",f),c&&(c=!1,u(m))},p=()=>{r=!0,window.addEventListener("pointerup",f,i),window.addEventListener("pointercancel",f,i)},y=m=>{if(m.pointerType!=="touch"){if(r){c=!0;return}u(m)}},k=m=>{if(!Cc(m))return;c=!1;const g=e(o,m);typeof g=="function"&&(h=g,o.addEventListener("pointerleave",y,i))};o.addEventListener("pointerenter",k,i),o.addEventListener("pointerdown",p,i)}),a}const Co=(t,e)=>e?t===e?!0:Co(t,e.parentElement):!1,Hn=t=>t.pointerType==="mouse"?typeof t.button!="number"||t.button<=0:t.isPrimary!==!1,Nc=new Set(["BUTTON","INPUT","SELECT","TEXTAREA","A"]);function $c(t){return Nc.has(t.tagName)||t.isContentEditable===!0}const Ec=new Set(["INPUT","SELECT","TEXTAREA"]);function Lc(t){return Ec.has(t.tagName)||t.isContentEditable===!0}const re=new WeakSet;function gs(t){return e=>{e.key==="Enter"&&t(e)}}function De(t,e){t.dispatchEvent(new PointerEvent("pointer"+e,{isPrimary:!0,bubbles:!0}))}const Dc=(t,e)=>{const n=t.currentTarget;if(!n)return;const s=gs(()=>{if(re.has(n))return;De(n,"down");const i=gs(()=>{De(n,"up")}),a=()=>De(n,"cancel");n.addEventListener("keyup",i,e),n.addEventListener("blur",a,e)});n.addEventListener("keydown",s,e),n.addEventListener("blur",()=>n.removeEventListener("keydown",s),e)};function ks(t){return Hn(t)&&!So()}const vs=new WeakSet;function Rc(t,e,n={}){const[s,i,a]=Vo(t,n),o=r=>{const c=r.currentTarget;if(!ks(r)||vs.has(r))return;re.add(c),n.stopPropagation&&vs.add(r);const h=e(c,r),l=(p,y)=>{window.removeEventListener("pointerup",u),window.removeEventListener("pointercancel",f),re.has(c)&&re.delete(c),ks(p)&&typeof h=="function"&&h(p,{success:y})},u=p=>{l(p,c===window||c===document||n.useGlobalTarget||Co(c,p.target))},f=p=>{l(p,!1)};window.addEventListener("pointerup",u,i),window.addEventListener("pointercancel",f,i)};return s.forEach(r=>{(n.useGlobalTarget?window:r).addEventListener("pointerdown",o,i),jt(r)&&(r.addEventListener("focus",h=>Dc(h,i)),!$c(r)&&!r.hasAttribute("tabindex")&&(r.tabIndex=0))}),a}function qn(t){return Ni(t)&&"ownerSVGElement"in t}const ce=new WeakMap;let ct;const Po=(t,e,n)=>(s,i)=>i&&i[0]?i[0][t+"Size"]:qn(s)&&"getBBox"in s?s.getBBox()[e]:s[n],jc=Po("inline","width","offsetWidth"),zc=Po("block","height","offsetHeight");function Bc({target:t,borderBoxSize:e}){var n;(n=ce.get(t))==null||n.forEach(s=>{s(t,{get width(){return jc(t,e)},get height(){return zc(t,e)}})})}function Fc(t){t.forEach(Bc)}function Ic(){typeof ResizeObserver>"u"||(ct=new ResizeObserver(Fc))}function Hc(t,e){ct||Ic();const n=To(t);return n.forEach(s=>{let i=ce.get(s);i||(i=new Set,ce.set(s,i)),i.add(e),ct==null||ct.observe(s)}),()=>{n.forEach(s=>{const i=ce.get(s);i==null||i.delete(e),i!=null&&i.size||ct==null||ct.unobserve(s)})}}const le=new Set;let bt;function qc(){bt=()=>{const t={get width(){return window.innerWidth},get height(){return window.innerHeight}};le.forEach(e=>e(t))},window.addEventListener("resize",bt)}function Oc(t){return le.add(t),bt||qc(),()=>{le.delete(t),!le.size&&typeof bt=="function"&&(window.removeEventListener("resize",bt),bt=void 0)}}function dn(t,e){return typeof t=="function"?Oc(t):Hc(t,e)}function No(t,e){let n;const s=()=>{const{currentTime:i}=e,o=(i===null?0:i.value)/100;n!==o&&t(o),n=o};return V.preUpdate(s,!0),()=>K(s)}function Wc(t){return qn(t)&&t.tagName==="svg"}function Uc(...t){const e=!Array.isArray(t[0]),n=e?0:-1,s=t[0+n],i=t[1+n],a=t[2+n],o=t[3+n],r=Nn(i,a,o);return e?r(s):r}function Kc(t,e,n={}){const s=t.get();let i=null,a=s,o;const r=typeof s=="string"?s.replace(/[\d.-]/g,""):void 0,c=()=>{i&&(i.stop(),i=null),t.animation=void 0},h=()=>{const u=xs(t.get()),f=xs(a);if(u===f){c();return}const p=i?i.getGeneratorVelocity():t.getVelocity();c(),i=new Ot({keyframes:[u,f],velocity:p,type:"spring",restDelta:.001,restSpeed:.01,...n,onUpdate:o})},l=()=>{var u;h(),t.animation=i??void 0,(u=t.events.animationStart)==null||u.notify(),i==null||i.then(()=>{var f;t.animation=void 0,(f=t.events.animationComplete)==null||f.notify()})};if(t.attach((u,f)=>{a=u,o=p=>f(Re(p,r)),V.postRender(l)},c),D(e)){let u=n.skipInitialAnimation===!0;const f=e.on("change",y=>{u?(u=!1,t.jump(Re(y,r),!1)):t.set(Re(y,r))}),p=t.on("destroy",f);return()=>{f(),p()}}return c}function Re(t,e){return e?t+e:t}function xs(t){return typeof t=="number"?t:parseFloat(t)}const Gc=[...wo,L,Z],Xc=t=>Gc.find(Mo(t)),Ms=()=>({translate:0,scale:1,origin:0,originPoint:0}),_t=()=>({x:Ms(),y:Ms()}),ws=()=>({min:0,max:0}),R=()=>({x:ws(),y:ws()}),Yc=new WeakMap;function Ae(t){return t!==null&&typeof t=="object"&&typeof t.start=="function"}function Wt(t){return typeof t=="string"||Array.isArray(t)}const On=["animate","whileInView","whileFocus","whileHover","whileTap","whileDrag","exit"],Wn=["initial",...On];function Se(t){return Ae(t.animate)||Wn.some(e=>Wt(t[e]))}function $o(t){return!!(Se(t)||t.variants)}function Zc(t,e,n){for(const s in e){const i=e[s],a=n[s];if(D(i))t.addValue(s,i);else if(D(a))t.addValue(s,Y(i,{owner:t}));else if(a!==i)if(t.hasValue(s)){const o=t.getValue(s);o.liveStyle===!0?o.jump(i):o.hasAnimated||o.set(i)}else{const o=t.getStaticValue(s);t.addValue(s,Y(o!==void 0?o:i,{owner:t}))}}for(const s in n)e[s]===void 0&&t.removeValue(s);return e}const ge={current:null},Un={current:!1},Jc=typeof window<"u";function Eo(){if(Un.current=!0,!!Jc)if(window.matchMedia){const t=window.matchMedia("(prefers-reduced-motion)"),e=()=>ge.current=t.matches;t.addEventListener("change",e),e()}else ge.current=!1}const bs=["AnimationStart","AnimationComplete","Update","BeforeLayoutMeasure","LayoutMeasure","LayoutAnimationStart","LayoutAnimationComplete"];let ke={};function Lo(t){ke=t}function Qc(){return ke}class t1{scrapeMotionValuesFromProps(e,n,s){return{}}constructor({parent:e,props:n,presenceContext:s,reducedMotionConfig:i,skipAnimations:a,blockInitialAnimation:o,visualState:r},c={}){this.current=null,this.children=new Set,this.isVariantNode=!1,this.isControllingVariants=!1,this.shouldReduceMotion=null,this.shouldSkipAnimations=!1,this.values=new Map,this.KeyframeResolver=En,this.features={},this.valueSubscriptions=new Map,this.prevMotionValues={},this.hasBeenMounted=!1,this.events={},this.propEventSubscriptions={},this.notifyUpdate=()=>this.notify("Update",this.latestValues),this.render=()=>{this.current&&(this.triggerBuild(),this.renderInstance(this.current,this.renderState,this.props.style,this.projection))},this.renderScheduledAt=0,this.scheduleRender=()=>{const p=F.now();this.renderScheduledAt<p&&(this.renderScheduledAt=p,V.render(this.render,!1,!0))};const{latestValues:h,renderState:l}=r;this.latestValues=h,this.baseTarget={...h},this.initialValues=n.initial?{...h}:{},this.renderState=l,this.parent=e,this.props=n,this.presenceContext=s,this.depth=e?e.depth+1:0,this.reducedMotionConfig=i,this.skipAnimationsConfig=a,this.options=c,this.blockInitialAnimation=!!o,this.isControllingVariants=Se(n),this.isVariantNode=$o(n),this.isVariantNode&&(this.variantChildren=new Set),this.manuallyAnimateOnMount=!!(e&&e.current);const{willChange:u,...f}=this.scrapeMotionValuesFromProps(n,{},this);for(const p in f){const y=f[p];h[p]!==void 0&&D(y)&&y.set(h[p])}}mount(e){var n,s;if(this.hasBeenMounted)for(const i in this.initialValues)(n=this.values.get(i))==null||n.jump(this.initialValues[i]),this.latestValues[i]=this.initialValues[i];this.current=e,Yc.set(e,this),this.projection&&!this.projection.instance&&this.projection.mount(e),this.parent&&this.isVariantNode&&!this.isControllingVariants&&(this.removeFromVariantTree=this.parent.addVariantChild(this)),this.values.forEach((i,a)=>this.bindToMotionValue(a,i)),this.reducedMotionConfig==="never"?this.shouldReduceMotion=!1:this.reducedMotionConfig==="always"?this.shouldReduceMotion=!0:(Un.current||Eo(),this.shouldReduceMotion=ge.current),this.shouldSkipAnimations=this.skipAnimationsConfig??!1,(s=this.parent)==null||s.addChild(this),this.update(this.props,this.presenceContext),this.hasBeenMounted=!0}unmount(){var e;this.projection&&this.projection.unmount(),K(this.notifyUpdate),K(this.render),this.valueSubscriptions.forEach(n=>n()),this.valueSubscriptions.clear(),this.removeFromVariantTree&&this.removeFromVariantTree(),(e=this.parent)==null||e.removeChild(this);for(const n in this.events)this.events[n].clear();for(const n in this.features){const s=this.features[n];s&&(s.unmount(),s.isMounted=!1)}this.current=null}addChild(e){this.children.add(e),this.enteringChildren??(this.enteringChildren=new Set),this.enteringChildren.add(e)}removeChild(e){this.children.delete(e),this.enteringChildren&&this.enteringChildren.delete(e)}bindToMotionValue(e,n){if(this.valueSubscriptions.has(e)&&this.valueSubscriptions.get(e)(),n.accelerate&&fo.has(e)&&this.current instanceof HTMLElement){const{factory:o,keyframes:r,times:c,ease:h,duration:l}=n.accelerate,u=new ho({element:this.current,name:e,keyframes:r,times:c,ease:h,duration:q(l)}),f=o(u);this.valueSubscriptions.set(e,()=>{f(),u.cancel()});return}const s=Ct.has(e);s&&this.onBindTransform&&this.onBindTransform();const i=n.on("change",o=>{this.latestValues[e]=o,this.props.onUpdate&&V.preRender(this.notifyUpdate),s&&this.projection&&(this.projection.isTransformDirty=!0),this.scheduleRender()});let a;typeof window<"u"&&window.MotionCheckAppearSync&&(a=window.MotionCheckAppearSync(this,e,n)),this.valueSubscriptions.set(e,()=>{i(),a&&a(),n.owner&&n.stop()})}sortNodePosition(e){return!this.current||!this.sortInstanceNodePosition||this.type!==e.type?0:this.sortInstanceNodePosition(this.current,e.current)}updateFeatures(){let e="animation";for(e in ke){const n=ke[e];if(!n)continue;const{isEnabled:s,Feature:i}=n;if(!this.features[e]&&i&&s(this.props)&&(this.features[e]=new i(this)),this.features[e]){const a=this.features[e];a.isMounted?a.update():(a.mount(),a.isMounted=!0)}}}triggerBuild(){this.build(this.renderState,this.latestValues,this.props)}measureViewportBox(){return this.current?this.measureInstanceViewportBox(this.current,this.props):R()}getStaticValue(e){return this.latestValues[e]}setStaticValue(e,n){this.latestValues[e]=n}update(e,n){(e.transformTemplate||this.props.transformTemplate)&&this.scheduleRender(),this.prevProps=this.props,this.props=e,this.prevPresenceContext=this.presenceContext,this.presenceContext=n;for(let s=0;s<bs.length;s++){const i=bs[s];this.propEventSubscriptions[i]&&(this.propEventSubscriptions[i](),delete this.propEventSubscriptions[i]);const a="on"+i,o=e[a];o&&(this.propEventSubscriptions[i]=this.on(i,o))}this.prevMotionValues=Zc(this,this.scrapeMotionValuesFromProps(e,this.prevProps||{},this),this.prevMotionValues),this.handleChildMotionValue&&this.handleChildMotionValue()}getProps(){return this.props}getVariant(e){return this.props.variants?this.props.variants[e]:void 0}getDefaultTransition(){return this.props.transition}getTransformPagePoint(){return this.props.transformPagePoint}getClosestVariantNode(){return this.isVariantNode?this:this.parent?this.parent.getClosestVariantNode():void 0}addVariantChild(e){const n=this.getClosestVariantNode();if(n)return n.variantChildren&&n.variantChildren.add(e),()=>n.variantChildren.delete(e)}addValue(e,n){const s=this.values.get(e);n!==s&&(s&&this.removeValue(e),this.bindToMotionValue(e,n),this.values.set(e,n),this.latestValues[e]=n.get())}removeValue(e){this.values.delete(e);const n=this.valueSubscriptions.get(e);n&&(n(),this.valueSubscriptions.delete(e)),delete this.latestValues[e],this.removeValueFromRenderState(e,this.renderState)}hasValue(e){return this.values.has(e)}getValue(e,n){if(this.props.values&&this.props.values[e])return this.props.values[e];let s=this.values.get(e);return s===void 0&&n!==void 0&&(s=Y(n===null?void 0:n,{owner:this}),this.addValue(e,s)),s}readValue(e,n){let s=this.latestValues[e]!==void 0||!this.current?this.latestValues[e]:this.getBaseTargetFromProps(this.props,e)??this.readValueFromInstance(this.current,e,this.options);return s!=null&&(typeof s=="string"&&(Pi(s)||$i(s))?s=parseFloat(s):!Xc(s)&&Z.test(n)&&(s=_o(e,n)),this.setBaseTarget(e,D(s)?s.get():s)),D(s)?s.get():s}setBaseTarget(e,n){this.baseTarget[e]=n}getBaseTarget(e){var a;const{initial:n}=this.props;let s;if(typeof n=="string"||typeof n=="object"){const o=zn(this.props,n,(a=this.presenceContext)==null?void 0:a.custom);o&&(s=o[e])}if(n&&s!==void 0)return s;const i=this.getBaseTargetFromProps(this.props,e);return i!==void 0&&!D(i)?i:this.initialValues[e]!==void 0&&s===void 0?void 0:this.baseTarget[e]}on(e,n){return this.events[e]||(this.events[e]=new wn),this.events[e].add(n)}notify(e,...n){this.events[e]&&this.events[e].notify(...n)}scheduleRenderMicrotask(){In.render(this.render)}}class Do extends t1{constructor(){super(...arguments),this.KeyframeResolver=Sc}sortInstanceNodePosition(e,n){return e.compareDocumentPosition(n)&2?1:-1}getBaseTargetFromProps(e,n){const s=e.style;return s?s[n]:void 0}removeValueFromRenderState(e,{vars:n,style:s}){delete n[e],delete s[e]}handleChildMotionValue(){this.childSubscription&&(this.childSubscription(),delete this.childSubscription);const{children:e}=this.props;D(e)&&(this.childSubscription=e.on("change",n=>{this.current&&(this.current.textContent=`${n}`)}))}}class dt{constructor(e){this.isMounted=!1,this.node=e}update(){}}function Ro({top:t,left:e,right:n,bottom:s}){return{x:{min:e,max:n},y:{min:t,max:s}}}function e1({x:t,y:e}){return{top:e.min,right:t.max,bottom:e.max,left:t.min}}function n1(t,e){if(!e)return t;const n=e({x:t.left,y:t.top}),s=e({x:t.right,y:t.bottom});return{top:n.y,left:n.x,bottom:s.y,right:s.x}}function je(t){return t===void 0||t===1}function un({scale:t,scaleX:e,scaleY:n}){return!je(t)||!je(e)||!je(n)}function pt(t){return un(t)||jo(t)||t.z||t.rotate||t.rotateX||t.rotateY||t.skewX||t.skewY}function jo(t){return _s(t.x)||_s(t.y)}function _s(t){return t&&t!=="0%"}function ve(t,e,n){const s=t-n,i=e*s;return n+i}function Ts(t,e,n,s,i){return i!==void 0&&(t=ve(t,i,s)),ve(t,n,s)+e}function fn(t,e=0,n=1,s,i){t.min=Ts(t.min,e,n,s,i),t.max=Ts(t.max,e,n,s,i)}function zo(t,{x:e,y:n}){fn(t.x,e.translate,e.scale,e.originPoint),fn(t.y,n.translate,n.scale,n.originPoint)}const As=.999999999999,Ss=1.0000000000001;function s1(t,e,n,s=!1){var r;const i=n.length;if(!i)return;e.x=e.y=1;let a,o;for(let c=0;c<i;c++){a=n[c],o=a.projectionDelta;const{visualElement:h}=a.options;h&&h.props.style&&h.props.style.display==="contents"||(s&&a.options.layoutScroll&&a.scroll&&a!==a.root&&(nt(t.x,-a.scroll.offset.x),nt(t.y,-a.scroll.offset.y)),o&&(e.x*=o.x.scale,e.y*=o.y.scale,zo(t,o)),s&&pt(a.latestValues)&&he(t,a.latestValues,(r=a.layout)==null?void 0:r.layoutBox))}e.x<Ss&&e.x>As&&(e.x=1),e.y<Ss&&e.y>As&&(e.y=1)}function nt(t,e){t.min+=e,t.max+=e}function Vs(t,e,n,s,i=.5){const a=P(t.min,t.max,i);fn(t,e,n,a,s)}function Cs(t,e){return typeof t=="string"?parseFloat(t)/100*(e.max-e.min):t}function he(t,e,n){const s=n??t;Vs(t.x,Cs(e.x,s.x),e.scaleX,e.scale,e.originX),Vs(t.y,Cs(e.y,s.y),e.scaleY,e.scale,e.originY)}function Bo(t,e){return Ro(n1(t.getBoundingClientRect(),e))}function i1(t,e,n){const s=Bo(t,n),{scroll:i}=e;return i&&(nt(s.x,i.offset.x),nt(s.y,i.offset.y)),s}const o1={x:"translateX",y:"translateY",z:"translateZ",transformPerspective:"perspective"},a1=Vt.length;function r1(t,e,n){let s="",i=!0;for(let a=0;a<a1;a++){const o=Vt[a],r=t[o];if(r===void 0)continue;let c=!0;if(typeof r=="number")c=r===(o.startsWith("scale")?1:0);else{const h=parseFloat(r);c=o.startsWith("scale")?h===1:h===0}if(!c||n){const h=Ao(r,Fn[o]);if(!c){i=!1;const l=o1[o]||o;s+=`${l}(${h}) `}n&&(e[o]=h)}}return s=s.trim(),n?s=n(e,i?"":s):i&&(s="none"),s}function Kn(t,e,n){const{style:s,vars:i,transformOrigin:a}=t;let o=!1,r=!1;for(const c in e){const h=e[c];if(Ct.has(c)){o=!0;continue}else if(Ui(c)){i[c]=h;continue}else{const l=Ao(h,Fn[c]);c.startsWith("origin")?(r=!0,a[c]=l):s[c]=l}}if(e.transform||(o||n?s.transform=r1(e,t.transform,n):s.transform&&(s.transform="none")),r){const{originX:c="50%",originY:h="50%",originZ:l=0}=a;s.transformOrigin=`${c} ${h} ${l}`}}function Fo(t,{style:e,vars:n},s,i){const a=t.style;let o;for(o in e)a[o]=e[o];i==null||i.applyProjectionStyles(a,s);for(o in n)a.setProperty(o,n[o])}function Ps(t,e){return e.max===e.min?0:t/(e.max-e.min)*100}const Pt={correct:(t,e)=>{if(!e.target)return t;if(typeof t=="string")if(b.test(t))t=parseFloat(t);else return t;const n=Ps(t,e.target.x),s=Ps(t,e.target.y);return`${n}% ${s}%`}},c1={correct:(t,{treeScale:e,projectionDelta:n})=>{const s=t,i=Z.parse(t);if(i.length>5)return s;const a=Z.createTransformer(t),o=typeof i[0]!="number"?1:0,r=n.x.scale*e.x,c=n.y.scale*e.y;i[0+o]/=r,i[1+o]/=c;const h=P(r,c,.5);return typeof i[2+o]=="number"&&(i[2+o]/=h),typeof i[3+o]=="number"&&(i[3+o]/=h),a(i)}},pn={borderRadius:{...Pt,applyTo:["borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius"]},borderTopLeftRadius:Pt,borderTopRightRadius:Pt,borderBottomLeftRadius:Pt,borderBottomRightRadius:Pt,boxShadow:c1};function Io(t,{layout:e,layoutId:n}){return Ct.has(t)||t.startsWith("origin")||(e||n!==void 0)&&(!!pn[t]||t==="opacity")}function Gn(t,e,n){var o;const s=t.style,i=e==null?void 0:e.style,a={};if(!s)return a;for(const r in s)(D(s[r])||i&&D(i[r])||Io(r,t)||((o=n==null?void 0:n.getValue(r))==null?void 0:o.liveStyle)!==void 0)&&(a[r]=s[r]);return a}function l1(t){return window.getComputedStyle(t)}class h1 extends Do{constructor(){super(...arguments),this.type="html",this.renderInstance=Fo}readValueFromInstance(e,n){var s;if(Ct.has(n))return(s=this.projection)!=null&&s.isProjecting?Qe(n):Pr(e,n);{const i=l1(e),a=(Ui(n)?i.getPropertyValue(n):i[n])||0;return typeof a=="string"?a.trim():a}}measureInstanceViewportBox(e,{transformPagePoint:n}){return Bo(e,n)}build(e,n,s){Kn(e,n,s.transformTemplate)}scrapeMotionValuesFromProps(e,n,s){return Gn(e,n,s)}}const d1={offset:"stroke-dashoffset",array:"stroke-dasharray"},u1={offset:"strokeDashoffset",array:"strokeDasharray"};function f1(t,e,n=1,s=0,i=!0){t.pathLength=1;const a=i?d1:u1;t[a.offset]=`${-s}`,t[a.array]=`${e} ${n}`}const p1=["offsetDistance","offsetPath","offsetRotate","offsetAnchor"];function Ho(t,{attrX:e,attrY:n,attrScale:s,pathLength:i,pathSpacing:a=1,pathOffset:o=0,...r},c,h,l){if(Kn(t,r,h),c){t.style.viewBox&&(t.attrs.viewBox=t.style.viewBox);return}t.attrs=t.style,t.style={};const{attrs:u,style:f}=t;u.transform&&(f.transform=u.transform,delete u.transform),(f.transform||u.transformOrigin)&&(f.transformOrigin=u.transformOrigin??"50% 50%",delete u.transformOrigin),f.transform&&(f.transformBox=(l==null?void 0:l.transformBox)??"fill-box",delete u.transformBox);for(const p of p1)u[p]!==void 0&&(f[p]=u[p],delete u[p]);e!==void 0&&(u.x=e),n!==void 0&&(u.y=n),s!==void 0&&(u.scale=s),i!==void 0&&f1(u,i,a,o,!1)}const qo=new Set(["baseFrequency","diffuseConstant","kernelMatrix","kernelUnitLength","keySplines","keyTimes","limitingConeAngle","markerHeight","markerWidth","numOctaves","targetX","targetY","surfaceScale","specularConstant","specularExponent","stdDeviation","tableValues","viewBox","gradientTransform","pathLength","startOffset","textLength","lengthAdjust"]),Oo=t=>typeof t=="string"&&t.toLowerCase()==="svg";function y1(t,e,n,s){Fo(t,e,void 0,s);for(const i in e.attrs)t.setAttribute(qo.has(i)?i:Bn(i),e.attrs[i])}function Wo(t,e,n){const s=Gn(t,e,n);for(const i in t)if(D(t[i])||D(e[i])){const a=Vt.indexOf(i)!==-1?"attr"+i.charAt(0).toUpperCase()+i.substring(1):i;s[a]=t[i]}return s}class m1 extends Do{constructor(){super(...arguments),this.type="svg",this.isSVGTag=!1,this.measureInstanceViewportBox=R}getBaseTargetFromProps(e,n){return e[n]}readValueFromInstance(e,n){if(Ct.has(n)){const s=bo(n);return s&&s.default||0}return n=qo.has(n)?n:Bn(n),e.getAttribute(n)}scrapeMotionValuesFromProps(e,n,s){return Wo(e,n,s)}build(e,n,s){Ho(e,n,this.isSVGTag,s.transformTemplate,s.style)}renderInstance(e,n,s,i){y1(e,n,s,i)}mount(e){this.isSVGTag=Oo(e.tagName),super.mount(e)}}const g1=Wn.length;function Uo(t){if(!t)return;if(!t.isControllingVariants){const n=t.parent?Uo(t.parent)||{}:{};return t.props.initial!==void 0&&(n.initial=t.props.initial),n}const e={};for(let n=0;n<g1;n++){const s=Wn[n],i=t.props[s];(Wt(i)||i===!1)&&(e[s]=i)}return e}function Ko(t,e){if(!Array.isArray(e))return!1;const n=e.length;if(n!==t.length)return!1;for(let s=0;s<n;s++)if(e[s]!==t[s])return!1;return!0}const k1=[...On].reverse(),v1=On.length;function x1(t){return e=>Promise.all(e.map(({animation:n,options:s})=>mc(t,n,s)))}function M1(t){let e=x1(t),n=Ns(),s=!0,i=!1;const a=h=>(l,u)=>{var p;const f=kt(t,u,h==="exit"?(p=t.presenceContext)==null?void 0:p.custom:void 0);if(f){const{transition:y,transitionEnd:k,...m}=f;l={...l,...m,...k}}return l};function o(h){e=h(t)}function r(h){const{props:l}=t,u=Uo(t.parent)||{},f=[],p=new Set;let y={},k=1/0;for(let g=0;g<v1;g++){const M=k1[g],x=n[M],w=l[M]!==void 0?l[M]:u[M],_=Wt(w),C=M===h?x.isActive:null;C===!1&&(k=g);let $=w===u[M]&&w!==l[M]&&_;if($&&(s||i)&&t.manuallyAnimateOnMount&&($=!1),x.protectedKeys={...y},!x.isActive&&C===null||!w&&!x.prevProp||Ae(w)||typeof w=="boolean")continue;if(M==="exit"&&x.isActive&&C!==!0){x.prevResolvedValues&&(y={...y,...x.prevResolvedValues});continue}const A=w1(x.prevProp,w);let S=A||M===h&&x.isActive&&!$&&_||g>k&&_,T=!1;const N=Array.isArray(w)?w:[w];let z=N.reduce(a(M),{});C===!1&&(z={});const{prevResolvedValues:ot={}}=x,Q={...ot,...z},at=B=>{S=!0,p.has(B)&&(T=!0,p.delete(B)),x.needsAnimating[B]=!0;const O=t.getValue(B);O&&(O.liveStyle=!1)};for(const B in Q){const O=z[B],ut=ot[B];if(y.hasOwnProperty(B))continue;let vt=!1;an(O)&&an(ut)?vt=!Ko(O,ut):vt=O!==ut,vt?O!=null?at(B):p.add(B):O!==void 0&&p.has(B)?at(B):x.protectedKeys[B]=!0}x.prevProp=w,x.prevResolvedValues=z,x.isActive&&(y={...y,...z}),(s||i)&&t.blockInitialAnimation&&(S=!1);const tt=$&&A;S&&(!tt||T)&&f.push(...N.map(B=>{const O={type:M};if(typeof B=="string"&&(s||i)&&!tt&&t.manuallyAnimateOnMount&&t.parent){const{parent:ut}=t,vt=kt(ut,B);if(ut.enteringChildren&&vt){const{delayChildren:_a}=vt.transition||{};O.delay=po(ut.enteringChildren,t,_a)}}return{animation:B,options:O}}))}if(p.size){const g={};if(typeof l.initial!="boolean"){const M=kt(t,Array.isArray(l.initial)?l.initial[0]:l.initial);M&&M.transition&&(g.transition=M.transition)}p.forEach(M=>{const x=t.getBaseTarget(M),w=t.getValue(M);w&&(w.liveStyle=!0),g[M]=x??null}),f.push({animation:g})}let m=!!f.length;return s&&(l.initial===!1||l.initial===l.animate)&&!t.manuallyAnimateOnMount&&(m=!1),s=!1,i=!1,m?e(f):Promise.resolve()}function c(h,l){var f;if(n[h].isActive===l)return Promise.resolve();(f=t.variantChildren)==null||f.forEach(p=>{var y;return(y=p.animationState)==null?void 0:y.setActive(h,l)}),n[h].isActive=l;const u=r(h);for(const p in n)n[p].protectedKeys={};return u}return{animateChanges:r,setActive:c,setAnimateFunction:o,getState:()=>n,reset:()=>{n=Ns(),i=!0}}}function w1(t,e){return typeof e=="string"?e!==t:Array.isArray(e)?!Ko(e,t):!1}function ft(t=!1){return{isActive:t,protectedKeys:{},needsAnimating:{},prevResolvedValues:{}}}function Ns(){return{animate:ft(!0),whileInView:ft(),whileHover:ft(),whileTap:ft(),whileDrag:ft(),whileFocus:ft(),exit:ft()}}function yn(t,e){t.min=e.min,t.max=e.max}function G(t,e){yn(t.x,e.x),yn(t.y,e.y)}function $s(t,e){t.translate=e.translate,t.scale=e.scale,t.originPoint=e.originPoint,t.origin=e.origin}const Go=1e-4,b1=1-Go,_1=1+Go,Xo=.01,T1=0-Xo,A1=0+Xo;function I(t){return t.max-t.min}function S1(t,e,n){return Math.abs(t-e)<=n}function Es(t,e,n,s=.5){t.origin=s,t.originPoint=P(e.min,e.max,t.origin),t.scale=I(n)/I(e),t.translate=P(n.min,n.max,t.origin)-t.originPoint,(t.scale>=b1&&t.scale<=_1||isNaN(t.scale))&&(t.scale=1),(t.translate>=T1&&t.translate<=A1||isNaN(t.translate))&&(t.translate=0)}function zt(t,e,n,s){Es(t.x,e.x,n.x,s?s.originX:void 0),Es(t.y,e.y,n.y,s?s.originY:void 0)}function Ls(t,e,n,s=0){const i=s?P(n.min,n.max,s):n.min;t.min=i+e.min,t.max=t.min+I(e)}function V1(t,e,n,s){Ls(t.x,e.x,n.x,s==null?void 0:s.x),Ls(t.y,e.y,n.y,s==null?void 0:s.y)}function Ds(t,e,n,s=0){const i=s?P(n.min,n.max,s):n.min;t.min=e.min-i,t.max=t.min+I(e)}function xe(t,e,n,s){Ds(t.x,e.x,n.x,s==null?void 0:s.x),Ds(t.y,e.y,n.y,s==null?void 0:s.y)}function Rs(t,e,n,s,i){return t-=e,t=ve(t,1/n,s),i!==void 0&&(t=ve(t,1/i,s)),t}function C1(t,e=0,n=1,s=.5,i,a=t,o=t){if(st.test(e)&&(e=parseFloat(e),e=P(o.min,o.max,e/100)-o.min),typeof e!="number")return;let r=P(a.min,a.max,s);t===a&&(r-=e),t.min=Rs(t.min,e,n,r,i),t.max=Rs(t.max,e,n,r,i)}function js(t,e,[n,s,i],a,o){C1(t,e[n],e[s],e[i],e.scale,a,o)}const P1=["x","scaleX","originX"],N1=["y","scaleY","originY"];function zs(t,e,n,s){js(t.x,e,P1,n?n.x:void 0,s?s.x:void 0),js(t.y,e,N1,n?n.y:void 0,s?s.y:void 0)}function Bs(t){return t.translate===0&&t.scale===1}function Yo(t){return Bs(t.x)&&Bs(t.y)}function Fs(t,e){return t.min===e.min&&t.max===e.max}function $1(t,e){return Fs(t.x,e.x)&&Fs(t.y,e.y)}function Is(t,e){return Math.round(t.min)===Math.round(e.min)&&Math.round(t.max)===Math.round(e.max)}function Zo(t,e){return Is(t.x,e.x)&&Is(t.y,e.y)}function Hs(t){return I(t.x)/I(t.y)}function qs(t,e){return t.translate===e.translate&&t.scale===e.scale&&t.originPoint===e.originPoint}function et(t){return[t("x"),t("y")]}function E1(t,e,n){let s="";const i=t.x.translate/e.x,a=t.y.translate/e.y,o=(n==null?void 0:n.z)||0;if((i||a||o)&&(s=`translate3d(${i}px, ${a}px, ${o}px) `),(e.x!==1||e.y!==1)&&(s+=`scale(${1/e.x}, ${1/e.y}) `),n){const{transformPerspective:h,rotate:l,rotateX:u,rotateY:f,skewX:p,skewY:y}=n;h&&(s=`perspective(${h}px) ${s}`),l&&(s+=`rotate(${l}deg) `),u&&(s+=`rotateX(${u}deg) `),f&&(s+=`rotateY(${f}deg) `),p&&(s+=`skewX(${p}deg) `),y&&(s+=`skewY(${y}deg) `)}const r=t.x.scale*e.x,c=t.y.scale*e.y;return(r!==1||c!==1)&&(s+=`scale(${r}, ${c})`),s||"none"}const Jo=["borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius"],L1=Jo.length,Os=t=>typeof t=="string"?parseFloat(t):t,Ws=t=>typeof t=="number"||b.test(t);function D1(t,e,n,s,i,a){i?(t.opacity=P(0,n.opacity??1,R1(s)),t.opacityExit=P(e.opacity??1,0,j1(s))):a&&(t.opacity=P(e.opacity??1,n.opacity??1,s));for(let o=0;o<L1;o++){const r=Jo[o];let c=Us(e,r),h=Us(n,r);if(c===void 0&&h===void 0)continue;c||(c=0),h||(h=0),c===0||h===0||Ws(c)===Ws(h)?(t[r]=Math.max(P(Os(c),Os(h),s),0),(st.test(h)||st.test(c))&&(t[r]+="%")):t[r]=h}(e.rotate||n.rotate)&&(t.rotate=P(e.rotate||0,n.rotate||0,s))}function Us(t,e){return t[e]!==void 0?t[e]:t.borderRadius}const R1=Qo(0,.5,Fi),j1=Qo(.5,.95,H);function Qo(t,e,n){return s=>s<t?0:s>e?1:n(Tt(t,e,s))}function z1(t,e,n){const s=D(t)?t:Y(t);return s.start(jn("",s,e,n)),s.animation}function Ut(t,e,n,s={passive:!0}){return t.addEventListener(e,n,s),()=>t.removeEventListener(e,n)}const B1=(t,e)=>t.depth-e.depth;class F1{constructor(){this.children=[],this.isDirty=!1}add(e){Mn(this.children,e),this.isDirty=!0}remove(e){fe(this.children,e),this.isDirty=!0}forEach(e){this.isDirty&&this.children.sort(B1),this.isDirty=!1,this.children.forEach(e)}}function I1(t,e){const n=F.now(),s=({timestamp:i})=>{const a=i-n;a>=e&&(K(s),t(a-e))};return V.setup(s,!0),()=>K(s)}function de(t){return D(t)?t.get():t}class H1{constructor(){this.members=[]}add(e){Mn(this.members,e);for(let n=this.members.length-1;n>=0;n--){const s=this.members[n];if(s===e||s===this.lead||s===this.prevLead)continue;const i=s.instance;(!i||i.isConnected===!1)&&!s.snapshot&&(fe(this.members,s),s.unmount())}e.scheduleRender()}remove(e){if(fe(this.members,e),e===this.prevLead&&(this.prevLead=void 0),e===this.lead){const n=this.members[this.members.length-1];n&&this.promote(n)}}relegate(e){var n;for(let s=this.members.indexOf(e)-1;s>=0;s--){const i=this.members[s];if(i.isPresent!==!1&&((n=i.instance)==null?void 0:n.isConnected)!==!1)return this.promote(i),!0}return!1}promote(e,n){var i;const s=this.lead;if(e!==s&&(this.prevLead=s,this.lead=e,e.show(),s)){s.updateSnapshot(),e.scheduleRender();const{layoutDependency:a}=s.options,{layoutDependency:o}=e.options;(a===void 0||a!==o)&&(e.resumeFrom=s,n&&(s.preserveOpacity=!0),s.snapshot&&(e.snapshot=s.snapshot,e.snapshot.latestValues=s.animationValues||s.latestValues),(i=e.root)!=null&&i.isUpdating&&(e.isLayoutDirty=!0)),e.options.crossfade===!1&&s.hide()}}exitAnimationComplete(){this.members.forEach(e=>{var n,s,i,a,o;(s=(n=e.options).onExitComplete)==null||s.call(n),(o=(i=e.resumingFrom)==null?void 0:(a=i.options).onExitComplete)==null||o.call(a)})}scheduleRender(){this.members.forEach(e=>e.instance&&e.scheduleRender(!1))}removeLeadSnapshot(){var e;(e=this.lead)!=null&&e.snapshot&&(this.lead.snapshot=void 0)}}const ue={hasAnimatedSinceResize:!0,hasEverUpdated:!1},ze=["","X","Y","Z"],q1=1e3;let O1=0;function Be(t,e,n,s){const{latestValues:i}=e;i[t]&&(n[t]=i[t],e.setStaticValue(t,0),s&&(s[t]=0))}function ta(t){if(t.hasCheckedOptimisedAppear=!0,t.root===t)return;const{visualElement:e}=t.options;if(!e)return;const n=vo(e);if(window.MotionHasOptimisedAnimation(n,"transform")){const{layout:i,layoutId:a}=t.options;window.MotionCancelOptimisedAnimation(n,"transform",V,!(i||a))}const{parent:s}=t;s&&!s.hasCheckedOptimisedAppear&&ta(s)}function ea({attachResizeListener:t,defaultParent:e,measureScroll:n,checkIsScrollRoot:s,resetTransform:i}){return class{constructor(o={},r=e==null?void 0:e()){this.id=O1++,this.animationId=0,this.animationCommitId=0,this.children=new Set,this.options={},this.isTreeAnimating=!1,this.isAnimationBlocked=!1,this.isLayoutDirty=!1,this.isProjectionDirty=!1,this.isSharedProjectionDirty=!1,this.isTransformDirty=!1,this.updateManuallyBlocked=!1,this.updateBlockedByResize=!1,this.isUpdating=!1,this.isSVG=!1,this.needsReset=!1,this.shouldResetTransform=!1,this.hasCheckedOptimisedAppear=!1,this.treeScale={x:1,y:1},this.eventHandlers=new Map,this.hasTreeAnimated=!1,this.layoutVersion=0,this.updateScheduled=!1,this.scheduleUpdate=()=>this.update(),this.projectionUpdateScheduled=!1,this.checkUpdateFailed=()=>{this.isUpdating&&(this.isUpdating=!1,this.clearAllSnapshots())},this.updateProjection=()=>{this.projectionUpdateScheduled=!1,this.nodes.forEach(K1),this.nodes.forEach(Q1),this.nodes.forEach(tl),this.nodes.forEach(G1)},this.resolvedRelativeTargetAt=0,this.linkedParentVersion=0,this.hasProjected=!1,this.isVisible=!0,this.animationProgress=0,this.sharedNodes=new Map,this.latestValues=o,this.root=r?r.root||r:this,this.path=r?[...r.path,r]:[],this.parent=r,this.depth=r?r.depth+1:0;for(let c=0;c<this.path.length;c++)this.path[c].shouldResetTransform=!0;this.root===this&&(this.nodes=new F1)}addEventListener(o,r){return this.eventHandlers.has(o)||this.eventHandlers.set(o,new wn),this.eventHandlers.get(o).add(r)}notifyListeners(o,...r){const c=this.eventHandlers.get(o);c&&c.notify(...r)}hasListeners(o){return this.eventHandlers.has(o)}mount(o){if(this.instance)return;this.isSVG=qn(o)&&!Wc(o),this.instance=o;const{layoutId:r,layout:c,visualElement:h}=this.options;if(h&&!h.current&&h.mount(o),this.root.nodes.add(this),this.parent&&this.parent.children.add(this),this.root.hasTreeAnimated&&(c||r)&&(this.isLayoutDirty=!0),t){let l,u=0;const f=()=>this.root.updateBlockedByResize=!1;V.read(()=>{u=window.innerWidth}),t(o,()=>{const p=window.innerWidth;p!==u&&(u=p,this.root.updateBlockedByResize=!0,l&&l(),l=I1(f,250),ue.hasAnimatedSinceResize&&(ue.hasAnimatedSinceResize=!1,this.nodes.forEach(Xs)))})}r&&this.root.registerSharedNode(r,this),this.options.animate!==!1&&h&&(r||c)&&this.addEventListener("didUpdate",({delta:l,hasLayoutChanged:u,hasRelativeLayoutChanged:f,layout:p})=>{if(this.isTreeAnimationBlocked()){this.target=void 0,this.relativeTarget=void 0;return}const y=this.options.transition||h.getDefaultTransition()||ol,{onLayoutAnimationStart:k,onLayoutAnimationComplete:m}=h.getProps(),g=!this.targetLayout||!Zo(this.targetLayout,p),M=!u&&f;if(this.options.layoutRoot||this.resumeFrom||M||u&&(g||!this.currentAnimation)){this.resumeFrom&&(this.resumingFrom=this.resumeFrom,this.resumingFrom.resumingFrom=void 0);const x={...Rn(y,"layout"),onPlay:k,onComplete:m};(h.shouldReduceMotion||this.options.layoutRoot)&&(x.delay=0,x.type=!1),this.startAnimation(x),this.setAnimationOrigin(l,M)}else u||Xs(this),this.isLead()&&this.options.onExitComplete&&this.options.onExitComplete();this.targetLayout=p})}unmount(){this.options.layoutId&&this.willUpdate(),this.root.nodes.remove(this);const o=this.getStack();o&&o.remove(this),this.parent&&this.parent.children.delete(this),this.instance=void 0,this.eventHandlers.clear(),K(this.updateProjection)}blockUpdate(){this.updateManuallyBlocked=!0}unblockUpdate(){this.updateManuallyBlocked=!1}isUpdateBlocked(){return this.updateManuallyBlocked||this.updateBlockedByResize}isTreeAnimationBlocked(){return this.isAnimationBlocked||this.parent&&this.parent.isTreeAnimationBlocked()||!1}startUpdate(){this.isUpdateBlocked()||(this.isUpdating=!0,this.nodes&&this.nodes.forEach(el),this.animationId++)}getTransformTemplate(){const{visualElement:o}=this.options;return o&&o.getProps().transformTemplate}willUpdate(o=!0){if(this.root.hasTreeAnimated=!0,this.root.isUpdateBlocked()){this.options.onExitComplete&&this.options.onExitComplete();return}if(window.MotionCancelOptimisedAnimation&&!this.hasCheckedOptimisedAppear&&ta(this),!this.root.isUpdating&&this.root.startUpdate(),this.isLayoutDirty)return;this.isLayoutDirty=!0;for(let l=0;l<this.path.length;l++){const u=this.path[l];u.shouldResetTransform=!0,(typeof u.latestValues.x=="string"||typeof u.latestValues.y=="string")&&(u.isLayoutDirty=!0),u.updateScroll("snapshot"),u.options.layoutRoot&&u.willUpdate(!1)}const{layoutId:r,layout:c}=this.options;if(r===void 0&&!c)return;const h=this.getTransformTemplate();this.prevTransformTemplateValue=h?h(this.latestValues,""):void 0,this.updateSnapshot(),o&&this.notifyListeners("willUpdate")}update(){if(this.updateScheduled=!1,this.isUpdateBlocked()){const c=this.updateBlockedByResize;this.unblockUpdate(),this.updateBlockedByResize=!1,this.clearAllSnapshots(),c&&this.nodes.forEach(Y1),this.nodes.forEach(Ks);return}if(this.animationId<=this.animationCommitId){this.nodes.forEach(Gs);return}this.animationCommitId=this.animationId,this.isUpdating?(this.isUpdating=!1,this.nodes.forEach(Z1),this.nodes.forEach(J1),this.nodes.forEach(W1),this.nodes.forEach(U1)):this.nodes.forEach(Gs),this.clearAllSnapshots();const r=F.now();j.delta=J(0,1e3/60,r-j.timestamp),j.timestamp=r,j.isProcessing=!0,Ce.update.process(j),Ce.preRender.process(j),Ce.render.process(j),j.isProcessing=!1}didUpdate(){this.updateScheduled||(this.updateScheduled=!0,In.read(this.scheduleUpdate))}clearAllSnapshots(){this.nodes.forEach(X1),this.sharedNodes.forEach(nl)}scheduleUpdateProjection(){this.projectionUpdateScheduled||(this.projectionUpdateScheduled=!0,V.preRender(this.updateProjection,!1,!0))}scheduleCheckAfterUnmount(){V.postRender(()=>{this.isLayoutDirty?this.root.didUpdate():this.root.checkUpdateFailed()})}updateSnapshot(){this.snapshot||!this.instance||(this.snapshot=this.measure(),this.snapshot&&!I(this.snapshot.measuredBox.x)&&!I(this.snapshot.measuredBox.y)&&(this.snapshot=void 0))}updateLayout(){if(!this.instance||(this.updateScroll(),!(this.options.alwaysMeasureLayout&&this.isLead())&&!this.isLayoutDirty))return;if(this.resumeFrom&&!this.resumeFrom.instance)for(let c=0;c<this.path.length;c++)this.path[c].updateScroll();const o=this.layout;this.layout=this.measure(!1),this.layoutVersion++,this.layoutCorrected||(this.layoutCorrected=R()),this.isLayoutDirty=!1,this.projectionDelta=void 0,this.notifyListeners("measure",this.layout.layoutBox);const{visualElement:r}=this.options;r&&r.notify("LayoutMeasure",this.layout.layoutBox,o?o.layoutBox:void 0)}updateScroll(o="measure"){let r=!!(this.options.layoutScroll&&this.instance);if(this.scroll&&this.scroll.animationId===this.root.animationId&&this.scroll.phase===o&&(r=!1),r&&this.instance){const c=s(this.instance);this.scroll={animationId:this.root.animationId,phase:o,isRoot:c,offset:n(this.instance),wasRoot:this.scroll?this.scroll.isRoot:c}}}resetTransform(){if(!i)return;const o=this.isLayoutDirty||this.shouldResetTransform||this.options.alwaysMeasureLayout,r=this.projectionDelta&&!Yo(this.projectionDelta),c=this.getTransformTemplate(),h=c?c(this.latestValues,""):void 0,l=h!==this.prevTransformTemplateValue;o&&this.instance&&(r||pt(this.latestValues)||l)&&(i(this.instance,h),this.shouldResetTransform=!1,this.scheduleRender())}measure(o=!0){const r=this.measurePageBox();let c=this.removeElementScroll(r);return o&&(c=this.removeTransform(c)),al(c),{animationId:this.root.animationId,measuredBox:r,layoutBox:c,latestValues:{},source:this.id}}measurePageBox(){var h;const{visualElement:o}=this.options;if(!o)return R();const r=o.measureViewportBox();if(!(((h=this.scroll)==null?void 0:h.wasRoot)||this.path.some(rl))){const{scroll:l}=this.root;l&&(nt(r.x,l.offset.x),nt(r.y,l.offset.y))}return r}removeElementScroll(o){var c;const r=R();if(G(r,o),(c=this.scroll)!=null&&c.wasRoot)return r;for(let h=0;h<this.path.length;h++){const l=this.path[h],{scroll:u,options:f}=l;l!==this.root&&u&&f.layoutScroll&&(u.wasRoot&&G(r,o),nt(r.x,u.offset.x),nt(r.y,u.offset.y))}return r}applyTransform(o,r=!1,c){var l,u;const h=c||R();G(h,o);for(let f=0;f<this.path.length;f++){const p=this.path[f];!r&&p.options.layoutScroll&&p.scroll&&p!==p.root&&(nt(h.x,-p.scroll.offset.x),nt(h.y,-p.scroll.offset.y)),pt(p.latestValues)&&he(h,p.latestValues,(l=p.layout)==null?void 0:l.layoutBox)}return pt(this.latestValues)&&he(h,this.latestValues,(u=this.layout)==null?void 0:u.layoutBox),h}removeTransform(o){var c;const r=R();G(r,o);for(let h=0;h<this.path.length;h++){const l=this.path[h];if(!pt(l.latestValues))continue;let u;l.instance&&(un(l.latestValues)&&l.updateSnapshot(),u=R(),G(u,l.measurePageBox())),zs(r,l.latestValues,(c=l.snapshot)==null?void 0:c.layoutBox,u)}return pt(this.latestValues)&&zs(r,this.latestValues),r}setTargetDelta(o){this.targetDelta=o,this.root.scheduleUpdateProjection(),this.isProjectionDirty=!0}setOptions(o){this.options={...this.options,...o,crossfade:o.crossfade!==void 0?o.crossfade:!0}}clearMeasurements(){this.scroll=void 0,this.layout=void 0,this.snapshot=void 0,this.prevTransformTemplateValue=void 0,this.targetDelta=void 0,this.target=void 0,this.isLayoutDirty=!1}forceRelativeParentToResolveTarget(){this.relativeParent&&this.relativeParent.resolvedRelativeTargetAt!==j.timestamp&&this.relativeParent.resolveTargetDelta(!0)}resolveTargetDelta(o=!1){var p;const r=this.getLead();this.isProjectionDirty||(this.isProjectionDirty=r.isProjectionDirty),this.isTransformDirty||(this.isTransformDirty=r.isTransformDirty),this.isSharedProjectionDirty||(this.isSharedProjectionDirty=r.isSharedProjectionDirty);const c=!!this.resumingFrom||this!==r;if(!(o||c&&this.isSharedProjectionDirty||this.isProjectionDirty||(p=this.parent)!=null&&p.isProjectionDirty||this.attemptToResolveRelativeTarget||this.root.updateBlockedByResize))return;const{layout:l,layoutId:u}=this.options;if(!this.layout||!(l||u))return;this.resolvedRelativeTargetAt=j.timestamp;const f=this.getClosestProjectingParent();f&&this.linkedParentVersion!==f.layoutVersion&&!f.options.layoutRoot&&this.removeRelativeTarget(),!this.targetDelta&&!this.relativeTarget&&(this.options.layoutAnchor!==!1&&f&&f.layout?this.createRelativeTarget(f,this.layout.layoutBox,f.layout.layoutBox):this.removeRelativeTarget()),!(!this.relativeTarget&&!this.targetDelta)&&(this.target||(this.target=R(),this.targetWithTransforms=R()),this.relativeTarget&&this.relativeTargetOrigin&&this.relativeParent&&this.relativeParent.target?(this.forceRelativeParentToResolveTarget(),V1(this.target,this.relativeTarget,this.relativeParent.target,this.options.layoutAnchor||void 0)):this.targetDelta?(this.resumingFrom?this.applyTransform(this.layout.layoutBox,!1,this.target):G(this.target,this.layout.layoutBox),zo(this.target,this.targetDelta)):G(this.target,this.layout.layoutBox),this.attemptToResolveRelativeTarget&&(this.attemptToResolveRelativeTarget=!1,this.options.layoutAnchor!==!1&&f&&!!f.resumingFrom==!!this.resumingFrom&&!f.options.layoutScroll&&f.target&&this.animationProgress!==1?this.createRelativeTarget(f,this.target,f.target):this.relativeParent=this.relativeTarget=void 0))}getClosestProjectingParent(){if(!(!this.parent||un(this.parent.latestValues)||jo(this.parent.latestValues)))return this.parent.isProjecting()?this.parent:this.parent.getClosestProjectingParent()}isProjecting(){return!!((this.relativeTarget||this.targetDelta||this.options.layoutRoot)&&this.layout)}createRelativeTarget(o,r,c){this.relativeParent=o,this.linkedParentVersion=o.layoutVersion,this.forceRelativeParentToResolveTarget(),this.relativeTarget=R(),this.relativeTargetOrigin=R(),xe(this.relativeTargetOrigin,r,c,this.options.layoutAnchor||void 0),G(this.relativeTarget,this.relativeTargetOrigin)}removeRelativeTarget(){this.relativeParent=this.relativeTarget=void 0}calcProjection(){var y;const o=this.getLead(),r=!!this.resumingFrom||this!==o;let c=!0;if((this.isProjectionDirty||(y=this.parent)!=null&&y.isProjectionDirty)&&(c=!1),r&&(this.isSharedProjectionDirty||this.isTransformDirty)&&(c=!1),this.resolvedRelativeTargetAt===j.timestamp&&(c=!1),c)return;const{layout:h,layoutId:l}=this.options;if(this.isTreeAnimating=!!(this.parent&&this.parent.isTreeAnimating||this.currentAnimation||this.pendingAnimation),this.isTreeAnimating||(this.targetDelta=this.relativeTarget=void 0),!this.layout||!(h||l))return;G(this.layoutCorrected,this.layout.layoutBox);const u=this.treeScale.x,f=this.treeScale.y;s1(this.layoutCorrected,this.treeScale,this.path,r),o.layout&&!o.target&&(this.treeScale.x!==1||this.treeScale.y!==1)&&(o.target=o.layout.layoutBox,o.targetWithTransforms=R());const{target:p}=o;if(!p){this.prevProjectionDelta&&(this.createProjectionDeltas(),this.scheduleRender());return}!this.projectionDelta||!this.prevProjectionDelta?this.createProjectionDeltas():($s(this.prevProjectionDelta.x,this.projectionDelta.x),$s(this.prevProjectionDelta.y,this.projectionDelta.y)),zt(this.projectionDelta,this.layoutCorrected,p,this.latestValues),(this.treeScale.x!==u||this.treeScale.y!==f||!qs(this.projectionDelta.x,this.prevProjectionDelta.x)||!qs(this.projectionDelta.y,this.prevProjectionDelta.y))&&(this.hasProjected=!0,this.scheduleRender(),this.notifyListeners("projectionUpdate",p))}hide(){this.isVisible=!1}show(){this.isVisible=!0}scheduleRender(o=!0){var r;if((r=this.options.visualElement)==null||r.scheduleRender(),o){const c=this.getStack();c&&c.scheduleRender()}this.resumingFrom&&!this.resumingFrom.instance&&(this.resumingFrom=void 0)}createProjectionDeltas(){this.prevProjectionDelta=_t(),this.projectionDelta=_t(),this.projectionDeltaWithTransform=_t()}setAnimationOrigin(o,r=!1){const c=this.snapshot,h=c?c.latestValues:{},l={...this.latestValues},u=_t();(!this.relativeParent||!this.relativeParent.options.layoutRoot)&&(this.relativeTarget=this.relativeTargetOrigin=void 0),this.attemptToResolveRelativeTarget=!r;const f=R(),p=c?c.source:void 0,y=this.layout?this.layout.source:void 0,k=p!==y,m=this.getStack(),g=!m||m.members.length<=1,M=!!(k&&!g&&this.options.crossfade===!0&&!this.path.some(il));this.animationProgress=0;let x;this.mixTargetDelta=w=>{const _=w/1e3;Ys(u.x,o.x,_),Ys(u.y,o.y,_),this.setTargetDelta(u),this.relativeTarget&&this.relativeTargetOrigin&&this.layout&&this.relativeParent&&this.relativeParent.layout&&(xe(f,this.layout.layoutBox,this.relativeParent.layout.layoutBox,this.options.layoutAnchor||void 0),sl(this.relativeTarget,this.relativeTargetOrigin,f,_),x&&$1(this.relativeTarget,x)&&(this.isProjectionDirty=!1),x||(x=R()),G(x,this.relativeTarget)),k&&(this.animationValues=l,D1(l,h,this.latestValues,_,M,g)),this.root.scheduleUpdateProjection(),this.scheduleRender(),this.animationProgress=_},this.mixTargetDelta(this.options.layoutRoot?1e3:0)}startAnimation(o){var r,c,h;this.notifyListeners("animationStart"),(r=this.currentAnimation)==null||r.stop(),(h=(c=this.resumingFrom)==null?void 0:c.currentAnimation)==null||h.stop(),this.pendingAnimation&&(K(this.pendingAnimation),this.pendingAnimation=void 0),this.pendingAnimation=V.update(()=>{ue.hasAnimatedSinceResize=!0,this.motionValue||(this.motionValue=Y(0)),this.motionValue.jump(0,!1),this.currentAnimation=z1(this.motionValue,[0,1e3],{...o,velocity:0,isSync:!0,onUpdate:l=>{this.mixTargetDelta(l),o.onUpdate&&o.onUpdate(l)},onStop:()=>{},onComplete:()=>{o.onComplete&&o.onComplete(),this.completeAnimation()}}),this.resumingFrom&&(this.resumingFrom.currentAnimation=this.currentAnimation),this.pendingAnimation=void 0})}completeAnimation(){this.resumingFrom&&(this.resumingFrom.currentAnimation=void 0,this.resumingFrom.preserveOpacity=void 0);const o=this.getStack();o&&o.exitAnimationComplete(),this.resumingFrom=this.currentAnimation=this.animationValues=void 0,this.notifyListeners("animationComplete")}finishAnimation(){this.currentAnimation&&(this.mixTargetDelta&&this.mixTargetDelta(q1),this.currentAnimation.stop()),this.completeAnimation()}applyTransformsToTarget(){const o=this.getLead();let{targetWithTransforms:r,target:c,layout:h,latestValues:l}=o;if(!(!r||!c||!h)){if(this!==o&&this.layout&&h&&na(this.options.animationType,this.layout.layoutBox,h.layoutBox)){c=this.target||R();const u=I(this.layout.layoutBox.x);c.x.min=o.target.x.min,c.x.max=c.x.min+u;const f=I(this.layout.layoutBox.y);c.y.min=o.target.y.min,c.y.max=c.y.min+f}G(r,c),he(r,l),zt(this.projectionDeltaWithTransform,this.layoutCorrected,r,l)}}registerSharedNode(o,r){this.sharedNodes.has(o)||this.sharedNodes.set(o,new H1),this.sharedNodes.get(o).add(r);const h=r.options.initialPromotionConfig;r.promote({transition:h?h.transition:void 0,preserveFollowOpacity:h&&h.shouldPreserveFollowOpacity?h.shouldPreserveFollowOpacity(r):void 0})}isLead(){const o=this.getStack();return o?o.lead===this:!0}getLead(){var r;const{layoutId:o}=this.options;return o?((r=this.getStack())==null?void 0:r.lead)||this:this}getPrevLead(){var r;const{layoutId:o}=this.options;return o?(r=this.getStack())==null?void 0:r.prevLead:void 0}getStack(){const{layoutId:o}=this.options;if(o)return this.root.sharedNodes.get(o)}promote({needsReset:o,transition:r,preserveFollowOpacity:c}={}){const h=this.getStack();h&&h.promote(this,c),o&&(this.projectionDelta=void 0,this.needsReset=!0),r&&this.setOptions({transition:r})}relegate(){const o=this.getStack();return o?o.relegate(this):!1}resetSkewAndRotation(){const{visualElement:o}=this.options;if(!o)return;let r=!1;const{latestValues:c}=o;if((c.z||c.rotate||c.rotateX||c.rotateY||c.rotateZ||c.skewX||c.skewY)&&(r=!0),!r)return;const h={};c.z&&Be("z",o,h,this.animationValues);for(let l=0;l<ze.length;l++)Be(`rotate${ze[l]}`,o,h,this.animationValues),Be(`skew${ze[l]}`,o,h,this.animationValues);o.render();for(const l in h)o.setStaticValue(l,h[l]),this.animationValues&&(this.animationValues[l]=h[l]);o.scheduleRender()}applyProjectionStyles(o,r){if(!this.instance||this.isSVG)return;if(!this.isVisible){o.visibility="hidden";return}const c=this.getTransformTemplate();if(this.needsReset){this.needsReset=!1,o.visibility="",o.opacity="",o.pointerEvents=de(r==null?void 0:r.pointerEvents)||"",o.transform=c?c(this.latestValues,""):"none";return}const h=this.getLead();if(!this.projectionDelta||!this.layout||!h.target){this.options.layoutId&&(o.opacity=this.latestValues.opacity!==void 0?this.latestValues.opacity:1,o.pointerEvents=de(r==null?void 0:r.pointerEvents)||""),this.hasProjected&&!pt(this.latestValues)&&(o.transform=c?c({},""):"none",this.hasProjected=!1);return}o.visibility="";const l=h.animationValues||h.latestValues;this.applyTransformsToTarget();let u=E1(this.projectionDeltaWithTransform,this.treeScale,l);c&&(u=c(l,u)),o.transform=u;const{x:f,y:p}=this.projectionDelta;o.transformOrigin=`${f.origin*100}% ${p.origin*100}% 0`,h.animationValues?o.opacity=h===this?l.opacity??this.latestValues.opacity??1:this.preserveOpacity?this.latestValues.opacity:l.opacityExit:o.opacity=h===this?l.opacity!==void 0?l.opacity:"":l.opacityExit!==void 0?l.opacityExit:0;for(const y in pn){if(l[y]===void 0)continue;const{correct:k,applyTo:m,isCSSVariable:g}=pn[y],M=u==="none"?l[y]:k(l[y],h);if(m){const x=m.length;for(let w=0;w<x;w++)o[m[w]]=M}else g?this.options.visualElement.renderState.vars[y]=M:o[y]=M}this.options.layoutId&&(o.pointerEvents=h===this?de(r==null?void 0:r.pointerEvents)||"":"none")}clearSnapshot(){this.resumeFrom=this.snapshot=void 0}resetTree(){this.root.nodes.forEach(o=>{var r;return(r=o.currentAnimation)==null?void 0:r.stop()}),this.root.nodes.forEach(Ks),this.root.sharedNodes.clear()}}}function W1(t){t.updateLayout()}function U1(t){var n;const e=((n=t.resumeFrom)==null?void 0:n.snapshot)||t.snapshot;if(t.isLead()&&t.layout&&e&&t.hasListeners("didUpdate")){const{layoutBox:s,measuredBox:i}=t.layout,{animationType:a}=t.options,o=e.source!==t.layout.source;if(a==="size")et(u=>{const f=o?e.measuredBox[u]:e.layoutBox[u],p=I(f);f.min=s[u].min,f.max=f.min+p});else if(a==="x"||a==="y"){const u=a==="x"?"y":"x";yn(o?e.measuredBox[u]:e.layoutBox[u],s[u])}else na(a,e.layoutBox,s)&&et(u=>{const f=o?e.measuredBox[u]:e.layoutBox[u],p=I(s[u]);f.max=f.min+p,t.relativeTarget&&!t.currentAnimation&&(t.isProjectionDirty=!0,t.relativeTarget[u].max=t.relativeTarget[u].min+p)});const r=_t();zt(r,s,e.layoutBox);const c=_t();o?zt(c,t.applyTransform(i,!0),e.measuredBox):zt(c,s,e.layoutBox);const h=!Yo(r);let l=!1;if(!t.resumeFrom){const u=t.getClosestProjectingParent();if(u&&!u.resumeFrom){const{snapshot:f,layout:p}=u;if(f&&p){const y=t.options.layoutAnchor||void 0,k=R();xe(k,e.layoutBox,f.layoutBox,y);const m=R();xe(m,s,p.layoutBox,y),Zo(k,m)||(l=!0),u.options.layoutRoot&&(t.relativeTarget=m,t.relativeTargetOrigin=k,t.relativeParent=u)}}}t.notifyListeners("didUpdate",{layout:s,snapshot:e,delta:c,layoutDelta:r,hasLayoutChanged:h,hasRelativeLayoutChanged:l})}else if(t.isLead()){const{onExitComplete:s}=t.options;s&&s()}t.options.transition=void 0}function K1(t){t.parent&&(t.isProjecting()||(t.isProjectionDirty=t.parent.isProjectionDirty),t.isSharedProjectionDirty||(t.isSharedProjectionDirty=!!(t.isProjectionDirty||t.parent.isProjectionDirty||t.parent.isSharedProjectionDirty)),t.isTransformDirty||(t.isTransformDirty=t.parent.isTransformDirty))}function G1(t){t.isProjectionDirty=t.isSharedProjectionDirty=t.isTransformDirty=!1}function X1(t){t.clearSnapshot()}function Ks(t){t.clearMeasurements()}function Y1(t){t.isLayoutDirty=!0,t.updateLayout()}function Gs(t){t.isLayoutDirty=!1}function Z1(t){t.isAnimationBlocked&&t.layout&&!t.isLayoutDirty&&(t.snapshot=t.layout,t.isLayoutDirty=!0)}function J1(t){const{visualElement:e}=t.options;e&&e.getProps().onBeforeLayoutMeasure&&e.notify("BeforeLayoutMeasure"),t.resetTransform()}function Xs(t){t.finishAnimation(),t.targetDelta=t.relativeTarget=t.target=void 0,t.isProjectionDirty=!0}function Q1(t){t.resolveTargetDelta()}function tl(t){t.calcProjection()}function el(t){t.resetSkewAndRotation()}function nl(t){t.removeLeadSnapshot()}function Ys(t,e,n){t.translate=P(e.translate,0,n),t.scale=P(e.scale,1,n),t.origin=e.origin,t.originPoint=e.originPoint}function Zs(t,e,n,s){t.min=P(e.min,n.min,s),t.max=P(e.max,n.max,s)}function sl(t,e,n,s){Zs(t.x,e.x,n.x,s),Zs(t.y,e.y,n.y,s)}function il(t){return t.animationValues&&t.animationValues.opacityExit!==void 0}const ol={duration:.45,ease:[.4,0,.1,1]},Js=t=>typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().includes(t),Qs=Js("applewebkit/")&&!Js("chrome/")?Math.round:H;function ti(t){t.min=Qs(t.min),t.max=Qs(t.max)}function al(t){ti(t.x),ti(t.y)}function na(t,e,n){return t==="position"||t==="preserve-aspect"&&!S1(Hs(e),Hs(n),.2)}function rl(t){var e;return t!==t.root&&((e=t.scroll)==null?void 0:e.wasRoot)}const cl=ea({attachResizeListener:(t,e)=>Ut(t,"resize",e),measureScroll:()=>{var t,e;return{x:document.documentElement.scrollLeft||((t=document.body)==null?void 0:t.scrollLeft)||0,y:document.documentElement.scrollTop||((e=document.body)==null?void 0:e.scrollTop)||0}},checkIsScrollRoot:()=>!0}),Fe={current:void 0},sa=ea({measureScroll:t=>({x:t.scrollLeft,y:t.scrollTop}),defaultParent:()=>{if(!Fe.current){const t=new cl({});t.mount(window),t.setOptions({layoutScroll:!0}),Fe.current=t}return Fe.current},resetTransform:(t,e)=>{t.style.transform=e!==void 0?e:"none"},checkIsScrollRoot:t=>window.getComputedStyle(t).position==="fixed"}),Yt=v.createContext({transformPagePoint:t=>t,isStatic:!1,reducedMotion:"never"});function ei(t,e){if(typeof t=="function")return t(e);t!=null&&(t.current=e)}function ll(...t){return e=>{let n=!1;const s=t.map(i=>{const a=ei(i,e);return!n&&typeof a=="function"&&(n=!0),a});if(n)return()=>{for(let i=0;i<s.length;i++){const a=s[i];typeof a=="function"?a():ei(t[i],null)}}}}function hl(...t){return v.useCallback(ll(...t),t)}class dl extends v.Component{getSnapshotBeforeUpdate(e){const n=this.props.childRef.current;if(jt(n)&&e.isPresent&&!this.props.isPresent&&this.props.pop!==!1){const s=n.offsetParent,i=jt(s)&&s.offsetWidth||0,a=jt(s)&&s.offsetHeight||0,o=getComputedStyle(n),r=this.props.sizeRef.current;r.height=parseFloat(o.height),r.width=parseFloat(o.width),r.top=n.offsetTop,r.left=n.offsetLeft,r.right=i-r.width-r.left,r.bottom=a-r.height-r.top}return null}componentDidUpdate(){}render(){return this.props.children}}function ul({children:t,isPresent:e,anchorX:n,anchorY:s,root:i,pop:a}){var f;const o=v.useId(),r=v.useRef(null),c=v.useRef({width:0,height:0,top:0,left:0,right:0,bottom:0}),{nonce:h}=v.useContext(Yt),l=((f=t.props)==null?void 0:f.ref)??(t==null?void 0:t.ref),u=hl(r,l);return v.useInsertionEffect(()=>{const{width:p,height:y,top:k,left:m,right:g,bottom:M}=c.current;if(e||a===!1||!r.current||!p||!y)return;const x=n==="left"?`left: ${m}`:`right: ${g}`,w=s==="bottom"?`bottom: ${M}`:`top: ${k}`;r.current.dataset.motionPopId=o;const _=document.createElement("style");h&&(_.nonce=h);const C=i??document.head;return C.appendChild(_),_.sheet&&_.sheet.insertRule(`
          [data-motion-pop-id="${o}"] {
            position: absolute !important;
            width: ${p}px !important;
            height: ${y}px !important;
            ${x}px !important;
            ${w}px !important;
          }
        `),()=>{var $;($=r.current)==null||$.removeAttribute("data-motion-pop-id"),C.contains(_)&&C.removeChild(_)}},[e]),U.jsx(dl,{isPresent:e,childRef:r,sizeRef:c,pop:a,children:a===!1?t:v.cloneElement(t,{ref:u})})}const fl=({children:t,initial:e,isPresent:n,onExitComplete:s,custom:i,presenceAffectsLayout:a,mode:o,anchorX:r,anchorY:c,root:h})=>{const l=it(pl),u=v.useId();let f=!0,p=v.useMemo(()=>(f=!1,{id:u,initial:e,isPresent:n,custom:i,onExitComplete:y=>{l.set(y,!0);for(const k of l.values())if(!k)return;s&&s()},register:y=>(l.set(y,!1),()=>l.delete(y))}),[n,l,s]);return a&&f&&(p={...p}),v.useMemo(()=>{l.forEach((y,k)=>l.set(k,!1))},[n]),v.useEffect(()=>{!n&&!l.size&&s&&s()},[n]),t=U.jsx(ul,{pop:o==="popLayout",isPresent:n,anchorX:r,anchorY:c,root:h,children:t}),U.jsx(_e.Provider,{value:p,children:t})};function pl(){return new Map}function ia(t=!0){const e=v.useContext(_e);if(e===null)return[!0,null];const{isPresent:n,onExitComplete:s,register:i}=e,a=v.useId();v.useEffect(()=>{if(t)return i(a)},[t]);const o=v.useCallback(()=>t&&s&&s(a),[a,s,t]);return!n&&s?[!1,o]:[!0]}const te=t=>t.key||"";function ni(t){const e=[];return v.Children.forEach(t,n=>{v.isValidElement(n)&&e.push(n)}),e}const Ap=({children:t,custom:e,initial:n=!0,onExitComplete:s,presenceAffectsLayout:i=!0,mode:a="sync",propagate:o=!1,anchorX:r="left",anchorY:c="top",root:h})=>{const[l,u]=ia(o),f=v.useMemo(()=>ni(t),[t]),p=o&&!l?[]:f.map(te),y=v.useRef(!0),k=v.useRef(f),m=it(()=>new Map),g=v.useRef(new Set),[M,x]=v.useState(f),[w,_]=v.useState(f);be(()=>{y.current=!1,k.current=f;for(let A=0;A<w.length;A++){const S=te(w[A]);p.includes(S)?(m.delete(S),g.current.delete(S)):m.get(S)!==!0&&m.set(S,!1)}},[w,p.length,p.join("-")]);const C=[];if(f!==M){let A=[...f];for(let S=0;S<w.length;S++){const T=w[S],N=te(T);p.includes(N)||(A.splice(S,0,T),C.push(T))}return a==="wait"&&C.length&&(A=C),_(ni(A)),x(f),null}const{forceRender:$}=v.useContext(xn);return U.jsx(U.Fragment,{children:w.map(A=>{const S=te(A),T=o&&!l?!1:f===w||p.includes(S),N=()=>{if(g.current.has(S))return;if(m.has(S))g.current.add(S),m.set(S,!0);else return;let z=!0;m.forEach(ot=>{ot||(z=!1)}),z&&($==null||$(),_(k.current),o&&(u==null||u()),s&&s())};return U.jsx(fl,{isPresent:T,initial:!y.current||n?void 0:!1,custom:e,presenceAffectsLayout:i,mode:a,root:h,onExitComplete:T?void 0:N,anchorX:r,anchorY:c,children:A},S)})})},oa=v.createContext({strict:!1}),si={animation:["animate","variants","whileHover","whileTap","exit","whileInView","whileFocus","whileDrag"],exit:["exit"],drag:["drag","dragControls"],focus:["whileFocus"],hover:["whileHover","onHoverStart","onHoverEnd"],tap:["whileTap","onTap","onTapStart","onTapCancel"],pan:["onPan","onPanStart","onPanSessionStart","onPanEnd"],inView:["whileInView","onViewportEnter","onViewportLeave"],layout:["layout","layoutId"]};let ii=!1;function yl(){if(ii)return;const t={};for(const e in si)t[e]={isEnabled:n=>si[e].some(s=>!!n[s])};Lo(t),ii=!0}function aa(){return yl(),Qc()}function ml(t){const e=aa();for(const n in t)e[n]={...e[n],...t[n]};Lo(e)}const gl=new Set(["animate","exit","variants","initial","style","values","variants","transition","transformTemplate","custom","inherit","onBeforeLayoutMeasure","onAnimationStart","onAnimationComplete","onUpdate","onDragStart","onDrag","onDragEnd","onMeasureDragConstraints","onDirectionLock","onDragTransitionEnd","_dragX","_dragY","onHoverStart","onHoverEnd","onViewportEnter","onViewportLeave","globalTapTarget","propagate","ignoreStrict","viewport"]);function Me(t){return t.startsWith("while")||t.startsWith("drag")&&t!=="draggable"||t.startsWith("layout")||t.startsWith("onTap")||t.startsWith("onPan")||t.startsWith("onLayout")||gl.has(t)}let ra=t=>!Me(t);function kl(t){typeof t=="function"&&(ra=e=>e.startsWith("on")?!Me(e):t(e))}try{kl(require("@emotion/is-prop-valid").default)}catch{}function vl(t,e,n){const s={};for(const i in t)i==="values"&&typeof t.values=="object"||D(t[i])||(ra(i)||n===!0&&Me(i)||!e&&!Me(i)||t.draggable&&i.startsWith("onDrag"))&&(s[i]=t[i]);return s}const Ve=v.createContext({});function xl(t,e){if(Se(t)){const{initial:n,animate:s}=t;return{initial:n===!1||Wt(n)?n:void 0,animate:Wt(s)?s:void 0}}return t.inherit!==!1?e:{}}function Ml(t){const{initial:e,animate:n}=xl(t,v.useContext(Ve));return v.useMemo(()=>({initial:e,animate:n}),[oi(e),oi(n)])}function oi(t){return Array.isArray(t)?t.join(" "):t}const Xn=()=>({style:{},transform:{},transformOrigin:{},vars:{}});function ca(t,e,n){for(const s in e)!D(e[s])&&!Io(s,n)&&(t[s]=e[s])}function wl({transformTemplate:t},e){return v.useMemo(()=>{const n=Xn();return Kn(n,e,t),Object.assign({},n.vars,n.style)},[e])}function bl(t,e){const n=t.style||{},s={};return ca(s,n,t),Object.assign(s,wl(t,e)),s}function _l(t,e){const n={},s=bl(t,e);return t.drag&&t.dragListener!==!1&&(n.draggable=!1,s.userSelect=s.WebkitUserSelect=s.WebkitTouchCallout="none",s.touchAction=t.drag===!0?"none":`pan-${t.drag==="x"?"y":"x"}`),t.tabIndex===void 0&&(t.onTap||t.onTapStart||t.whileTap)&&(n.tabIndex=0),n.style=s,n}const la=()=>({...Xn(),attrs:{}});function Tl(t,e,n,s){const i=v.useMemo(()=>{const a=la();return Ho(a,e,Oo(s),t.transformTemplate,t.style),{...a.attrs,style:{...a.style}}},[e]);if(t.style){const a={};ca(a,t.style,t),i.style={...a,...i.style}}return i}const Al=["animate","circle","defs","desc","ellipse","g","image","line","filter","marker","mask","metadata","path","pattern","polygon","polyline","rect","stop","switch","symbol","svg","text","tspan","use","view"];function Yn(t){return typeof t!="string"||t.includes("-")?!1:!!(Al.indexOf(t)>-1||/[A-Z]/u.test(t))}function Sl(t,e,n,{latestValues:s},i,a=!1,o){const c=(o??Yn(t)?Tl:_l)(e,s,i,t),h=vl(e,typeof t=="string",a),l=t!==v.Fragment?{...h,...c,ref:n}:{},{children:u}=e,f=v.useMemo(()=>D(u)?u.get():u,[u]);return v.createElement(t,{...l,children:f})}function Vl({scrapeMotionValuesFromProps:t,createRenderState:e},n,s,i){return{latestValues:Cl(n,s,i,t),renderState:e()}}function Cl(t,e,n,s){const i={},a=s(t,{});for(const f in a)i[f]=de(a[f]);let{initial:o,animate:r}=t;const c=Se(t),h=$o(t);e&&h&&!c&&t.inherit!==!1&&(o===void 0&&(o=e.initial),r===void 0&&(r=e.animate));let l=n?n.initial===!1:!1;l=l||o===!1;const u=l?r:o;if(u&&typeof u!="boolean"&&!Ae(u)){const f=Array.isArray(u)?u:[u];for(let p=0;p<f.length;p++){const y=zn(t,f[p]);if(y){const{transitionEnd:k,transition:m,...g}=y;for(const M in g){let x=g[M];if(Array.isArray(x)){const w=l?x.length-1:0;x=x[w]}x!==null&&(i[M]=x)}for(const M in k)i[M]=k[M]}}}return i}const ha=t=>(e,n)=>{const s=v.useContext(Ve),i=v.useContext(_e),a=()=>Vl(t,e,s,i);return n?a():it(a)},Pl=ha({scrapeMotionValuesFromProps:Gn,createRenderState:Xn}),Nl=ha({scrapeMotionValuesFromProps:Wo,createRenderState:la}),$l=Symbol.for("motionComponentSymbol");function El(t,e,n){const s=v.useRef(n);v.useInsertionEffect(()=>{s.current=n});const i=v.useRef(null);return v.useCallback(a=>{var r;a&&((r=t.onMount)==null||r.call(t,a));const o=s.current;if(typeof o=="function")if(a){const c=o(a);typeof c=="function"&&(i.current=c)}else i.current?(i.current(),i.current=null):o(a);else o&&(o.current=a);e&&(a?e.mount(a):e.unmount())},[e])}const da=v.createContext({});function Mt(t){return t&&typeof t=="object"&&Object.prototype.hasOwnProperty.call(t,"current")}function Ll(t,e,n,s,i,a){var x,w;const{visualElement:o}=v.useContext(Ve),r=v.useContext(oa),c=v.useContext(_e),h=v.useContext(Yt),l=h.reducedMotion,u=h.skipAnimations,f=v.useRef(null),p=v.useRef(!1);s=s||r.renderer,!f.current&&s&&(f.current=s(t,{visualState:e,parent:o,props:n,presenceContext:c,blockInitialAnimation:c?c.initial===!1:!1,reducedMotionConfig:l,skipAnimations:u,isSVG:a}),p.current&&f.current&&(f.current.manuallyAnimateOnMount=!0));const y=f.current,k=v.useContext(da);y&&!y.projection&&i&&(y.type==="html"||y.type==="svg")&&Dl(f.current,n,i,k);const m=v.useRef(!1);v.useInsertionEffect(()=>{y&&m.current&&y.update(n,c)});const g=n[ko],M=v.useRef(!!g&&typeof window<"u"&&!((x=window.MotionHandoffIsComplete)!=null&&x.call(window,g))&&((w=window.MotionHasOptimisedAnimation)==null?void 0:w.call(window,g)));return be(()=>{p.current=!0,y&&(m.current=!0,window.MotionIsMounted=!0,y.updateFeatures(),y.scheduleRenderMicrotask(),M.current&&y.animationState&&y.animationState.animateChanges())}),v.useEffect(()=>{y&&(!M.current&&y.animationState&&y.animationState.animateChanges(),M.current&&(queueMicrotask(()=>{var _;(_=window.MotionHandoffMarkAsComplete)==null||_.call(window,g)}),M.current=!1),y.enteringChildren=void 0)}),y}function Dl(t,e,n,s){const{layoutId:i,layout:a,drag:o,dragConstraints:r,layoutScroll:c,layoutRoot:h,layoutAnchor:l,layoutCrossfade:u}=e;t.projection=new n(t.latestValues,e["data-framer-portal-id"]?void 0:ua(t.parent)),t.projection.setOptions({layoutId:i,layout:a,alwaysMeasureLayout:!!o||r&&Mt(r),visualElement:t,animationType:typeof a=="string"?a:"both",initialPromotionConfig:s,crossfade:u,layoutScroll:c,layoutRoot:h,layoutAnchor:l})}function ua(t){if(t)return t.options.allowProjection!==!1?t.projection:ua(t.parent)}function Ie(t,{forwardMotionProps:e=!1,type:n}={},s,i){s&&ml(s);const a=n?n==="svg":Yn(t),o=a?Nl:Pl;function r(h,l){let u;const f={...v.useContext(Yt),...h,layoutId:Rl(h)},{isStatic:p}=f,y=Ml(h),k=o(h,p);if(!p&&typeof window<"u"){jl();const m=zl(f);u=m.MeasureLayout,y.visualElement=Ll(t,k,f,i,m.ProjectionNode,a)}return U.jsxs(Ve.Provider,{value:y,children:[u&&y.visualElement?U.jsx(u,{visualElement:y.visualElement,...f}):null,Sl(t,h,El(k,y.visualElement,l),k,p,e,a)]})}r.displayName=`motion.${typeof t=="string"?t:`create(${t.displayName??t.name??""})`}`;const c=v.forwardRef(r);return c[$l]=t,c}function Rl({layoutId:t}){const e=v.useContext(xn).id;return e&&t!==void 0?e+"-"+t:t}function jl(t,e){v.useContext(oa).strict}function zl(t){const e=aa(),{drag:n,layout:s}=e;if(!n&&!s)return{};const i={...n,...s};return{MeasureLayout:n!=null&&n.isEnabled(t)||s!=null&&s.isEnabled(t)?i.MeasureLayout:void 0,ProjectionNode:i.ProjectionNode}}function Bl(t,e){if(typeof Proxy>"u")return Ie;const n=new Map,s=(a,o)=>Ie(a,o,t,e),i=(a,o)=>s(a,o);return new Proxy(i,{get:(a,o)=>o==="create"?s:(n.has(o)||n.set(o,Ie(o,void 0,t,e)),n.get(o))})}const Fl=(t,e)=>e.isSVG??Yn(t)?new m1(e):new h1(e,{allowProjection:t!==v.Fragment});class Il extends dt{constructor(e){super(e),e.animationState||(e.animationState=M1(e))}updateAnimationControlsSubscription(){const{animate:e}=this.node.getProps();Ae(e)&&(this.unmountControls=e.subscribe(this.node))}mount(){this.updateAnimationControlsSubscription()}update(){const{animate:e}=this.node.getProps(),{animate:n}=this.node.prevProps||{};e!==n&&this.updateAnimationControlsSubscription()}unmount(){var e;this.node.animationState.reset(),(e=this.unmountControls)==null||e.call(this)}}let Hl=0;class ql extends dt{constructor(){super(...arguments),this.id=Hl++,this.isExitComplete=!1}update(){var a;if(!this.node.presenceContext)return;const{isPresent:e,onExitComplete:n}=this.node.presenceContext,{isPresent:s}=this.node.prevPresenceContext||{};if(!this.node.animationState||e===s)return;if(e&&s===!1){if(this.isExitComplete){const{initial:o,custom:r}=this.node.getProps();if(typeof o=="string"){const c=kt(this.node,o,r);if(c){const{transition:h,transitionEnd:l,...u}=c;for(const f in u)(a=this.node.getValue(f))==null||a.jump(u[f])}}this.node.animationState.reset(),this.node.animationState.animateChanges()}else this.node.animationState.setActive("exit",!1);this.isExitComplete=!1;return}const i=this.node.animationState.setActive("exit",!e);n&&!e&&i.then(()=>{this.isExitComplete=!0,n(this.id)})}mount(){const{register:e,onExitComplete:n}=this.node.presenceContext||{};n&&n(this.id),e&&(this.unmount=e(this.id))}unmount(){}}const Ol={animation:{Feature:Il},exit:{Feature:ql}};function Zt(t){return{point:{x:t.pageX,y:t.pageY}}}const Wl=t=>e=>Hn(e)&&t(e,Zt(e));function Bt(t,e,n,s){return Ut(t,e,Wl(n),s)}const fa=({current:t})=>t?t.ownerDocument.defaultView:null,ai=(t,e)=>Math.abs(t-e);function Ul(t,e){const n=ai(t.x,e.x),s=ai(t.y,e.y);return Math.sqrt(n**2+s**2)}const ri=new Set(["auto","scroll"]);class pa{constructor(e,n,{transformPagePoint:s,contextWindow:i=window,dragSnapToOrigin:a=!1,distanceThreshold:o=3,element:r}={}){if(this.startEvent=null,this.lastMoveEvent=null,this.lastMoveEventInfo=null,this.lastRawMoveEventInfo=null,this.handlers={},this.contextWindow=window,this.scrollPositions=new Map,this.removeScrollListeners=null,this.onElementScroll=p=>{this.handleScroll(p.target)},this.onWindowScroll=()=>{this.handleScroll(window)},this.updatePoint=()=>{if(!(this.lastMoveEvent&&this.lastMoveEventInfo))return;this.lastRawMoveEventInfo&&(this.lastMoveEventInfo=ee(this.lastRawMoveEventInfo,this.transformPagePoint));const p=He(this.lastMoveEventInfo,this.history),y=this.startEvent!==null,k=Ul(p.offset,{x:0,y:0})>=this.distanceThreshold;if(!y&&!k)return;const{point:m}=p,{timestamp:g}=j;this.history.push({...m,timestamp:g});const{onStart:M,onMove:x}=this.handlers;y||(M&&M(this.lastMoveEvent,p),this.startEvent=this.lastMoveEvent),x&&x(this.lastMoveEvent,p)},this.handlePointerMove=(p,y)=>{this.lastMoveEvent=p,this.lastRawMoveEventInfo=y,this.lastMoveEventInfo=ee(y,this.transformPagePoint),V.update(this.updatePoint,!0)},this.handlePointerUp=(p,y)=>{this.end();const{onEnd:k,onSessionEnd:m,resumeAnimation:g}=this.handlers;if((this.dragSnapToOrigin||!this.startEvent)&&g&&g(),!(this.lastMoveEvent&&this.lastMoveEventInfo))return;const M=He(p.type==="pointercancel"?this.lastMoveEventInfo:ee(y,this.transformPagePoint),this.history);this.startEvent&&k&&k(p,M),m&&m(p,M)},!Hn(e))return;this.dragSnapToOrigin=a,this.handlers=n,this.transformPagePoint=s,this.distanceThreshold=o,this.contextWindow=i||window;const c=Zt(e),h=ee(c,this.transformPagePoint),{point:l}=h,{timestamp:u}=j;this.history=[{...l,timestamp:u}];const{onSessionStart:f}=n;f&&f(e,He(h,this.history)),this.removeListeners=Kt(Bt(this.contextWindow,"pointermove",this.handlePointerMove),Bt(this.contextWindow,"pointerup",this.handlePointerUp),Bt(this.contextWindow,"pointercancel",this.handlePointerUp)),r&&this.startScrollTracking(r)}startScrollTracking(e){let n=e.parentElement;for(;n;){const s=getComputedStyle(n);(ri.has(s.overflowX)||ri.has(s.overflowY))&&this.scrollPositions.set(n,{x:n.scrollLeft,y:n.scrollTop}),n=n.parentElement}this.scrollPositions.set(window,{x:window.scrollX,y:window.scrollY}),window.addEventListener("scroll",this.onElementScroll,{capture:!0}),window.addEventListener("scroll",this.onWindowScroll),this.removeScrollListeners=()=>{window.removeEventListener("scroll",this.onElementScroll,{capture:!0}),window.removeEventListener("scroll",this.onWindowScroll)}}handleScroll(e){const n=this.scrollPositions.get(e);if(!n)return;const s=e===window,i=s?{x:window.scrollX,y:window.scrollY}:{x:e.scrollLeft,y:e.scrollTop},a={x:i.x-n.x,y:i.y-n.y};a.x===0&&a.y===0||(s?this.lastMoveEventInfo&&(this.lastMoveEventInfo.point.x+=a.x,this.lastMoveEventInfo.point.y+=a.y):this.history.length>0&&(this.history[0].x-=a.x,this.history[0].y-=a.y),this.scrollPositions.set(e,i),V.update(this.updatePoint,!0))}updateHandlers(e){this.handlers=e}end(){this.removeListeners&&this.removeListeners(),this.removeScrollListeners&&this.removeScrollListeners(),this.scrollPositions.clear(),K(this.updatePoint)}}function ee(t,e){return e?{point:e(t.point)}:t}function ci(t,e){return{x:t.x-e.x,y:t.y-e.y}}function He({point:t},e){return{point:t,delta:ci(t,ya(e)),offset:ci(t,Kl(e)),velocity:Gl(e,.1)}}function Kl(t){return t[0]}function ya(t){return t[t.length-1]}function Gl(t,e){if(t.length<2)return{x:0,y:0};let n=t.length-1,s=null;const i=ya(t);for(;n>=0&&(s=t[n],!(i.timestamp-s.timestamp>q(e)));)n--;if(!s)return{x:0,y:0};s===t[0]&&t.length>2&&i.timestamp-s.timestamp>q(e)*2&&(s=t[1]);const a=W(i.timestamp-s.timestamp);if(a===0)return{x:0,y:0};const o={x:(i.x-s.x)/a,y:(i.y-s.y)/a};return o.x===1/0&&(o.x=0),o.y===1/0&&(o.y=0),o}function Xl(t,{min:e,max:n},s){return e!==void 0&&t<e?t=s?P(e,t,s.min):Math.max(t,e):n!==void 0&&t>n&&(t=s?P(n,t,s.max):Math.min(t,n)),t}function li(t,e,n){return{min:e!==void 0?t.min+e:void 0,max:n!==void 0?t.max+n-(t.max-t.min):void 0}}function Yl(t,{top:e,left:n,bottom:s,right:i}){return{x:li(t.x,n,i),y:li(t.y,e,s)}}function hi(t,e){let n=e.min-t.min,s=e.max-t.max;return e.max-e.min<t.max-t.min&&([n,s]=[s,n]),{min:n,max:s}}function Zl(t,e){return{x:hi(t.x,e.x),y:hi(t.y,e.y)}}function Jl(t,e){let n=.5;const s=I(t),i=I(e);return i>s?n=Tt(e.min,e.max-s,t.min):s>i&&(n=Tt(t.min,t.max-i,e.min)),J(0,1,n)}function Ql(t,e){const n={};return e.min!==void 0&&(n.min=e.min-t.min),e.max!==void 0&&(n.max=e.max-t.min),n}const mn=.35;function th(t=mn){return t===!1?t=0:t===!0&&(t=mn),{x:di(t,"left","right"),y:di(t,"top","bottom")}}function di(t,e,n){return{min:ui(t,e),max:ui(t,n)}}function ui(t,e){return typeof t=="number"?t:t[e]||0}const eh=new WeakMap;class nh{constructor(e){this.openDragLock=null,this.isDragging=!1,this.currentDirection=null,this.originPoint={x:0,y:0},this.constraints=!1,this.hasMutatedConstraints=!1,this.elastic=R(),this.latestPointerEvent=null,this.latestPanInfo=null,this.visualElement=e}start(e,{snapToCursor:n=!1,distanceThreshold:s}={}){const{presenceContext:i}=this.visualElement;if(i&&i.isPresent===!1)return;const a=u=>{n&&this.snapToCursor(Zt(u).point),this.stopAnimation()},o=(u,f)=>{const{drag:p,dragPropagation:y,onDragStart:k}=this.getProps();if(p&&!y&&(this.openDragLock&&this.openDragLock(),this.openDragLock=Vc(p),!this.openDragLock))return;this.latestPointerEvent=u,this.latestPanInfo=f,this.isDragging=!0,this.currentDirection=null,this.resolveConstraints(),this.visualElement.projection&&(this.visualElement.projection.isAnimationBlocked=!0,this.visualElement.projection.target=void 0),et(g=>{let M=this.getAxisMotionValue(g).get()||0;if(st.test(M)){const{projection:x}=this.visualElement;if(x&&x.layout){const w=x.layout.layoutBox[g];w&&(M=I(w)*(parseFloat(M)/100))}}this.originPoint[g]=M}),k&&V.update(()=>k(u,f),!1,!0),rn(this.visualElement,"transform");const{animationState:m}=this.visualElement;m&&m.setActive("whileDrag",!0)},r=(u,f)=>{this.latestPointerEvent=u,this.latestPanInfo=f;const{dragPropagation:p,dragDirectionLock:y,onDirectionLock:k,onDrag:m}=this.getProps();if(!p&&!this.openDragLock)return;const{offset:g}=f;if(y&&this.currentDirection===null){this.currentDirection=ih(g),this.currentDirection!==null&&k&&k(this.currentDirection);return}this.updateAxis("x",f.point,g),this.updateAxis("y",f.point,g),this.visualElement.render(),m&&V.update(()=>m(u,f),!1,!0)},c=(u,f)=>{this.latestPointerEvent=u,this.latestPanInfo=f,this.stop(u,f),this.latestPointerEvent=null,this.latestPanInfo=null},h=()=>{const{dragSnapToOrigin:u}=this.getProps();(u||this.constraints)&&this.startAnimation({x:0,y:0})},{dragSnapToOrigin:l}=this.getProps();this.panSession=new pa(e,{onSessionStart:a,onStart:o,onMove:r,onSessionEnd:c,resumeAnimation:h},{transformPagePoint:this.visualElement.getTransformPagePoint(),dragSnapToOrigin:l,distanceThreshold:s,contextWindow:fa(this.visualElement),element:this.visualElement.current})}stop(e,n){const s=e||this.latestPointerEvent,i=n||this.latestPanInfo,a=this.isDragging;if(this.cancel(),!a||!i||!s)return;const{velocity:o}=i;this.startAnimation(o);const{onDragEnd:r}=this.getProps();r&&V.postRender(()=>r(s,i))}cancel(){this.isDragging=!1;const{projection:e,animationState:n}=this.visualElement;e&&(e.isAnimationBlocked=!1),this.endPanSession();const{dragPropagation:s}=this.getProps();!s&&this.openDragLock&&(this.openDragLock(),this.openDragLock=null),n&&n.setActive("whileDrag",!1)}endPanSession(){this.panSession&&this.panSession.end(),this.panSession=void 0}updateAxis(e,n,s){const{drag:i}=this.getProps();if(!s||!ne(e,i,this.currentDirection))return;const a=this.getAxisMotionValue(e);let o=this.originPoint[e]+s[e];this.constraints&&this.constraints[e]&&(o=Xl(o,this.constraints[e],this.elastic[e])),a.set(o)}resolveConstraints(){var a;const{dragConstraints:e,dragElastic:n}=this.getProps(),s=this.visualElement.projection&&!this.visualElement.projection.layout?this.visualElement.projection.measure(!1):(a=this.visualElement.projection)==null?void 0:a.layout,i=this.constraints;e&&Mt(e)?this.constraints||(this.constraints=this.resolveRefConstraints()):e&&s?this.constraints=Yl(s.layoutBox,e):this.constraints=!1,this.elastic=th(n),i!==this.constraints&&!Mt(e)&&s&&this.constraints&&!this.hasMutatedConstraints&&et(o=>{this.constraints!==!1&&this.getAxisMotionValue(o)&&(this.constraints[o]=Ql(s.layoutBox[o],this.constraints[o]))})}resolveRefConstraints(){const{dragConstraints:e,onMeasureDragConstraints:n}=this.getProps();if(!e||!Mt(e))return!1;const s=e.current,{projection:i}=this.visualElement;if(!i||!i.layout)return!1;const a=i1(s,i.root,this.visualElement.getTransformPagePoint());let o=Zl(i.layout.layoutBox,a);if(n){const r=n(e1(o));this.hasMutatedConstraints=!!r,r&&(o=Ro(r))}return o}startAnimation(e){const{drag:n,dragMomentum:s,dragElastic:i,dragTransition:a,dragSnapToOrigin:o,onDragTransitionEnd:r}=this.getProps(),c=this.constraints||{},h=et(l=>{if(!ne(l,n,this.currentDirection))return;let u=c&&c[l]||{};(o===!0||o===l)&&(u={min:0,max:0});const f=i?200:1e6,p=i?40:1e7,y={type:"inertia",velocity:s?e[l]:0,bounceStiffness:f,bounceDamping:p,timeConstant:750,restDelta:1,restSpeed:10,...a,...u};return this.startAxisValueAnimation(l,y)});return Promise.all(h).then(r)}startAxisValueAnimation(e,n){const s=this.getAxisMotionValue(e);return rn(this.visualElement,e),s.start(jn(e,s,0,n,this.visualElement,!1))}stopAnimation(){et(e=>this.getAxisMotionValue(e).stop())}getAxisMotionValue(e){const n=`_drag${e.toUpperCase()}`,s=this.visualElement.getProps(),i=s[n];return i||this.visualElement.getValue(e,(s.initial?s.initial[e]:void 0)||0)}snapToCursor(e){et(n=>{const{drag:s}=this.getProps();if(!ne(n,s,this.currentDirection))return;const{projection:i}=this.visualElement,a=this.getAxisMotionValue(n);if(i&&i.layout){const{min:o,max:r}=i.layout.layoutBox[n],c=a.get()||0;a.set(e[n]-P(o,r,.5)+c)}})}scalePositionWithinConstraints(){if(!this.visualElement.current)return;const{drag:e,dragConstraints:n}=this.getProps(),{projection:s}=this.visualElement;if(!Mt(n)||!s||!this.constraints)return;this.stopAnimation();const i={x:0,y:0};et(o=>{const r=this.getAxisMotionValue(o);if(r&&this.constraints!==!1){const c=r.get();i[o]=Jl({min:c,max:c},this.constraints[o])}});const{transformTemplate:a}=this.visualElement.getProps();this.visualElement.current.style.transform=a?a({},""):"none",s.root&&s.root.updateScroll(),s.updateLayout(),this.constraints=!1,this.resolveConstraints(),et(o=>{if(!ne(o,e,null))return;const r=this.getAxisMotionValue(o),{min:c,max:h}=this.constraints[o];r.set(P(c,h,i[o]))}),this.visualElement.render()}addListeners(){if(!this.visualElement.current)return;eh.set(this.visualElement,this);const e=this.visualElement.current,n=Bt(e,"pointerdown",h=>{const{drag:l,dragListener:u=!0}=this.getProps(),f=h.target,p=f!==e&&Lc(f);l&&u&&!p&&this.start(h)});let s;const i=()=>{const{dragConstraints:h}=this.getProps();Mt(h)&&h.current&&(this.constraints=this.resolveRefConstraints(),s||(s=sh(e,h.current,()=>this.scalePositionWithinConstraints())))},{projection:a}=this.visualElement,o=a.addEventListener("measure",i);a&&!a.layout&&(a.root&&a.root.updateScroll(),a.updateLayout()),V.read(i);const r=Ut(window,"resize",()=>this.scalePositionWithinConstraints()),c=a.addEventListener("didUpdate",(({delta:h,hasLayoutChanged:l})=>{this.isDragging&&l&&(et(u=>{const f=this.getAxisMotionValue(u);f&&(this.originPoint[u]+=h[u].translate,f.set(f.get()+h[u].translate))}),this.visualElement.render())}));return()=>{r(),n(),o(),c&&c(),s&&s()}}getProps(){const e=this.visualElement.getProps(),{drag:n=!1,dragDirectionLock:s=!1,dragPropagation:i=!1,dragConstraints:a=!1,dragElastic:o=mn,dragMomentum:r=!0}=e;return{...e,drag:n,dragDirectionLock:s,dragPropagation:i,dragConstraints:a,dragElastic:o,dragMomentum:r}}}function fi(t){let e=!0;return()=>{if(e){e=!1;return}t()}}function sh(t,e,n){const s=dn(t,fi(n)),i=dn(e,fi(n));return()=>{s(),i()}}function ne(t,e,n){return(e===!0||e===t)&&(n===null||n===t)}function ih(t,e=10){let n=null;return Math.abs(t.y)>e?n="y":Math.abs(t.x)>e&&(n="x"),n}class oh extends dt{constructor(e){super(e),this.removeGroupControls=H,this.removeListeners=H,this.controls=new nh(e)}mount(){const{dragControls:e}=this.node.getProps();e&&(this.removeGroupControls=e.subscribe(this.controls)),this.removeListeners=this.controls.addListeners()||H}update(){const{dragControls:e}=this.node.getProps(),{dragControls:n}=this.node.prevProps||{};e!==n&&(this.removeGroupControls(),e&&(this.removeGroupControls=e.subscribe(this.controls)))}unmount(){this.removeGroupControls(),this.removeListeners(),this.controls.isDragging||this.controls.endPanSession()}}const qe=t=>(e,n)=>{t&&V.update(()=>t(e,n),!1,!0)};class ah extends dt{constructor(){super(...arguments),this.removePointerDownListener=H}onPointerDown(e){this.session=new pa(e,this.createPanHandlers(),{transformPagePoint:this.node.getTransformPagePoint(),contextWindow:fa(this.node)})}createPanHandlers(){const{onPanSessionStart:e,onPanStart:n,onPan:s,onPanEnd:i}=this.node.getProps();return{onSessionStart:qe(e),onStart:qe(n),onMove:qe(s),onEnd:(a,o)=>{delete this.session,i&&V.postRender(()=>i(a,o))}}}mount(){this.removePointerDownListener=Bt(this.node.current,"pointerdown",e=>this.onPointerDown(e))}update(){this.session&&this.session.updateHandlers(this.createPanHandlers())}unmount(){this.removePointerDownListener(),this.session&&this.session.end()}}let Oe=!1;class rh extends v.Component{componentDidMount(){const{visualElement:e,layoutGroup:n,switchLayoutGroup:s,layoutId:i}=this.props,{projection:a}=e;a&&(n.group&&n.group.add(a),s&&s.register&&i&&s.register(a),Oe&&a.root.didUpdate(),a.addEventListener("animationComplete",()=>{this.safeToRemove()}),a.setOptions({...a.options,layoutDependency:this.props.layoutDependency,onExitComplete:()=>this.safeToRemove()})),ue.hasEverUpdated=!0}getSnapshotBeforeUpdate(e){const{layoutDependency:n,visualElement:s,drag:i,isPresent:a}=this.props,{projection:o}=s;return o&&(o.isPresent=a,e.layoutDependency!==n&&o.setOptions({...o.options,layoutDependency:n}),Oe=!0,i||e.layoutDependency!==n||n===void 0||e.isPresent!==a?o.willUpdate():this.safeToRemove(),e.isPresent!==a&&(a?o.promote():o.relegate()||V.postRender(()=>{const r=o.getStack();(!r||!r.members.length)&&this.safeToRemove()}))),null}componentDidUpdate(){const{visualElement:e,layoutAnchor:n}=this.props,{projection:s}=e;s&&(s.options.layoutAnchor=n,s.root.didUpdate(),In.postRender(()=>{!s.currentAnimation&&s.isLead()&&this.safeToRemove()}))}componentWillUnmount(){const{visualElement:e,layoutGroup:n,switchLayoutGroup:s}=this.props,{projection:i}=e;Oe=!0,i&&(i.scheduleCheckAfterUnmount(),n&&n.group&&n.group.remove(i),s&&s.deregister&&s.deregister(i))}safeToRemove(){const{safeToRemove:e}=this.props;e&&e()}render(){return null}}function ma(t){const[e,n]=ia(),s=v.useContext(xn);return U.jsx(rh,{...t,layoutGroup:s,switchLayoutGroup:v.useContext(da),isPresent:e,safeToRemove:n})}const ch={pan:{Feature:ah},drag:{Feature:oh,ProjectionNode:sa,MeasureLayout:ma}};function pi(t,e,n){const{props:s}=t;t.animationState&&s.whileHover&&t.animationState.setActive("whileHover",n==="Start");const i="onHover"+n,a=s[i];a&&V.postRender(()=>a(e,Zt(e)))}class lh extends dt{mount(){const{current:e}=this.node;e&&(this.unmount=Pc(e,(n,s)=>(pi(this.node,s,"Start"),i=>pi(this.node,i,"End"))))}unmount(){}}class hh extends dt{constructor(){super(...arguments),this.isActive=!1}onFocus(){let e=!1;try{e=this.node.current.matches(":focus-visible")}catch{e=!0}!e||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!0),this.isActive=!0)}onBlur(){!this.isActive||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!1),this.isActive=!1)}mount(){this.unmount=Kt(Ut(this.node.current,"focus",()=>this.onFocus()),Ut(this.node.current,"blur",()=>this.onBlur()))}unmount(){}}function yi(t,e,n){const{props:s}=t;if(t.current instanceof HTMLButtonElement&&t.current.disabled)return;t.animationState&&s.whileTap&&t.animationState.setActive("whileTap",n==="Start");const i="onTap"+(n==="End"?"":n),a=s[i];a&&V.postRender(()=>a(e,Zt(e)))}class dh extends dt{mount(){const{current:e}=this.node;if(!e)return;const{globalTapTarget:n,propagate:s}=this.node.props;this.unmount=Rc(e,(i,a)=>(yi(this.node,a,"Start"),(o,{success:r})=>yi(this.node,o,r?"End":"Cancel")),{useGlobalTarget:n,stopPropagation:(s==null?void 0:s.tap)===!1})}unmount(){}}const gn=new WeakMap,We=new WeakMap,uh=t=>{const e=gn.get(t.target);e&&e(t)},fh=t=>{t.forEach(uh)};function ph({root:t,...e}){const n=t||document;We.has(n)||We.set(n,{});const s=We.get(n),i=JSON.stringify(e);return s[i]||(s[i]=new IntersectionObserver(fh,{root:t,...e})),s[i]}function yh(t,e,n){const s=ph(e);return gn.set(t,n),s.observe(t),()=>{gn.delete(t),s.unobserve(t)}}const mh={some:0,all:1};class gh extends dt{constructor(){super(...arguments),this.hasEnteredView=!1,this.isInView=!1}startObserver(){var c;(c=this.stopObserver)==null||c.call(this);const{viewport:e={}}=this.node.getProps(),{root:n,margin:s,amount:i="some",once:a}=e,o={root:n?n.current:void 0,rootMargin:s,threshold:typeof i=="number"?i:mh[i]},r=h=>{const{isIntersecting:l}=h;if(this.isInView===l||(this.isInView=l,a&&!l&&this.hasEnteredView))return;l&&(this.hasEnteredView=!0),this.node.animationState&&this.node.animationState.setActive("whileInView",l);const{onViewportEnter:u,onViewportLeave:f}=this.node.getProps(),p=l?u:f;p&&p(h)};this.stopObserver=yh(this.node.current,o,r)}mount(){this.startObserver()}update(){if(typeof IntersectionObserver>"u")return;const{props:e,prevProps:n}=this.node;["amount","margin","root"].some(kh(e,n))&&this.startObserver()}unmount(){var e;(e=this.stopObserver)==null||e.call(this),this.hasEnteredView=!1,this.isInView=!1}}function kh({viewport:t={}},{viewport:e={}}={}){return n=>t[n]!==e[n]}const vh={inView:{Feature:gh},tap:{Feature:dh},focus:{Feature:hh},hover:{Feature:lh}},xh={layout:{ProjectionNode:sa,MeasureLayout:ma}},Mh={...Ol,...vh,...ch,...xh},ga=Bl(Mh,Fl);function we(t){return typeof window>"u"?!1:t?ao():Dn()}const wh=50,mi=()=>({current:0,offset:[],progress:0,scrollLength:0,targetOffset:0,targetLength:0,containerLength:0,velocity:0}),bh=()=>({time:0,x:mi(),y:mi()}),_h={x:{length:"Width",position:"Left"},y:{length:"Height",position:"Top"}};function gi(t,e,n,s){const i=n[e],{length:a,position:o}=_h[e],r=i.current,c=n.time;i.current=Math.abs(t[`scroll${o}`]),i.scrollLength=t[`scroll${a}`]-t[`client${a}`],i.offset.length=0,i.offset[0]=0,i.offset[1]=i.scrollLength,i.progress=Tt(0,i.scrollLength,i.current);const h=s-c;i.velocity=h>wh?0:bn(i.current-r,h)}function Th(t,e,n){gi(t,"x",e,n),gi(t,"y",e,n),e.time=n}function Ah(t,e){const n={x:0,y:0};let s=t;for(;s&&s!==e;)if(jt(s))n.x+=s.offsetLeft,n.y+=s.offsetTop,s=s.offsetParent;else if(s.tagName==="svg"){const i=s.getBoundingClientRect();s=s.parentElement;const a=s.getBoundingClientRect();n.x+=i.left-a.left,n.y+=i.top-a.top}else if(s instanceof SVGGraphicsElement){const{x:i,y:a}=s.getBBox();n.x+=i,n.y+=a;let o=null,r=s.parentNode;for(;!o;)r.tagName==="svg"&&(o=r),r=s.parentNode;s=o}else break;return n}const kn={start:0,center:.5,end:1};function ki(t,e,n=0){let s=0;if(t in kn&&(t=kn[t]),typeof t=="string"){const i=parseFloat(t);t.endsWith("px")?s=i:t.endsWith("%")?t=i/100:t.endsWith("vw")?s=i/100*document.documentElement.clientWidth:t.endsWith("vh")?s=i/100*document.documentElement.clientHeight:t=i}return typeof t=="number"&&(s=e*t),n+s}const Sh=[0,0];function Vh(t,e,n,s){let i=Array.isArray(t)?t:Sh,a=0,o=0;return typeof t=="number"?i=[t,t]:typeof t=="string"&&(t=t.trim(),t.includes(" ")?i=t.split(" "):i=[t,kn[t]?t:"0"]),a=ki(i[0],n,s),o=ki(i[1],e),a-o}const $t={Enter:[[0,1],[1,1]],Exit:[[0,0],[1,0]],Any:[[1,0],[0,1]],All:[[0,0],[1,1]]},Ch={x:0,y:0};function Ph(t){return"getBBox"in t&&t.tagName!=="svg"?t.getBBox():{width:t.clientWidth,height:t.clientHeight}}function Nh(t,e,n){const{offset:s=$t.All}=n,{target:i=t,axis:a="y"}=n,o=a==="y"?"height":"width",r=i!==t?Ah(i,t):Ch,c=i===t?{width:t.scrollWidth,height:t.scrollHeight}:Ph(i),h={width:t.clientWidth,height:t.clientHeight};e[a].offset.length=0;let l=!e[a].interpolate;const u=s.length;for(let f=0;f<u;f++){const p=Vh(s[f],h[o],c[o],r[a]);!l&&p!==e[a].interpolatorOffsets[f]&&(l=!0),e[a].offset[f]=p}l&&(e[a].interpolate=Nn(e[a].offset,eo(s),{clamp:!1}),e[a].interpolatorOffsets=[...e[a].offset]),e[a].progress=J(0,1,e[a].interpolate(e[a].current))}function $h(t,e=t,n){if(n.x.targetOffset=0,n.y.targetOffset=0,e!==t){let s=e;for(;s&&s!==t;)n.x.targetOffset+=s.offsetLeft,n.y.targetOffset+=s.offsetTop,s=s.offsetParent}n.x.targetLength=e===t?e.scrollWidth:e.clientWidth,n.y.targetLength=e===t?e.scrollHeight:e.clientHeight,n.x.containerLength=t.clientWidth,n.y.containerLength=t.clientHeight}function Eh(t,e,n,s={}){return{measure:i=>{$h(t,s.target,n),Th(t,n,i),(s.offset||s.target)&&Nh(t,n,s)},notify:()=>e(n)}}const xt=new WeakMap,vi=new WeakMap,Ue=new WeakMap,xi=new WeakMap,se=new WeakMap,Mi=t=>t===document.scrollingElement?window:t;function ka(t,{container:e=document.scrollingElement,trackContentSize:n=!1,...s}={}){if(!e)return H;let i=Ue.get(e);i||(i=new Set,Ue.set(e,i));const a=bh(),o=Eh(e,t,a,s);if(i.add(o),!xt.has(e)){const c=()=>{for(const f of i)f.measure(j.timestamp);V.preUpdate(h)},h=()=>{for(const f of i)f.notify()},l=()=>V.read(c);xt.set(e,l);const u=Mi(e);window.addEventListener("resize",l),e!==document.documentElement&&vi.set(e,dn(e,l)),u.addEventListener("scroll",l),l()}if(n&&!se.has(e)){const c=xt.get(e),h={width:e.scrollWidth,height:e.scrollHeight};xi.set(e,h);const l=()=>{const f=e.scrollWidth,p=e.scrollHeight;(h.width!==f||h.height!==p)&&(c(),h.width=f,h.height=p)},u=V.read(l,!0);se.set(e,u)}const r=xt.get(e);return V.read(r,!1,!0),()=>{var u;K(r);const c=Ue.get(e);if(!c||(c.delete(o),c.size))return;const h=xt.get(e);xt.delete(e),h&&(Mi(e).removeEventListener("scroll",h),(u=vi.get(e))==null||u(),window.removeEventListener("resize",h));const l=se.get(e);l&&(K(l),se.delete(e)),xi.delete(e)}}const Lh=[[$t.Enter,"entry"],[$t.Exit,"exit"],[$t.Any,"cover"],[$t.All,"contain"]],wi={start:0,end:1};function Dh(t){const e=t.trim().split(/\s+/);if(e.length!==2)return;const n=wi[e[0]],s=wi[e[1]];if(!(n===void 0||s===void 0))return[n,s]}function Rh(t){if(t.length!==2)return;const e=[];for(const n of t)if(Array.isArray(n))e.push(n);else if(typeof n=="string"){const s=Dh(n);if(!s)return;e.push(s)}else return;return e}function jh(t,e){const n=Rh(t);if(!n)return!1;for(let s=0;s<2;s++){const i=n[s],a=e[s];if(i[0]!==a[0]||i[1]!==a[1])return!1}return!0}function Zn(t){if(!t)return{rangeStart:"contain 0%",rangeEnd:"contain 100%"};for(const[e,n]of Lh)if(jh(t,e))return{rangeStart:`${n} 0%`,rangeEnd:`${n} 100%`}}const bi=new Map;function _i(t){const e={value:0},n=ka(s=>{e.value=s[t.axis].progress*100},t);return{currentTime:e,cancel:n}}function va({source:t,container:e,...n}){const{axis:s}=n;t&&(e=t);let i=bi.get(e);i||(i=new Map,bi.set(e,i));const a=n.target??"self";let o=i.get(a);o||(o={},i.set(a,o));const r=s+(n.offset??[]).join(",");return o[r]||(n.target&&we(n.target)?Zn(n.offset)?o[r]=new ViewTimeline({subject:n.target,axis:s}):o[r]=_i({container:e,...n}):we()?o[r]=new ScrollTimeline({source:e,axis:s}):o[r]=_i({container:e,...n})),o[r]}function zh(t,e){const n=va(e),s=e.target?Zn(e.offset):void 0,i=e.target?we(e.target)&&!!s:we();return t.attachTimeline({timeline:i?n:void 0,...s&&i&&{rangeStart:s.rangeStart,rangeEnd:s.rangeEnd},observe:a=>(a.pause(),No(o=>{a.time=a.iterationDuration*o},n))})}function Bh(t){return t.length===2}function Fh(t,e){return Bh(t)?ka(n=>{t(n[e.axis].progress,n)},e):No(t,va(e))}function xa(t,{axis:e="y",container:n=document.scrollingElement,...s}={}){if(!n)return H;const i={axis:e,container:n,...s};return typeof t=="function"?Fh(t,i):zh(t,i)}const Ih=()=>({scrollX:Y(0),scrollY:Y(0),scrollXProgress:Y(0),scrollYProgress:Y(0)}),ie=t=>t?!t.current:!1;function Ti(t,e,n,s){return{factory:i=>xa(i,{...e,axis:t,container:(n==null?void 0:n.current)||void 0,target:(s==null?void 0:s.current)||void 0}),times:[0,1],keyframes:[0,1],ease:i=>i,duration:1}}function Hh(t,e){return typeof window>"u"?!1:t?ao()&&!!Zn(e):Dn()}function Sp({container:t,target:e,...n}={}){const s=it(Ih);Hh(e,n.offset)&&(s.scrollXProgress.accelerate=Ti("x",n,t,e),s.scrollYProgress.accelerate=Ti("y",n,t,e));const i=v.useRef(null),a=v.useRef(!1),o=v.useCallback(()=>(i.current=xa((r,{x:c,y:h})=>{s.scrollX.set(c.current),s.scrollXProgress.set(c.progress),s.scrollY.set(h.current),s.scrollYProgress.set(h.progress)},{...n,container:(t==null?void 0:t.current)||void 0,target:(e==null?void 0:e.current)||void 0}),()=>{var r;(r=i.current)==null||r.call(i)}),[t,e,JSON.stringify(n.offset)]);return be(()=>{if(a.current=!1,ie(t)||ie(e)){a.current=!0;return}else return o()},[o]),v.useEffect(()=>{if(a.current)return Ht(!ie(t)),Ht(!ie(e)),o()},[o]),s}function Jn(t){const e=it(()=>Y(t)),{isStatic:n}=v.useContext(Yt);if(n){const[,s]=v.useState(t);v.useEffect(()=>e.on("change",s),[])}return e}function Ma(t,e){const n=Jn(e()),s=()=>n.set(e());return s(),be(()=>{const i=()=>V.preRender(s,!1,!0),a=t.map(o=>o.on("change",i));return()=>{a.forEach(o=>o()),K(s)}}),n}function qh(t){Rt.current=[],t();const e=Ma(Rt.current,t);return Rt.current=void 0,e}function Qn(t,e,n,s){if(typeof t=="function")return qh(t);if(n!==void 0&&!Array.isArray(n)&&typeof e!="function")return Oh(t,e,n,s);const o=typeof e=="function"?e:Uc(e,n,s),r=Array.isArray(t)?Ai(t,o):Ai([t],([h])=>o(h)),c=Array.isArray(t)?void 0:t.accelerate;return c&&!c.isTransformed&&typeof e!="function"&&Array.isArray(n)&&(s==null?void 0:s.clamp)!==!1&&(r.accelerate={...c,times:e,keyframes:n,isTransformed:!0}),r}function Ai(t,e){const n=it(()=>[]);return Ma(t,()=>{n.length=0;const s=t.length;for(let i=0;i<s;i++)n[i]=t[i].get();return e(n)})}function Oh(t,e,n,s){const i=it(()=>Object.keys(n)),a=it(()=>({}));for(const o of i)a[o]=Qn(t,e,n[o],s);return a}function Wh(t,e={}){const{isStatic:n}=v.useContext(Yt),s=()=>D(t)?t.get():t;if(n)return Qn(s);const i=Jn(s());return v.useInsertionEffect(()=>Kc(i,t,e),[i,JSON.stringify(e)]),i}function Vp(t,e={}){return Wh(t,{type:"spring",...e})}function Cp(){!Un.current&&Eo();const[t]=v.useState(ge.current);return t}const wa=v.createContext(null);function Uh(t,e,n,s){if(!s)return t;const i=t.findIndex(l=>l.value===e);if(i===-1)return t;const a=s>0?1:-1,o=t[i+a];if(!o)return t;const r=t[i],c=o.layout,h=P(c.min,c.max,.5);return a===1&&r.layout.max+n>h||a===-1&&r.layout.min+n<h?Aa(t,i,i+a):t}function Kh({children:t,as:e="ul",axis:n="y",onReorder:s,values:i,...a},o){const r=it(()=>ga[e]),c=[],h=v.useRef(!1),l=v.useRef(null),u={axis:n,groupRef:l,registerItem:(y,k)=>{const m=c.findIndex(g=>y===g.value);m!==-1?c[m].layout=k[n]:c.push({value:y,layout:k[n]}),c.sort(Gh)},updateOrder:(y,k,m)=>{if(h.current)return;const g=Uh(c,y,k,m);if(c!==g){h.current=!0;const M=[...i];for(let x=0;x<g.length;x++)if(c[x].value!==g[x].value){const w=i.indexOf(c[x].value),_=i.indexOf(g[x].value);w!==-1&&_!==-1&&([M[w],M[_]]=[M[_],M[w]]);break}s(M)}}};v.useEffect(()=>{h.current=!1});const f=y=>{l.current=y,typeof o=="function"?o(y):o&&(o.current=y)},p={overflowAnchor:"none",...a.style};return U.jsx(r,{...a,style:p,ref:f,ignoreStrict:!0,children:U.jsx(wa.Provider,{value:u,children:t})})}const Pp=v.forwardRef(Kh);function Gh(t,e){return t.layout.min-e.layout.min}const oe=50,Si=25,Xh=new Set(["auto","scroll"]),Ft=new WeakMap,It=new WeakMap;let Et=null;function Yh(){if(Et){const t=vn(Et,"y");t&&(It.delete(t),Ft.delete(t));const e=vn(Et,"x");e&&e!==t&&(It.delete(e),Ft.delete(e)),Et=null}}function Zh(t,e){const n=getComputedStyle(t),s=e==="x"?n.overflowX:n.overflowY,i=t===document.body||t===document.documentElement;return Xh.has(s)||i}function vn(t,e){let n=t==null?void 0:t.parentElement;for(;n;){if(Zh(n,e))return n;n=n.parentElement}return null}function Jh(t,e,n){const s=e.getBoundingClientRect(),i=n==="x"?Math.max(0,s.left):Math.max(0,s.top),a=n==="x"?Math.min(window.innerWidth,s.right):Math.min(window.innerHeight,s.bottom),o=t-i,r=a-t;if(o<oe){const c=1-o/oe;return{amount:-Si*c*c,edge:"start"}}else if(r<oe){const c=1-r/oe;return{amount:Si*c*c,edge:"end"}}return{amount:0,edge:null}}function Qh(t,e,n,s){if(!t)return;Et=t;const i=vn(t,n);if(!i)return;const a=e-(n==="x"?window.scrollX:window.scrollY),{amount:o,edge:r}=Jh(a,i,n);if(r===null){It.delete(i),Ft.delete(i);return}const c=It.get(i),h=i===document.body||i===document.documentElement;if(c!==r){if(!(r==="start"&&s<0||r==="end"&&s>0))return;It.set(i,r);const u=n==="x"?i.scrollWidth-(h?window.innerWidth:i.clientWidth):i.scrollHeight-(h?window.innerHeight:i.clientHeight);Ft.set(i,u)}if(o>0){const l=Ft.get(i);if((n==="x"?h?window.scrollX:i.scrollLeft:h?window.scrollY:i.scrollTop)>=l)return}n==="x"?h?window.scrollBy({left:o}):i.scrollLeft+=o:h?window.scrollBy({top:o}):i.scrollTop+=o}function Vi(t,e=0){return D(t)?t:Jn(e)}function td({children:t,style:e={},value:n,as:s="li",onDrag:i,onDragEnd:a,layout:o=!0,...r},c){const h=it(()=>ga[s]),l=v.useContext(wa),u={x:Vi(e.x),y:Vi(e.y)},f=Qn([u.x,u.y],([g,M])=>g||M?1:"unset"),{axis:p,registerItem:y,updateOrder:k,groupRef:m}=l;return U.jsx(h,{drag:p,...r,dragSnapToOrigin:!0,style:{...e,x:u.x,y:u.y,zIndex:f},layout:o,onDrag:(g,M)=>{const{velocity:x,point:w}=M,_=u[p].get();k(n,_,x[p]),Qh(m.current,w[p],p,x[p]),i&&i(g,M)},onDragEnd:(g,M)=>{Yh(),a&&a(g,M)},onLayoutMeasure:g=>{y(n,g)},ref:c,ignoreStrict:!0,children:t})}const Np=v.forwardRef(td);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ed=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),nd=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,n,s)=>s?s.toUpperCase():n.toLowerCase()),Ci=t=>{const e=nd(t);return e.charAt(0).toUpperCase()+e.slice(1)},ba=(...t)=>t.filter((e,n,s)=>!!e&&e.trim()!==""&&s.indexOf(e)===n).join(" ").trim(),sd=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var id={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const od=v.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:n=2,absoluteStrokeWidth:s,className:i="",children:a,iconNode:o,...r},c)=>v.createElement("svg",{ref:c,...id,width:e,height:e,stroke:t,strokeWidth:s?Number(n)*24/Number(e):n,className:ba("lucide",i),...!a&&!sd(r)&&{"aria-hidden":"true"},...r},[...o.map(([h,l])=>v.createElement(h,l)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(t,e)=>{const n=v.forwardRef(({className:s,...i},a)=>v.createElement(od,{ref:a,iconNode:e,className:ba(`lucide-${ed(Ci(t))}`,`lucide-${t}`,s),...i}));return n.displayName=Ci(t),n};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ad=[["circle",{cx:"16",cy:"4",r:"1",key:"1grugj"}],["path",{d:"m18 19 1-7-6 1",key:"r0i19z"}],["path",{d:"m5 8 3-3 5.5 3-2.36 3.5",key:"9ptxx2"}],["path",{d:"M4.24 14.5a5 5 0 0 0 6.88 6",key:"10kmtu"}],["path",{d:"M13.76 17.5a5 5 0 0 0-6.88-6",key:"2qq6rc"}]],$p=d("accessibility",ad);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rd=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],Ep=d("activity",rd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cd=[["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}],["path",{d:"M10 4v4",key:"pp8u80"}],["path",{d:"M2 8h20",key:"d11cs7"}],["path",{d:"M6 4v4",key:"1svtjw"}]],Lp=d("app-window",cd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ld=[["path",{d:"M12 6.528V3a1 1 0 0 1 1-1h0",key:"11qiee"}],["path",{d:"M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21",key:"110c12"}]],Dp=d("apple",ld);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hd=[["rect",{width:"20",height:"5",x:"2",y:"3",rx:"1",key:"1wp1u1"}],["path",{d:"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",key:"1s80jp"}],["path",{d:"M10 12h4",key:"a56b0p"}]],Rp=d("archive",hd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dd=[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]],jp=d("arrow-down-left",dd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ud=[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]],zp=d("arrow-down-right",ud);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fd=[["path",{d:"M12 17V3",key:"1cwfxf"}],["path",{d:"m6 11 6 6 6-6",key:"12ii2o"}],["path",{d:"M19 21H5",key:"150jfl"}]],Bp=d("arrow-down-to-line",fd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pd=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],Fp=d("arrow-left",pd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yd=[["path",{d:"m16 3 4 4-4 4",key:"1x1c3m"}],["path",{d:"M20 7H4",key:"zbl0bi"}],["path",{d:"m8 21-4-4 4-4",key:"h9nckh"}],["path",{d:"M4 17h16",key:"g4d7ey"}]],Ip=d("arrow-right-left",yd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const md=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],Hp=d("arrow-right",md);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gd=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],qp=d("arrow-up-right",gd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kd=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],Op=d("arrow-up",kd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vd=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8",key:"7n84p3"}]],Wp=d("at-sign",vd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xd=[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]],Up=d("award",xd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Md=[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Kp=d("badge-check",Md);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wd=[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["path",{d:"M7 12h5",key:"gblrwe"}],["path",{d:"M15 9.4a4 4 0 1 0 0 5.2",key:"1makmb"}]],Gp=d("badge-euro",wd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bd=[["path",{d:"M4.929 4.929 19.07 19.071",key:"196cmz"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Xp=d("ban",bd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _d=[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"2",key:"9lu3g6"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M6 12h.01M18 12h.01",key:"113zkx"}]],Yp=d("banknote",_d);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Td=[["path",{d:"M4.5 3h15",key:"c7n0jr"}],["path",{d:"M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3",key:"m1uhx7"}],["path",{d:"M6 14h12",key:"4cwo0f"}]],Zp=d("beaker",Td);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ad=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],Jp=d("bell",Ad);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sd=[["path",{d:"M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727",key:"yr8idg"}]],Qp=d("bitcoin",Sd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vd=[["path",{d:"M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2",key:"1ah6g2"}],["rect",{x:"14",y:"2",width:"8",height:"8",rx:"1",key:"88lufb"}]],ty=d("blocks",Vd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cd=[["path",{d:"M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8",key:"mg9rjx"}]],ey=d("bold",Cd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pd=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],ny=d("book-open",Pd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nd=[["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",key:"k3hazp"}]],sy=d("book",Nd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $d=[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]],iy=d("bookmark",$d);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ed=[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]],oy=d("bot",Ed);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ld=[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]],ay=d("box",Ld);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dd=[["path",{d:"M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z",key:"lc1i9w"}],["path",{d:"m7 16.5-4.74-2.85",key:"1o9zyk"}],["path",{d:"m7 16.5 5-3",key:"va8pkn"}],["path",{d:"M7 16.5v5.17",key:"jnp8gn"}],["path",{d:"M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z",key:"8zsnat"}],["path",{d:"m17 16.5-5-3",key:"8arw3v"}],["path",{d:"m17 16.5 4.74-2.85",key:"8rfmw"}],["path",{d:"M17 16.5v5.17",key:"k6z78m"}],["path",{d:"M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z",key:"1xygjf"}],["path",{d:"M12 8 7.26 5.15",key:"1vbdud"}],["path",{d:"m12 8 4.74-2.85",key:"3rx089"}],["path",{d:"M12 13.5V8",key:"1io7kd"}]],ry=d("boxes",Dd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rd=[["path",{d:"M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1",key:"ezmyqa"}],["path",{d:"M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1",key:"e1hn23"}]],cy=d("braces",Rd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jd=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M9 13a4.5 4.5 0 0 0 3-4",key:"10igwf"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M12 13h4",key:"1ku699"}],["path",{d:"M12 18h6a2 2 0 0 1 2 2v1",key:"105ag5"}],["path",{d:"M12 8h8",key:"1lhi5i"}],["path",{d:"M16 8V5a2 2 0 0 1 2-2",key:"u6izg6"}],["circle",{cx:"16",cy:"13",r:".5",key:"ry7gng"}],["circle",{cx:"18",cy:"3",r:".5",key:"1aiba7"}],["circle",{cx:"20",cy:"21",r:".5",key:"yhc1fs"}],["circle",{cx:"20",cy:"8",r:".5",key:"1e43v0"}]],ly=d("brain-circuit",jd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zd=[["path",{d:"M12 18V5",key:"adv99a"}],["path",{d:"M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",key:"1e3is1"}],["path",{d:"M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",key:"1gqd8o"}],["path",{d:"M17.997 5.125a4 4 0 0 1 2.526 5.77",key:"iwvgf7"}],["path",{d:"M18 18a4 4 0 0 0 2-7.464",key:"efp6ie"}],["path",{d:"M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",key:"1gq6am"}],["path",{d:"M6 18a4 4 0 0 1-2-7.464",key:"k1g0md"}],["path",{d:"M6.003 5.125a4 4 0 0 0-2.526 5.77",key:"q97ue3"}]],hy=d("brain",zd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bd=[["path",{d:"M12 12h.01",key:"1mp3jc"}],["path",{d:"M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",key:"1ksdt3"}],["path",{d:"M22 13a18.15 18.15 0 0 1-20 0",key:"12hx5q"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],dy=d("briefcase-business",Bd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fd=[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],uy=d("briefcase",Fd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Id=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],fy=d("building-2",Id);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hd=[["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",key:"cabbwy"}],["rect",{x:"4",y:"2",width:"16",height:"20",rx:"2",key:"1uxh74"}]],py=d("building",Hd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qd=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]],yy=d("calculator",qd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Od=[["path",{d:"M16 14v2.2l1.6 1",key:"fo4ql5"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",key:"1osxxc"}],["path",{d:"M3 10h5",key:"r794hk"}],["path",{d:"M8 2v4",key:"1cmpym"}],["circle",{cx:"16",cy:"16",r:"6",key:"qoo3c4"}]],my=d("calendar-clock",Od);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wd=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],gy=d("calendar",Wd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ud=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],ky=d("camera",Ud);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kd=[["rect",{width:"18",height:"14",x:"3",y:"5",rx:"2",ry:"2",key:"12ruh7"}],["path",{d:"M7 15h4M15 15h2M7 11h2M13 11h4",key:"1ueiar"}]],vy=d("captions",Kd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gd=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]],xy=d("chart-column",Gd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xd=[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]],My=d("chart-line",Xd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yd=[["path",{d:"M5 21v-6",key:"1hz6c0"}],["path",{d:"M12 21V3",key:"1lcnhd"}],["path",{d:"M19 21V9",key:"unv183"}]],wy=d("chart-no-axes-column",Yd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zd=[["path",{d:"M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",key:"pzmjnu"}],["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}]],by=d("chart-pie",Zd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jd=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],_y=d("check",Jd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qd=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],Ty=d("chevron-down",Qd);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tu=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],Ay=d("chevron-left",tu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const eu=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],Sy=d("chevron-right",eu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nu=[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]],Vy=d("chevron-up",nu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const su=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],Cy=d("circle-alert",su);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const iu=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Py=d("circle-check-big",iu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ou=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Ny=d("circle-check",ou);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const au=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 18V6",key:"zqpxq5"}]],$y=d("circle-dollar-sign",au);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ru=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"10",x2:"10",y1:"15",y2:"9",key:"c1nkhi"}],["line",{x1:"14",x2:"14",y1:"15",y2:"9",key:"h65svq"}]],Ey=d("circle-pause",ru);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cu=[["path",{d:"M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",key:"kmsa83"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Ly=d("circle-play",cu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lu=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]],Dy=d("circle-plus",lu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hu=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Ry=d("circle-question-mark",hu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const du=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],jy=d("circle-x",du);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uu=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],zy=d("circle",uu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fu=[["path",{d:"M12 6v6h4",key:"135r8i"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],By=d("clock-3",fu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pu=[["path",{d:"M12 6v6l4 2",key:"mmk7yg"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Fy=d("clock",pu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yu=[["path",{d:"M12 13v8",key:"1l5pq0"}],["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"m8 17 4-4 4 4",key:"1quai1"}]],Iy=d("cloud-upload",yu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mu=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]],Hy=d("cloud",mu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gu=[["path",{d:"m18 16 4-4-4-4",key:"1inbqp"}],["path",{d:"m6 8-4 4 4 4",key:"15zrgr"}],["path",{d:"m14.5 4-5 16",key:"e7oirm"}]],qy=d("code-xml",gu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ku=[["path",{d:"m16 18 6-6-6-6",key:"eg8j8"}],["path",{d:"m8 6-6 6 6 6",key:"ppft3o"}]],Oy=d("code",ku);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vu=[["path",{d:"M14 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1",key:"1l7d7l"}],["path",{d:"M19 3a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1",key:"9955pe"}],["path",{d:"m7 15 3 3",key:"4hkfgk"}],["path",{d:"m7 21 3-3H5a2 2 0 0 1-2-2v-2",key:"1xljwe"}],["rect",{x:"14",y:"14",width:"7",height:"7",rx:"1",key:"1cdgtw"}],["rect",{x:"3",y:"3",width:"7",height:"7",rx:"1",key:"zi3rio"}]],Wy=d("combine",vu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xu=[["path",{d:"M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3",key:"11bfej"}]],Uy=d("command",xu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mu=[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],Ky=d("compass",Mu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wu=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 18a6 6 0 0 0 0-12v12z",key:"j4l70d"}]],Gy=d("contrast",wu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bu=[["path",{d:"M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5",key:"laymnq"}],["path",{d:"M8.5 8.5v.01",key:"ue8clq"}],["path",{d:"M16 15.5v.01",key:"14dtrp"}],["path",{d:"M12 12v.01",key:"u5ubse"}],["path",{d:"M11 17v.01",key:"1hyl5a"}],["path",{d:"M7 14v.01",key:"uct60s"}]],Xy=d("cookie",bu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _u=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],Yy=d("copy",_u);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tu=[["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M17 20v2",key:"1rnc9c"}],["path",{d:"M17 2v2",key:"11trls"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M2 17h2",key:"7oei6x"}],["path",{d:"M2 7h2",key:"asdhe0"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"M20 17h2",key:"1fpfkl"}],["path",{d:"M20 7h2",key:"1o8tra"}],["path",{d:"M7 20v2",key:"4gnj0m"}],["path",{d:"M7 2v2",key:"1i4yhu"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1",key:"z9xiuo"}]],Zy=d("cpu",Tu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Au=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],Jy=d("credit-card",Au);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Su=[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]],Qy=d("crown",Su);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vu=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],tm=d("database",Vu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cu=[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]],em=d("dollar-sign",Cu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pu=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],nm=d("download",Pu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nu=[["path",{d:"M21.54 15H17a2 2 0 0 0-2 2v4.54",key:"1djwo0"}],["path",{d:"M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17",key:"1tzkfa"}],["path",{d:"M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05",key:"14pb5j"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],sm=d("earth",Nu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $u=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]],im=d("ellipsis-vertical",$u);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Eu=[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]],om=d("ellipsis",Eu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lu=[["path",{d:"M4 10h12",key:"1y6xl8"}],["path",{d:"M4 14h9",key:"1loblj"}],["path",{d:"M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2",key:"1j6lzo"}]],am=d("euro",Lu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Du=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],rm=d("external-link",Du);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ru=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],cm=d("eye-off",Ru);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ju=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],lm=d("eye",ju);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zu=[["path",{d:"M10 12v-1",key:"v7bkov"}],["path",{d:"M10 18v-2",key:"1cjy8d"}],["path",{d:"M10 7V6",key:"dljcrl"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v16a2 2 0 0 0 .274 1.01",key:"gkbcor"}],["circle",{cx:"10",cy:"20",r:"2",key:"1xzdoj"}]],hm=d("file-archive",zu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bu=[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m3 15 2 2 4-4",key:"1lhrkk"}]],dm=d("file-check-2",Bu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fu=[["path",{d:"M10 12.5 8 15l2 2.5",key:"1tg20x"}],["path",{d:"m14 12.5 2 2.5-2 2.5",key:"yinavb"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z",key:"1mlx9k"}]],um=d("file-code",Fu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Iu=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]],fm=d("file-down",Iu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hu=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1",key:"1oajmo"}],["path",{d:"M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1",key:"mpwhp6"}]],pm=d("file-json",Hu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qu=[["path",{d:"m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2",key:"142zxg"}],["path",{d:"M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",key:"2t3380"}],["path",{d:"M8 18h1",key:"13wk12"}]],ym=d("file-pen-line",qu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ou=[["path",{d:"M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5",key:"1couwa"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",key:"1y4qbx"}]],mm=d("file-pen",Ou);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wu=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]],gm=d("file-spreadsheet",Wu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uu=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],km=d("file-text",Uu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ku=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 12v6",key:"3ahymv"}],["path",{d:"m15 15-3-3-3 3",key:"15xj92"}]],vm=d("file-up",Ku);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gu=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],xm=d("file-warning",Gu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xu=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}]],Mm=d("file",Xu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yu=[["path",{d:"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",key:"1nerag"}],["path",{d:"M14 13.12c0 2.38 0 6.38-1 8.88",key:"o46ks0"}],["path",{d:"M17.29 21.02c.12-.6.43-2.3.5-3.02",key:"ptglia"}],["path",{d:"M2 12a10 10 0 0 1 18-6",key:"ydlgp0"}],["path",{d:"M2 16h.01",key:"1gqxmh"}],["path",{d:"M21.8 16c.2-2 .131-5.354 0-6",key:"drycrb"}],["path",{d:"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2",key:"1tidbn"}],["path",{d:"M8.65 22c.21-.66.45-1.32.57-2",key:"13wd9y"}],["path",{d:"M9 6.8a6 6 0 0 1 9 5.2v2",key:"1fr1j5"}]],wm=d("fingerprint",Yu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zu=[["path",{d:"M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",key:"1jaruq"}]],bm=d("flag",Zu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ju=[["path",{d:"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",key:"1slcih"}]],_m=d("flame",Ju);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qu=[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]],Tm=d("folder-open",Qu);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t0=[["path",{d:"M12 10v6",key:"1bos4e"}],["path",{d:"M9 13h6",key:"1uhe8q"}],["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]],Am=d("folder-plus",t0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const e0=[["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]],Sm=d("folder",e0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n0=[["path",{d:"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",key:"sc7q7i"}]],Vm=d("funnel",n0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s0=[["line",{x1:"6",x2:"10",y1:"11",y2:"11",key:"1gktln"}],["line",{x1:"8",x2:"8",y1:"9",y2:"13",key:"qnk9ow"}],["line",{x1:"15",x2:"15.01",y1:"12",y2:"12",key:"krot7o"}],["line",{x1:"18",x2:"18.01",y1:"10",y2:"10",key:"1lcuu1"}],["path",{d:"M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z",key:"mfqc10"}]],Cm=d("gamepad-2",s0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i0=[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]],Pm=d("gauge",i0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o0=[["path",{d:"m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381",key:"pgg06f"}],["path",{d:"m16 16 6-6",key:"vzrcl6"}],["path",{d:"m21.5 10.5-8-8",key:"a17d9x"}],["path",{d:"m8 8 6-6",key:"18bi4p"}],["path",{d:"m8.5 7.5 8 8",key:"1oyaui"}]],Nm=d("gavel",o0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a0=[["path",{d:"M10.5 3 8 9l4 13 4-13-2.5-6",key:"b3dvk1"}],["path",{d:"M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z",key:"7w4byz"}],["path",{d:"M2 9h20",key:"16fsjt"}]],$m=d("gem",a0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r0=[["path",{d:"M9 10h.01",key:"qbtxuw"}],["path",{d:"M15 10h.01",key:"1qmjsl"}],["path",{d:"M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z",key:"uwwb07"}]],Em=d("ghost",r0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c0=[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]],Lm=d("gift",c0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l0=[["line",{x1:"6",x2:"6",y1:"3",y2:"15",key:"17qcm7"}],["circle",{cx:"18",cy:"6",r:"3",key:"1h7g24"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["path",{d:"M18 9a9 9 0 0 1-9 9",key:"n2h4wq"}]],Dm=d("git-branch",l0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h0=[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]],Rm=d("github",h0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d0=[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]],jm=d("graduation-cap",d0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u0=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],zm=d("globe",u0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f0=[["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 12h18",key:"1i2n21"}],["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}]],Bm=d("grid-2x2",f0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p0=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]],Fm=d("grid-3x3",p0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y0=[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]],Im=d("grip-vertical",y0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m0=[["path",{d:"m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9",key:"1hayfq"}],["path",{d:"m18 15 4-4",key:"16gjal"}],["path",{d:"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",key:"15ts47"}]],Hm=d("hammer",m0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g0=[["path",{d:"m11 17 2 2a1 1 0 1 0 3-3",key:"efffak"}],["path",{d:"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4",key:"9pr0kb"}],["path",{d:"m21 3 1 11h-2",key:"1tisrp"}],["path",{d:"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3",key:"1uvwmv"}],["path",{d:"M3 4h8",key:"1ep09j"}]],qm=d("handshake",g0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k0=[["line",{x1:"22",x2:"2",y1:"12",y2:"12",key:"1y58io"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}],["line",{x1:"6",x2:"6.01",y1:"16",y2:"16",key:"sgf278"}],["line",{x1:"10",x2:"10.01",y1:"16",y2:"16",key:"1l4acy"}]],Om=d("hard-drive",k0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v0=[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"m17 12 3-2v8",key:"1hhhft"}]],Wm=d("heading-1",v0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x0=[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",key:"9jr5yi"}]],Um=d("heading-2",x0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M0=[["path",{d:"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",key:"mvr1a0"}]],Km=d("heart",M0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w0=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],Gm=d("history",w0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b0=[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]],Xm=d("house",b0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _0=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],Ym=d("image",_0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T0=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],Zm=d("info",T0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A0=[["rect",{width:"20",height:"20",x:"2",y:"2",rx:"5",ry:"5",key:"2e1cvw"}],["path",{d:"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z",key:"9exkf1"}],["line",{x1:"17.5",x2:"17.51",y1:"6.5",y2:"6.5",key:"r4j83e"}]],Jm=d("instagram",A0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S0=[["line",{x1:"19",x2:"10",y1:"4",y2:"4",key:"15jd3p"}],["line",{x1:"14",x2:"5",y1:"20",y2:"20",key:"bu0au3"}],["line",{x1:"15",x2:"9",y1:"4",y2:"20",key:"uljnxc"}]],Qm=d("italic",S0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V0=[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]],tg=d("key-round",V0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C0=[["path",{d:"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4",key:"g0fldk"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}]],eg=d("key",C0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P0=[["path",{d:"M10 8h.01",key:"1r9ogq"}],["path",{d:"M12 12h.01",key:"1mp3jc"}],["path",{d:"M14 8h.01",key:"1primd"}],["path",{d:"M16 12h.01",key:"1l6xoz"}],["path",{d:"M18 8h.01",key:"emo2bl"}],["path",{d:"M6 8h.01",key:"x9i8wu"}],["path",{d:"M7 16h10",key:"wp8him"}],["path",{d:"M8 12h.01",key:"czm47f"}],["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}]],ng=d("keyboard",P0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N0=[["path",{d:"M10 18v-7",key:"wt116b"}],["path",{d:"M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z",key:"1m329m"}],["path",{d:"M14 18v-7",key:"vav6t3"}],["path",{d:"M18 18v-7",key:"aexdmj"}],["path",{d:"M3 22h18",key:"8prr45"}],["path",{d:"M6 18v-7",key:"1ivflk"}]],sg=d("landmark",N0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $0=[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]],ig=d("languages",$0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E0=[["rect",{width:"18",height:"12",x:"3",y:"4",rx:"2",ry:"2",key:"1qhy41"}],["line",{x1:"2",x2:"22",y1:"20",y2:"20",key:"ni3hll"}]],og=d("laptop-minimal",E0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L0=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],ag=d("layers",L0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D0=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],rg=d("layout-dashboard",D0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R0=[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]],cg=d("layout-grid",R0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j0=[["rect",{width:"18",height:"7",x:"3",y:"3",rx:"1",key:"f1a2em"}],["rect",{width:"9",height:"7",x:"3",y:"14",rx:"1",key:"jqznyg"}],["rect",{width:"5",height:"7",x:"16",y:"14",rx:"1",key:"q5h2i8"}]],lg=d("layout-template",j0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z0=[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]],hg=d("lightbulb",z0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B0=[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]],dg=d("link-2",B0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F0=[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]],ug=d("link",F0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I0=[["path",{d:"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",key:"c2jq9f"}],["rect",{width:"4",height:"12",x:"2",y:"9",key:"mk3on5"}],["circle",{cx:"4",cy:"4",r:"2",key:"bt5ra8"}]],fg=d("linkedin",I0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H0=[["path",{d:"M11 5h10",key:"1cz7ny"}],["path",{d:"M11 12h10",key:"1438ji"}],["path",{d:"M11 19h10",key:"11t30w"}],["path",{d:"M4 4h1v5",key:"10yrso"}],["path",{d:"M4 9h2",key:"r1h2o0"}],["path",{d:"M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02",key:"xtkcd5"}]],pg=d("list-ordered",H0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q0=[["path",{d:"M3 5h.01",key:"18ugdj"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 19h.01",key:"noohij"}],["path",{d:"M8 5h13",key:"1pao27"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 19h13",key:"m83p4d"}]],yg=d("list",q0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O0=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],mg=d("loader-circle",O0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W0=[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]],gg=d("lock-keyhole",W0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U0=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]],kg=d("lock-open",U0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K0=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],vg=d("lock",K0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G0=[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]],xg=d("log-in",G0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X0=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],Mg=d("log-out",X0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y0=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],wg=d("mail",Y0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z0=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],bg=d("map-pin",Z0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J0=[["path",{d:"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",key:"169xi5"}],["path",{d:"M15 5.764v15",key:"1pn4in"}],["path",{d:"M9 3.236v15",key:"1uimfh"}]],_g=d("map",J0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q0=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"m21 3-7 7",key:"1l2asr"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M9 21H3v-6",key:"wtvkvv"}]],Tg=d("maximize-2",Q0);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t2=[["path",{d:"M8 3H5a2 2 0 0 0-2 2v3",key:"1dcmit"}],["path",{d:"M21 8V5a2 2 0 0 0-2-2h-3",key:"1e4gt3"}],["path",{d:"M3 16v3a2 2 0 0 0 2 2h3",key:"wsl5sc"}],["path",{d:"M16 21h3a2 2 0 0 0 2-2v-3",key:"18trek"}]],Ag=d("maximize",t2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const e2=[["path",{d:"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",key:"q8bfy3"}],["path",{d:"M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14",key:"1853fq"}],["path",{d:"M8 6v8",key:"15ugcq"}]],Sg=d("megaphone",e2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n2=[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]],Vg=d("menu",n2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s2=[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]],Cg=d("message-circle",s2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i2=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}],["path",{d:"M12 8v6",key:"1ib9pf"}],["path",{d:"M9 11h6",key:"1fldmi"}]],Pg=d("message-square-plus",i2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o2=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}]],Ng=d("message-square",o2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a2=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M15 9.34V5a3 3 0 0 0-5.68-1.33",key:"1gzdoj"}],["path",{d:"M16.95 16.95A7 7 0 0 1 5 12v-2",key:"cqa7eg"}],["path",{d:"M18.89 13.23A7 7 0 0 0 19 12v-2",key:"16hl24"}],["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M9 9v3a3 3 0 0 0 5.12 2.12",key:"r2i35w"}]],$g=d("mic-off",a2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r2=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["rect",{x:"9",y:"2",width:"6",height:"13",rx:"3",key:"s6n7sd"}]],Eg=d("mic",r2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c2=[["path",{d:"m14 10 7-7",key:"oa77jy"}],["path",{d:"M20 10h-6V4",key:"mjg0md"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M4 14h6v6",key:"rmj7iw"}]],Lg=d("minimize-2",c2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l2=[["path",{d:"M8 3v3a2 2 0 0 1-2 2H3",key:"hohbtr"}],["path",{d:"M21 8h-3a2 2 0 0 1-2-2V3",key:"5jw1f3"}],["path",{d:"M3 16h3a2 2 0 0 1 2 2v3",key:"198tvr"}],["path",{d:"M16 21v-3a2 2 0 0 1 2-2h3",key:"ph8mxp"}]],Dg=d("minimize",l2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h2=[["path",{d:"M5 12h14",key:"1ays0h"}]],Rg=d("minus",h2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d2=[["path",{d:"M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8",key:"10dyio"}],["path",{d:"M10 19v-3.96 3.15",key:"1irgej"}],["path",{d:"M7 19h5",key:"qswx4l"}],["rect",{width:"6",height:"10",x:"16",y:"12",rx:"2",key:"1egngj"}]],jg=d("monitor-smartphone",d2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u2=[["path",{d:"m9 10 3-3 3 3",key:"11gsxs"}],["path",{d:"M12 13V7",key:"h0r20n"}],["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["path",{d:"M12 17v4",key:"1riwvh"}],["path",{d:"M8 21h8",key:"1ev6f3"}]],zg=d("monitor-up",u2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f2=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],Bg=d("monitor",f2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p2=[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]],Fg=d("moon",p2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y2=[["path",{d:"M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",key:"edeuup"}]],Ig=d("mouse-pointer-2",y2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m2=[["path",{d:"M14 4.1 12 6",key:"ita8i4"}],["path",{d:"m5.1 8-2.9-.8",key:"1go3kf"}],["path",{d:"m6 12-1.9 2",key:"mnht97"}],["path",{d:"M7.2 2.2 8 5.1",key:"1cfko1"}],["path",{d:"M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z",key:"s0h3yz"}]],Hg=d("mouse-pointer-click",m2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g2=[["path",{d:"M12 2v20",key:"t6zp3m"}],["path",{d:"m15 19-3 3-3-3",key:"11eu04"}],["path",{d:"m19 9 3 3-3 3",key:"1mg7y2"}],["path",{d:"M2 12h20",key:"9i4pu4"}],["path",{d:"m5 9-3 3 3 3",key:"j64kie"}],["path",{d:"m9 5 3-3 3 3",key:"l8vdw6"}]],qg=d("move",g2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k2=[["path",{d:"M9 18V5l12-2v13",key:"1jmyc2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["circle",{cx:"18",cy:"16",r:"3",key:"1hluhg"}]],Og=d("music",k2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v2=[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1",key:"4q2zg0"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1",key:"8cvhb9"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1",key:"1egb70"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",key:"1jsf9p"}],["path",{d:"M12 12V8",key:"2874zd"}]],Wg=d("network",v2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x2=[["path",{d:"m16 16 2 2 4-4",key:"gfu2re"}],["path",{d:"M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",key:"e7tb2h"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["line",{x1:"12",x2:"12",y1:"22",y2:"12",key:"a4e8g8"}]],Ug=d("package-check",x2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M2=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],Kg=d("package",M2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w2=[["path",{d:"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",key:"e79jfc"}],["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}]],Gg=d("palette",w2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b2=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M15 3v18",key:"14nvp0"}],["path",{d:"m8 9 3 3-3 3",key:"12hl5m"}]],Xg=d("panel-right-close",b2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _2=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M9 21V9",key:"1oto5p"}]],Yg=d("panels-top-left",_2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T2=[["path",{d:"m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551",key:"1miecu"}]],Zg=d("paperclip",T2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A2=[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]],Jg=d("pause",A2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S2=[["path",{d:"M13 21h8",key:"1jsn5i"}],["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],Qg=d("pen-line",S2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V2=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],t5=d("pen",V2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C2=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]],e5=d("pencil",C2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P2=[["line",{x1:"19",x2:"5",y1:"5",y2:"19",key:"1x9vlm"}],["circle",{cx:"6.5",cy:"6.5",r:"2.5",key:"4mh3h7"}],["circle",{cx:"17.5",cy:"17.5",r:"2.5",key:"1mdrzq"}]],n5=d("percent",P2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N2=[["path",{d:"M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272",key:"1wngk7"}],["path",{d:"M22 2 2 22",key:"y4kqgn"}],["path",{d:"M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473",key:"10hv5p"}]],s5=d("phone-off",N2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $2=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],i5=d("phone",$2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E2=[["path",{d:"M2 10h6V4",key:"zwrco"}],["path",{d:"m2 4 6 6",key:"ug085t"}],["path",{d:"M21 10V7a2 2 0 0 0-2-2h-7",key:"git5jr"}],["path",{d:"M3 14v2a2 2 0 0 0 2 2h3",key:"1f7fh3"}],["rect",{x:"12",y:"14",width:"10",height:"7",rx:"1",key:"1wjs3o"}]],o5=d("picture-in-picture",E2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L2=[["path",{d:"M12 17v5",key:"bb1du9"}],["path",{d:"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",key:"1nkz8b"}]],a5=d("pin",L2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D2=[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]],r5=d("play",D2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R2=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],c5=d("plus",R2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j2=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],l5=d("printer",j2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z2=[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]],h5=d("qr-code",z2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B2=[["path",{d:"M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"rib7q0"}],["path",{d:"M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",key:"1ymkrd"}]],d5=d("quote",B2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F2=[["path",{d:"M16.247 7.761a6 6 0 0 1 0 8.478",key:"1fwjs5"}],["path",{d:"M19.075 4.933a10 10 0 0 1 0 14.134",key:"ehdyv1"}],["path",{d:"M4.925 19.067a10 10 0 0 1 0-14.134",key:"1q22gi"}],["path",{d:"M7.753 16.239a6 6 0 0 1 0-8.478",key:"r2q7qm"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],u5=d("radio",F2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I2=[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",key:"q3az6g"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17.5v-11",key:"1jc1ny"}]],f5=d("receipt",I2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H2=[["path",{d:"m15 14 5-5-5-5",key:"12vg1m"}],["path",{d:"M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13",key:"6uklza"}]],p5=d("redo-2",H2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q2=[["path",{d:"M21 7v6h-6",key:"3ptur4"}],["path",{d:"M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7",key:"1kgawr"}]],y5=d("redo",q2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O2=[["path",{d:"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"14sxne"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",key:"1hlbsb"}],["path",{d:"M16 16h5v5",key:"ccwih5"}]],m5=d("refresh-ccw",O2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W2=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],g5=d("refresh-cw",W2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U2=[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]],k5=d("repeat",U2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K2=[["path",{d:"M20 18v-2a4 4 0 0 0-4-4H4",key:"5vmcpk"}],["path",{d:"m9 17-5-5 5-5",key:"nvlc11"}]],v5=d("reply",K2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G2=[["path",{d:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",key:"m3kijz"}],["path",{d:"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",key:"1fmvmk"}],["path",{d:"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",key:"1f8sc4"}],["path",{d:"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",key:"qeys4"}]],x5=d("rocket",G2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X2=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],M5=d("rotate-ccw",X2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y2=[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]],w5=d("rotate-cw",Y2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z2=[["circle",{cx:"6",cy:"19",r:"3",key:"1kj8tv"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",key:"1d8sl"}],["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}]],b5=d("route",Z2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J2=[["path",{d:"M4 11a9 9 0 0 1 9 9",key:"pv89mb"}],["path",{d:"M4 4a16 16 0 0 1 16 16",key:"k0647b"}],["circle",{cx:"5",cy:"19",r:"1",key:"bfqh0e"}]],_5=d("rss",J2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q2=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],T5=d("save",Q2);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tf=[["path",{d:"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"7g6ntu"}],["path",{d:"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z",key:"ijws7r"}],["path",{d:"M7 21h10",key:"1b0cd5"}],["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",key:"3gwbw2"}]],A5=d("scale",tf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ef=[["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M18 5v16",key:"1ethyx"}],["path",{d:"m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6",key:"zywc2d"}],["path",{d:"m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11",key:"1d4ql0"}],["path",{d:"M6 5v16",key:"1sn0nx"}],["circle",{cx:"12",cy:"9",r:"2",key:"1092wv"}]],S5=d("school",ef);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nf=[["path",{d:"M15 12h-5",key:"r7krc0"}],["path",{d:"M15 8h-5",key:"1khuty"}],["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",key:"1ph1d7"}]],V5=d("scroll-text",nf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sf=[["path",{d:"m8 11 2 2 4-4",key:"1sed1v"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],C5=d("search-check",sf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const of=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],P5=d("search",of);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const af=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]],N5=d("send",af);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rf=[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]],$5=d("server",rf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cf=[["path",{d:"M14 17H5",key:"gfn3mx"}],["path",{d:"M19 7h-9",key:"6i9tg"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]],E5=d("settings-2",cf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lf=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],L5=d("settings",lf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hf=[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]],D5=d("share-2",hf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const df=[["path",{d:"M12 2v13",key:"1km8f5"}],["path",{d:"m16 6-4-4-4 4",key:"13yo43"}],["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}]],R5=d("share",df);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uf=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],j5=d("shield-alert",uf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ff=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],z5=d("shield-check",ff);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pf=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 22V2",key:"zs6s6o"}]],B5=d("shield-half",pf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yf=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],F5=d("shield",yf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mf=[["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}],["path",{d:"M3.103 6.034h17.794",key:"awc11p"}],["path",{d:"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z",key:"o988cm"}]],I5=d("shopping-bag",mf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gf=[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]],H5=d("shopping-cart",gf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kf=[["path",{d:"M10 5H3",key:"1qgfaw"}],["path",{d:"M12 19H3",key:"yhmn1j"}],["path",{d:"M14 3v4",key:"1sua03"}],["path",{d:"M16 17v4",key:"1q0r14"}],["path",{d:"M21 12h-9",key:"1o4lsq"}],["path",{d:"M21 19h-5",key:"1rlt1p"}],["path",{d:"M21 5h-7",key:"1oszz2"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M8 12H3",key:"a7s4jb"}]],q5=d("sliders-horizontal",kf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vf=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],O5=d("smartphone",vf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xf=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]],W5=d("smile",xf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mf=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],U5=d("sparkles",Mf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wf=[["path",{d:"M16 3h5v5",key:"1806ms"}],["path",{d:"M8 3H3v5",key:"15dfkv"}],["path",{d:"M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3",key:"1qrqzj"}],["path",{d:"m15 9 6-6",key:"ko1vev"}]],K5=d("split",wf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bf=[["path",{d:"M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344",key:"2acyp4"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],G5=d("square-check-big",bf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _f=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],X5=d("square-pen",_f);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tf=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]],Y5=d("square",Tf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Af=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],Z5=d("star",Af);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sf=[["path",{d:"M11 2v2",key:"1539x4"}],["path",{d:"M5 2v2",key:"1yf1q8"}],["path",{d:"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1",key:"rb5t3r"}],["path",{d:"M8 15a6 6 0 0 0 12 0v-3",key:"x18d4x"}],["circle",{cx:"20",cy:"10",r:"2",key:"ts1r5v"}]],J5=d("stethoscope",Sf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vf=[["path",{d:"M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z",key:"qazsjp"}],["path",{d:"M15 3v4a2 2 0 0 0 2 2h4",key:"40519r"}]],Q5=d("sticky-note",Vf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cf=[["path",{d:"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5",key:"slp6dd"}],["path",{d:"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",key:"o0xfot"}],["path",{d:"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05",key:"wn3emo"}]],tk=d("store",Cf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pf=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],ek=d("sun",Pf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nf=[["path",{d:"m11 19-6-6",key:"s7kpr"}],["path",{d:"m5 21-2-2",key:"1kw20b"}],["path",{d:"m8 16-4 4",key:"1oqv8h"}],["path",{d:"M9.5 17.5 21 6V3h-3L6.5 14.5",key:"pkxemp"}]],nk=d("sword",Nf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $f=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["line",{x1:"12",x2:"12.01",y1:"18",y2:"18",key:"1dp563"}]],sk=d("tablet",$f);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ef=[["path",{d:"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",key:"vktsd0"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor",key:"kqv944"}]],ik=d("tag",Ef);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lf=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],ok=d("target",Lf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Df=[["path",{d:"M12 19h8",key:"baeox8"}],["path",{d:"m4 17 6-6-6-6",key:"1yngyt"}]],ak=d("terminal",Df);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rf=[["path",{d:"M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01a2.83 2.83 0 0 1 0-4L17 3",key:"1ub6xw"}],["path",{d:"m16 2 6 6",key:"1gw87d"}],["path",{d:"M12 16H4",key:"1cjfip"}]],rk=d("test-tube-diagonal",Rf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jf=[["path",{d:"M7 10v12",key:"1qc93n"}],["path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",key:"emmmcr"}]],ck=d("thumbs-up",jf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zf=[["path",{d:"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",key:"qn84l0"}],["path",{d:"M13 5v2",key:"dyzc3o"}],["path",{d:"M13 17v2",key:"1ont0d"}],["path",{d:"M13 11v2",key:"1wjjxi"}]],lk=d("ticket",zf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bf=[["line",{x1:"10",x2:"14",y1:"2",y2:"2",key:"14vaq8"}],["line",{x1:"12",x2:"15",y1:"14",y2:"11",key:"17fdiu"}],["circle",{cx:"12",cy:"14",r:"8",key:"1e1u0o"}]],hk=d("timer",Bf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ff=[["circle",{cx:"9",cy:"12",r:"3",key:"u3jwor"}],["rect",{width:"20",height:"14",x:"2",y:"5",rx:"7",key:"g7kal2"}]],dk=d("toggle-left",Ff);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const If=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],uk=d("trash-2",If);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hf=[["path",{d:"M16 17h6v-6",key:"t6n2it"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7",key:"x473p"}]],fk=d("trending-down",Hf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qf=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],pk=d("trending-up",qf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Of=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],yk=d("triangle-alert",Of);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wf=[["path",{d:"M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"14u9p9"}]],mk=d("triangle",Wf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uf=[["path",{d:"M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978",key:"1n3hpd"}],["path",{d:"M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978",key:"rfe1zi"}],["path",{d:"M18 9h1.5a1 1 0 0 0 0-5H18",key:"7xy6bh"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z",key:"1mhfuq"}],["path",{d:"M6 9H4.5a1 1 0 0 1 0-5H6",key:"tex48p"}]],gk=d("trophy",Uf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kf=[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]],kk=d("truck",Kf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gf=[["path",{d:"M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",key:"pff0z6"}]],vk=d("twitter",Gf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xf=[["path",{d:"M12 4v16",key:"1654pz"}],["path",{d:"M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2",key:"e0r10z"}],["path",{d:"M9 20h6",key:"s66wpe"}]],xk=d("type",Xf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yf=[["path",{d:"M9 14 4 9l5-5",key:"102s5s"}],["path",{d:"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",key:"f3b9sd"}]],Mk=d("undo-2",Yf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zf=[["path",{d:"M3 7v6h6",key:"1v2h90"}],["path",{d:"M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",key:"1r6uu6"}]],wk=d("undo",Zf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jf=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],bk=d("upload",Jf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qf=[["path",{d:"m16 11 2 2 4-4",key:"9rsbq5"}],["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],_k=d("user-check",Qf);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tp=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],Tk=d("user-plus",tp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ep=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],Ak=d("user-minus",ep);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const np=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],Sk=d("user-round",np);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sp=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"17",x2:"22",y1:"8",y2:"13",key:"3nzzx3"}],["line",{x1:"22",x2:"17",y1:"8",y2:"13",key:"1swrse"}]],Vk=d("user-x",sp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ip=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],Ck=d("user",ip);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const op=[["path",{d:"M18 21a8 8 0 0 0-16 0",key:"3ypg7q"}],["circle",{cx:"10",cy:"8",r:"5",key:"o932ke"}],["path",{d:"M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3",key:"10s06x"}]],Pk=d("users-round",op);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ap=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],Nk=d("users",ap);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rp=[["path",{d:"M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196",key:"w8jjjt"}],["path",{d:"M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2",key:"1xawa7"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],$k=d("video-off",rp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cp=[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]],Ek=d("video",cp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lp=[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]],Lk=d("volume-2",lp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hp=[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["line",{x1:"22",x2:"16",y1:"9",y2:"15",key:"1ewh16"}],["line",{x1:"16",x2:"22",y1:"9",y2:"15",key:"5ykzw1"}]],Dk=d("volume-x",hp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dp=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2",key:"4125el"}],["path",{d:"M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21",key:"1dpki6"}]],Rk=d("wallet-cards",dp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const up=[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1",key:"18etb6"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",key:"xoc0q4"}]],jk=d("wallet",up);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fp=[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",key:"ul74o6"}],["path",{d:"m14 7 3 3",key:"1r5n42"}],["path",{d:"M5 6v4",key:"ilb8ba"}],["path",{d:"M19 14v4",key:"blhpug"}],["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M7 8H3",key:"zfb6yr"}],["path",{d:"M21 16h-4",key:"1cnmox"}],["path",{d:"M11 3H9",key:"1obp7u"}]],zk=d("wand-sparkles",fp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pp=[["path",{d:"M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2",key:"q3hayz"}],["path",{d:"m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06",key:"1go1hn"}],["path",{d:"m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8",key:"qlwsc0"}]],Bk=d("webhook",pp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yp=[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]],Fk=d("wifi",yp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mp=[["rect",{width:"8",height:"8",x:"3",y:"3",rx:"2",key:"by2w9f"}],["path",{d:"M7 11v4a2 2 0 0 0 2 2h4",key:"xkn7yn"}],["rect",{width:"8",height:"8",x:"13",y:"13",rx:"2",key:"1cgmvn"}]],Ik=d("workflow",mp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gp=[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",key:"1ngwbx"}]],Hk=d("wrench",gp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kp=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],qk=d("x",kp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vp=[["path",{d:"M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17",key:"1q2vi4"}],["path",{d:"m10 15 5-3-5-3z",key:"1jp15x"}]],Ok=d("youtube",vp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xp=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Wk=d("zap",xp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mp=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],Uk=d("zoom-in",Mp);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wp=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],Kk=d("zoom-out",wp);export{oy as $,Hp as A,fy as B,_y as C,Xy as D,E5 as E,km as F,zm as G,vk as H,Jm as I,Rm as J,fg as K,mg as L,Sg as M,cg as N,Km as O,Kg as P,Zm as Q,k5 as R,z5 as S,pk as T,Sk as U,yk as V,Hk as W,qk as X,Cp as Y,Wk as Z,Ky as _,Ap as a,Jg as a$,ry as a0,dy as a1,lg as a2,Pk as a3,qp as a4,nm as a5,Ay as a6,ik as a7,Yy as a8,lm as a9,gy as aA,rm as aB,Cg as aC,om as aD,R5 as aE,hm as aF,bg as aG,em as aH,iy as aI,xy as aJ,Vm as aK,im as aL,X5 as aM,uk as aN,Ly as aO,T5 as aP,Bg as aQ,jk as aR,sg as aS,Gm as aT,Ep as aU,zp as aV,r5 as aW,Tk as aX,L5 as aY,Ry as aZ,Im as a_,j5 as aa,Cy as ab,g5 as ac,Xm as ad,wg as ae,ng as af,Op as ag,Fp as ah,wm as ai,vg as aj,cm as ak,jy as al,Py as am,tm as an,_k as ao,Ng as ap,Om as aq,Zy as ar,Jp as as,D5 as at,N5 as au,q5 as av,Bm as aw,Uy as ax,$y as ay,Kp as az,uy as b,Bp as b$,Y5 as b0,Up as b1,ug as b2,Gg as b3,Ak as b4,Xp as b5,Fy as b6,Vg as b7,Cm as b8,Eg as b9,o5 as bA,Dg as bB,Ag as bC,eg as bD,gk as bE,Mm as bF,_m as bG,Zg as bH,ty as bI,Ik as bJ,H5 as bK,Q5 as bL,Zp as bM,Lm as bN,qm as bO,Ip as bP,m5 as bQ,jp as bR,lk as bS,ym as bT,f5 as bU,Qp as bV,By as bW,ok as bX,hg as bY,Wy as bZ,bm as b_,Ek as ba,V5 as bb,t5 as bc,Am as bd,Dk as be,Lk as bf,Qg as bg,i5 as bh,dg as bi,a5 as bj,ck as bk,v5 as bl,Dy as bm,Ym as bn,W5 as bo,Wp as bp,e5 as bq,Tm as br,Iy as bs,Pm as bt,sk as bu,x5 as bv,xk as bw,qy as bx,sm as by,M5 as bz,U5 as c,Kk as c$,gm as c0,ak as c1,h5 as c2,Fk as c3,b5 as c4,Hg as c5,C5 as c6,zk as c7,mm as c8,Bk as c9,Gy as cA,vy as cB,my as cC,ek as cD,$p as cE,Fg as cF,Mg as cG,py as cH,ly as cI,fk as cJ,A5 as cK,kg as cL,gg as cM,Nm as cN,xm as cO,Ig as cP,Vy as cQ,K5 as cR,Ug as cS,dm as cT,S5 as cU,Xg as cV,p5 as cW,Pg as cX,Mk as cY,kk as cZ,Qy as c_,Oy as ca,bk as cb,Lp as cc,$5 as cd,n5 as ce,Yp as cf,Sm as cg,ey as ch,Qm as ci,Wm as cj,Um as ck,yg as cl,pg as cm,G5 as cn,d5 as co,wk as cp,y5 as cq,sy as cr,Lg as cs,Tg as ct,Fm as cu,am as cv,dk as cw,vm as cx,tg as cy,qg as cz,ay as d,Uk as d0,_5 as d1,u5 as d2,$k as d3,$g as d4,zg as d5,s5 as d6,l5 as d7,ig as d8,Vk as d9,wy as dA,My as dB,xg as dC,Pp as dD,Np as dE,Og as dF,fm as dG,Hy as dH,pm as dI,Rp as dJ,cy as dK,Dm as dL,Ey as dM,rk as dN,w5 as da,ky as db,Ok as dc,hk as dd,zy as de,jg as df,nk as dg,mk as dh,_g as di,hy as dj,Gp as dk,Rk as dl,$m as dm,Sp as dn,Qn as dp,Hm as dq,J5 as dr,Wg as ds,Jn as dt,B5 as du,Vp as dv,Rg as dw,Em as dx,og as dy,Dp as dz,Nk as e,ag as f,yy as g,O5 as h,P5 as i,Z5 as j,ny as k,Ny as l,ga as m,c5 as n,tk as o,rg as p,by as q,Ty as r,F5 as s,I5 as t,Ck as u,jm as v,Jy as w,Yg as x,um as y,Sy as z};
//# sourceMappingURL=vendor-ui-DOeBBl1E.js.map
