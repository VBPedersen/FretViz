import type { FretDot } from "../types";

/**
 * Walks the entire parsed score and collects every unique (string, fret)
 * position used anywhere in the song. This is a static, one-time pass on song load
 */
export function extractSongNotes(score: unknown): FretDot[] {
    const seen = new Map<string, FretDot>();

    // alphaTab's Score type isn't imported here to keep file decoupled
    const s = score as {
        tracks: {
            staves: {
                bars: {
                    voices: {
                        beats: {
                            notes: { string: number; fret: number }[];
                        }[];
                    }[];
                }[];
            }[];
        }[];
    };

    for (const track of s.tracks ?? []) {
        for (const staff of track.staves ?? []) {
            for (const bar of staff.bars ?? []) {
                for (const voice of bar.voices ?? []) {
                    for (const beat of voice.beats ?? []) {
                        for (const note of beat.notes ?? []) {
                            if (note.string == null || note.fret == null) continue;
                            const key = `${note.string}-${note.fret}`;
                            if (!seen.has(key)) {
                                seen.set(key, { string: note.string, fret: note.fret, role: "scale" });
                            }
                        }
                    }
                }
            }
        }
    }

    return Array.from(seen.values());
}