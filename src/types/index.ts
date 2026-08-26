// Standard 6-string tuning, low to high (string 6 = low E ... string 1 = high E)
// alphaTab uses string numbers where 1 = highest pitch string, matching this convention.
export const STANDARD_TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"] as const;

export type NoteRole = "root" | "scale" | "active" | "upcoming" | "none";

export interface FretDot {
    string: number; // 1-6
    fret: number; // 0-24
    role: NoteRole;
    noteName?: string; // e.g. "A4"
}

export interface BarNote extends FretDot {
    beatIndex: number; // position within the bar, used to order direction lines
}

export interface ScaleDefinition {
    tonic: string; // e.g. "A"
    scaleName: string; // tonal.js scale name, e.g. "minor pentatonic"
}

/**
 * A note currently sounding in alphaTab.
 *
 * `bendSemitones` is the sampled bend curve at the current playback tick.
 * `vibratoOffsetSemitones` is the instantaneous +/- vibrato displacement.
 * `pitchOffsetSemitones` is the value the visualizer should actually render.
 *
 * The latter two are deliberately separate so the UI can style/inspect
 * bends and vibratos independently without re-parsing alphaTab data.
 */
export interface ActiveNote {
    string: number;
    fret: number;
    bendSemitones?: number; // e.g. 0.5 for quarter bend, 2 for full
    vibrato?: boolean;
    vibratoOffsetSemitones?: number;
    pitchOffsetSemitones?: number;
}

// A saved item in the user's library
export interface TabEntry {
    id: string; // uuid
    title: string;
    artist?: string;
    source: "upload" | "alphatex" | "pasted-ascii";
    createdAt: number;
    updatedAt: number;
    // Raw content: either binary (base64, for .gp*) or text (alphaTex)
    format: "gp" | "alphatex";
    content: ArrayBuffer | string; // ArrayBuffer for gp files, string for alphaTex
    defaultScale?: ScaleDefinition;
    tempoOverride?: number;
}