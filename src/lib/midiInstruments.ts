/**
 * Maps a General MIDI program number (0-127) to a coarse instrument
 * category used for track icons. GM groups instruments into blocks of 8;
 * only care about a few broad buckets, not exact patch names.
 */
export function gmProgramToInstrument(program: number, channel: number): string {
    if (channel === 9) return "drums"; // MIDI channel 10 is always percussion, regardless of program
    if (program >= 25 && program <= 32) return "guitar";
    if (program >= 32 && program <= 39) return "bass";
    if (program >= 41 && program <= 48) return "strings";
    if (program >= 89 && program <= 96) return "synth";
    if (program >= 0 && program <= 7) return "piano";
    return "other";
}