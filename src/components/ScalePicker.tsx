import type { ScaleDefinition } from "../types";
import { COMMON_SCALES } from "../lib/scaleEngine";

const NOTE_LETTERS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface ScalePickerProps {
    scale: ScaleDefinition;
    onChange: (scale: ScaleDefinition) => void;
}

/**
 * Picker dropdown component to select scale from list of scales
 * TODO Maybe pull scales from alphatab or just add more to common scales
 * @param scale scale as combination of tonic and name : ScaleDefinition
 * @param onChange what to do when selecting new scale
 * @constructor
 */
export function ScalePicker({ scale, onChange }: ScalePickerProps) {
    return (
        <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
                Root
                <select
                    value={scale.tonic}
                    onChange={(e) => onChange({ ...scale, tonic: e.target.value })}
                    className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
                >
                    {NOTE_LETTERS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
                Scale
                <select
                    value={scale.scaleName}
                    onChange={(e) => onChange({ ...scale, scaleName: e.target.value })}
                    className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
                >
                    {COMMON_SCALES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </label>
        </div>
    );
}