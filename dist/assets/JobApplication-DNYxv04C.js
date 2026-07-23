const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DVp6wI-c.js","assets/vendor-react-2DI8nfEr.js","assets/vendor-ui-Dgnfd_EO.js","assets/vendor-supabase-_AuQRo9U.js","assets/vendor-runtime-ckwbz45p.js","assets/vendor-utils-0xY1gjx9.js","assets/index-BxxiYQM5.css"])))=>i.map(i=>d[i]);
import{_ as Z}from"./vendor-runtime-ckwbz45p.js";import{o as W,i as ee,r as n,j as e,L as C}from"./vendor-react-2DI8nfEr.js";import{u as se,e as U,S as te,s as d}from"./index-DVp6wI-c.js";import{g as M}from"./geminiClient-eE27CT6z.js";import{c as ae}from"./chatAiService-lcvhHEU7.js";import{aj as re,c as oe,b as ie,m as P,v as ne,a5 as q,av as le}from"./vendor-ui-Dgnfd_EO.js";import"./vendor-supabase-_AuQRo9U.js";import"./vendor-utils-0xY1gjx9.js";let ce=M();const de=()=>ce;class ue{static async getLocalizedResponse(w){const{locale:m,message:o,job_context:j,chat_history:t}=w,f=`
      You are part of Wersee’s global localization system.
      Your job is to adapt content, UI text, and conversations based on the user's locale.

      A locale is defined as:
      {language}-{country}
      Example: nl-nl, en-us, de-de

      ---
      GOALS:
      1. Always respond in the correct language
      2. Adapt tone to the country culture
      3. Keep responses clear, short, and professional
      4. Optimize for job application conversations

      ---
      LANGUAGE RULES:
      - If the language is supported (nl, en, de, fr, es, pt):
        → Respond fully in that language
      - If the language is NOT supported:
        → Fallback to English (en)

      ---
      COUNTRY TONE ADJUSTMENTS:
      - en-us → casual, confident, direct
      - en-gb → polite, slightly formal
      - nl-nl → direct, clear, informal-professional
      - de-de → formal, structured, precise
      - fr-fr → polite, slightly formal
      - es-es → friendly and expressive

      ---
      JOB APPLICATION CONTEXT:
      When used inside ApplyFlow:
      - Ask relevant follow-up questions
      - Keep messages short (1–2 sentences)
      - Be conversational, not robotic
      - Encourage better answers if input is weak
      - Detect low-effort or unclear answers and ask for clarification

      ---
      TRANSLATION RULES:
      If content is not in the user's language:
      - Translate it naturally
      - Do NOT translate word-for-word
      - Keep meaning and intent
      - Keep it professional
      - **CRITICAL: Do NOT translate or modify URLs. Keep them exactly as they are.**

      ---
      OUTPUT STYLE:
      - No emojis
      - No unnecessary explanations
      - Clean formatting
      - Human-like tone
      - Return ONLY the response message.

      ---
      INPUT VARIABLES:
      locale: ${m}
      user_message: ${o}
      job_context: ${j||"General conversation"}
      ${t?`CHAT HISTORY:
${t}`:""}
    `;try{const l=de();return l?(await l.models.generateContent({model:"gemini-3-flash-preview",contents:f})).text||"I'm sorry, I encountered an error. Could you repeat that?":o}catch(l){return console.error("Localization AI Error:",l),"I'm sorry, I'm having trouble processing your request right now."}}}let me=M();const pe=()=>me,Ne=()=>{var L;const{id:u}=W(),w=ee(),{user:m}=se(),[o,j]=n.useState(null),[t,f]=n.useState(null),[l,g]=n.useState([]),[h,A]=n.useState(""),[D,J]=n.useState(!0),[b,_]=n.useState(!1),S=n.useRef(null);n.useEffect(()=>{u&&m?z():m||w("/auth")},[u,m]),n.useEffect(()=>{var s;(s=S.current)==null||s.scrollIntoView({behavior:"smooth"})},[l]);const z=async()=>{try{const{data:s}=await U("business/get-listing",{id:u});j(s);const r=await U("jobs/apply/start",{jobId:u});r.success&&r.data&&(f(r.data),Y(r.data.id))}catch(s){console.error("Error starting application:",s)}finally{J(!1)}},Y=async s=>{try{const{supabase:r}=await Z(async()=>{const{supabase:x}=await import("./index-DVp6wI-c.js").then(y=>y.an);return{supabase:x}},__vite__mapDeps([0,1,2,3,4,5,6])),{data:p}=await r.from("job_application_messages").select("*").eq("application_id",s).order("created_at",{ascending:!0});p&&g(p)}catch(r){console.error("Error fetching messages:",r)}},B=async s=>{var p,x,y;if(s.preventDefault(),!h.trim()||!t||b)return;const r=h.trim();A(""),_(!0);try{const E=(await ae(r)).cleanedContent,{data:F,error:I}=await d.from("job_application_messages").insert({application_id:t.id,message:E,role:"user"}).select().single();if(I)throw I;g(a=>[...a,F]);const{data:i}=await d.from("job_applications").select("*, listings(title, description), job_application_flows(config, job_questions(*))").eq("id",t.id).single(),{data:v}=await d.from("job_application_messages").select("*").eq("application_id",t.id).order("created_at",{ascending:!0}),R=((p=i==null?void 0:i.listings)==null?void 0:p.title)||"a job",H=((x=i==null?void 0:i.listings)==null?void 0:x.description)||"",G=((y=i==null?void 0:i.job_application_flows)==null?void 0:y.job_questions)||[],$=(v==null?void 0:v.map(a=>`${a.role==="ai"?"AI":"Candidate"}: ${a.message}`).join(`
`))||"",k=new URLSearchParams(window.location.search),K=k.get("hl")||k.get("locale")||navigator.language||"en-US",N=await ue.getLocalizedResponse({locale:K,message:E,job_context:`Recruiter for "${R}". URL: ${window.location.href}. Description: "${H}". Questions to cover: ${G.map(a=>a.question).join(", ")}`,chat_history:$}),{data:V,error:O}=await d.from("job_application_messages").insert({application_id:t.id,message:N,role:"ai"}).select().single();if(O)throw O;if(g(a=>[...a,V]),N.toLowerCase().includes("application is complete")){f(c=>({...c,status:"completed"}));const a=pe();if(!a){await d.from("job_applications").update({status:"completed"}).eq("id",t.id);return}const Q=`
          Analyze the following interview chat history for the position of "${R}".
          
          Chat History:
          ${$}
          AI: ${N}
          
          Provide a structured summary and scoring for the employer.
          Return ONLY a JSON object with the following structure:
          {
            "summary": "A short, clean summary of the candidate's experience, skills, and communication style.",
            "scores": {
              "skill": number (0-100),
              "fit": number (0-100),
              "effort": "High" | "Medium" | "Low"
            },
            "redFlags": ["list of any red flags, or empty array"]
          }
        `;let X=(await a.models.generateContent({model:"gemini-3-flash-preview",contents:Q,config:{responseMimeType:"application/json"}})).text||"{}";try{const c=JSON.parse(X);await d.from("job_applications").update({ai_summary:c.summary,scores:c.scores,status:"completed"}).eq("id",t.id)}catch(c){console.error("Failed to parse summary JSON:",c)}}}catch(T){console.error("Error in chat flow:",T)}finally{_(!1)}};return D?e.jsx("div",{className:"min-h-screen bg-[#0A0A0A] flex items-center justify-center",children:e.jsx("div",{className:"w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"})}):o?e.jsxs("div",{className:"min-h-screen bg-[#0A0A0A] flex flex-col",children:[e.jsx(te,{title:`Apply for ${o.title} | Wersee`,description:`Apply for the ${o.title} position at ${((L=o.profiles)==null?void 0:L.full_name)||"Wersee"}`}),e.jsxs("header",{className:"sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx(C,{to:`/jobs/${o.id}`,className:"p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors",children:e.jsx(re,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-lg font-black text-white",children:o.title}),e.jsx("p",{className:"text-xs text-gray-500 font-medium",children:"Application Interview"})]})]}),e.jsx("div",{className:"w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20",children:e.jsx(oe,{className:"w-5 h-5 text-indigo-400"})})]}),e.jsxs("main",{className:"flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl mx-auto w-full",children:[e.jsxs(ie,{initial:!1,children:[l.map(s=>e.jsxs(P.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},className:`flex gap-4 ${s.role==="user"?"flex-row-reverse":""}`,children:[e.jsx("div",{className:`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.role==="user"?"bg-indigo-500 text-white":"bg-white/10 text-gray-400"}`,children:s.role==="user"?e.jsx(ne,{className:"w-4 h-4"}):e.jsx(q,{className:"w-4 h-4"})}),e.jsx("div",{className:`max-w-[80%] rounded-2xl p-4 ${s.role==="user"?"bg-indigo-500 text-white rounded-tr-sm":"bg-[#111] border border-white/10 text-gray-200 rounded-tl-sm"}`,children:e.jsx("p",{className:"text-sm whitespace-pre-wrap leading-relaxed",children:s.message})})]},s.id)),b&&e.jsxs(P.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},className:"flex gap-4",children:[e.jsx("div",{className:"w-8 h-8 rounded-full bg-white/10 text-gray-400 flex items-center justify-center shrink-0",children:e.jsx(q,{className:"w-4 h-4"})}),e.jsxs("div",{className:"bg-[#111] border border-white/10 rounded-2xl p-4 rounded-tl-sm flex items-center gap-2",children:[e.jsx("div",{className:"w-2 h-2 bg-gray-500 rounded-full animate-bounce"}),e.jsx("div",{className:"w-2 h-2 bg-gray-500 rounded-full animate-bounce",style:{animationDelay:"0.2s"}}),e.jsx("div",{className:"w-2 h-2 bg-gray-500 rounded-full animate-bounce",style:{animationDelay:"0.4s"}})]})]})]}),e.jsx("div",{ref:S})]}),e.jsx("footer",{className:"p-6 bg-[#0A0A0A] border-t border-white/10",children:e.jsx("div",{className:"max-w-3xl mx-auto",children:(t==null?void 0:t.status)==="completed"?e.jsx("div",{className:"text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold",children:"Application Complete! The employer will review your profile."}):e.jsxs("form",{onSubmit:B,className:"relative",children:[e.jsx("input",{type:"text",value:h,onChange:s=>A(s.target.value),placeholder:"Type your answer...",disabled:b,className:"w-full bg-[#111] border border-white/10 rounded-2xl pl-6 pr-16 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"}),e.jsx("button",{type:"submit",disabled:!h.trim()||b,className:"absolute right-2 top-2 bottom-2 aspect-square bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-xl flex items-center justify-center transition-all",children:e.jsx(le,{className:"w-4 h-4"})})]})})})]}):e.jsxs("div",{className:"min-h-screen bg-[#0A0A0A] text-white pt-24 pb-20 flex flex-col items-center justify-center",children:[e.jsx("h1",{className:"text-2xl font-bold mb-4",children:"Job not found"}),e.jsx(C,{to:"/jobs",className:"text-indigo-400 hover:text-indigo-300",children:"Back to Jobs"})]})};export{Ne as JobApplication};
//# sourceMappingURL=JobApplication-DNYxv04C.js.map
