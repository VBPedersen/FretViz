import type { FretDot } from "../types";

/**
 * Walks the entire parsed score and collects every unique (string, fret)
 * position used anywhere in the song. This is a static, one-time pass on song load
 */
export function extractSongNotes(score: unknown, trackIndex = 0): FretDot[] {
    const seen = new Map<string, FretDot>();

    // alphaTab's Score type isn't imported here to keep file decoupled
    const s = score as {
        tracks: {
            staves: {
                bars: {
                    voices: {
                        beats: {
                            isRest?: boolean;
                            notes: { string: number; fret: number; isDead?: boolean; isTieDestination?: boolean }[];
                        }[];
                    }[];
                }[];
            }[];
        }[];
    };


    const track = s.tracks?.[trackIndex];
    if (!track) return [];

    for (const staff of track.staves ?? []) {
        for (const bar of staff.bars ?? []) {
            for (const voice of bar.voices ?? []) {
                for (const beat of voice.beats ?? []) {
                    if (beat.isRest) continue;
                    for (const note of beat.notes ?? []) {
                        if (note.string == null || note.fret == null) continue;
                        if (note.isDead || note.isTieDestination) continue;
                        const key = `${note.string}-${note.fret}`;
                        if (!seen.has(key)) {
                            seen.set(key, { string: note.string, fret: note.fret, role: "scale" });
                        }
                    }
                }
            }
        }
    }

    return Array.from(seen.values());
}

/**
 * Returns the amount of frets to show based on the furthest fret played in dot array
 * @param dots - FretDot array of dots to use for calculating highest fret played
 */
export function getFretRange(dots: FretDot[]): number {
    const maxFret = Math.max(0, ...dots.map((d) => d.fret));
    if (maxFret <= 12) return 15;
    if (maxFret <= 17) return maxFret + 1;
    return maxFret;
}