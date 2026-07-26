import{g as f}from"./geminiClient-ByrKbAeq.js";const d=()=>f(),u=async e=>{const l=/https?:\/\/[^\s]+/g,o=e.match(l);if(!o||o.length===0)return{safe:!0,cleanedContent:e};const a=d();try{if(!a)throw new Error("GEMINI_API_KEY not configured");const r=await a.models.generateContent({model:"gemini-3-flash-preview",contents:`
        Analyze the following message for forbidden payment links.
        Forbidden: Any payment links (Stripe, PayPal, Buy Me a Coffee, etc.) that are NOT from Wersee (wersee.com).
        Allowed: Any other links (Google, YouTube, etc.) and Wersee links (wersee.com).
        
        If a forbidden link is found, return a JSON object with:
        - "safe": false
        - "cleanedContent": The message with forbidden links replaced by "[FORBIDDEN LINK REMOVED]"
        - "reason": A short explanation
        
        If no forbidden links are found, return:
        - "safe": true
        - "cleanedContent": The original message
        
        Message: "${e}"
      `,config:{responseMimeType:"application/json"}}),n=JSON.parse(r.text||'{"safe": true}');return{safe:n.safe??!0,cleanedContent:n.cleanedContent??e,reason:n.reason}}catch(r){console.error("AI Link Detection Error:",r);const n=[/stripe\.com/,/paypal\.me/,/paypal\.com/,/buymeacoffee\.com/];let s=e,i=!1;for(const t of o)!t.includes("wersee.com")&&n.some(c=>c.test(t))&&(s=s.replace(t,"[FORBIDDEN LINK REMOVED]"),i=!0);return{safe:!i,cleanedContent:s}}};export{u as c};
