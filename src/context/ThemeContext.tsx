import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "cyberpunk" | "vintage";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem("fretviz-theme") as Theme) || "dark";
    });

    useEffect(() => {
        // Sets <html data-theme="..."> so CSS variables change app-wide instantly
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("fretviz-theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}