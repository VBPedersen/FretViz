import type { ScaleDefinition } from "../types";
import { COMMON_SCALES } from "../lib/scaleEngine";

const NOTE_LETTERS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface ToolbarProps {
    isPlaying: boolean;
    isReady: boolean;
    scale: ScaleDefinition;
    onPlayPause: () => void;
    onScaleChange: (scale: ScaleDefinition) => void;
    onSpeedChange: (speed: number) => void;
    onFileUpload: (file: File) => void;
}

export function Toolbar({
                            isPlaying,
                            isReady,
                            scale,
                            onPlayPause,
                            onScaleChange,
                            onSpeedChange,
                            onFileUpload,
                        }: ToolbarProps) {
    return (
        <header className="flex items-center gap-6 border-b border-neutral-800 px-4 py-3 bg-neutral-950 text-neutral-100">
            <h1 className="text-lg font-semibold tracking-tight">FretViz</h1>

            <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-neutral-200">
                <span>Import</span>
                <input
                    type="file"
                    accept=".gp,.gp3,.gp4,.gp5,.gpx"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onFileUpload(file);
                    }}
                />
            </label>

            <button
                onClick={onPlayPause}
                disabled={!isReady}
                className="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white
                   hover:bg-pink-500 disabled:opacity-40 disabled:hover:bg-pink-600
                   transition-colors"
            >
                {isPlaying ? "Pause" : "Play"}
            </button>

            <label className="flex items-center gap-2 text-sm text-neutral-400">
                Speed
                <input
                    type="range"
                    min={0.25}
                    max={1.5}
                    step={0.05}
                    defaultValue={1}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    className="accent-pink-600"
                />
            </label>

            <div className="ml-auto flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-neutral-400">
                    Root
                    <select
                        value={scale.tonic}
                        onChange={(e) => onScaleChange({ ...scale, tonic: e.target.value })}
                        className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
                    >
                        {NOTE_LETTERS.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex items-center gap-2 text-sm text-neutral-400">
                    Scale
                    <select
                        value={scale.scaleName}
                        onChange={(e) => onScaleChange({ ...scale, scaleName: e.target.value })}
                        className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
                    >
                        {COMMON_SCALES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
        </header>
    );
}