
interface FretboardOptionsPickerProps {
    numFrets: number;
    onNumFretChange: (numFrets: number) => void;
}

/**
 * Picker dropdown component to select fretboard options like number of frets to show
 * @param numFrets - current number of frets to display
 * @param onNumFretChange - callback: what to do when changing number of frets
 * @constructor
 */
export function FretboardOptionsPicker({ numFrets, onNumFretChange }: FretboardOptionsPickerProps) {
    return (
        <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-neutral-400">
                Number of Frets
                <select
                    value={numFrets}
                    onChange={(e) => onNumFretChange(Number(e.target.value))}
                    className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
                >
                    <option value={12}>12 frets</option>
                    <option value={15}>15 frets</option>
                    <option value={17}>17 frets</option>
                    <option value={21}>21 frets</option>
                </select>
            </label>
        </div>
    );
}
