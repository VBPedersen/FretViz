import { useTheme, Theme } from "../context/ThemeContext";

/**
 * simple Theme selector with hardcoded values for now
 * TODO make cooler
 * @constructor
 */
export function ThemeSelect() {
    const { theme, setTheme } = useTheme();

    return (
        <label className="flex items-center gap-2 text-sm text-neutral-400">
            Theme
            <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
            >
                <option value="dark">Dark Studio</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="vintage">Vintage Rosewood</option>
            </select>
        </label>
    );
}