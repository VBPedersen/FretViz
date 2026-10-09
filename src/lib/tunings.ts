export interface TuningPreset {
	name: string;
	notes: readonly string[];
}

export const TUNING_PRESETS: TuningPreset[] = [
	{ name: "Standard", notes: ["E2", "A2", "D3", "G3", "B3", "E4"] },
	{ name: "Drop D", notes: ["D2", "A2", "D3", "G3", "B3", "E4"] },
	{ name: "Drop C", notes: ["C2", "G2", "C3", "F3", "A3", "D4"] },
	{ name: "Drop C#", notes: ["C#2", "G#2", "C#3", "F#3", "A#3", "D#4"] },
	{ name: "Double Drop D", notes: ["D2", "A2", "D3", "G3", "B3", "D4"] },
	{ name: "Open G", notes: ["D2", "G2", "D3", "G3", "B3", "D4"] },
	{ name: "Open D", notes: ["D2", "A2", "D3", "F#3", "A3", "D4"] },
	{ name: "Half-step down", notes: ["D#2", "G#2", "C#3", "F#3", "A#3", "D#4"] },
	{ name: "Full-step down", notes: ["D2", "G2", "C3", "F3", "A3", "D4"] },
	{ name: "DADGAD", notes: ["D2", "A2", "D3", "G3", "A3", "D4"] },
];
