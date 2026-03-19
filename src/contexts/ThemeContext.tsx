import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

export type ThemeAccent = "violet" | "blue" | "emerald" | "rose" | "amber";

export interface ThemeOption {
  id: ThemeAccent;
  label: string;
  color: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "violet", label: "Violet", color: "#8b5cf6" },
  { id: "blue",   label: "Midnight Blue", color: "#3b82f6" },
  { id: "emerald",label: "Emerald", color: "#10b981" },
  { id: "rose",   label: "Rose", color: "#f43f5e" },
  { id: "amber",  label: "Amber", color: "#f59e0b" },
];

interface ThemeContextValue {
  theme: ThemeAccent;
  setTheme: Dispatch<SetStateAction<ThemeAccent>>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "violet",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeAccent>(
    () => (localStorage.getItem("pulse-theme") as ThemeAccent) ?? "violet"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pulse-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
