import {TUNING_PRESETS} from "../lib/tunings.ts";

export function TuningPicker({ tuning, onChange }: { tuning: string; onChange: (name: string) => void }) {
    return (
        <label className="flex items-center gap-2 text-sm text-neutral-400">
            Tuning
            <select value={tuning} onChange={(e) => onChange(e.target.value)} className="rounded bg-neutral-800 px-2 py-1 text-neutral-100">
                {TUNING_PRESETS.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
        </label>
    );
}