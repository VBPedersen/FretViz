import {useEffect, useRef, useState} from "react";
import {AlphaTabApi, PlayerMode, type Settings} from "@coderline/alphatab";
import type {ActiveNote} from "../types";
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
    { onActiveNotesChange, onScoreLoaded }: UseAlphaTabOptions = {}
) {
    const apiRef = useRef<AlphaTabApi | null>(null);
    const cachedNotesRef = useRef<CachedNote[]>([]);
    // Refs used for callbacks to not interrupt rAF
    const onActiveNotesChangeRef = useRef(onActiveNotesChange);
    const onScoreLoadedRef = useRef(onScoreLoaded);

    const [isReady, setIsReady] = useState(false);
    const [tempo, setTempo] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        onActiveNotesChangeRef.current = onActiveNotesChange;
    }, [onActiveNotesChange]);

    useEffect(() => {
        onScoreLoadedRef.current = onScoreLoaded;
    }, [onScoreLoaded]);

    useEffect(() => {
        if (!containerRef.current) return;

        const settings = {
            core: { engine: "svg" },
            player: {
                playerMode: PlayerMode.EnabledAutomatic,
                enableCursor: true,
                enableUserInteraction: true, // needed for click-to-hear notes
                soundFont: "/soundfonts/sonivox.sf2",
            },
        } as Settings;

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
                }
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);



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

    function loadAlphaTex(text: string) {
        apiRef.current?.tex(text);
    }

    function play() {
        apiRef.current?.playPause();
    }

    function stop() {
        apiRef.current?.stop();
    }

    function setPlaybackSpeed(speed: number) {
        if (apiRef.current) apiRef.current.playbackSpeed = speed;
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

