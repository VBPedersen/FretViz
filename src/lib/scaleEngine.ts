import {Chord, Note, Scale} from "tonal";
import { STANDARD_TUNING } from "../types";
import type { FretDot, ScaleDefinition } from "../types";

const DEFAULT_MAX_FRET  = 21;


/**
 * Given a set of pitch classes (chroma 0-11) and a root,
 * compute every (string, fret) position on the given tuning where one of
 * those pitch classes occurs, tagging the root separately.
 *
 * Scales, chords, triads and arpeggios all reduce to this — they only
 * differ in which pitch classes they pass in. Keep this pure/static,
 * call it once per selection change, not per frame.
 */
export function buildNoteSetMap(
    pitchClasses: number[],
    rootChroma: number,
    tuning: readonly string[] = STANDARD_TUNING,
    maxFret: number = DEFAULT_MAX_FRET
): FretDot[] {
    const set = new Set(pitchClasses);
    const dots: FretDot[] = [];

    tuning.forEach((openNote, tuningIndex) => {
        const stringNumber = tuningIndex + 1;
        const openMidi = Note.midi(openNote);
        if (openMidi == null) return;

        for (let fret = 0; fret <= maxFret; fret++) {
            const midi = openMidi + fret;
            const noteName = Note.fromMidi(midi);
            const chroma = Note.chroma(noteName);
            if (chroma == null || !set.has(chroma)) continue;

            dots.push({
                string: stringNumber,
                fret,
                role: chroma === rootChroma ? "root" : "scale",
                noteName,
            });
        }
    });

    return dots;
}


/**
 * Given a tuning and a scale (tonic + scale name), compute every
 * (string, fret) position that belongs to the scale, tagging roots
 * separately from other scale tones.
 *
 * This is pure/static, call once per scale change, not per frame.
 */
export function buildScaleMap(
    scale: ScaleDefinition,
    tuning: readonly string[] = STANDARD_TUNING,
    maxFret: number = DEFAULT_MAX_FRET
): FretDot[] {
    const scaleData = Scale.get(`${scale.tonic} ${scale.scaleName}`);
    if (scaleData.empty) {
        throw new Error(`Unknown scale: ${scale.tonic} ${scale.scaleName}`);
    }
    const pitchClasses = scaleData.notes.map((n) => Note.chroma(n)!);
    const rootChroma = Note.chroma(scale.tonic)!;
    return buildNoteSetMap(pitchClasses, rootChroma, tuning, maxFret);
}


export interface ChordDefinition {
    tonic: string;   // e.g. "A"
    symbol: string;  // tonal.js chord symbol, e.g. "M", "m", "7", "maj7", "dim"
}


/**
 * Given a tuning and a chord (tonic + chord name), compute every
 * (string, fret) position that belongs to the chord, tagging roots
 * separately from other chord tones.
 *
 * This is pure/static, call once per chord change, not per frame.
 */
export function buildChordMap(
    chord: ChordDefinition,
    tuning: readonly string[] = STANDARD_TUNING,
    maxFret: number = DEFAULT_MAX_FRET
): FretDot[] {
    const chordData = Chord.get(`${chord.tonic}${chord.symbol}`);
    if (chordData.empty) {
        throw new Error(`Unknown chord: ${chord.tonic}${chord.symbol}`);
    }
    const pitchClasses = chordData.notes.map((n) => Note.chroma(n)!);
    const rootChroma = Note.chroma(chord.tonic)!;
    return buildNoteSetMap(pitchClasses, rootChroma, tuning, maxFret);
}


const STRING_SETS: [number, number, number][] = [
    [1, 2, 3], [2, 3, 4], [3, 4, 5], [4, 5, 6],
];


/**
 * Builds true closed-voicing triad shapes: exactly one note per string,
 * restricted to 3 adjacent strings, containing all three triad tones
 * (root, 3rd, 5th). This is distinct from buildChordMap, which scatters
 * every matching note across all 6 strings, that's correct for full
 * chord voicings, but not how triad shapes are actually played/taught.
 */
export function buildTriadShapes(
    chord: ChordDefinition,
    tuning: readonly string[] = STANDARD_TUNING,
    maxFret: number = DEFAULT_MAX_FRET,
    span: number = 4
): FretDot[][] {
    const chordData = Chord.get(`${chord.tonic}${chord.symbol}`);
    if (chordData.empty || chordData.notes.length !== 3) {
        throw new Error(`Not a triad: ${chord.tonic}${chord.symbol}`);
    }

    const pitchClasses = new Set(chordData.notes.map((n) => Note.chroma(n)!));
    const rootChroma = Note.chroma(chord.tonic)!;

    // Per-string note map: for each string, every fret/chroma that belongs to the triad
    const perString = tuning.map((openNote) => {
        const openMidi = Note.midi(openNote);
        const hits: { fret: number; chroma: number; noteName: string }[] = [];
        if (openMidi == null) return hits;
        for (let fret = 0; fret <= maxFret; fret++) {
            const noteName = Note.fromMidi(openMidi + fret);
            const chroma = Note.chroma(noteName);
            if (chroma != null && pitchClasses.has(chroma)) {
                hits.push({ fret, chroma, noteName });
            }
        }
        return hits;
    });

    const shapes: FretDot[][] = [];

    for (const [s1, s2, s3] of STRING_SETS) {
        const hitsA = perString[s1 - 1];
        const hitsB = perString[s2 - 1];
        const hitsC = perString[s3 - 1];

        for (const a of hitsA) {
            for (const b of hitsB) {
                if (Math.abs(b.fret - a.fret) > span) continue;
                for (const c of hitsC) {
                    const frets = [a.fret, b.fret, c.fret];
                    const spanUsed = Math.max(...frets) - Math.min(...frets);
                    if (spanUsed > span) continue;

                    // must cover all three triad tones, not just any 3 notes
                    const chromas = new Set([a.chroma, b.chroma, c.chroma]);
                    if (chromas.size !== 3) continue;
                    if (![...pitchClasses].every((pc) => chromas.has(pc))) continue;

                    shapes.push([
                        { string: s1, fret: a.fret, noteName: a.noteName, role: a.chroma === rootChroma ? "root" : "scale" },
                        { string: s2, fret: b.fret, noteName: b.noteName, role: b.chroma === rootChroma ? "root" : "scale" },
                        { string: s3, fret: c.fret, noteName: c.noteName, role: c.chroma === rootChroma ? "root" : "scale" },
                    ]);
                }
            }
        }
    }

    // dedupe identical shapes (same string+fret combos can arise from
    // the nested loop in more than one order) and sort low to high
    const seen = new Set<string>();
    const unique = shapes.filter((shape) => {
        const key = shape.map((d) => `${d.string}-${d.fret}`).sort().join("|");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return unique.sort((a, b) => Math.min(...a.map(d => d.fret)) - Math.min(...b.map(d => d.fret)));
}


// Just for convenience, triads are just common-length chords. Kept as a named export
export const COMMON_TRIADS = ["M", "m", "dim", "aug"] as const;

// A handful of common chords for the UI dropdown.
export const COMMON_CHORDS = [
    "M", "m", "7", "maj7", "m7", "dim", "aug", "sus2", "sus4", "m7b5",
] as const;

// A handful of common scales for the UI dropdown.
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

/**
 * Interval label relative to a root, for display modes that show
 * "R, b3, 5" instead of note names. Returns null if chroma is invalid.
 */
const INTERVAL_LABELS = ["R", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];

export function intervalLabel(noteChroma: number, rootChroma: number): string {
    const steps = (noteChroma - rootChroma + 12) % 12;
    return INTERVAL_LABELS[steps];
}
/**
 * Groups chord/triad dots into distinct playable positions using a
 * sliding fret-span window rather than global
 * fret gaps, chord tones are dense across 6 strings, so gap-based
 * clustering collapses into one group. A window scan instead finds every
 * hand position that contains a reasonably complete voicing, then keeps
 * only the strongest, non-redundant ones.
 */
export function groupDotsByPosition(
    dots: FretDot[],
    span: number = 4
): FretDot[][] {
    if (dots.length === 0) return [];

    const maxFret = Math.max(...dots.map((d) => d.fret));
    const candidates: { start: number; dots: FretDot[] }[] = [];

    for (let start = 0; start <= maxFret; start++) {
        const inWindow = dots.filter((d) => d.fret >= start && d.fret < start + span);
        if (inWindow.length === 0) continue;

        // require at least one note on 3+ distinct strings to count as a
        // real playable shape, not a stray single note at the window edge
        const distinctStrings = new Set(inWindow.map((d) => d.string)).size;
        if (distinctStrings < 3) continue;

        candidates.push({ start, dots: inWindow });
    }

    if (candidates.length === 0) return [dots]; // fallback: don't hide everything

    // Sweep left to right, keep a window only when it's meaningfully
    // different from the one just kept (avoids near-duplicate windows
    // that slide by 1 fret and contain almost the same notes).
    const kept: FretDot[][] = [];
    let lastKeptStart = -Infinity;

    for (const c of candidates) {
        if (c.start - lastKeptStart < span) {
            // still inside the previous shape's span — only replace if
            // this window has strictly more notes (a fuller voicing)
            if (kept.length > 0 && c.dots.length > kept[kept.length - 1].length) {
                kept[kept.length - 1] = c.dots;
                lastKeptStart = c.start;
            }
            continue;
        }
        kept.push(c.dots);
        lastKeptStart = c.start;
    }

    return kept;
}
