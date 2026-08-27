import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useAlphaTab } from "../hooks/useAlphaTab";
import { Fretboard } from "../components/Fretboard";
import type {ActiveNote, BarNote, FretDot, TabEntry} from "../types";
import {extractSongNotes, getFretRange} from "../lib/songNotes.ts";
import {getTab} from "../lib/db.ts";
import { useParams } from "react-router-dom";
import {TransportControls} from "../components/TransportControls.tsx";
import {useKeyBindings} from "../hooks/useKeyBindings.ts";
import {TrackSidebar} from "../components/TrackSidebar.tsx";
import {gmProgramToInstrument} from "../lib/midiInstruments.ts";


interface TrackRowState {
    index: number;
    name: string;
    muted: boolean;
    solo: boolean;
    volume: number;
}


/**
 * Page for playing a song, has fretboard visualization and music sheet
 * @constructor
 */
export function PlayerPage() {
    const { songId } = useParams<{ songId: string }>();
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
    const [songNotes, setSongNotes] = useState<FretDot[]>([]);
    const [song, setSong] = useState<TabEntry | null>(null);
    const scoreRef = useRef<unknown>(null); // ref to actual score

    const [tracks, setTracks] = useState<TrackRowState[]>([]);
    const [selectedTrack, setSelectedTrack] = useState(0); // track index, default is 0

    const [currentBarIndex, setCurrentBarIndex] = useState(0);
    const [currentBarNotes, setCurrentBarNotes] = useState<FretDot[]>([]);
    const [upcomingNotes, setUpcomingNotes] = useState<FretDot[]>([]);

    // Speed controls
    const [speed, setSpeed] = useState(1);
    function handleSpeedChange(v: number) {
        setSpeed(v);
        setPlaybackSpeed(v);
    }

    const numFrets = useMemo(() => getFretRange(songNotes), [songNotes]);

    // per-bar pass, drives what's drawn on the fretboard
    const onBarChange = useCallback((barIndex: number,cur: BarNote[], next: BarNote[]) => {
        setCurrentBarIndex(barIndex);
        setCurrentBarNotes(cur);
        setUpcomingNotes(next);
    }, []);

    // whole-song pass, needed for numFrets
    const onScoreLoaded = useCallback((score: unknown) => {
        scoreRef.current = score;
        //load tracks from score
        const s = score as {
            tracks: {
                name?: string;
                playbackInfo?: { program: number; primaryChannel?: number };
            }[];
        };
        console.log(JSON.stringify(s.tracks.map(t => t.playbackInfo), null, 2));
        const trackList: TrackRowState[] = (s.tracks ?? []).map((t, i) => ({
            index: i,
            name: t.name?.trim() || `Track ${i + 1}`,
            muted: false,
            solo: false,
            volume: 1,
            instrument: gmProgramToInstrument(
                t.playbackInfo?.program ?? 0,
                t.playbackInfo?.primaryChannel ?? -1
            ),
        }));

        setTracks(trackList);
        setSelectedTrack(0); // reset selected track per song
        setSongNotes(extractSongNotes(score, 0)); // extract song notes from score
    }, []);

    const onActiveNotesChange = useCallback((notes: ActiveNote[]) => {
        setActiveNotes(notes);
    }, []);

    const { loadFile, play, stop, isPlaying, isReady, setPlaybackSpeed,
        setActiveTrackIndex, setLoopRange, setTrackVolume,
        setTrackMute, setTrackSolo } = useAlphaTab(
        tabContainerRef,
        { onActiveNotesChange, onScoreLoaded, onBarChange }
    );

    useEffect(() => {
        if (!songId) return;
        getTab(songId).then((entry) => {
            if (!entry) return;
            setSong(entry);
            if (entry.content instanceof ArrayBuffer) {
                loadFile(entry.content);
            }
        });
    }, [songId]);

    /**
     * Function to handle the track change by user
     * @param index
     */
    function handleTrackSelect(index: number) {
        setSelectedTrack(index);
        setActiveTrackIndex(index);
        if (scoreRef.current) setSongNotes(extractSongNotes(scoreRef.current, index));
    }


    function handleMuteToggle(index: number) {
        setTracks((prev) => prev.map((t) => {
            if (t.index !== index) return t;
            const muted = !t.muted;
            setTrackMute(index, muted);
            return { ...t, muted };
        }));
    }

    function handleSoloToggle(index: number) {
        setTracks((prev) => prev.map((t) => {
            if (t.index !== index) return t;
            const solo = !t.solo;
            setTrackSolo(index, solo);
            return { ...t, solo };
        }));
    }

    function handleVolumeChange(index: number, volume: number) {
        setTracks((prev) => prev.map((t) => (t.index === index ? { ...t, volume } : t)));
        setTrackVolume(index, volume);
    }

    // LOOPS
    const [loop, setLoop] = useState<{ start: number; end: number } | null>(null);

    /**
     * Initializes and activates a custom loop range.
     *
     * @param start - The starting bar index (0-indexed).
     * @param end - The ending bar index (0-indexed, inclusive).
     */
    function startLoop(start: number, end: number) {
        // Update local React state to keep track of active loop bounds
        setLoop({ start, end });
        // Update the AlphaTab engine with the new tick bounds
        setLoopRange(start, end);
    }

    /**
     * Extends or shrinks the current loop boundary by adding a delta to the end bar.
     *
     * @param delta - The number of measures to shift the end boundary (positive to expand, negative to shrink).
     */
    function extendLoop(delta: number) {
        // Do nothing if no loop is currently active
        if (!loop) return;
        // Calculate updated loop coordinates based on existing state
        const next = { ...loop, end: loop.end + delta };
        // Sync updated loop boundaries across React state and the AlphaTab instance
        setLoop(next);
        setLoopRange(next.start, next.end);
    }

    // Setup keybindings
    useKeyBindings({
        playPause: play,
        playPauseDouble: () => startLoop(currentBarIndex, currentBarIndex), // loop current bar
        loopExtendRight: () => extendLoop(1),
        loopExtendLeft: () => extendLoop(-1),
    });

    return (
        <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100 p-2">
            <h2 className="text-lg font-semibold">{song?.title ?? "Loading..."}</h2>

            <TransportControls
                isPlaying={isPlaying}
                isReady={isReady}
                onPlayPause={play}
                onSpeedChange={handleSpeedChange}
                onStop={stop}
                speed={speed}
            />
            <div className="flex flex-1 overflow-hidden">
                <main className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                    <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                        <Fretboard
                            passiveNotes={currentBarNotes}
                            upcomingNotes={upcomingNotes}
                            activeNotes={activeNotes}
                            numFrets={numFrets}
                        />
                    </section>

                    <section className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                        <div ref={tabContainerRef} className="min-h-[300px]" />
                    </section>
                </main>

                <TrackSidebar
                    tracks={tracks}
                    selectedIndex={selectedTrack}
                    onSelect={handleTrackSelect}
                    onMuteToggle={handleMuteToggle}
                    onSoloToggle={handleSoloToggle}
                    onVolumeChange={handleVolumeChange}
                />
            </div>
        </div>
    );
}
