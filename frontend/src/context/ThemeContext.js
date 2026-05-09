// src/context/ThemeContext.js
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(true);
  const toggle = () => setDark(d => !d);

  const theme = {
    dark,
    toggle,
    bg:       dark ? "#03050a" : "#f0f4ff",
    surface:  dark ? "#080d17" : "#ffffff",
    surface2: dark ? "#0e1422" : "#f8faff",
    border:   dark ? "#1a2236" : "#dde3f0",
    text:     dark ? "#eef2ff" : "#0d1b3e",
    muted:    dark ? "#4a5680" : "#7a88b0",
    accent:   "#00c4e8",
    accent2:  "#ff3d6b",
    accent3:  "#ffe566",
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
