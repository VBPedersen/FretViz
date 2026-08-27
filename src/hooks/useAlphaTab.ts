import {useEffect, useRef, useState} from "react";
import {AlphaTabApi, PlayerMode, Settings} from "@coderline/alphatab";
import type {ActiveNote, BarNote} from "../types";
import {AlphaTabBendPoint, NormalizedBendPoint, parseAlphaTabBends, sampleBendSemitones} from "../lib/bendUtils.ts";

/**
 * Internal cached note interface, only used locally
 */
interface CachedNote {
    string: number;
    fret: number;
    bendPoints: NormalizedBendPoint[];
    hasVibrato: boolean;
    noteStartTick: number;
    noteDuration: number;
}


interface UseAlphaTabOptions {
    onActiveNotesChange?: (notes: ActiveNote[]) => void;
    onBarChange?: (barIndex: number, currentBarNotes: BarNote[], nextBarNotes: BarNote[]) => void;
    onScoreLoaded?: (score: unknown) => void;
}

/**
 * Wraps AlphaTab's API in a React-friendly hook.
 *
 * alphaTab indicates which notes are sounding
 * at the current playback position via the active Beat objects.
 * `playedBeatChanged` fires with the beat(s) currently audible; each
 * Beat has `.notes[]`, and each Note has `.string` / `.fret` already
 * populated from the parsed file.
 *
 * Important performance rule:
 * - activeBeatsChanged does the expensive work once per note/beat change.
 * - requestAnimationFrame only samples numeric curves while playing.
 * - no BendPoint objects are allocated inside the interpolation loop.
 *
 * `tickPosition` is alphaTab's authoritative MIDI-tick clock, so bends stay
 * synchronized with audio even when playback speed changes.
 */
export function useAlphaTab(
    containerRef: React.RefObject<HTMLDivElement | null>,
    { onActiveNotesChange, onScoreLoaded, onBarChange}: UseAlphaTabOptions = {}
) {
    const apiRef = useRef<AlphaTabApi | null>(null);
    const cachedNotesRef = useRef<CachedNote[]>([]);
    const wasEmptyRef = useRef(true); // used to clear cached notes
    const selectedTrackIndexRef = useRef<number>(0); // selected track index

    // Refs used for callbacks to not interrupt rAF
    const onActiveNotesChangeRef = useRef(onActiveNotesChange);
    const onScoreLoadedRef = useRef(onScoreLoaded);

    // Current bar tracking for upcoming note viz
    const currentBarIndexRef = useRef<number>(-1);
    const onBarChangeRef = useRef(onBarChange);

    const [isReady, setIsReady] = useState(false);
    const [tempo, setTempo] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        onBarChangeRef.current = onBarChange;
    }, [onBarChange]);

    useEffect(() => {
        onActiveNotesChangeRef.current = onActiveNotesChange;
    }, [onActiveNotesChange]);

    useEffect(() => {
        onScoreLoadedRef.current = onScoreLoaded;
    }, [onScoreLoaded]);

    useEffect(() => {
        if (!containerRef.current) return;

        // create default settings
        const settings = new Settings();
        // Overwrite partial settings
        settings.fillFromJson({
            core: { engine: "svg" },
            display: {
                resources: {mainGlyphColor: "#e5e5e5", secondaryGlyphColor: "#a3a3a3", scoreInfoColor: "#e5e5e5"} // TODO integrate with theme system
            },
            player: {
                playerMode: PlayerMode.EnabledAutomatic,
                enableCursor: true,
                enableUserInteraction: true, // needed for click-to-hear notes
                soundFont: "/soundfonts/sonivox.sf2",
            },
        });

        const api = new AlphaTabApi(containerRef.current, settings);
        apiRef.current = api;

        // Event listeners
        api.renderStarted.on(() => setIsReady(false));
        api.renderFinished.on(() => setIsReady(true));
        api.playerStateChanged.on((e) => setIsPlaying(e.state === 1 /* Playing */));
        // Fires when a score is loaded (e.g new song loaded)
        api.scoreLoaded.on((score) => {
            cachedNotesRef.current = [];
            onScoreLoadedRef.current?.(score);
        });
        // Error listener
        api.error.on((e) => console.error("alphaTab error:", e));

        // Fires whenever the set of currently-sounding beats changes during playback.
        // Only caches which notes are active + their bend curves.
        api.activeBeatsChanged.on((e) => {
            const notes: CachedNote[] = [];
            for (const beat of e.activeBeats) {
                if (beat.voice.bar.staff.track.index !== selectedTrackIndexRef.current) continue;
                for (const note of beat.notes) {
                    const bendPoints = note.bendPoints
                        ? parseAlphaTabBends(toSimpleBendPoints(note.bendPoints))
                        : [];

                    notes.push({
                        string: note.string,
                        fret: note.fret,
                        bendPoints,
                        hasVibrato: note.vibrato !== 0,
                        noteStartTick: beat.absolutePlaybackStart,
                        noteDuration: beat.playbackDuration,
                    });
                }
            }
            cachedNotesRef.current = notes;

            // Bar index is shared across tracks (bars align on the same timeline),
            // so any active beat tells us "which bar we're in" even if the selected
            // track itself is resting right now.
            const barIndex = e.activeBeats[0]?.voice?.bar?.index;
            if (barIndex == null || barIndex === currentBarIndexRef.current) return;
            currentBarIndexRef.current = barIndex;

            // Always fetch the bar from the SELECTED track's own staff, never from
            // whichever beat happened to trigger this event.
            const track = api.score?.tracks[selectedTrackIndexRef.current];
            const staff = track?.staves[0];
            const bar = staff?.bars[barIndex];
            const nextBar = staff?.bars[barIndex + 1];

            const currentBarNotes = bar ? collectBarNotes(bar) : [];
            const nextBarNotes = nextBar ? collectBarNotes(nextBar) : [];

            onBarChangeRef.current?.(barIndex, currentBarNotes, nextBarNotes);
        });

        // Click-to-hear: user clicks a note in the tab/notation view.
        api.noteMouseDown.on((note) => {
            api.playNote?.(note as never); // see note below
        });


        return () => {
            cachedNotesRef.current = [];
            api.destroy();
            apiRef.current = null;
        };
    }, []);

    // Render-time animation clock.
    useEffect(() => {
        let raf = 0;

        const tick = () => {
            const api = apiRef.current;

            if (api) {
                const currentTick = api.tickPosition;
                const cachedNotes = cachedNotesRef.current;
                if (cachedNotes.length > 0) {
                    wasEmptyRef.current = false;
                    const sampled: ActiveNote[] = new Array(cachedNotes.length);

                    for (let i = 0; i < cachedNotes.length; i++) {
                        const note = cachedNotes[i];
                        const progress = note.noteDuration > 0
                            ? (currentTick - note.noteStartTick) / note.noteDuration
                            : 0;
                        const bendSemitones = sampleBendSemitones(
                            note.bendPoints,
                            progress
                        );

                        // alphaTab's player exposes four vibrato variants.
                        // Only one visual default used here intentionally
                        const vibratoOffsetSemitones = note.hasVibrato
                            ? Math.sin(
                            (currentTick - note.noteStartTick) *
                            (Math.PI * 2 / VIBRATO_WAVELENGTH_TICKS)
                        ) * VIBRATO_AMPLITUDE_SEMITONES
                            : 0;

                        sampled[i] = {
                            string: note.string,
                            fret: note.fret,
                            bendSemitones,
                            vibrato: note.hasVibrato,
                            vibratoOffsetSemitones,
                            pitchOffsetSemitones:
                                bendSemitones + vibratoOffsetSemitones,
                        };
                    }
                    onActiveNotesChangeRef.current?.(sampled);
                } else if (!wasEmptyRef.current) {
                    wasEmptyRef.current = true;
                    onActiveNotesChangeRef.current?.([]);
                }
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);


    /**
     * Collects bar notes to array of BarNote
     * @param bar - current bar
     */
    function collectBarNotes(bar: any): BarNote[] {
        const notes: BarNote[] = [];
        bar.voices.forEach((voice: any) => {
            voice.beats.forEach((beat: any, beatIndex: number) => {
                if (beat.isRest) return; // rests have no notes but can leave stale entries
                beat.notes.forEach((note: any) => {
                    if (beat.voice.bar.staff.track.index !== selectedTrackIndexRef.current) return;
                    if (note.isDead) return;       // muted/percussive x notes
                    if (note.isTieDestination) return; // sustain of a previous note, not a new attack
                    notes.push({ string: note.string, fret: note.fret, role: "scale", beatIndex });
                });
            });
        });
        return notes;
    }

    /**
     * Loads file or url into the alphatab api
     * @param fileOrUrl
     */
    function loadFile(fileOrUrl: File | string | ArrayBuffer) {
        if (typeof fileOrUrl === "string" || fileOrUrl instanceof ArrayBuffer) {
            const ok = apiRef.current?.load(fileOrUrl);
            console.log("load returned:", ok);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const buffer = reader.result as ArrayBuffer;
            const ok = apiRef.current?.load(buffer);
            console.log("load(arrayBuffer) returned:", ok);
        };
        reader.onerror = () => console.error("FileReader failed:", reader.error);
        reader.readAsArrayBuffer(fileOrUrl);
    }

    /**
     * Renders music notation dynamically from an AlphaTex formatted string.
     *
     * @param text - The raw AlphaTex markup representing the score notation.
     */
    function loadAlphaTex(text: string) {
        apiRef.current?.tex(text);
    }

    /**
     * Toggles audio playback between playing and paused states.
     */
    function play() {
        apiRef.current?.playPause();
    }

    /**
     * Stops playback completely and resets the cursor to the start of the score.
     */
    function stop() {
        apiRef.current?.stop();
    }

    /**
     * Adjusts the playback speed multiplier in AlphaTab (e.g., 1.0 for normal, 0.5 for half speed).
     *
     * @param speed - The playback speed ratio.
     */
    function setPlaybackSpeed(speed: number) {
        if (apiRef.current) apiRef.current.playbackSpeed = speed;
    }

    /**
     * Switches the actively selected track and re-renders the notation display for that single track.
     *
     * @param index - The zero-based index of the target track in the score.
     */
    function setActiveTrackIndex(index: number) {
        selectedTrackIndexRef.current = index;
        currentBarIndexRef.current = -1; // force a re-fetch of bar notes for the new track

        // alphaTab should only render/consider this track
        const api = apiRef.current;
        if (api?.score) {
            api.renderTracks([api.score.tracks[index]]);
        }
    }

    /**
     * Mutes or unmutes audio output for a specific track.
     *
     * @param index - The zero-based index of the target track.
     * @param muted - `true` to silence the track, `false` to restore sound.
     */
    function setTrackMute(index: number, muted: boolean) {
        const track = apiRef.current?.score?.tracks[index];
        if (track) apiRef.current?.changeTrackMute([track], muted);
    }

    /**
     * Solos or unsolos a specific track during playback.
     *
     * @param index - The zero-based index of the target track.
     * @param solo - `true` to isolate this track's audio output, `false` to clear solo status.
     */
    function setTrackSolo(index: number, solo: boolean) {
        const track = apiRef.current?.score?.tracks[index];
        if (track) apiRef.current?.changeTrackSolo([track], solo);
    }

    /**
     * Adjusts the volume output level for a specific track.
     *
     * @param index - The zero-based index of the target track.
     * @param volume - Volume level multiplier (typically between 0.0 and 1.0).
     */
    function setTrackVolume(index: number, volume: number) {
        const track = apiRef.current?.score?.tracks[index];
        if (track) apiRef.current?.changeTrackVolume([track], volume);
    }

    /**
     * Sets a looping playback range based on zero-indexed bar (measure) indices.
     *
     * @param startBarIndex - The index of the bar where looping should begin.
     * @param endBarIndex - The index of the bar where looping should end (inclusive).
     */
    function setLoopRange(startBarIndex: number, endBarIndex: number) {
        const api = apiRef.current;
        // Guard against uninitialized API or unloaded score data
        if (!api?.score) return;
        // Retrieve the active track and its primary staff to extract bar timing details
        const track = api.score.tracks[selectedTrackIndexRef.current];
        const staff = track.staves[0];

        // Calculate the starting tick position of the first measure (defaults to 0 if invalid)
        const startTick = staff.bars[startBarIndex]?.masterBar.start ?? 0;
        // Calculate the ending tick position by adding measure duration to the measure's start tick
        const endBar = staff.bars[endBarIndex];
        const endTick = endBar ? endBar.masterBar.start + endBar.masterBar.calculateDuration() : undefined;

        // Apply tick range to AlphaTab and enable looping
        api.playbackRange = { startTick, endTick: endTick ?? startTick };
        api.isLooping = true;
    }

    /**
     * Clears any active looping range and restores full score playback.
     */
    function clearLoop() {
        const api = apiRef.current;
        if (!api) return;
        // Reset playback range and disable looping mode
        api.playbackRange = null;
        api.isLooping = false;
    }

    return {
        api: apiRef,
        isReady,
        isPlaying,
        tempo,
        setTempo,
        loadFile,
        loadAlphaTex,
        play,
        stop,
        setPlaybackSpeed,
        setActiveTrackIndex,
        setTrackMute,
        setTrackSolo,
        setTrackVolume,
        setLoopRange,
        clearLoop,
    };
}

const VIBRATO_AMPLITUDE_SEMITONES = 0.65;
const VIBRATO_WAVELENGTH_TICKS = 300;

function toSimpleBendPoints(
    points: ArrayLike<AlphaTabBendPoint> | Iterable<AlphaTabBendPoint>
): AlphaTabBendPoint[] {
    const result: AlphaTabBendPoint[] = [];

    for (const point of Array.from(points)) {
        result.push({
            offset: point.offset,
            value: point.value,
        });
    }

    return result;
}

