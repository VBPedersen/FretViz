import {ScaleDefinition} from "../types";
import {useState} from "react";
import {Fretboard} from "../components/Fretboard.tsx";
import {buildScaleMap} from "../lib/scaleEngine.ts";
import {ScalePicker} from "../components/ScalePicker.tsx";
import {FretboardOptionsPicker} from "../components/FretboardOptionsPicker.tsx";

// TODO add

/**
 * Visualizes selected scales like A minor pentatonic on the fretboard
 * @constructor
 */
export function ScaleVisualizerPage() {
    const [scale, setScale] = useState<ScaleDefinition>({
        tonic: "A",
        scaleName: "minor pentatonic",
    });
    const [numFrets, setNumFrets] = useState(15);


    const scaleDots = buildScaleMap(scale);

    return (
        <div className="flex flex-col gap-4 p-4">
            <header className="flex items-center gap-6 border-b border-neutral-800 pb-3">
                <h2 className="text-lg font-semibold">Scale Visualizer</h2>
                <ScalePicker scale={scale} onChange={setScale} />
                <FretboardOptionsPicker numFrets={numFrets} onNumFretChange={setNumFrets} />
            </header>
            <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                <Fretboard passiveNotes={scaleDots} activeNotes={[]} numFrets={numFrets} />
            </section>
        </div>
    );
}
