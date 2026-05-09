// src/components/Toast.jsx
export default function Toast({ toasts }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "12px 20px", borderRadius: 10, fontSize: 13,
          fontFamily: "DM Sans, sans-serif", fontWeight: 600,
          background: t.type === "error" ? "#1a0812" : "#081812",
          border: `1px solid ${t.type === "error" ? "#ff3d6b" : "#00c4e8"}`,
          color: t.type === "error" ? "#ff3d6b" : "#00c4e8",
          boxShadow: `0 4px 20px ${t.type === "error" ? "rgba(255,61,107,0.2)" : "rgba(0,196,232,0.2)"}`,
          maxWidth: 320,
          animation: "fadeUp 0.3s ease forwards",
        }}>
          {t.type === "error" ? "✗ " : "✓ "}{t.msg}
        </div>
      ))}
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:translateY(0);}}`}</style>
    </div>
  );
}
