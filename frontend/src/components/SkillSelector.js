// src/components/SkillSelector.jsx
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export const SKILL_CATEGORIES = {
  "💻 Tech":      ["React","Node.js","Python","JavaScript","TypeScript","Java","Flutter","AI/ML","DevOps","Blockchain","SQL","MongoDB"],
  "🎨 Design":    ["UI/UX","Figma","Photoshop","Illustrator","3D Design","Motion Graphics","Brand Design"],
  "🎵 Music":     ["Guitar","Piano","Drums","Singing","Music Theory","DJ","Music Production","Violin"],
  "🗣️ Language":  ["English","Spanish","French","Tamil","Hindi","Japanese","German","Mandarin"],
  "🍳 Lifestyle": ["Cooking","Baking","Yoga","Fitness","Meditation","Photography","Videography"],
  "📈 Business":  ["Marketing","SEO","Content Writing","Finance","Public Speaking","Sales","Excel"],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

export default function SkillSelector({ type, selected, onChange }) {
  const T = useTheme();
  const [activeCategory, setActiveCategory] = useState("💻 Tech");
  const [search, setSearch] = useState("");

  const color   = type === "offer" ? T.accent : T.accent2;
  const filtered = search
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : SKILL_CATEGORIES[activeCategory] || [];

  const toggle = (skill) => {
    onChange(selected.includes(skill) ? selected.filter(s => s !== skill) : [...selected, skill]);
  };

  return (
    <div>
      {/* Selected pills */}
      {selected.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
          {selected.map(s => (
            <span key={s} onClick={() => toggle(s)} style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"5px 12px", borderRadius:999, fontSize:12, fontWeight:700,
              border:`1.5px solid ${color}`, background:color,
              color: type === "offer" ? "#03050a" : "#fff",
              cursor:"pointer", fontFamily:"DM Sans, sans-serif",
            }}>
              {s} <span style={{ fontSize:13 }}>×</span>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        placeholder="🔍 Search skills..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width:"100%", padding:"9px 14px", marginBottom:10,
          borderRadius:8, border:`1px solid ${T.border}`,
          background:T.surface2, color:T.text,
          fontFamily:"DM Sans, sans-serif", fontSize:13, outline:"none",
        }}
      />

      {/* Category tabs */}
      {!search && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          {Object.keys(SKILL_CATEGORIES).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding:"4px 11px", borderRadius:999, fontSize:11, fontWeight:700,
              fontFamily:"DM Sans, sans-serif", cursor:"pointer", border:"1px solid",
              transition:"all 0.15s",
              borderColor: activeCategory === cat ? color : T.border,
              background:  activeCategory === cat ? `${color}20` : "transparent",
              color:       activeCategory === cat ? color : T.muted,
            }}>{cat}</button>
          ))}
        </div>
      )}

      {/* Skills */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, maxHeight:120, overflowY:"auto" }}>
        {filtered.map(skill => {
          const sel = selected.includes(skill);
          return (
            <span key={skill} onClick={() => toggle(skill)} style={{
              display:"inline-flex", alignItems:"center",
              padding:"6px 13px", borderRadius:999, fontSize:12, fontWeight:700,
              border:`1.5px solid ${sel ? color : T.border}`,
              background: sel ? color : "transparent",
              color: sel ? (type === "offer" ? "#03050a" : "#fff") : T.muted,
              cursor:"pointer", fontFamily:"DM Sans, sans-serif", transition:"all 0.15s",
            }}>{skill}</span>
          );
        })}
        {filtered.length === 0 && (
          <span style={{ color:T.muted, fontSize:13 }}>No skills found</span>
        )}
      </div>
      <div style={{ fontSize:11, color:T.muted, marginTop:6 }}>{selected.length} selected</div>
    </div>
  );
}
