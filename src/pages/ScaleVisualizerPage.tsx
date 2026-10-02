import {ScaleDefinition} from "../types";
import {useEffect, useMemo, useState} from "react";
import {Fretboard} from "../components/Fretboard.tsx";
import {
    buildChordMap,
    buildScaleMap,
    buildTriadShapes,
    COMMON_CHORDS,
    COMMON_TRIADS,
    groupDotsByPosition
} from "../lib/scaleEngine.ts";
import {ScalePicker} from "../components/ScalePicker.tsx";
import {FretboardOptionsPicker} from "../components/FretboardOptionsPicker.tsx";
import {VisualizerModePicker} from "../components/VisualizerModePicker.tsx";
import {ChordPicker} from "../components/ChordPicker.tsx";
import {PositionPicker} from "../components/PositionPicker.tsx";


type VisualizerMode = "scale" | "triad" | "chord";

/**
 * Visualizes selected scales like A minor pentatonic on the fretboard
 * @constructor
 */
export function ScaleVisualizerPage() {
    const [mode, setMode] = useState<VisualizerMode>("scale");
    const [scale, setScale] = useState<ScaleDefinition>({ tonic: "A", scaleName: "minor pentatonic" });
    const [chordTonic, setChordTonic] = useState("A");
    const [chordSymbol, setChordSymbol] = useState("M");
    const [numFrets, setNumFrets] = useState(15);
    const [positionIndex, setPositionIndex] = useState(0);

    const allDots = useMemo(() => {
        if (mode === "scale") return buildScaleMap(scale);
        return buildChordMap({ tonic: chordTonic, symbol: chordSymbol });
    }, [mode, scale, chordTonic, chordSymbol]);

    // only chord/triad modes get split into positions.
    const positions = useMemo(() => {
        if (mode === "scale") return [allDots];
        if (mode === "triad") return buildTriadShapes({ tonic: chordTonic, symbol: chordSymbol });
        return groupDotsByPosition(allDots);
    }, [mode, allDots, chordTonic, chordSymbol]);



    // reset to position 0 whenever the underlying note set changes,
    // otherwise positionIndex can point past the end of a shorter list
    useEffect(() => setPositionIndex(0), [allDots]);

    const dots = positions[positionIndex] ?? [];


    const positionRange = useMemo(() => {
        if (dots.length === 0) return undefined;
        const frets = dots.map((d) => d.fret);
        return { minFret: Math.min(...frets), maxFret: Math.max(...frets) };
    }, [dots]);

    function handleModeChange(next: VisualizerMode) {
        setMode(next);
        if (next === "triad") setChordSymbol(COMMON_TRIADS[0]);
        if (next === "chord") setChordSymbol(COMMON_CHORDS[0]);
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <header className="flex items-center gap-6 border-b border-neutral-800 pb-3 flex-wrap">
                <h2 className="text-lg font-semibold">Scale Visualizer</h2>
                <VisualizerModePicker mode={mode} onChange={handleModeChange} />

                {mode === "scale" ? (
                    <ScalePicker scale={scale} onChange={setScale} />
                ) : (
                    <ChordPicker
                        tonic={chordTonic}
                        symbol={chordSymbol}
                        mode={mode}
                        onChange={(t, s) => { setChordTonic(t); setChordSymbol(s); }}
                    />
                )}

                <FretboardOptionsPicker numFrets={numFrets} onNumFretChange={setNumFrets} />

                {mode !== "scale" && (
                    <PositionPicker
                        positionIndex={positionIndex}
                        totalPositions={positions.length}
                        onChange={setPositionIndex}
                    />
                )}
            </header>
            <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                {mode == "scale" ?
                    <Fretboard passiveNotes={dots} activeNotes={[]} numFrets={numFrets} />
                     :
                <Fretboard passiveNotes={dots} activeNotes={[]} numFrets={numFrets} positionRange={positionRange} />
                }
            </section>
        </div>
    );
}
