import { useCallback, useRef, useState } from "react";
import { useAlphaTab } from "../hooks/useAlphaTab";
import { Fretboard } from "../components/Fretboard";
import { Toolbar } from "../components/Toolbar";
import { buildScaleMap } from "../lib/scaleEngine";
import type { ActiveNote, ScaleDefinition } from "../types";

export function HomePage() {
    const tabContainerRef = useRef<HTMLDivElement>(null);
    const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
    const [scale, setScale] = useState<ScaleDefinition>({
        tonic: "A",
        scaleName: "minor pentatonic",
    });

    const onActiveNotesChange = useCallback((notes: ActiveNote[]) => {
        setActiveNotes(notes);
    }, []);

    const { loadFile, play, isPlaying, isReady, setPlaybackSpeed } = useAlphaTab(
        tabContainerRef,
        { onActiveNotesChange }
    );

    const scaleDots = buildScaleMap(scale);

    return (
        <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100">
            <Toolbar
                isPlaying={isPlaying}
                isReady={isReady}
                scale={scale}
                onPlayPause={play}
                onScaleChange={setScale}
                onSpeedChange={setPlaybackSpeed}
                onFileUpload={loadFile}
            />

            <main className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <Fretboard scaleDots={scaleDots} activeNotes={activeNotes} />
                </section>

                <section className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <div ref={tabContainerRef} className="min-h-[300px]" />
                </section>
            </main>
        </div>
    );
}
