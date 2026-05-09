// src/pages/LandingPage.jsx
import { useTheme } from "../context/ThemeContext";

const FEATURES = [
  { icon:"⚡", title:"Live Matching",   desc:"AI-powered real-time skill matching algorithm" },
  { icon:"📹", title:"Video Sessions",  desc:"WebRTC peer-to-peer HD video skill exchange" },
  { icon:"⛓️", title:"On-Chain Creds", desc:"Blockchain-verified skill credentials forever" },
  { icon:"⭐", title:"Rating System",   desc:"Build your reputation with every session" },
];

export default function LandingPage({ onLogin, onSignup }) {
  const T = useTheme();

  const keyframes = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  `;

  const floaters = [
    {s:"React",x:6,y:18,d:0},{s:"Guitar",x:86,y:22,d:0.6},
    {s:"Python",x:78,y:62,d:1},{s:"Yoga",x:4,y:68,d:1.4},
    {s:"Spanish",x:88,y:78,d:0.8},{s:"UI/UX",x:14,y:84,d:1.2},
    {s:"Cooking",x:48,y:6,d:0.3},{s:"AI/ML",x:44,y:91,d:1.8},
  ];

  return (
    <div style={{
      minHeight:"100vh", background:T.bg, color:T.text,
      fontFamily:"DM Sans, sans-serif", transition:"all 0.3s",
      position:"relative", overflow:"hidden",
    }}>
      <style>{keyframes}</style>

      {/* Grid bg */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:`linear-gradient(${T.dark?"rgba(0,196,232,0.03)":"rgba(0,196,232,0.06)"} 1px,transparent 1px),linear-gradient(90deg,${T.dark?"rgba(0,196,232,0.03)":"rgba(0,196,232,0.06)"} 1px,transparent 1px)`,
        backgroundSize:"60px 60px",
      }}/>

      {/* Orbs */}
      {T.dark && <>
        <div style={{position:"fixed",width:500,height:500,borderRadius:"50%",background:"rgba(0,196,232,0.06)",top:-100,left:-100,filter:"blur(80px)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"fixed",width:400,height:400,borderRadius:"50%",background:"rgba(255,61,107,0.05)",bottom:-80,right:-80,filter:"blur(80px)",pointerEvents:"none",zIndex:0}}/>
      </>}

      {/* Floating skill tags */}
      {floaters.map((f,i) => (
        <div key={i} style={{
          position:"fixed", left:`${f.x}%`, top:`${f.y}%`, zIndex:0,
          pointerEvents:"none",
          padding:"5px 13px", borderRadius:999,
          background: T.dark?"rgba(255,255,255,0.02)":"rgba(0,196,232,0.06)",
          border:`1px solid ${T.dark?"rgba(255,255,255,0.06)":"rgba(0,196,232,0.15)"}`,
          color: T.dark?"rgba(255,255,255,0.12)":"rgba(0,196,232,0.4)",
          fontSize:11, fontWeight:700, letterSpacing:"0.05em",
          animation:`float ${3+i*0.3}s ease-in-out infinite`,
          animationDelay:`${f.d}s`,
        }}>{f.s}</div>
      ))}

      {/* NAV */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 48px", height:64,
        background: T.dark?"rgba(3,5,10,0.8)":"rgba(240,244,255,0.85)",
        backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${T.border}`,
        transition:"all 0.3s",
      }}>
        {/* Logo — using logo.png from public folder */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img
            src="/logo.png"
            alt="SkillSwap Logo"
            style={{
              width:34,
              height:34,
              objectFit:"contain",
              borderRadius:8,
            }}
          />
          <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,letterSpacing:"-0.02em",color:T.text}}>
            SKILL<span style={{color:T.accent}}>SWAP</span>
          </span>
        </div>

        {/* Nav right */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* Dark/Light toggle */}
          <button onClick={T.toggle} style={{
            width:44,height:26,borderRadius:13,border:`1.5px solid ${T.border}`,
            background: T.dark?"#1a2236":"#dde3f0",
            cursor:"pointer",position:"relative",transition:"all 0.3s",padding:0,
          }}>
            <div style={{
              width:18,height:18,borderRadius:"50%",
              background: T.dark?"#00c4e8":"#ffe566",
              position:"absolute",top:3,
              left: T.dark?21:3,
              transition:"left 0.3s, background 0.3s",
              boxShadow:`0 0 8px ${T.dark?"rgba(0,196,232,0.6)":"rgba(255,229,102,0.8)"}`,
            }}/>
          </button>
          <button onClick={onLogin} style={{
            padding:"8px 20px",borderRadius:9,border:`1px solid ${T.border}`,
            background:"transparent",color:T.accent,fontFamily:"DM Sans",
            fontSize:14,fontWeight:700,cursor:"pointer",transition:"all 0.2s",
          }}>Login</button>
          <button onClick={onSignup} style={{
            padding:"9px 20px",borderRadius:9,border:"none",
            background:"linear-gradient(135deg,#00c4e8,#0066ff)",
            color:"#fff",fontFamily:"DM Sans",fontSize:14,fontWeight:700,
            cursor:"pointer",boxShadow:"0 0 20px rgba(0,196,232,0.3)",
            transition:"all 0.2s",
          }}>Get Started →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        minHeight:"100vh",display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",textAlign:"center",
        padding:"100px 24px 60px",position:"relative",zIndex:1,
      }}>
        {/* Badge */}
        <div style={{
          display:"inline-flex",alignItems:"center",gap:8,
          padding:"6px 16px",borderRadius:999,marginBottom:28,
          background:"rgba(0,196,232,0.08)",
          border:"1px solid rgba(0,196,232,0.25)",
          fontSize:12,fontWeight:700,color:T.accent,letterSpacing:"0.08em",
          animation:"fadeUp 0.5s ease forwards",
        }}>
          <span style={{width:6,height:6,borderRadius:"50%",background:T.accent,display:"inline-block",animation:"pulse 2s infinite"}}/>
          DECENTRALIZED SKILL EXCHANGE PROTOCOL
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:"Syne,sans-serif",fontWeight:800,
          fontSize:"clamp(40px,7vw,86px)",
          lineHeight:1.0,letterSpacing:"-0.03em",marginBottom:24,
          color:T.text,animation:"fadeUp 0.5s 0.05s ease forwards",opacity:0,
        }}>
          Trade Skills,<br/>
          <span style={{
            background:"linear-gradient(90deg,#00c4e8,#ff3d6b,#ffe566,#00c4e8)",
            backgroundSize:"300% auto",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"shimmer 4s linear infinite",
          }}>Not Money.</span>
        </h1>

        <p style={{
          fontSize:"clamp(15px,2vw,18px)",color:T.muted,maxWidth:520,
          lineHeight:1.7,marginBottom:40,
          animation:"fadeUp 0.5s 0.1s ease forwards",opacity:0,
        }}>
          Teach what you know. Learn what you love. Every skill exchange is
          verified on the blockchain and matched by AI.
        </p>

        {/* CTAs */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",
          animation:"fadeUp 0.5s 0.15s ease forwards",opacity:0}}>
          <button onClick={onSignup} style={{
            padding:"14px 32px",borderRadius:10,border:"none",fontSize:15,
            fontWeight:700,fontFamily:"DM Sans",cursor:"pointer",
            background:"linear-gradient(135deg,#00c4e8,#0066ff)",color:"#fff",
            boxShadow:"0 0 30px rgba(0,196,232,0.35)",transition:"all 0.2s",
          }}>Start Swapping →</button>
          <button onClick={onLogin} style={{
            padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:700,
            fontFamily:"DM Sans",cursor:"pointer",
            background:"transparent",color:T.accent,
            border:`1px solid ${T.dark?"rgba(0,196,232,0.35)":T.border}`,
            transition:"all 0.2s",
          }}>Sign In</button>
        </div>

        {/* Stats */}
        <div style={{display:"flex",gap:48,marginTop:64,
          animation:"fadeUp 0.5s 0.2s ease forwards",opacity:0}}>
          {[["500+","Skills Available"],["2.4k","Active Traders"],["98%","Match Rate"]].map(([n,l]) => (
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:28,color:T.accent}}>{n}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:2,fontWeight:500}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{padding:"60px 48px 100px",maxWidth:1000,margin:"0 auto",position:"relative",zIndex:1}}>
        <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:34,
          textAlign:"center",marginBottom:40,color:T.text,letterSpacing:"-0.02em"}}>
          How it <span style={{color:T.accent}}>Works</span>
        </h2>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:18}}>
          {FEATURES.map((f,i) => (
            <div key={i} style={{
              padding:24,borderRadius:14,cursor:"default",
              background:T.surface,border:`1px solid ${T.border}`,
              transition:"all 0.2s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,196,232,0.4)";e.currentTarget.style.transform="translateY(-3px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{fontSize:30,marginBottom:10}}>{f.icon}</div>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,marginBottom:6,color:T.text}}>{f.title}</div>
              <div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop:56,textAlign:"center",padding:"44px 32px",borderRadius:18,
          background: T.dark?"linear-gradient(135deg,rgba(0,196,232,0.06),rgba(255,61,107,0.04))":"linear-gradient(135deg,rgba(0,196,232,0.08),rgba(255,61,107,0.05))",
          border:`1px solid ${T.dark?"rgba(0,196,232,0.2)":"rgba(0,196,232,0.25)"}`,
        }}>
          <h3 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:26,marginBottom:10,color:T.text}}>
            Ready to start swapping?
          </h3>
          <p style={{color:T.muted,marginBottom:22,fontSize:14}}>
            Free forever. No money exchanged — only skills.
          </p>
          <button onClick={onSignup} style={{
            padding:"13px 34px",borderRadius:10,border:"none",
            background:"linear-gradient(135deg,#00c4e8,#0066ff)",
            color:"#fff",fontFamily:"DM Sans",fontSize:15,fontWeight:700,
            cursor:"pointer",boxShadow:"0 0 24px rgba(0,196,232,0.3)",
          }}>Create Free Account →</button>
        </div>
      </div>
    </div>
  );
}
