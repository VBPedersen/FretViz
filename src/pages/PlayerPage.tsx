import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useAlphaTab } from "../hooks/useAlphaTab";
import { Fretboard } from "../components/Fretboard";
import type {ActiveNote, BarNote, FretDot, TabEntry} from "../types";
import {extractSongNotes, getFretRange} from "../lib/songNotes.ts";
import {getTab} from "../lib/db.ts";
import { useParams } from "react-router-dom";
import {TransportControls} from "../components/TransportControls.tsx";
import {TrackPicker} from "../components/TrackPicker.tsx";

interface TrackInfo {
    index: number;
    name: string;
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
    const [tracks, setTracks] = useState<TrackInfo[]>([]);
    const [selectedTrack, setSelectedTrack] = useState(0); // track index, default is 0
    const scoreRef = useRef<unknown>(null); // ref to actual score

    const [currentBarNotes, setCurrentBarNotes] = useState<FretDot[]>([]);
    const [upcomingNotes, setUpcomingNotes] = useState<FretDot[]>([]);

    const numFrets = useMemo(() => getFretRange(songNotes), [songNotes]);

    // per-bar pass, drives what's drawn on the fretboard
    const onBarChange = useCallback((cur: BarNote[], next: BarNote[]) => {
        setCurrentBarNotes(cur);
        setUpcomingNotes(next);
    }, []);

    // whole-song pass, needed for numFrets
    const onScoreLoaded = useCallback((score: unknown) => {
        scoreRef.current = score;
        //load tracks from score
        const s = score as { tracks: { name?: string }[] };
        const trackList = (s.tracks ?? []).map((t, i) => ({
            index: i,
            name: t.name?.trim() || `Track ${i + 1}`,
        }));
        setTracks(trackList);
        setSelectedTrack(0); // reset selected track per song
        setSongNotes(extractSongNotes(score, 0)); // extract song notes from score
    }, []);

    const onActiveNotesChange = useCallback((notes: ActiveNote[]) => {
        setActiveNotes(notes);
    }, []);

    const { loadFile, play, isPlaying, isReady, setPlaybackSpeed, setActiveTrackIndex  } = useAlphaTab(
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
    function handleTrackChange(index: number) {
        setSelectedTrack(index);
        setActiveTrackIndex(index);
        if (scoreRef.current) {
            setSongNotes(extractSongNotes(scoreRef.current, index));
        }
    }

    return (
        <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100 m-2">
            <h2 className="text-lg font-semibold">{song?.title ?? "Loading..."}</h2>
            <div className="flex items-center gap-4">
                <TransportControls
                    isPlaying={isPlaying}
                    isReady={isReady}
                    onPlayPause={play}
                    onSpeedChange={setPlaybackSpeed}
                />
                <TrackPicker
                    tracks={tracks}
                    selectedIndex={selectedTrack}
                    onChange={handleTrackChange}
                />
            </div>

            <main className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <Fretboard passiveNotes={currentBarNotes} upcomingNotes={upcomingNotes} activeNotes={activeNotes} numFrets={numFrets}/>
                </section>

                <section className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <div ref={tabContainerRef} className="min-h-[300px]" />
                </section>
            </main>
        </div>
    );
}
