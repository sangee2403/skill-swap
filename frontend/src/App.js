// src/App.js
import { useState, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";

import Toast        from "./components/Toast";
import LandingPage  from "./pages/LandingPage";
import LoginPage    from "./pages/LoginPage";
import SignupPage   from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import VideoCallPage from "./pages/VideoCallPage";
import ProfilePage  from "./pages/ProfilePage";

function AppInner() {
  const [page, setPage]         = useState("landing");
  const [user, setUser]         = useState(()=>{
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [videoRoom, setVideoRoom] = useState(null);
  const [toasts, setToasts]     = useState([]);

  const toast = useCallback((msg, type="success")=>{
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);

  const onLogin = (u)=>{
    setUser(u);
    setPage("dashboard");
  };

  const onLogout = ()=>{
    localStorage.clear();
    setUser(null);
    setPage("landing");
  };

  // Guard protected routes
  const go = (p) => {
    if (!user && !["landing","login","signup"].includes(p)) {
      setPage("login"); return;
    }
    setPage(p);
  };

  return (
    <>
      {page === "landing" && (
        <LandingPage
          onLogin  ={()=>go("login")}
          onSignup ={()=>go("signup")}
        />
      )}
      {page === "login" && (
        <LoginPage
          onLogin    ={onLogin}
          onGoSignup ={()=>go("signup")}
          toast      ={toast}
        />
      )}
      {page === "signup" && (
        <SignupPage
          onSuccess ={()=>go("login")}
          onGoLogin ={()=>go("login")}
          toast     ={toast}
        />
      )}
      {page === "dashboard" && user && (
        <DashboardPage
          user        ={user}
          setPage     ={go}
          setVideoRoom={setVideoRoom}
          toast       ={toast}
        />
      )}
      {page === "videocall" && user && videoRoom && (
        <VideoCallPage
          user      ={user}
          videoRoom ={videoRoom}
          setPage   ={go}
          toast     ={toast}
        />
      )}
      {page === "profile" && user && (
        <ProfilePage
          user    ={user}
          setUser ={setUser}
          setPage ={go}
          toast   ={toast}
        />
      )}

      <Toast toasts={toasts}/>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
