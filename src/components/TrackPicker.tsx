interface TrackInfo {
    index: number;
    name: string;
}

interface TrackPickerProps {
    tracks: TrackInfo[];
    selectedIndex: number;
    onChange: (index: number) => void;
}

/**
 * Picker dropdown component to select which track (instrument) of a
 * multi-track .gp* file to visualize on the fretboard.
 */
export function TrackPicker({ tracks, selectedIndex, onChange }: TrackPickerProps) {
    if (tracks.length <= 1) return null; // nothing to pick when there's only one track

    return (
        <label className="flex items-center gap-2 text-sm text-neutral-400">
            Track
            <select
                value={selectedIndex}
                onChange={(e) => onChange(Number(e.target.value))}
                className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
            >
                {tracks.map((t) => (
                    <option key={t.index} value={t.index}>{t.name}</option>
                ))}
            </select>
        </label>
    );
}