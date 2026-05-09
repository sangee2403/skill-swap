// src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import { useSocket } from "../hooks/useSocket";

export default function DashboardPage({ user, setPage, setVideoRoom, toast }) {
  const T = useTheme();
  const [matches, setMatches]     = useState([]);
  const [ratings, setRatings]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [reqState, setReqState]   = useState({});
  const [incomingReq, setIncomingReq] = useState(null);

  const onIncomingRequest = useCallback(({ fromUser, roomId }) => {
    setIncomingReq({ fromUser, roomId });
    toast(`📨 ${fromUser.username} wants to exchange skills!`);
  }, [toast]);

  const onRequestAccepted = useCallback(({ fromUser, roomId }) => {
    setReqState(p => ({ ...p, [fromUser.id]: "accepted" }));
    toast(`✅ ${fromUser.username} accepted! Joining call...`);
    setTimeout(() => setPage("videocall"), 800);
  }, [toast, setPage]);

  const onRequestRejected = useCallback(({ byUser }) => {
    setReqState(p => ({ ...p, [byUser.id]: "idle" }));
    toast(`${byUser.username} declined the request`, "error");
  }, [toast]);

  const onRequestFailed = useCallback(({ message }) => {
    toast(message, "error");
  }, [toast]);

  const { sendRequest, acceptRequest, rejectRequest } = useSocket(user, {
    onIncomingRequest,
    onRequestAccepted,
    onRequestRejected,
    onRequestFailed,
  });

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api(`/matches/${user.id}`).catch(() => []),
      fetch("http://localhost:5000/api/expert-ratings").then(r => r.json()).catch(() => []),
    ]).then(([m, r]) => {
      setMatches(Array.isArray(m) ? m : []);
      setRatings(Array.isArray(r) ? r : []);
    }).finally(() => setLoading(false));
  }, [user]);

  const myRating  = ratings.find(r => r.expert_id === user?.id);
  const avgRating = myRating ? parseFloat(myRating.avg_rating).toFixed(1) : null;
  const totalRevs = myRating ? myRating.total_reviews : 0;

  const handleRequest = (match) => {
    // FIX: smaller id first — same as server.js pending deliver
    const u1 = Math.min(user.id, match.id);
    const u2 = Math.max(user.id, match.id);
    const roomId = `room_${u1}_${u2}`;
    setReqState(p => ({ ...p, [match.id]: "pending" }));
    sendRequest(user, match.id, roomId);
    setVideoRoom({ roomId, peer: match, isRequester: true });
    toast(`⚡ Request sent to ${match.username}!`);
  };

  const handleAccept = () => {
    if (!incomingReq) return;
    const roomId = incomingReq.roomId;
    acceptRequest(incomingReq.fromUser.id, user, roomId);
    setVideoRoom({ roomId, peer: incomingReq.fromUser, isRequester: false });
    setIncomingReq(null);
    setPage("videocall");
  };

  const handleReject = () => {
    if (!incomingReq) return;
    rejectRequest(incomingReq.fromUser.id, user);
    setIncomingReq(null);
    toast("Request declined");
  };

  const avatarBg = (id) => `hsl(${(id || 0) * 47 % 360},55%,40%)`;

  const statCard = (icon, label, value, color) => (
    <div style={{ padding:22, borderRadius:14, background:T.surface, border:`1px solid ${T.border}`, transition:"all 0.2s" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.boxShadow=`0 0 16px ${color}30`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>
      <div style={{fontSize:26,marginBottom:8}}>{icon}</div>
      <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:28,color}}>{value}</div>
      <div style={{fontSize:11,color:T.muted,fontWeight:700,letterSpacing:"0.08em",marginTop:4}}>{label}</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"DM Sans, sans-serif",transition:"all 0.3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(0,196,232,0.5)}70%{box-shadow:0 0 0 14px rgba(0,196,232,0)}100%{box-shadow:0 0 0 0 rgba(0,196,232,0)}}
      `}</style>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,height:60,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",background:T.dark?"rgba(3,5,10,0.88)":"rgba(240,244,255,0.92)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`,transition:"all 0.3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo.png" alt="SkillSwap" style={{width:32,height:32,objectFit:"contain",borderRadius:8}}/>
          <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:T.text,letterSpacing:"-0.02em"}}>SKILL<span style={{color:T.accent}}>SWAP</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:13,color:T.muted}}>Hey, <strong style={{color:T.text}}>{user?.username}</strong></span>
          <button onClick={T.toggle} style={{width:44,height:26,borderRadius:13,border:`1.5px solid ${T.border}`,background:T.dark?"#1a2236":"#dde3f0",cursor:"pointer",padding:0,position:"relative"}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:T.dark?"#00c4e8":"#ffe566",position:"absolute",top:3,left:T.dark?21:3,transition:"left 0.3s"}}/>
          </button>
          <button onClick={()=>setPage("profile")} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontFamily:"DM Sans",fontSize:13,fontWeight:600,cursor:"pointer"}}>Profile</button>
          <button onClick={()=>{localStorage.clear();setPage("landing");}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:"rgba(255,61,107,0.12)",color:"#ff3d6b",fontFamily:"DM Sans",fontSize:13,fontWeight:700,cursor:"pointer"}}>Logout</button>
        </div>
      </nav>

      {/* INCOMING REQUEST POPUP */}
      {incomingReq && (
        <div style={{position:"fixed",top:80,right:24,zIndex:300,background:T.surface,border:"1px solid #00c4e8",borderRadius:16,padding:"22px 26px",boxShadow:"0 0 40px rgba(0,196,232,0.3)",maxWidth:340,minWidth:300,animation:"slideDown 0.4s ease forwards"}}>
          <div style={{width:54,height:54,borderRadius:"50%",background:`hsl(${(incomingReq.fromUser.id||0)*47%360},55%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",margin:"0 auto 14px",animation:"ringPulse 1.2s infinite"}}>
            {incomingReq.fromUser.username?.[0]?.toUpperCase()}
          </div>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,color:T.text,marginBottom:4}}>Incoming Request! 📨</div>
            <p style={{fontSize:14,color:T.muted}}><strong style={{color:T.text}}>{incomingReq.fromUser.username}</strong> wants to exchange skills</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center",marginTop:10}}>
              {(incomingReq.fromUser.skills_offered||[]).slice(0,4).map(s=>(
                <span key={s} style={{padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(0,196,232,0.1)",color:T.accent,border:"1px solid rgba(0,196,232,0.25)"}}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleAccept} style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontFamily:"DM Sans",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 0 16px rgba(34,197,94,0.3)"}}>✅ Accept</button>
            <button onClick={handleReject} style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"rgba(255,61,107,0.12)",color:"#ff3d6b",fontFamily:"DM Sans",fontSize:14,fontWeight:700,cursor:"pointer"}}>❌ Decline</button>
          </div>
        </div>
      )}

      <div style={{padding:"80px 32px 40px",maxWidth:1100,margin:"0 auto"}}>
        {/* Header */}
        <div style={{marginBottom:28,animation:"fadeUp 0.4s ease forwards"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(0,196,232,0.1)",border:"1px solid rgba(0,196,232,0.3)",color:T.accent}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:T.accent,display:"inline-block",animation:"pulse 2s infinite"}}/>LIVE
            </span>
          </div>
          <h1 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:32,letterSpacing:"-0.02em",color:T.text}}>
            Good day, <span style={{color:T.accent}}>{user?.username}</span>
          </h1>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:28}}>
          {statCard("⚡","MATCHES FOUND",loading?"…":matches.length,T.accent)}
          {statCard("⭐","YOUR RATING",avgRating?`${avgRating}★`:"—","#ffe566")}
          {statCard("💬","REVIEWS RECEIVED",totalRevs,"#a78bfa")}
          {statCard("🔗","WALLET",user?.wallet_address?"Linked":"Not linked",user?.wallet_address?"#22c55e":T.muted)}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20}}>
          {/* MATCH LIST */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:T.text}}>🔥 Live Skill Exchange</h2>
              <span style={{fontSize:12,color:T.muted}}>{matches.length} available</span>
            </div>

            {loading ? (
              <div style={{textAlign:"center",padding:60,color:T.muted}}>
                <div style={{width:36,height:36,border:`2px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",margin:"0 auto 12px",animation:"spin 0.8s linear infinite"}}/>
                Finding matches...
              </div>
            ) : matches.length===0 ? (
              <div style={{textAlign:"center",padding:60,background:T.surface,border:`1px solid ${T.border}`,borderRadius:16}}>
                <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:18,color:T.text,marginBottom:8}}>No matches yet</div>
                <div style={{color:T.muted,fontSize:13,marginBottom:18}}>Update your skills to find partners</div>
                <button onClick={()=>setPage("profile")} style={{padding:"10px 22px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#00c4e8,#0066ff)",color:"#fff",fontFamily:"DM Sans",fontSize:14,fontWeight:700,cursor:"pointer"}}>Update Skills →</button>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {matches.map((m,i) => {
                  const status = reqState[m.id]||"idle";
                  return (
                    <div key={m.id} style={{padding:20,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,transition:"all 0.2s",animation:`fadeUp 0.4s ${i*0.05}s ease forwards`,opacity:0}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,196,232,0.35)";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,196,232,0.1)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="none";}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{display:"flex",alignItems:"center",gap:14,flex:1}}>
                          <div style={{width:48,height:48,borderRadius:"50%",background:avatarBg(m.id),display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff",flexShrink:0,border:`2px solid ${T.border}`}}>
                            {m.username?.[0]?.toUpperCase()}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,color:T.text}}>{m.username}</div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                              {(m.skills_offered||[]).slice(0,4).map(s=>(
                                <span key={s} style={{padding:"3px 9px",borderRadius:999,fontSize:10,fontWeight:700,background:"rgba(0,196,232,0.1)",color:T.accent,border:"1px solid rgba(0,196,232,0.25)"}}>🎯 {s}</span>
                              ))}
                            </div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
                              {(m.skills_needed||[]).slice(0,3).map(s=>(
                                <span key={s} style={{padding:"3px 9px",borderRadius:999,fontSize:10,fontWeight:700,background:"rgba(255,61,107,0.08)",color:"#ff3d6b",border:"1px solid rgba(255,61,107,0.2)"}}>needs: {s}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{flexShrink:0,marginLeft:12}}>
                          {status==="idle" && (
                            <button onClick={()=>handleRequest(m)} style={{padding:"10px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#00c4e8,#0066ff)",color:"#fff",fontFamily:"DM Sans",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 0 14px rgba(0,196,232,0.3)",whiteSpace:"nowrap"}}>⚡ Request</button>
                          )}
                          {status==="pending" && (
                            <span style={{padding:"10px 18px",borderRadius:9,fontSize:13,fontWeight:700,background:"rgba(255,229,102,0.1)",color:"#ffe566",border:"1px solid rgba(255,229,102,0.3)",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}>
                              <span style={{width:12,height:12,border:"2px solid rgba(255,229,102,0.4)",borderTopColor:"#ffe566",borderRadius:"50%",display:"inline-block",animation:"spin 0.8s linear infinite"}}/>
                              Waiting...
                            </span>
                          )}
                          {status==="accepted" && (
                            <button onClick={()=>setPage("videocall")} style={{padding:"10px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#22c55e,#16a34a)",color:"#fff",fontFamily:"DM Sans",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 0 14px rgba(34,197,94,0.35)",whiteSpace:"nowrap"}}>📹 Start Call</button>
                          )}
                          {status==="rejected" && (
                            <button onClick={()=>setReqState(p=>({...p,[m.id]:"idle"}))} style={{padding:"10px 18px",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.muted,fontFamily:"DM Sans",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Try Again</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:20}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:T.text,marginBottom:14}}>My Skills</div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:7}}>OFFERING</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {(user?.skills_offered||[]).length>0 ? (user.skills_offered||[]).map(s=>(
                    <span key={s} style={{padding:"4px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(0,196,232,0.1)",color:T.accent,border:"1px solid rgba(0,196,232,0.25)"}}>{s}</span>
                  )) : <span style={{color:T.muted,fontSize:12}}>None added</span>}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:7}}>LOOKING FOR</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {(user?.skills_needed||[]).length>0 ? (user.skills_needed||[]).map(s=>(
                    <span key={s} style={{padding:"4px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:"rgba(255,61,107,0.08)",color:"#ff3d6b",border:"1px solid rgba(255,61,107,0.2)"}}>{s}</span>
                  )) : <span style={{color:T.muted,fontSize:12}}>None added</span>}
                </div>
              </div>
              <button onClick={()=>setPage("profile")} style={{width:"100%",marginTop:14,padding:"9px",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.accent,fontFamily:"DM Sans",fontSize:13,fontWeight:700,cursor:"pointer"}}>Edit Skills →</button>
            </div>

            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:20}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:T.text,marginBottom:12}}>Your Reputation</div>
              {avgRating ? (
                <>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:40,color:"#ffe566"}}>{avgRating}</div>
                  <div style={{display:"flex",gap:2,margin:"6px 0 8px"}}>{[1,2,3,4,5].map(n=><span key={n} style={{color:n<=Math.round(avgRating)?"#ffe566":T.border,fontSize:20}}>★</span>)}</div>
                  <div style={{fontSize:12,color:T.muted}}>{totalRevs} reviews</div>
                </>
              ) : <div style={{fontSize:13,color:T.muted,lineHeight:1.6}}>Complete a session to earn your first rating! ⭐</div>}
            </div>

            <div style={{background:T.dark?"rgba(0,196,232,0.04)":"rgba(0,196,232,0.06)",border:"1px solid rgba(0,196,232,0.2)",borderRadius:14,padding:20}}>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:T.accent,marginBottom:12}}>How It Works</div>
              {[["⚡","Click Request to invite someone"],["📨","They get a live notification"],["✅","They Accept → both join call"],["📹","Exchange skills via video"],["⭐","Rate each other after"]].map(([icon,text])=>(
                <div key={text} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,fontSize:12,color:T.muted}}><span>{icon}</span><span>{text}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
