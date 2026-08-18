import { Note, Scale } from "tonal";
import { STANDARD_TUNING } from "../types";
import type { FretDot, ScaleDefinition } from "../types";

const MAX_FRET = 21; // TODO for now const, might consider dynamic or parametric input later

/**
 * Given a tuning and a scale (tonic + scale name), compute every
 * (string, fret) position that belongs to the scale, tagging roots
 * separately from other scale tones.
 *
 * This is pure/static — call it once per scale change, not per frame.
 */
export function buildScaleMap(
    scale: ScaleDefinition,
    tuning: readonly string[] = STANDARD_TUNING
): FretDot[] {
    const scaleData = Scale.get(`${scale.tonic} ${scale.scaleName}`);
    if (scaleData.empty) {
        throw new Error(`Unknown scale: ${scale.tonic} ${scale.scaleName}`);
    }

    // pitch classes only (e.g. ["A", "C", "D", "E", "G"]) so octave doesn't matter
    const scalePitchClasses = new Set(scaleData.notes.map((n) => Note.chroma(n)));
    const rootChroma = Note.chroma(scale.tonic);

    const dots: FretDot[] = [];

    // tuning[0] = low E = string 6 in our display convention (1 = high E)
    tuning.forEach((openNote, tuningIndex) => {
        const stringNumber = tuning.length - tuningIndex; // 6..1
        const openMidi = Note.midi(openNote);
        if (openMidi == null) return;

        for (let fret = 0; fret <= MAX_FRET; fret++) {
            const midi = openMidi + fret;
            const noteName = Note.fromMidi(midi);
            const chroma = Note.chroma(noteName);
            if (chroma == null) continue;

            if (chroma === rootChroma) {
                dots.push({ string: stringNumber, fret, role: "root", noteName });
            } else if (scalePitchClasses.has(chroma)) {
                dots.push({ string: stringNumber, fret, role: "scale", noteName });
            }
        }
    });

    return dots;
}

// A handful of common scales for the initial UI dropdown.
// picked via tonal.js Scale.names().
export const COMMON_SCALES = [
    "major",
    "minor",
    "minor pentatonic",
    "major pentatonic",
    "dorian",
    "mixolydian",
    "blues",
    "harmonic minor",
] as const;