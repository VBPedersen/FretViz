import {useEffect, useRef, useState} from "react";
import {AlphaTabApi, PlayerMode, type Settings} from "@coderline/alphatab";
import type {ActiveNote} from "../types";

interface UseAlphaTabOptions {
    onActiveNotesChange?: (notes: ActiveNote[]) => void;
    onScoreLoaded?: (score: unknown) => void;
}

/**
 * Wraps AlphaTab's API in a React-friendly hook.
 *
 * alphaTab tells indicates which notes are sounding
 * at the current playback position via the active Beat objects.
 * `playedBeatChanged` fires with the beat(s) currently audible; each
 * Beat has `.notes[]`, and each Note has `.string` / `.fret` already
 * populated from the parsed file.
 */
export function useAlphaTab(
    containerRef: React.RefObject<HTMLDivElement | null>,
    { onActiveNotesChange, onScoreLoaded }: UseAlphaTabOptions = {}
) {
    const apiRef = useRef<AlphaTabApi | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [tempo, setTempo] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);

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

        api.renderStarted.on(() => setIsReady(false));
        api.renderFinished.on(() => setIsReady(true));

        api.playerStateChanged.on((e) => setIsPlaying(e.state === 1 /* Playing */));

        // Fires when a score is loaded (e.g new song loaded)
        api.scoreLoaded.on((score) => {
            onScoreLoaded?.(score);
        });

        // Fires whenever the set of currently-sounding beats changes during playback.
        api.activeBeatsChanged.on((e) => {
            const notes: ActiveNote[] = [];
            for (const beat of e.activeBeats) {
                for (const note of beat.notes) {
                    notes.push({ string: note.string, fret: note.fret });
                }
            }
            onActiveNotesChange?.(notes);
        });

        // Click-to-hear: user clicks a note in the tab/notation view.
        api.noteMouseDown.on((note) => {
            api.playNote?.(note as never); // see note below
        });

        // Error listeners
        api.error.on((e) => console.error("alphaTab error:", e));

        return () => {
            api.destroy();
            apiRef.current = null;
        };
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