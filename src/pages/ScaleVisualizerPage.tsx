import { useEffect, useMemo, useState } from "react";
import { ChordPicker } from "../components/ChordPicker.tsx";
import { Fretboard } from "../components/Fretboard.tsx";
import { FretboardOptionsPicker } from "../components/FretboardOptionsPicker.tsx";
import { PositionPicker } from "../components/PositionPicker.tsx";
import { ScalePicker } from "../components/ScalePicker.tsx";
import { TuningPicker } from "../components/TuningPicker.tsx";
import { VisualizerModePicker } from "../components/VisualizerModePicker.tsx";
import {
	buildChordMap,
	buildScaleMap,
	buildTriadShapes,
	COMMON_CHORDS,
	COMMON_TRIADS,
	colorizePositions,
	groupDotsByPosition,
} from "../lib/scaleEngine.ts";
import { TUNING_PRESETS, type TuningPreset } from "../lib/tunings.ts";
import type { ScaleDefinition } from "../types";

type VisualizerMode = "scale" | "triad" | "chord";

/**
 * Visualizes selected scales like A minor pentatonic on the fretboard
 * @constructor
 */
export function ScaleVisualizerPage() {
	const [mode, setMode] = useState<VisualizerMode>("scale");
	const [scale, setScale] = useState<ScaleDefinition>({
		tonic: "A",
		scaleName: "minor pentatonic",
	});
	const [tuning, setTuning] = useState<TuningPreset>(
		// finds "Standard" tuning, else select first in preset array
		() =>
			TUNING_PRESETS.find((t) => t.name === "Standard") ?? TUNING_PRESETS[0],
	);
	const [chordTonic, setChordTonic] = useState("A");
	const [chordSymbol, setChordSymbol] = useState("M");
	const [numFrets, setNumFrets] = useState(15);
	const [positionIndex, setPositionIndex] = useState(0);
	const [showAll, setShowAll] = useState(false);

	const allDots = useMemo(() => {
		if (mode === "scale") return buildScaleMap(scale, tuning.notes);
		return buildChordMap(
			{ tonic: chordTonic, symbol: chordSymbol },
			tuning.notes,
		);
	}, [mode, scale, chordTonic, chordSymbol, tuning]);

	// only chord/triad modes get split into positions.
	const positions = useMemo(() => {
		if (mode === "scale") return [allDots];
		if (mode === "triad")
			return buildTriadShapes(
				{ tonic: chordTonic, symbol: chordSymbol },
				tuning.notes,
			);
		return groupDotsByPosition(allDots);
	}, [mode, allDots, chordTonic, chordSymbol, tuning.notes]);

	// reset to position 0 whenever the underlying note set changes,
	// otherwise positionIndex can point past the end of a shorter list
	// biome-ignore lint/correctness/useExhaustiveDependencies: Point is to react to alldots change
	useEffect(() => setPositionIndex(0), [allDots]);

	const dots = positions[positionIndex] ?? [];

	const coloredPositions = useMemo(
		() => (showAll ? colorizePositions(positions) : []),
		[showAll, positions],
	);

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

	const handleTuningChange = (name: string) => {
		const selected = TUNING_PRESETS.find((t) => t.name === name);
		if (selected) {
			setTuning(selected);
		}
	};

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
						onChange={(t, s) => {
							setChordTonic(t);
							setChordSymbol(s);
						}}
					/>
				)}

				<TuningPicker tuning={tuning.name} onChange={handleTuningChange} />

				<FretboardOptionsPicker
					numFrets={numFrets}
					onNumFretChange={setNumFrets}
				/>

				{mode !== "scale" && (
					<>
						<button
							type={"button"}
							onClick={() => setShowAll((v) => !v)}
							className={`px-3 py-1 text-sm rounded ${showAll ? "bg-pink-600 text-white" : "bg-neutral-800 text-neutral-400"}`}
						>
							{showAll ? "Showing All" : "Show All"}
						</button>
						{!showAll && (
							<PositionPicker
								positionIndex={positionIndex}
								totalPositions={positions.length}
								onChange={setPositionIndex}
							/>
						)}
					</>
				)}
			</header>
			<section className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
				{mode === "scale" ? (
					<Fretboard passiveNotes={dots} activeNotes={[]} numFrets={numFrets} />
				) : (
					// <Fretboard passiveNotes={dots} activeNotes={[]} numFrets={numFrets} positionRange={positionRange} />

					<Fretboard
						passiveNotes={dots}
						allPositions={showAll ? coloredPositions : undefined}
						activeNotes={[]}
						numFrets={numFrets}
						positionRange={positionRange}
					/>
				)}

				{showAll && (
					<div className="flex gap-3 flex-wrap text-xs text-neutral-400">
						{coloredPositions.map((g) => (
							<span key={g.label} className="flex items-center gap-1">
								<span
									className="w-3 h-3 rounded-full inline-block"
									style={{ background: g.color }}
								/>
								{g.label}
							</span>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
