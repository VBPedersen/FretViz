

// Custom interface matching alphaTab's internal BendPoint structure
export interface AlphaTabBendPoint {
    offset: number; // 0 to 60
    value: number;  // Quarter-tones
}

export interface NormalizedBendPoint {
    offset: number;
    semitones: number;
}


const MAX_BEND_OFFSET = 60;

/**
 * Convert alphaTab's bend representation into semitones.
 *
 * alphaTab documents BendPoint.value as quarter-tone units, so:
 *   2 -> 1 semitone
 *   4 -> 2 semitones
 */
export function parseAlphaTabBends(
    points: AlphaTabBendPoint[] | undefined | null
): NormalizedBendPoint[] {
    if (!points || points.length === 0) return [];

    return points
        .map((point) => ({
            offset: clamp(point.offset, 0, MAX_BEND_OFFSET),
            semitones: point.value / 2,
        }))
        .sort((a, b) => a.offset - b.offset);
}

/**
 * Linearly interpolates the current bend amount (in semitones)
 * given playback progress through the note (0.0 to 1.0).
 */
export function sampleBendSemitones(
    points: AlphaTabBendPoint[] | NormalizedBendPoint[] | undefined,
    progress: number
): number {
    if (!points || points.length === 0) return 0;

    const offset = clamp(progress, 0, 1) * MAX_BEND_OFFSET;

    // Fast path for the common one/two-point bend.
    if (points.length === 1) {
        const p = points[0];
        return "value" in p ? p.value / 2 : p.semitones;
    }


    const first = toNormalizedPoint(points[0]);
    const last = toNormalizedPoint(points[points.length - 1]);

    if (offset <= first.offset) return first.semitones;
    if (offset >= last.offset) return last.semitones;

    // Binary search avoids scanning long custom GP bend curves every frame.
    let low = 0;
    let high = points.length - 1;

    while (low + 1 < high) {
        const mid = (low + high) >> 1;
        const midOffset = points[mid].offset;

        if (midOffset <= offset) {
            low = mid;
        } else {
            high = mid;
        }
    }

    const a = toNormalizedPoint(points[low]);
    const b = toNormalizedPoint(points[high]);
    const range = b.offset - a.offset;

    if (range <= 0) return b.semitones;

    const t = (offset - a.offset) / range;
    return a.semitones + (b.semitones - a.semitones) * t;
}

function toNormalizedPoint(
    point: AlphaTabBendPoint | NormalizedBendPoint
): NormalizedBendPoint {
    return "value" in point
        ? { offset: point.offset, semitones: point.value / 2 }
        : point;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}