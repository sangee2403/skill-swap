// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import SkillSelector from "../components/SkillSelector";
import { useBlockchain } from "../hooks/useBlockchain";

export default function ProfilePage({ user, setUser, setPage, toast }) {
  const T = useTheme();
  const [form, setForm]     = useState({
    skills_offered: Array.isArray(user?.skills_offered) ? user.skills_offered : [],
    skills_needed:  Array.isArray(user?.skills_needed)  ? user.skills_needed  : [],
    wallet_address: user?.wallet_address || "",
    bio:            user?.bio || "",
  });
  const [saving, setSaving]         = useState(false);
  const [ratings, setRatings]       = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [onChainCreds, setOnChainCreds] = useState([]);
  const [onChainSessions, setOnChainSessions] = useState([]);
  const [loadingBC, setLoadingBC]   = useState(false);

  const { wallet, connectWallet, loading: walletLoading,
          getCredentials, getOnChainSessions, checkConnection,
          CONTRACT_ADDRESS } = useBlockchain();

  useEffect(()=>{
    checkConnection();
    fetch("https://skill-swap-cs2a.onrender.com/api/expert-ratings").then(r=>r.json())
      .then(d=>setRatings(Array.isArray(d)?d:[])).catch(()=>{});
    if (user?.id) {
      fetch(`https://skill-swap-cs2a.onrender.com/api/reviews/${user.id}`).then(r=>r.json())
        .then(d=>setReviews(Array.isArray(d)?d:[])).catch(()=>{});
    }
  },[user]);

  useEffect(()=>{
    if (!user?.id) return;
    setLoadingBC(true);
    Promise.all([
      fetch(`https://skill-swap-cs2a.onrender.com/api/skill-credentials/${user.id}`).then(r=>r.json()).catch(()=>[]),
      fetch(`http://localhost:5000/api/sessions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r=>r.json()).catch(()=>[]),
    ]).then(([creds, sessions])=>{
      setOnChainCreds(Array.isArray(creds) ? creds : []);
      setOnChainSessions(Array.isArray(sessions) ? sessions.filter(s=>s.status==='completed') : []);
    }).finally(()=>setLoadingBC(false));
    const addr = wallet || user?.wallet_address;
    if (addr) {
      getCredentials(addr).then(c=>{ if(c&&c.length>0) setOnChainCreds(c); }).catch(()=>{});
      getOnChainSessions(addr).then(s=>{ if(s&&s.length>0) setOnChainSessions(s); }).catch(()=>{});
    }
  },[user?.id, wallet]);

  const save = async ()=>{
    setSaving(true);
    try {
      const data = await api("/update-profile",{method:"PUT",body:JSON.stringify(form)});
      const updated = {...user,...data.user};
      localStorage.setItem("user",JSON.stringify(updated));
      setUser(updated);
      toast("Profile updated! ✅");
    } catch(e) { toast(e.message,"error"); }
    setSaving(false);
  };

  const myRating  = ratings.find(r=>r.expert_id===user?.id);
  const avg       = myRating ? parseFloat(myRating.avg_rating).toFixed(1) : null;
  const totalRevs = myRating ? myRating.total_reviews : 0;
  const avatarBg = `hsl(${(user?.id||0)*47%360},55%,40%)`;

  const downloadCertificate = (cred) => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Open+Sans:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{width:900px;height:636px;background:#0a0a1a;display:flex;align-items:center;justify-content:center;}
.cert{width:860px;height:600px;background:linear-gradient(135deg,#0d0d2b 0%,#1a0a2e 50%,#0d1a2b 100%);border-radius:20px;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;border:2px solid #00c4e8;}
.corner{position:absolute;width:60px;height:60px;}
.tl{top:12px;left:12px;border-top:3px solid #00c4e8;border-left:3px solid #00c4e8;border-radius:8px 0 0 0;}
.tr{top:12px;right:12px;border-top:3px solid #00c4e8;border-right:3px solid #00c4e8;border-radius:0 8px 0 0;}
.bl{bottom:12px;left:12px;border-bottom:3px solid #00c4e8;border-left:3px solid #00c4e8;border-radius:0 0 0 8px;}
.br{bottom:12px;right:12px;border-bottom:3px solid #00c4e8;border-right:3px solid #00c4e8;border-radius:0 0 8px 0;}
.content{text-align:center;width:100%;}
.logo{font-family:'Cinzel',serif;font-size:14px;font-weight:700;letter-spacing:0.4em;color:#00c4e8;margin-bottom:6px;}
.divider{width:200px;height:1px;background:linear-gradient(90deg,transparent,#00c4e8,transparent);margin:10px auto;}
.title{font-family:'Cinzel',serif;font-size:11px;letter-spacing:0.3em;color:#a78bfa;text-transform:uppercase;margin-bottom:18px;}
.label{font-family:'Open Sans',sans-serif;font-size:12px;color:#6b7280;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:8px;}
.recipient{font-family:'Cinzel',serif;font-size:38px;font-weight:700;color:#fff;margin-bottom:14px;text-shadow:0 0 30px rgba(0,196,232,0.4);}
.desc{font-family:'Open Sans',sans-serif;font-size:13px;color:#9ca3af;margin-bottom:14px;}
.skill{display:inline-block;padding:10px 32px;border-radius:999px;background:linear-gradient(135deg,rgba(0,196,232,0.15),rgba(124,58,237,0.15));border:1.5px solid #00c4e8;font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:#00c4e8;margin-bottom:18px;}
.proof{background:rgba(0,196,232,0.05);border:1px solid rgba(0,196,232,0.2);border-radius:10px;padding:10px 20px;display:inline-block;margin-bottom:16px;}
.proof-label{font-size:10px;color:#6b7280;letter-spacing:0.1em;margin-bottom:4px;}
.proof-hash{font-family:monospace;font-size:11px;color:#00c4e8;}
.footer{display:flex;justify-content:space-between;align-items:center;width:100%;padding:0 20px;}
.footer-item{text-align:center;}
.footer-label{font-size:10px;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;}
.footer-value{font-family:'Cinzel',serif;font-size:12px;color:#e5e7eb;font-weight:600;}
.seal{width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,rgba(0,196,232,0.1),rgba(124,58,237,0.1));border:2px solid #00c4e8;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.seal-icon{font-size:22px;}
.seal-text{font-size:7px;color:#00c4e8;letter-spacing:0.05em;text-transform:uppercase;font-weight:700;margin-top:2px;}
</style></head>
<body><div class="cert">
<div class="corner tl"></div><div class="corner tr"></div>
<div class="corner bl"></div><div class="corner br"></div>
<div class="content">
<div class="logo">⛓ SKILLSWAP</div>
<div class="divider"></div>
<div class="title">Certificate of Skill Achievement</div>
<div class="label">This certifies that</div>
<div class="recipient">${user?.username || 'User'}</div>
<div class="desc">has successfully demonstrated proficiency in</div>
<div class="skill">🏆 ${cred.skill_name || cred.skillName || 'Skill'}</div><br/>
<div class="proof">
<div class="proof-label">⛓ Blockchain Verified · TX Hash</div>
<div class="proof-hash">${(cred.tx_hash || 'N/A').slice(0,42)}...</div>
</div>
<div class="footer">
<div class="footer-item">
<div class="footer-label">Issue Date</div>
<div class="footer-value">${new Date(cred.issued_at || Date.now()).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
</div>
<div class="seal"><div class="seal-icon">✅</div><div class="seal-text">Verified</div></div>
<div class="footer-item">
<div class="footer-label">Network</div>
<div class="footer-value">Hardhat Local</div>
</div>
</div>
</div>
</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillSwap_Certificate_${cred.skill_name || 'Skill'}_${user?.username}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"DM Sans, sans-serif",transition:"all 0.3s"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Nav */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,height:60,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 32px",
        background:T.dark?"rgba(3,5,10,0.85)":"rgba(240,244,255,0.9)",
        backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`,
        transition:"all 0.3s",
      }}>
        <button onClick={()=>setPage("dashboard")} style={{
          display:"flex",alignItems:"center",gap:8,
          background:"transparent",border:"none",cursor:"pointer",
          color:T.muted,fontFamily:"DM Sans",fontSize:14,fontWeight:600,
        }}>← Dashboard</button>

        {/* ── LOGO ── */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src="/logo.png" alt="SkillSwap" style={{width:30,height:30,objectFit:"contain",borderRadius:8}}/>
          <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:T.text}}>
            SKILL<span style={{color:T.accent}}>SWAP</span>
          </span>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={T.toggle} style={{
            width:44,height:26,borderRadius:13,border:`1.5px solid ${T.border}`,
            background:T.dark?"#1a2236":"#dde3f0",cursor:"pointer",padding:0,position:"relative",
          }}>
            <div style={{width:18,height:18,borderRadius:"50%",background:T.dark?"#00c4e8":"#ffe566",position:"absolute",top:3,left:T.dark?21:3,transition:"left 0.3s"}}/>
          </button>
          <button onClick={()=>{localStorage.clear();setPage("landing");}} style={{
            padding:"7px 16px",borderRadius:8,border:"none",
            background:"rgba(255,61,107,0.12)",color:"#ff3d6b",
            fontFamily:"DM Sans",fontSize:13,fontWeight:700,cursor:"pointer",
          }}>Logout</button>
        </div>
      </nav>

      <div style={{padding:"80px 32px 40px",maxWidth:1000,margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:28,animation:"fadeUp 0.4s ease forwards"}}>
          <div style={{
            width:80,height:80,borderRadius:"50%",background:avatarBg,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:34,fontWeight:800,color:"#fff",flexShrink:0,
            border:`3px solid rgba(0,196,232,0.3)`,
            boxShadow:"0 0 24px rgba(0,196,232,0.2)",
          }}>{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <h1 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:28,color:T.text,letterSpacing:"-0.02em"}}>
              {user?.username}
            </h1>
            <div style={{color:T.muted,fontSize:14,marginTop:3}}>{user?.email}</div>
            <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
              {avg && <span style={{padding:"4px 12px",borderRadius:999,fontSize:12,fontWeight:700,background:"rgba(255,229,102,0.1)",color:"#ffe566",border:"1px solid rgba(255,229,102,0.3)"}}>★ {avg}</span>}
              <span style={{padding:"4px 12px",borderRadius:999,fontSize:12,fontWeight:700,background:"rgba(167,139,250,0.1)",color:"#a78bfa",border:"1px solid rgba(167,139,250,0.3)"}}>{totalRevs} reviews</span>
              {user?.wallet_address && <span style={{padding:"4px 12px",borderRadius:999,fontSize:12,fontWeight:700,background:"rgba(34,197,94,0.1)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)"}}>🔗 Wallet Linked</span>}
              <span style={{padding:"4px 12px",borderRadius:999,fontSize:12,fontWeight:700,background:"rgba(0,196,232,0.1)",color:T.accent,border:"1px solid rgba(0,196,232,0.25)"}}>ID #{user?.id}</span>
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20}}>
          {/* LEFT */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:18,color:T.text,marginBottom:20}}>Edit Profile</div>
              <div style={{marginBottom:18}}>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Wallet Address</div>
                <input value={form.wallet_address} onChange={e=>setForm(p=>({...p,wallet_address:e.target.value}))} placeholder="0x..."
                  style={{width:"100%",padding:"12px 15px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,color:T.text,fontFamily:"DM Sans",fontSize:14,outline:"none"}}/>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>Bio</div>
                <textarea rows={3} placeholder="Tell others about yourself..." value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))}
                  style={{width:"100%",padding:"12px 15px",borderRadius:10,border:`1px solid ${T.border}`,background:T.surface2,color:T.text,fontFamily:"DM Sans",fontSize:14,outline:"none",resize:"none"}}/>
              </div>
              <div style={{padding:16,borderRadius:12,marginBottom:16,background:T.dark?"rgba(0,196,232,0.03)":"rgba(0,196,232,0.05)",border:`1px solid ${T.dark?"rgba(0,196,232,0.15)":"rgba(0,196,232,0.25)"}`}}>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:T.text,marginBottom:12}}>🎯 Skills You Offer</div>
                <SkillSelector type="offer" selected={form.skills_offered} onChange={v=>setForm(p=>({...p,skills_offered:v}))}/>
              </div>
              <div style={{padding:16,borderRadius:12,marginBottom:20,background:T.dark?"rgba(255,61,107,0.03)":"rgba(255,61,107,0.04)",border:`1px solid ${T.dark?"rgba(255,61,107,0.15)":"rgba(255,61,107,0.2)"}`}}>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:T.text,marginBottom:12}}>✨ Skills You Need</div>
                <SkillSelector type="need" selected={form.skills_needed} onChange={v=>setForm(p=>({...p,skills_needed:v}))}/>
              </div>
              <button onClick={save} disabled={saving} style={{padding:"13px 28px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00c4e8,#0066ff)",color:"#fff",fontFamily:"DM Sans",fontSize:14,fontWeight:700,cursor:saving?"not-allowed":"pointer",opacity:saving?0.7:1,display:"flex",alignItems:"center",gap:8,boxShadow:"0 0 20px rgba(0,196,232,0.3)"}}>
                {saving?<span style={{width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>:"Save Changes →"}
              </button>
            </div>

            {reviews.length > 0 && (
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24}}>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:18,color:T.text,marginBottom:16}}>Reviews Received</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {reviews.map((r,i)=>(
                    <div key={i} style={{padding:"13px 16px",borderRadius:12,background:T.surface2,border:`1px solid ${T.border}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontWeight:700,fontSize:13,color:T.text}}>{r.reviewer_name}</span>
                        <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(n=><span key={n} style={{color:n<=r.rating?"#ffe566":T.border,fontSize:14}}>★</span>)}</div>
                      </div>
                      {r.review_text && <p style={{fontSize:13,color:T.muted,lineHeight:1.6,fontStyle:"italic"}}>"{r.review_text}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:22}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:T.text,marginBottom:14}}>Reputation</div>
              {avg ? (
                <>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:44,color:"#ffe566"}}>{avg}</div>
                  <div style={{display:"flex",gap:2,margin:"6px 0 8px"}}>{[1,2,3,4,5].map(n=><span key={n} style={{color:n<=Math.round(avg)?"#ffe566":T.border,fontSize:22}}>★</span>)}</div>
                  <div style={{fontSize:12,color:T.muted}}>{totalRevs} reviews</div>
                </>
              ) : <div style={{fontSize:13,color:T.muted,lineHeight:1.7}}>Complete a session to earn your first rating! ⭐</div>}
            </div>

            <div style={{background:T.dark?"rgba(124,58,237,0.06)":"rgba(124,58,237,0.04)",border:`1px solid ${T.dark?"rgba(124,58,237,0.25)":"rgba(124,58,237,0.2)"}`,borderRadius:14,padding:22}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:"#a78bfa",marginBottom:12}}>⛓️ Blockchain — Hardhat Local</div>
              {!wallet ? (
                <div>
                  <p style={{fontSize:13,color:T.muted,marginBottom:14,lineHeight:1.6}}>Connect MetaMask to view & mint your on-chain skill credentials on Sepolia testnet.</p>
                  <button onClick={connectWallet} disabled={walletLoading} style={{width:"100%",padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff",fontFamily:"DM Sans",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {walletLoading?<span style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>:"🦊 Connect MetaMask"}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{padding:"8px 12px",borderRadius:9,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#22c55e",marginBottom:3}}>CONNECTED</div>
                    <div style={{fontSize:11,color:T.text,fontFamily:"monospace",wordBreak:"break-all"}}>{wallet}</div>
                  </div>
                  {CONTRACT_ADDRESS && (
                    <div style={{padding:"8px 12px",borderRadius:9,background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",marginBottom:14}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#a78bfa",marginBottom:3}}>CONTRACT</div>
                      <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#a78bfa",fontFamily:"monospace",wordBreak:"break-all",textDecoration:"none"}}>{CONTRACT_ADDRESS} ↗</a>
                    </div>
                  )}
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color:T.text,marginBottom:10}}>🏆 On-Chain Credentials ({onChainCreds.length})</div>
                  {loadingBC ? (
                    <div style={{color:T.muted,fontSize:12,textAlign:"center",padding:12}}>Loading from blockchain...</div>
                  ) : onChainCreds.length === 0 ? (
                    <div style={{fontSize:12,color:T.muted,padding:"10px",borderRadius:8,background:T.surface2,marginBottom:12}}>No credentials yet. Complete a session to earn one!</div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                      {onChainCreds.map((cred,i)=>(
                        <div key={i} style={{padding:"10px 12px",borderRadius:10,background:T.surface2,border:`1px solid ${T.border}`}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(124,58,237,0.15)",color:"#a78bfa",border:"1px solid rgba(124,58,237,0.3)"}}>🏆 {cred.skill_name||cred.skillName}</span>
                            <span style={{fontSize:10,color:T.muted}}>{cred.issued_at?new Date(cred.issued_at).toLocaleDateString():cred.issuedAt}</span>
                          </div>
                          <div style={{fontSize:10,color:T.muted,fontFamily:"monospace",marginBottom:8}}>{cred.tx_hash?`TX: ${cred.tx_hash.slice(0,18)}...`:`ID #${cred.id}`}</div>
                          <button onClick={()=>downloadCertificate(cred)} style={{width:"100%",padding:"7px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff",fontFamily:"DM Sans",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>📜 Download Certificate</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color:T.text,marginBottom:10}}>📹 On-Chain Sessions ({onChainSessions.length})</div>
                  {onChainSessions.length===0 ? (
                    <div style={{fontSize:12,color:T.muted,padding:"10px",borderRadius:8,background:T.surface2}}>No sessions recorded yet.</div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {onChainSessions.map((s,i)=>(
                        <div key={i} style={{padding:"10px 12px",borderRadius:10,background:T.surface2,border:`1px solid ${T.border}`}}>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                            <span style={{fontSize:11,fontWeight:700,color:T.accent}}>⚡ {s.skill_topic||s.skill1||"Skill Exchange"}</span>
                            <span style={{fontSize:11,color:"#22c55e",fontWeight:700}}>✅ completed</span>
                          </div>
                          <div style={{fontSize:10,color:T.muted}}>{s.ended_at?new Date(s.ended_at).toLocaleDateString():s.completedAt} · {Math.floor((s.duration_secs||s.duration||0)/60)}m {(s.duration_secs||s.duration||0)%60}s</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:22}}>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>OFFERING</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {(form.skills_offered||[]).map(s=><span key={s} style={{padding:"4px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(0,196,232,0.1)",color:T.accent,border:"1px solid rgba(0,196,232,0.25)"}}>{s}</span>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>LOOKING FOR</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {(form.skills_needed||[]).map(s=><span key={s} style={{padding:"4px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(255,61,107,0.08)",color:"#ff3d6b",border:"1px solid rgba(255,61,107,0.2)"}}>{s}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
