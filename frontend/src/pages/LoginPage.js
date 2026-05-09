// src/pages/LoginPage.jsx
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";

export default function LoginPage({ onLogin, onGoSignup, toast }) {
  const T = useTheme();
  const [form, setForm]       = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) return toast("Fill all fields","error");
    setLoading(true);
    try {
      const data = await api("/login",{method:"POST",body:JSON.stringify(form)});
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      toast("Welcome back, " + data.user.username + "! 🎉");
      onLogin(data.user);
    } catch(e) { toast(e.message,"error"); }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:"100vh", background:T.bg, color:T.text,
      fontFamily:"DM Sans, sans-serif", transition:"all 0.3s",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      position:"relative",
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
          position:"absolute",top:3,left:T.dark?21:3,
          transition:"left 0.3s",
          boxShadow:`0 0 8px ${T.dark?"rgba(0,196,232,0.6)":"rgba(255,229,102,0.8)"}`,
        }}/>
      </button>

      <div style={{width:"100%",maxWidth:420,animation:"fadeUp 0.4s ease forwards"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <img
            src="/logo.png"
            alt="SkillSwap"
            style={{
              width:52, height:52, objectFit:"contain",
              borderRadius:14, margin:"0 auto 14px", display:"block",
              boxShadow:"0 0 28px rgba(0,196,232,0.35)",
            }}
          />
          <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:28,letterSpacing:"-0.02em",color:T.text}}>
            Welcome back
          </h2>
          <p style={{color:T.muted,fontSize:14,marginTop:6}}>Sign in to continue trading skills</p>
        </div>

        {/* Card */}
        <div style={{
          background:T.surface, border:`1px solid ${T.border}`,
          borderRadius:18, padding:32,
        }}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Email</label>
            <input
              type="email" placeholder="you@example.com"
              value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&submit()}
              style={{width:"100%",padding:"13px 16px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,color:T.text,fontFamily:"DM Sans",fontSize:14,outline:"none",transition:"border 0.2s"}}
              onFocus={e=>e.target.style.borderColor="#00c4e8"}
              onBlur={e=>e.target.style.borderColor=T.border}
            />
          </div>
          <div style={{marginBottom:24}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Password</label>
            <input
              type="password" placeholder="••••••••"
              value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&submit()}
              style={{width:"100%",padding:"13px 16px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,color:T.text,fontFamily:"DM Sans",fontSize:14,outline:"none",transition:"border 0.2s"}}
              onFocus={e=>e.target.style.borderColor="#00c4e8"}
              onBlur={e=>e.target.style.borderColor=T.border}
            />
          </div>
          <button onClick={submit} disabled={loading} style={{
            width:"100%",padding:"13px",borderRadius:10,border:"none",
            background:"linear-gradient(135deg,#00c4e8,#0066ff)",
            color:"#fff",fontFamily:"DM Sans",fontSize:15,fontWeight:700,
            cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            boxShadow:"0 0 20px rgba(0,196,232,0.3)",transition:"all 0.2s",
          }}>
            {loading ? <span style={{width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/> : "Sign In →"}
          </button>
        </div>

        <p style={{textAlign:"center",marginTop:20,fontSize:13,color:T.muted}}>
          No account?{" "}
          <span onClick={onGoSignup} style={{color:T.accent,cursor:"pointer",fontWeight:700}}>Create one free →</span>
        </p>
      </div>
    </div>
  );
}
