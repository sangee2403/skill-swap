// src/pages/VideoCallPage.jsx
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import { getSocket } from "../hooks/useSocket";
import { useBlockchain } from "../hooks/useBlockchain";

export default function VideoCallPage({ user, videoRoom, setPage, toast }) {
  const T = useTheme();
  const [elapsed, setElapsed]         = useState(0);
  const [muted, setMuted]             = useState(false);
  const [videoOff, setVideoOff]       = useState(false);
  const [messages, setMessages]       = useState([]);
  const [msg, setMsg]                 = useState("");
  const [showReview, setShowReview]   = useState(false);
  const [review, setReview]           = useState({ rating: 0, review_text: "" });
  const [selectedSkill, setSelectedSkill] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [txHash, setTxHash]           = useState(null);
  const [bcLoading, setBcLoading]     = useState(false);
  const [status, setStatus]           = useState("waiting");
  const [isHost, setIsHost]           = useState(false);
  const [reviewDone, setReviewDone]   = useState(false);
  const [sharing, setSharing]         = useState(false);
  const [showChat, setShowChat]       = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);

  const localRef   = useRef(null);
  const remoteRef  = useRef(null);
  const streamRef  = useRef(null);
  const screenRef  = useRef(null);
  const pcRef      = useRef(null);
  const timerRef   = useRef(null);
  const chatRef    = useRef(null);
  const didSetup   = useRef(false);
  const elapsedRef = useRef(0);
  const sessionIdRef = useRef(null);

  const roomId      = videoRoom?.roomId;
  const peer        = videoRoom?.peer;
  const isRequester = videoRoom?.isRequester ?? true;

  const { wallet, connectWallet, issueCredential, recordSession, checkConnection } = useBlockchain();

  const canEndCall = true;

  useEffect(() => { checkConnection(); }, []);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!roomId || didSetup.current) return;
    didSetup.current = true;

    const socket = getSocket();
    socket.emit("register", user.id);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    socket.on("show-review", async () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      setSharing(false);
      setIsHost(false);
      setShowReview(true);
      toast("Session ended! Please rate your experience ⭐");
    });

    socket.on("end-call", () => {});

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteRef.current) { remoteRef.current.srcObject = e.streams[0]; setStatus("connected"); }
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("candidate", { roomId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed")    setStatus("waiting");
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        socket.emit("join-room", roomId);
      })
      .catch(() => toast("Camera access denied", "error"));

    socket.on("joined-as-first",  () => console.log("⏳ Waiting for peer"));
    socket.on("joined-as-second", () => console.log("✅ Waiting for offer"));

    socket.on("peer-joined", async () => {
      try {
        const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
      } catch (err) { console.error("Offer error:", err); }
    });

    socket.on("offer", async (offer) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer });
      } catch (err) { console.error("Answer error:", err); }
    });

    socket.on("answer", async (answer) => {
      try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); }
      catch (err) { console.error("SetRemote answer error:", err); }
    });

    socket.on("candidate", async (candidate) => {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
    });

    socket.on("peer-left", () => {
      setStatus("left");
      toast(`${peer?.username} left the call`, "error");
    });
    socket.on("receive-message", (data) => {
      setMessages(m => [...m, { ...data, mine: false }]);
    });

    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      socket.off("joined-as-first"); socket.off("joined-as-second");
      socket.off("peer-joined"); socket.off("offer"); socket.off("answer");
      socket.off("candidate"); socket.off("peer-left");
      socket.off("receive-message"); socket.off("show-review");
      socket.emit("leave-room", roomId);
      didSetup.current = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMuted(m => !m);
  };
  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setVideoOff(v => !v);
  };

  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    if (sharing) {
      screenRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current = null;
      setSharing(false);
      const camTrack = streamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(camTrack);
      }
      if (localRef.current) localRef.current.srcObject = streamRef.current;
      toast("Screen share stopped");
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
        screenRef.current = ss;
        const st = ss.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(st);
        if (localRef.current) localRef.current.srcObject = new MediaStream([st, ...(streamRef.current?.getAudioTracks() || [])]);
        setSharing(true);
        toast("🖥️ Screen sharing started!");
        st.onended = async () => {
          screenRef.current = null;
          setSharing(false);
          const ct = streamRef.current?.getVideoTracks()[0];
          if (ct) {
            const s = pc.getSenders().find(s => s.track?.kind === "video");
            if (s) await s.replaceTrack(ct);
          }
          if (localRef.current) localRef.current.srcObject = streamRef.current;
          toast("Screen share stopped");
        };
      } catch (e) {
        if (e.name !== "NotAllowedError") toast("Screen share failed: " + e.message, "error");
      }
    }
  };

  const endCall = async () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    screenRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    setSharing(false);
    const socket = getSocket();
    socket.emit("end-call", { roomId, fromUser: user, toUser: peer });

    // Only host (!isRequester) creates session — no duplicate
    if (!isRequester) {
      try {
        // FIX: session topic = peer's skill (what they taught = what I learned)
        const skillTopic = selectedSkill || (peer?.skills_offered || ["Skill Exchange"])[0];
        const created = await api("/sessions", {
          method: "POST",
          body: JSON.stringify({ guest_id: peer.id, skill_topic: skillTopic }),
        });
        if (created?.session?.id) {
          sessionIdRef.current = created.session.id;
          await api(`/sessions/${created.session.id}`, { method: "PUT", body: JSON.stringify({ status: "active" }) });
          await api(`/sessions/${created.session.id}`, { method: "PUT", body: JSON.stringify({ status: "completed", duration_secs: elapsedRef.current }) });
        }
      } catch (e) { console.log("Session save:", e.message); }
    }

    setIsHost(true);
    setShowReview(true);
    setTimeout(() => { if (window.ethereum) toast("🔗 Session complete! Record on blockchain →"); }, 800);
  };

  const sendMsg = () => {
    if (!msg.trim()) return;
    const socket = getSocket();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(m => [...m, { from: user.username, text: msg, time, mine: true }]);
    socket.emit("send-message", { roomId, from: user.username, text: msg, time, userId: user.id });
    setMsg("");
  };

  const submitReview = async () => {
    if (!selectedSkill) return toast("Please select a skill you learned!", "error");
    if (!review.rating) return toast("Please select a rating", "error");
    setSubmitting(true);
    try {
      const expertId = peer?.id;
      const reviewerId = user?.id;
      if (!expertId) { toast("Cannot submit review — peer not found!", "error"); setSubmitting(false); return; }
      await api("/submit-review", {
        method: "POST",
        body: JSON.stringify({ expert_id: expertId, user_id: reviewerId, rating: review.rating, review_text: review.review_text || "", session_id: sessionIdRef.current || null }),
      });
      toast("Review submitted! ⭐");
      setReviewDone(true);
    } catch (e) { toast(e.message, "error"); }
    setSubmitting(false);
  };

  const recordBlockchain = async () => {
    if (!wallet) {
      const connected = await connectWallet();
      if (!connected) return toast("Please connect MetaMask first!", "error");
    }
    setBcLoading(true);
    try {
      toast("⛓️ Recording on blockchain...");
      const dbSessionId = `${roomId}_${user.id}_${Date.now()}`;
      // FIX: peerSkill = what peer taught = what I learned = my credential
      const peerSkill   = (peer?.skills_offered || ["Skill Exchange"])[0];
      const mySkill     = (user?.skills_offered  || ["Skill Exchange"])[0];
      // FIX: credSkill = always peer's skill (what I learned from peer)
      const credSkill   = selectedSkill || peerSkill;
      const peerWallet  = peer?.wallet_address;
      let actualTxHash  = null;

      const { ethers } = await import("ethers");
      if (!isRequester && peerWallet && ethers.isAddress(peerWallet) && peerWallet !== wallet) {
        try {
          const sessionResult = await recordSession({
            peer2Wallet: peerWallet,
            skill1: peerSkill,
            skill2: mySkill,
            duration: elapsedRef.current,
            dbSessionId,
          });
          actualTxHash = sessionResult.txHash;
          setTxHash(actualTxHash);
          toast("✅ Session recorded!");
        } catch (sessErr) {
          console.log("recordSession skipped:", sessErr.message);
        }
      } else if (!isRequester && (!peerWallet || !ethers.isAddress(peerWallet))) {
        toast("⚠️ Peer wallet not set — skipping session record", "error");
      }

      const credResult = await issueCredential({
        recipientWallet: wallet,
        skillName: credSkill,
        sessionId: `${roomId}_${user.id}`,
      });
      if (!actualTxHash && credResult?.txHash) actualTxHash = credResult.txHash;
      setTxHash(actualTxHash);

      try {
        await api("/skill-credentials", {
          method: "POST",
          body: JSON.stringify({
            skill_name:       credSkill,
            tx_hash:          actualTxHash || null,
            contract_address: process.env.REACT_APP_CONTRACT_ADDRESS,
          }),
        });
      } catch (e) { console.log("Credential DB save:", e.message); }

      toast("🎓 Credential issued! Check Profile.");
      setTimeout(() => setPage("profile"), 2000);
    } catch (bcErr) {
      console.error("BC error:", bcErr);
      if (bcErr.code === "UNSUPPORTED_OPERATION" || bcErr.message?.includes("ENS")) {
        toast("⚠️ ENS error — please set wallet address in Profile", "error");
      } else {
        toast("Blockchain record failed: " + bcErr.message, "error");
      }
    } finally { setBcLoading(false); }
  };

  // ══ REVIEW SCREEN ══════════════════════════════════════════════════════
  if (showReview) return (
    <div style={{ minHeight:"100vh", background:"#202124", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Google Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ width:"100%", maxWidth:500, background:"#2d2f3a", border:"1px solid #3c4043", borderRadius:24, padding:40, animation:"fadeUp 0.4s ease forwards" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:56, marginBottom:14 }}>🎉</div>
          <h2 style={{ fontWeight:700, fontSize:28, color:"#e8eaed", marginBottom:6 }}>Session Complete!</h2>
          <p style={{ color:"#9aa0b4", fontSize:14 }}>With <strong style={{ color:"#8ab4f8" }}>{peer?.username}</strong> · {fmt(elapsed)}</p>
        </div>

        {!reviewDone && (
          <>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#9aa0b4", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>What skill did you learn? 🎓</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {/* FIX: எல்லாரும் peer's skills காட்டணும் — peer கத்துக்கொடுத்தது = நான் கத்துக்கொண்டது */}
                {(peer?.skills_offered || []).map(skill => (
                  <button key={skill} onClick={() => setSelectedSkill(skill)} style={{
                    padding:"10px 18px", borderRadius:999, border:"none", cursor:"pointer",
                    fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all 0.15s",
                    background: selectedSkill === skill ? "#8ab4f8" : "#3c4043",
                    color: selectedSkill === skill ? "#0f1117" : "#9aa0b4",
                    boxShadow: selectedSkill === skill ? "0 0 20px rgba(138,180,248,0.3)" : "none",
                  }}>🏆 {skill}</button>
                ))}
              </div>
              {!selectedSkill && <div style={{ fontSize:11, color:"#f28b82", marginTop:8 }}>* Please select a skill</div>}
            </div>

            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#9aa0b4", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>Rate Your Experience</div>
              <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} onClick={() => setReview(r => ({...r, rating:n}))}
                    style={{ fontSize:38, cursor:"pointer", transition:"transform 0.15s", filter: n<=review.rating?"none":"grayscale(1) opacity(0.35)" }}
                    onMouseEnter={e=>e.target.style.transform="scale(1.25)"}
                    onMouseLeave={e=>e.target.style.transform="scale(1)"}>⭐</span>
                ))}
              </div>
              {review.rating > 0 && <div style={{ textAlign:"center", marginTop:10, fontSize:13, color:"#8ab4f8", fontWeight:600 }}>{["","😕 Poor","😐 Fair","🙂 Good","😊 Great","🤩 Amazing!"][review.rating]}</div>}
            </div>

            <textarea rows={3} placeholder="Share your experience..."
              value={review.review_text} onChange={e => setReview(r => ({...r, review_text:e.target.value}))}
              style={{ width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid #3c4043", background:"#3c4043", color:"#e8eaed", fontFamily:"inherit", fontSize:13, outline:"none", resize:"none", marginBottom:18, boxSizing:"border-box" }}/>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={submitReview} disabled={submitting} style={{
                flex:1, padding:"14px", borderRadius:12, border:"none",
                background:"#8ab4f8", color:"#0f1117", fontFamily:"inherit",
                fontSize:14, fontWeight:700, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                {submitting ? <span style={{ width:18,height:18,border:"2px solid rgba(0,0,0,0.2)",borderTopColor:"#0f1117",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/> : "Submit Review ★"}
              </button>
              {isHost
                ? <button onClick={() => setReviewDone(true)} style={{ padding:"14px 18px", borderRadius:12, border:"1px solid #3c4043", background:"transparent", color:"#9aa0b4", fontFamily:"inherit", cursor:"pointer", fontSize:13 }}>Skip ⛓️</button>
                : <button onClick={() => setPage("profile")} style={{ padding:"14px 20px", borderRadius:12, border:"1px solid #3c4043", background:"transparent", color:"#9aa0b4", fontFamily:"inherit", cursor:"pointer" }}>Skip</button>
              }
            </div>
          </>
        )}

        {reviewDone && (
          <div>
            <div style={{ width:"100%", height:1, background:"#3c4043", marginBottom:22 }}/>
            <p style={{ color:"#9aa0b4", fontSize:13, marginBottom:18, textAlign:"center" }}>
              {isHost ? "Record on blockchain to earn your credential 🎓" : "Issue your skill credential on the blockchain 🎓"}
            </p>
            {!wallet ? (
              <button onClick={connectWallet} disabled={bcLoading} style={{ width:"100%", padding:"14px", borderRadius:12, border:"none", background:"#f9ab00", color:"#0f1117", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                🦊 Connect MetaMask
              </button>
            ) : (
              <button onClick={recordBlockchain} disabled={bcLoading} style={{ width:"100%", padding:"14px", borderRadius:12, border:"none", background:"#8ab4f8", color:"#0f1117", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:bcLoading?"not-allowed":"pointer", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {bcLoading ? <><span style={{ width:18,height:18,border:"2px solid rgba(0,0,0,0.2)",borderTopColor:"#0f1117",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite" }}/> Recording...</> : "⛓️ Record on Blockchain"}
              </button>
            )}
            {txHash && <div style={{ fontSize:11, color:"#81c995", marginBottom:12, wordBreak:"break-all", textAlign:"center" }}>✅ TX: {txHash.slice(0,24)}...</div>}
            <button onClick={() => setPage("profile")} style={{ width:"100%", padding:"12px", borderRadius:12, border:"1px solid #3c4043", background:"transparent", color:"#9aa0b4", fontFamily:"inherit", cursor:"pointer" }}>
              Skip → Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ══ CALL SCREEN ══════════════════════════════════════════════════════════
  const isConnected = status === "connected";
  const peerLeft    = status === "left";

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#202124", fontFamily:"'Google Sans', sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes glow  { 0%,100%{box-shadow:0 0 20px rgba(138,180,248,0.2)} 50%{box-shadow:0 0 50px rgba(138,180,248,0.5)} }
        @keyframes blink { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        @keyframes fadeIn{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ctrl-btn:hover { filter: brightness(1.2); transform: scale(1.08); }
        .ctrl-btn:active { transform: scale(0.95); }
        .ctrl-btn { transition: all 0.15s; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", background:"#202124", borderBottom:"1px solid #3c4043", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#8ab4f8,#4285f4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>⚡</div>
            <span style={{ fontWeight:700, fontSize:16, color:"#e8eaed" }}>SkillSwap</span>
          </div>
          <div style={{ width:1, height:22, background:"#3c4043" }}/>
          <span style={{ fontSize:13, color:"#9aa0b4" }}>
            Session with <strong style={{ color:"#8ab4f8" }}>{peer?.username}</strong>
          </span>
          {sharing && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:"rgba(242,75,67,0.12)", border:"1px solid rgba(242,75,67,0.35)", fontSize:11, fontWeight:600, color:"#f28b82" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#f28b82", animation:"pulse 1s infinite", display:"inline-block" }}/>
              Presenting
            </div>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#2d2f3a", padding:"9px 22px", borderRadius:999, border:"1px solid #3c4043" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background: isConnected ? "#81c995" : "#f9ab00", display:"inline-block", animation:"pulse 2s infinite" }}/>
          <span style={{ fontFamily:"monospace", fontSize:20, fontWeight:700, color:"#e8eaed", letterSpacing:"0.06em" }}>{fmt(elapsed)}</span>
        </div>
        <div style={{ padding:"7px 16px", borderRadius:999, background: isConnected ? "rgba(129,201,149,0.1)" : "rgba(249,171,0,0.1)", border:`1px solid ${isConnected ? "rgba(129,201,149,0.3)" : "rgba(249,171,0,0.3)"}`, fontSize:12, fontWeight:600, color: isConnected ? "#81c995" : "#f9ab00" }}>
          {isConnected ? "● Connected" : "◌ Connecting..."}
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex:1, position:"relative", background:"#171717", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <video ref={remoteRef} autoPlay playsInline style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:isConnected?1:0, transition:"opacity 0.6s" }}/>
          {!isConnected && (
            <div style={{ textAlign:"center", zIndex:1, animation:"fadeIn 0.5s ease" }}>
              <div style={{ width:140, height:140, borderRadius:"50%", background:`hsl(${(peer?.id||0)*57%360},45%,28%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:56, fontWeight:700, color:"#fff", margin:"0 auto 22px", animation:"glow 2.5s ease-in-out infinite" }}>
                {peer?.username?.[0]?.toUpperCase()}
              </div>
              <p style={{ color:"#9aa0b4", fontSize:16, fontWeight:500, animation:"blink 2s infinite", marginBottom:18 }}>
                {peerLeft ? `${peer?.username} left the call` : `Waiting for ${peer?.username} to join...`}
              </p>
              {!peerLeft && <div style={{ width:32, height:32, border:"3px solid #3c4043", borderTopColor:"#8ab4f8", borderRadius:"50%", margin:"0 auto", animation:"spin 0.9s linear infinite" }}/>}
            </div>
          )}
          {/* Local PiP */}
          <div style={{ position:"absolute", bottom:110, right:22, width:224, height:150, borderRadius:16, overflow:"hidden", border:"2px solid rgba(255,255,255,0.1)", boxShadow:"0 8px 40px rgba(0,0,0,0.7)", zIndex:10, background:"#2d2f3a" }}>
            <video ref={localRef} autoPlay playsInline muted
              style={{ width:"100%", height:"100%", objectFit:"cover", transform: sharing ? "none" : "scaleX(-1)", display: videoOff && !sharing ? "none" : "block" }}/>
            {videoOff && !sharing && (
              <div style={{ position:"absolute", inset:0, background:"#2d2f3a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:"#3c4043", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>👤</div>
                <span style={{ fontSize:11, color:"#9aa0b4" }}>Camera off</span>
              </div>
            )}
            <div style={{ position:"absolute", bottom:8, left:10, fontSize:11, fontWeight:600, color:"#fff", background:"rgba(0,0,0,0.65)", padding:"3px 10px", borderRadius:6 }}>
              {sharing ? "🖥️ Screen" : (user?.username || "You")}
            </div>
            {muted && <div style={{ position:"absolute", top:8, right:8, width:26, height:26, borderRadius:"50%", background:"rgba(242,75,67,0.9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🔇</div>}
          </div>

          {/* BOTTOM CONTROLS */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", alignItems:"center", justifyContent:"center", gap:14, padding:"18px 28px 24px", background:"linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <button onClick={toggleMute} className="ctrl-btn" style={{ width:58, height:58, borderRadius:"50%", border:"none", cursor:"pointer", background: muted ? "#f28b82" : "#3c4043", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:24 }}>{muted ? "🔇" : "🎙️"}</span>
              </button>
              <span style={{ fontSize:10, color:"#9aa0b4", fontWeight:500 }}>{muted ? "Unmute" : "Mute"}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <button onClick={toggleVideo} className="ctrl-btn" style={{ width:58, height:58, borderRadius:"50%", border:"none", cursor:"pointer", background: videoOff ? "#f28b82" : "#3c4043", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:24 }}>{videoOff ? "📷" : "📹"}</span>
              </button>
              <span style={{ fontSize:10, color:"#9aa0b4", fontWeight:500 }}>{videoOff ? "Start cam" : "Stop cam"}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <button onClick={toggleScreenShare} className="ctrl-btn" style={{ width:58, height:58, borderRadius:"50%", border:"none", cursor:"pointer", background: sharing ? "#f28b82" : "#3c4043", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                <span style={{ fontSize:24 }}>🖥️</span>
                {sharing && <span style={{ position:"absolute", top:2, right:2, width:12, height:12, borderRadius:"50%", background:"#f28b82", border:"2px solid #202124", animation:"pulse 1s infinite" }}/>}
              </button>
              <span style={{ fontSize:10, color:"#9aa0b4", fontWeight:500 }}>{sharing ? "Stop share" : "Share screen"}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <button onClick={() => { setShowChat(c => !c); setShowParticipants(false); }} className="ctrl-btn" style={{ width:58, height:58, borderRadius:"50%", border:"none", cursor:"pointer", background: showChat ? "#8ab4f8" : "#3c4043", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                <span style={{ fontSize:24 }}>💬</span>
                {messages.filter(m => !m.mine).length > 0 && !showChat && (
                  <span style={{ position:"absolute", top:2, right:2, minWidth:16, height:16, borderRadius:999, background:"#f28b82", fontSize:9, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px" }}>
                    {messages.filter(m => !m.mine).length}
                  </span>
                )}
              </button>
              <span style={{ fontSize:10, color:"#9aa0b4", fontWeight:500 }}>Chat</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <button onClick={() => { setShowParticipants(p => !p); setShowChat(false); }} className="ctrl-btn" style={{ width:58, height:58, borderRadius:"50%", border:"none", cursor:"pointer", background: showParticipants ? "#8ab4f8" : "#3c4043", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:24 }}>👥</span>
              </button>
              <span style={{ fontSize:10, color:"#9aa0b4", fontWeight:500 }}>People</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <button onClick={endCall} className="ctrl-btn" style={{ height:58, padding:"0 32px", borderRadius:999, border:"none", cursor:"pointer", background:"#f28b82", color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 20px rgba(242,139,130,0.35)" }}>
                📵 Leave call
              </button>
              <span style={{ fontSize:10, color:"#9aa0b4", fontWeight:500 }}>End call</span>
            </div>
          </div>
        </div>

        {/* CHAT PANEL */}
        {showChat && (
          <div style={{ width:340, borderLeft:"1px solid #3c4043", display:"flex", flexDirection:"column", background:"#202124", animation:"fadeIn 0.2s ease" }}>
            <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #3c4043", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontWeight:700, fontSize:16, color:"#e8eaed" }}>In-call messages</span>
              <button onClick={() => setShowChat(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aa0b4", fontSize:20, lineHeight:1, padding:"2px 6px", borderRadius:6 }}>✕</button>
            </div>
            <div style={{ padding:"10px 16px", background:"rgba(138,180,248,0.05)", margin:"12px 16px", borderRadius:12, fontSize:12, color:"#9aa0b4", lineHeight:1.6, border:"1px solid rgba(138,180,248,0.1)" }}>
              💬 Messages are only visible to people in this call
            </div>
            <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"0 16px 12px", display:"flex", flexDirection:"column", gap:12 }}>
              {messages.length===0 && (
                <div style={{ color:"#9aa0b4", fontSize:13, textAlign:"center", marginTop:28, lineHeight:1.8 }}>
                  No messages yet<br/><span style={{ fontSize:24 }}>👋</span>
                </div>
              )}
              {messages.map((m,i) => (
                <div key={i} style={{ animation:"fadeIn 0.2s ease" }}>
                  <div style={{ fontSize:11, color: m.mine ? "#8ab4f8" : "#81c995", fontWeight:600, marginBottom:5 }}>
                    {m.mine ? "You" : m.from} · {m.time}
                  </div>
                  <div style={{ padding:"11px 14px", borderRadius:14, background: m.mine ? "rgba(138,180,248,0.1)" : "#2d2f3a", border:`1px solid ${m.mine ? "rgba(138,180,248,0.2)" : "#3c4043"}`, fontSize:13, color:"#e8eaed", lineHeight:1.5 }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:"12px 16px 18px", borderTop:"1px solid #3c4043", display:"flex", gap:10, alignItems:"center" }}>
              <input placeholder="Send a message to everyone" value={msg}
                onChange={e=>setMsg(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendMsg()}
                style={{ flex:1, padding:"12px 16px", borderRadius:999, fontSize:13, border:"1px solid #3c4043", background:"#2d2f3a", color:"#e8eaed", fontFamily:"inherit", outline:"none" }}
                onFocus={e=>e.target.style.borderColor="#8ab4f8"}
                onBlur={e=>e.target.style.borderColor="#3c4043"}
              />
              <button onClick={sendMsg} style={{ width:44, height:44, borderRadius:"50%", border:"none", background:"#8ab4f8", color:"#0f1117", fontSize:18, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>→</button>
            </div>
          </div>
        )}

        {/* PARTICIPANTS PANEL */}
        {showParticipants && (
          <div style={{ width:300, borderLeft:"1px solid #3c4043", display:"flex", flexDirection:"column", background:"#202124", animation:"fadeIn 0.2s ease" }}>
            <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #3c4043", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontWeight:700, fontSize:16, color:"#e8eaed" }}>People (2)</span>
              <button onClick={() => setShowParticipants(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aa0b4", fontSize:20, lineHeight:1, padding:"2px 6px", borderRadius:6 }}>✕</button>
            </div>
            <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
              {[{ name: user?.username, you: true }, { name: peer?.username, you: false }].map((p, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:14, background:"#2d2f3a", border:"1px solid #3c4043" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:`hsl(${(i+1)*97%360},45%,32%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff", flexShrink:0 }}>
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#e8eaed" }}>
                      {p.name} {p.you && <span style={{ fontSize:11, color:"#9aa0b4", fontWeight:400 }}>(You)</span>}
                    </div>
                    <div style={{ fontSize:11, color:"#81c995", marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:"#81c995", display:"inline-block" }}/>
                      In call
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
