// Standard 6-string tuning, low to high (string 6 = low E ... string 1 = high E)
// alphaTab uses string numbers where 1 = highest pitch string, matching this convention.
export const STANDARD_TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"] as const;

export type NoteRole = "root" | "scale" | "active" | "none";

export interface FretDot {
    string: number; // 1-6
    fret: number; // 0-24
    role: NoteRole;
    noteName?: string; // e.g. "A4"
}

export interface ScaleDefinition {
    tonic: string; // e.g. "A"
    scaleName: string; // tonal.js scale name, e.g. "minor pentatonic"
}

export interface ActiveNote {
    string: number;
    fret: number;
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
    content: string; // base64 for gp files, plain text for alphaTex
    defaultScale?: ScaleDefinition;
    tempoOverride?: number;
}