import {useCallback, useEffect, useRef, useState} from "react";
import { useAlphaTab } from "../hooks/useAlphaTab";
import { Fretboard } from "../components/Fretboard";
import type {ActiveNote, FretDot, TabEntry} from "../types";
import {extractSongNotes} from "../lib/songNotes.ts";
import {getTab} from "../lib/db.ts";
import { useParams } from "react-router-dom";
import {TransportControls} from "../components/TransportControls.tsx";

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

    const onScoreLoaded = useCallback((score: unknown) => {
        setSongNotes(extractSongNotes(score));
    }, []);

    const onActiveNotesChange = useCallback((notes: ActiveNote[]) => {
        setActiveNotes(notes);
    }, []);

    const { loadFile, play, isPlaying, isReady, setPlaybackSpeed } = useAlphaTab(
        tabContainerRef,
        { onActiveNotesChange, onScoreLoaded }
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

    return (
        <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100 m-2">
            <h2 className="text-lg font-semibold">{song?.title ?? "Loading..."}</h2>
            <TransportControls
                isPlaying={isPlaying}
                isReady={isReady}
                onPlayPause={play}
                onSpeedChange={setPlaybackSpeed}
            />

            <main className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <Fretboard passiveNotes={songNotes} activeNotes={activeNotes} />
                </section>

                <section className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <div ref={tabContainerRef} className="min-h-[300px]" />
                </section>
            </main>
        </div>
    );
}
