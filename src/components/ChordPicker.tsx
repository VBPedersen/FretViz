import { COMMON_CHORDS, COMMON_TRIADS } from "../lib/scaleEngine";

const NOTE_LETTERS = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B",
];

interface ChordPickerProps {
	tonic: string;
	symbol: string;
	mode: "triad" | "chord";
	onChange: (tonic: string, symbol: string) => void;
}

export function ChordPicker({
	tonic,
	symbol,
	mode,
	onChange,
}: ChordPickerProps) {
	const symbols = mode === "triad" ? COMMON_TRIADS : COMMON_CHORDS;

	return (
		<div className="flex items-center gap-3">
			<label className="flex items-center gap-2 text-sm text-neutral-400">
				Root
				<select
					value={tonic}
					onChange={(e) => onChange(e.target.value, symbol)}
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
				{mode === "triad" ? "Triad" : "Chord"}
				<select
					value={symbol}
					onChange={(e) => onChange(tonic, e.target.value)}
					className="rounded bg-neutral-800 px-2 py-1 text-neutral-100"
				>
					{symbols.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</label>
		</div>
	);
}
