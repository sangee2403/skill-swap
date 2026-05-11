// src/pages/SignupPage.jsx
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import SkillSelector from "../components/SkillSelector";

export default function SignupPage({ onSuccess, onGoLogin, toast }) {
  const T = useTheme();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    username:"", email:"", password:"", confirm:"",
    skills_offered:[], skills_needed:[],
  });

  const inp = (name,type="text",ph) => (
    <input
      type={type} name={name} placeholder={ph}
      value={form[name]} onChange={e=>setForm(p=>({...p,[name]:e.target.value}))}
      style={{width:"100%",padding:"12px 15px",borderRadius:10,
        border:`1px solid ${T.border}`,background:T.surface2,color:T.text,
        fontFamily:"DM Sans",fontSize:14,outline:"none",transition:"border 0.2s"}}
      onFocus={e=>e.target.style.borderColor="#00c4e8"}
      onBlur={e=>e.target.style.borderColor=T.border}
    />
  );

  const label = txt => (
    <label style={{display:"block",fontSize:11,fontWeight:700,color:T.muted,
      letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>{txt}</label>
  );

  const goStep2 = () => {
    if (!form.username)                  return toast("Username required","error");
    if (!form.email)                     return toast("Email required","error");
    if (!form.password)                  return toast("Password required","error");
    if (form.password.length < 6)       return toast("Password min 6 chars","error");
    if (form.password !== form.confirm) return toast("Passwords don't match","error");
    setStep(2);
  };

  const submit = async () => {
    if (!form.skills_offered.length) return toast("Select at least 1 skill you offer","error");
    if (!form.skills_needed.length)  return toast("Select at least 1 skill you need","error");
    setLoading(true);
    try {
      await api("/api/register",{method:"POST",body:JSON.stringify({
        username:form.username, email:form.email, password:form.password,
        skills_offered:form.skills_offered, skills_needed:form.skills_needed,
      })});
      toast("Account created! Please login 🎉");
      onSuccess();
    } catch(e) { toast(e.message,"error"); }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:"100vh",background:T.bg,color:T.text,
      fontFamily:"DM Sans, sans-serif",transition:"all 0.3s",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:"20px",position:"relative",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;500;700&display=swap');
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Theme toggle */}
      <button onClick={T.toggle} style={{
        position:"fixed",top:20,right:20,
        width:44,height:26,borderRadius:13,border:`1.5px solid ${T.border}`,
        background:T.dark?"#1a2236":"#dde3f0",cursor:"pointer",padding:0,zIndex:100,
      }}>
        <div style={{
          width:18,height:18,borderRadius:"50%",
          background:T.dark?"#00c4e8":"#ffe566",
          position:"absolute",top:3,left:T.dark?21:3,transition:"left 0.3s",
          boxShadow:`0 0 8px ${T.dark?"rgba(0,196,232,0.6)":"rgba(255,229,102,0.8)"}`,
        }}/>
      </button>

      <div style={{width:"100%",maxWidth:step===2?620:430,animation:"fadeUp 0.4s ease forwards"}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:28}}>
          {/* LOGO */}
          <img
            src="/logo.png"
            alt="SkillSwap"
            style={{
              width:50, height:50, objectFit:"contain",
              borderRadius:14, margin:"0 auto 12px", display:"block",
              boxShadow:"0 0 26px rgba(0,196,232,0.35)",
            }}
          />
          <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:26,letterSpacing:"-0.02em",color:T.text}}>
            {step===1 ? "Create Account" : "Pick Your Skills"}
          </h2>
          <p style={{color:T.muted,fontSize:14,marginTop:5}}>
            {step===1 ? "Join the skill exchange revolution" : "What do you offer & what do you want to learn?"}
          </p>

          {/* Step Indicator */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}>
            {[1,2].map(s=>(
              <div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{
                  width:28,height:28,borderRadius:"50%",
                  background:step>=s?"#00c4e8":T.border,
                  color:step>=s?"#03050a":T.muted,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:800,transition:"all 0.3s",
                  boxShadow:step>=s?"0 0 12px rgba(0,196,232,0.4)":"none",
                }}>{s}</div>
                {s<2&&<div style={{width:40,height:2,borderRadius:2,background:step>s?"#00c4e8":T.border,transition:"background 0.3s"}}/>}
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1 */}
        {step===1 && (
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:28}}>
            <div style={{marginBottom:14}}>{label("Username")}{inp("username","text","Enter Your Name")}</div>
            <div style={{marginBottom:14}}>{label("Email")}{inp("email","email","you@example.com")}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:22}}>
              <div>{label("Password")}{inp("password","password","••••••••")}</div>
              <div>{label("Confirm")}{inp("confirm","password","••••••••")}</div>
            </div>
            <button onClick={goStep2} style={{
              width:"100%",padding:"13px",borderRadius:10,border:"none",
              background:"linear-gradient(135deg,#00c4e8,#0066ff)",
              color:"#fff",fontFamily:"DM Sans",fontSize:15,fontWeight:700,cursor:"pointer",
              boxShadow:"0 0 20px rgba(0,196,232,0.3)",
            }}>Next: Select Skills →</button>
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:28}}>
            {/* Offer */}
            <div style={{
              padding:18,borderRadius:12,marginBottom:16,
              background:T.dark?"rgba(0,196,232,0.03)":"rgba(0,196,232,0.05)",
              border:`1px solid ${T.dark?"rgba(0,196,232,0.15)":"rgba(0,196,232,0.25)"}`,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:20}}>🎯</span>
                <div>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:T.text}}>Skills You Offer</div>
                  <div style={{fontSize:12,color:T.muted}}>What can you teach?</div>
                </div>
              </div>
              <SkillSelector type="offer" selected={form.skills_offered} onChange={v=>setForm(p=>({...p,skills_offered:v}))}/>
            </div>

            {/* Need */}
            <div style={{
              padding:18,borderRadius:12,marginBottom:20,
              background:T.dark?"rgba(255,61,107,0.03)":"rgba(255,61,107,0.04)",
              border:`1px solid ${T.dark?"rgba(255,61,107,0.15)":"rgba(255,61,107,0.2)"}`,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:20}}>✨</span>
                <div>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:T.text}}>Skills You Need</div>
                  <div style={{fontSize:12,color:T.muted}}>What do you want to learn?</div>
                </div>
              </div>
              <SkillSelector type="need" selected={form.skills_needed} onChange={v=>setForm(p=>({...p,skills_needed:v}))}/>
            </div>

            {/* Summary bar */}
            {(form.skills_offered.length>0||form.skills_needed.length>0) && (
              <div style={{padding:"9px 14px",borderRadius:9,marginBottom:14,
                background:T.surface2,border:`1px solid ${T.border}`,fontSize:12,color:T.muted}}>
                <span style={{color:"#00c4e8"}}>⚡ {form.skills_offered.length} offering</span>
                {" · "}
                <span style={{color:"#ff3d6b"}}>✨ {form.skills_needed.length} needed</span>
              </div>
            )}

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(1)} style={{
                padding:"12px 20px",borderRadius:10,border:`1px solid ${T.border}`,
                background:"transparent",color:T.accent,fontFamily:"DM Sans",
                fontSize:14,fontWeight:700,cursor:"pointer",
              }}>← Back</button>
              <button onClick={submit} disabled={loading} style={{
                flex:1,padding:"12px",borderRadius:10,border:"none",
                background:"linear-gradient(135deg,#00c4e8,#0066ff)",
                color:"#fff",fontFamily:"DM Sans",fontSize:15,fontWeight:700,
                cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              }}>
                {loading?<span style={{width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>:"Create Account 🚀"}
              </button>
            </div>
          </div>
        )}

        <p style={{textAlign:"center",marginTop:18,fontSize:13,color:T.muted}}>
          Already have an account?{" "}
          <span onClick={onGoLogin} style={{color:T.accent,cursor:"pointer",fontWeight:700}}>Sign in →</span>
        </p>
      </div>
    </div>
  );
}
