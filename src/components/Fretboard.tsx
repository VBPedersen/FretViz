import { memo } from "react";
import type { ColoredPosition } from "../lib/scaleEngine.ts";
import type { ActiveNote, FretDot } from "../types";

interface FretboardProps {
	passiveNotes: FretDot[]; // current bar's notes
	upcomingNotes?: FretDot[]; // next bar, rendered ghosted
	activeNotes: ActiveNote[];
	allPositions?: ColoredPosition[];
	positionRange?: { minFret: number; maxFret: number };
	numFrets?: number;
	numStrings?: number;
	onFretClick?: (string: number, fret: number) => void;
}

const FRET_WIDTH = 60;
const STRING_HEIGHT = 30;
const MARGIN = 40;

// Visual pitch displacement. This is deliberately a visual scale, not a
// physical mapping between pitch and string spacing.
const PIXELS_PER_SEMITONE = 10;
const MAX_VISUAL_OFFSET = STRING_HEIGHT * 0.95;

// Frets with single or double marker inlays
const SINGLE_MARKER_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_MARKER_FRETS = [12, 24];

// TODO add input and change of numfrets and such, maybe in settings
// TODO add note characther (e.g. A or A#) to the dots (at least possible for scales), and some content on bottom half page

/**
 * Fretboard visualizer component, takes scale dots and possibly active notes to visualize current playback
 * @param passiveNotes - all notes to show as dots on fretboard currently
 * @param activeNotes - current active notes to highlight based on current playback
 * @param numFrets - number of frets to show
 * @param numStrings - number of strings to show
 * @param onFretClick - callback: what to do when clicking a note on fret
 * @constructor
 */
export const Fretboard = memo(function Fretboard({
	passiveNotes,
	activeNotes,
	allPositions,
	positionRange,
	numFrets = 21,
	numStrings = 6,
	onFretClick,
	upcomingNotes,
}: FretboardProps) {
	const width = MARGIN * 2 + numFrets * FRET_WIDTH;
	const height = MARGIN * 2 + (numStrings - 1) * STRING_HEIGHT;

	const centerY = MARGIN + ((numStrings - 1) * STRING_HEIGHT) / 2;

	return (
		<svg
			viewBox={`0 0 ${width} ${height}`}
			width="100%"
			role="img"
			aria-label="Fretboard"
			style={{ overflow: "visible" }}
		>
			{positionRange && (
				<rect
					x={fretXPosition(positionRange.minFret) - FRET_WIDTH / 2}
					y={MARGIN - 10}
					width={
						fretXPosition(positionRange.maxFret) -
						fretXPosition(positionRange.minFret) +
						FRET_WIDTH
					}
					height={height - MARGIN * 2 + 20}
					fill="var(--active-color)"
					opacity={0.06}
					rx={8}
				/>
			)}

			<StaticFretboard
				numFrets={numFrets}
				numStrings={numStrings}
				width={width}
				height={height}
				centerY={centerY}
			/>

			{allPositions ? (
				<MultiPositionLayer
					groups={allPositions}
					numStrings={numStrings}
					onFretClick={onFretClick}
				/>
			) : (
				<PassiveNotesLayer
					passiveNotes={passiveNotes}
					numStrings={numStrings}
					onFretClick={onFretClick}
				/>
			)}

			{upcomingNotes && upcomingNotes.length > 0 && (
				<UpcomingNotesLayer
					upcomingNotes={upcomingNotes}
					numStrings={numStrings}
					onFretClick={onFretClick}
				/>
			)}

			<ActiveNotesLayer
				activeNotes={activeNotes}
				numStrings={numStrings}
				onFretClick={onFretClick}
			/>
		</svg>
	);
});

interface StaticFretboardProps {
	numFrets: number;
	numStrings: number;
	width: number;
	height: number;
	centerY: number;
}

const StaticFretboard = memo(function StaticFretboard({
	numFrets,
	numStrings,
	width,
	height,
	centerY,
}: StaticFretboardProps) {
	return (
		<>
			{/* Fret inlays and labels */}
			{Array.from({ length: numFrets }, (_, i) => {
				const fret = i + 1;
				const fretX = fretXPosition(fret);
				const isSingle = SINGLE_MARKER_FRETS.includes(fret);
				const isDouble = DOUBLE_MARKER_FRETS.includes(fret);

				return (
					<g key={`inlay-${fret}`}>
						{isSingle && (
							<circle
								cx={fretX}
								cy={centerY}
								r={6}
								fill="var(--fret-marker, rgba(255, 255, 255, 0.15))"
							/>
						)}

						{isDouble && (
							<>
								<circle
									cx={fretX}
									cy={stringY(2.5, numStrings)}
									r={6}
									fill="var(--fret-marker, rgba(255, 255, 255, 0.15))"
								/>
								<circle
									cx={fretX}
									cy={stringY(numStrings - 1.5, numStrings)}
									r={6}
									fill="var(--fret-marker, rgba(255, 255, 255, 0.15))"
								/>
							</>
						)}

						<text
							x={fretX}
							y={height - MARGIN / 4}
							textAnchor="middle"
							dominantBaseline="middle"
							fill="var(--fret-text, #9ca3af)"
							fontSize="11"
							fontWeight="600"
							style={{ userSelect: "none" }}
						>
							{fret}
						</text>
					</g>
				);
			})}

			{/* Fret lines */}
			{Array.from({ length: numFrets + 1 }, (_, fret) => (
				<line
					key={`fret-${fret}`}
					x1={MARGIN + fret * FRET_WIDTH}
					y1={MARGIN}
					x2={MARGIN + fret * FRET_WIDTH}
					y2={height - MARGIN}
					stroke="var(--fret-line)"
					strokeWidth={fret === 0 ? 4 : 1}
				/>
			))}

			{/* Guitar strings */}
			{Array.from({ length: numStrings }, (_, i) => {
				const stringNum = i + 1;

				return (
					<line
						key={`string-${stringNum}`}
						x1={MARGIN}
						y1={stringY(stringNum, numStrings)}
						x2={width - MARGIN}
						y2={stringY(stringNum, numStrings)}
						stroke="var(--string-line)"
						strokeWidth={1 + (numStrings - stringNum) * 0.3}
					/>
				);
			})}
		</>
	);
});

interface PassiveNotesLayerProps {
	passiveNotes: FretDot[];
	numStrings: number;
	onFretClick?: (string: number, fret: number) => void;
}

const PassiveNotesLayer = memo(function PassiveNotesLayer({
	passiveNotes,
	numStrings,
	onFretClick,
}: PassiveNotesLayerProps) {
	// Rendering only actual scale dots avoids the old O(strings * frets)
	// lookup/render loop. The fretboard itself remains static SVG.
	return (
		<g aria-label="Scale notes">
			{passiveNotes.map((dot) => {
				const key = noteKey(dot.string, dot.fret);

				return (
					<g
						key={key}
						onClick={() => onFretClick?.(dot.string, dot.fret)}
						style={{
							cursor: onFretClick ? "pointer" : "default",
						}}
					>
						<circle
							cx={fretXPosition(dot.fret)}
							cy={stringY(dot.string, numStrings)}
							r={12}
							fill="transparent"
						/>
						<circle
							cx={fretXPosition(dot.fret)}
							cy={stringY(dot.string, numStrings)}
							r={8}
							fill={
								dot.role === "root" ? "var(--root-color)" : "var(--scale-color)"
							}
						/>
					</g>
				);
			})}
		</g>
	);
});

interface UpcomingNotesLayerProps {
	upcomingNotes: FretDot[];
	numStrings: number;
	onFretClick?: (string: number, fret: number) => void;
}

const UpcomingNotesLayer = memo(function UpcomingNotesLayer({
	upcomingNotes,
	numStrings,
	onFretClick,
}: UpcomingNotesLayerProps) {
	// lookup/render loop. The fretboard itself remains static SVG.
	return (
		<g aria-label="Upcoming notes" opacity={0.28}>
			{upcomingNotes.map((dot) => {
				const key = noteKey(dot.string, dot.fret);

				return (
					<g
						key={key}
						onClick={() => onFretClick?.(dot.string, dot.fret)}
						style={{ cursor: onFretClick ? "pointer" : "default" }}
					>
						<circle
							cx={fretXPosition(dot.fret)}
							cy={stringY(dot.string, numStrings)}
							r={12}
							fill="transparent"
						/>
						<circle
							cx={fretXPosition(dot.fret)}
							cy={stringY(dot.string, numStrings)}
							r={8}
							fill="var(--upcoming-color)"
							stroke={
								dot.role === "root" ? "var(--root-color)" : "var(--scale-color)"
							}
							strokeWidth={1.5}
						/>
					</g>
				);
			})}
		</g>
	);
});

interface ActiveNotesLayerProps {
	activeNotes: ActiveNote[];
	numStrings: number;
	onFretClick?: (string: number, fret: number) => void;
}

const ActiveNotesLayer = memo(function ActiveNotesLayer({
	activeNotes,
	numStrings,
	onFretClick,
}: ActiveNotesLayerProps) {
	return (
		<g aria-label="Currently playing notes">
			{activeNotes.map((note) => {
				const key = noteKey(note.string, note.fret);
				const active = note;
				const baseY = stringY(note.string, numStrings);
				const pitchOffset = clamp(
					active.pitchOffsetSemitones ?? active.bendSemitones ?? 0,
					-MAX_VISUAL_OFFSET / PIXELS_PER_SEMITONE,
					MAX_VISUAL_OFFSET / PIXELS_PER_SEMITONE,
				);

				const animatedY = baseY + pitchOffset * PIXELS_PER_SEMITONE;
				const vibratoAmount = Math.abs(active.vibratoOffsetSemitones ?? 0);
				const hasBend = Math.abs(active.bendSemitones ?? 0) > 0.001;
				const hasVibrato = active.vibrato === true;

				return (
					<g
						key={key}
						onClick={() => onFretClick?.(active.string, active.fret)}
						style={{
							cursor: onFretClick ? "pointer" : "default",
						}}
					>
						{/* A thin connector makes larger bends readable. */}
						{hasBend && (
							<line
								x1={fretXPosition(active.fret)}
								y1={baseY}
								x2={fretXPosition(active.fret)}
								y2={animatedY}
								stroke="var(--active-color)"
								strokeWidth={2}
								strokeLinecap="round"
								opacity={0.28}
							/>
						)}

						{/* Large transparent hit target */}
						<circle
							cx={fretXPosition(active.fret)}
							cy={animatedY}
							r={16}
							fill="transparent"
						/>

						{/* Soft halo */}
						<circle
							cx={fretXPosition(active.fret)}
							cy={animatedY}
							r={hasVibrato ? 13 + vibratoAmount * 2 : 13}
							fill="none"
							stroke="var(--active-color)"
							strokeWidth={2}
							opacity={hasVibrato ? 0.32 : 0.2}
							style={{ animation: "pulse-ring 0.6s ease-out infinite" }}
						/>

						{/* Active note */}
						<circle
							cx={fretXPosition(active.fret)}
							cy={animatedY}
							r={10}
							fill="var(--active-color)"
							opacity={1}
						/>

						{/* Tiny highlight keeps the dot readable on dark themes. */}
						<circle
							cx={fretXPosition(active.fret) - 2.5}
							cy={animatedY - 2.5}
							r={2.5}
							fill="rgba(255, 255, 255, 0.75)"
							pointerEvents="none"
						/>
					</g>
				);
			})}
		</g>
	);
});

function fretXPosition(fret: number): number {
	return fret === 0 ? MARGIN / 2 : MARGIN + (fret - 0.5) * FRET_WIDTH;
}

function stringY(stringNum: number, numStrings: number): number {
	return MARGIN + (numStrings - stringNum) * STRING_HEIGHT;
}

function noteKey(stringNum: number, fret: number): string {
	return `${stringNum}-${fret}`;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

interface MultiPositionLayerProps {
	groups: ColoredPosition[];
	numStrings: number;
	onFretClick?: (string: number, fret: number) => void;
}

const MultiPositionLayer = memo(function MultiPositionLayer({
	groups,
	numStrings,
	onFretClick,
}: MultiPositionLayerProps) {
	const merged = new Map<
		string,
		{ string: number; fret: number; colors: string[]; isRoot: boolean }
	>();

	groups.forEach((group) => {
		group.dots.forEach((dot) => {
			const key = `${dot.string}-${dot.fret}`;
			const existing = merged.get(key);
			if (existing) {
				existing.colors.push(group.color);
				existing.isRoot = existing.isRoot || dot.role === "root";
			} else {
				merged.set(key, {
					string: dot.string,
					fret: dot.fret,
					colors: [group.color],
					isRoot: dot.role === "root",
				});
			}
		});
	});

	return (
		<g aria-label="All positions">
			{Array.from(merged.values()).map((spot) => {
				const cx = fretXPosition(spot.fret);
				const cy = stringY(spot.string, numStrings);
				const key = noteKey(spot.string, spot.fret);
				const r = spot.isRoot ? 9 : 7;

				return (
					<g
						key={key}
						onClick={() => onFretClick?.(spot.string, spot.fret)}
						style={{ cursor: onFretClick ? "pointer" : "default" }}
					>
						<circle cx={cx} cy={cy} r={12} fill="transparent" />

						{spot.colors.length === 1 ? (
							<circle cx={cx} cy={cy} r={r} fill={spot.colors[0]} />
						) : (
							<PieDot cx={cx} cy={cy} r={r} colors={spot.colors} />
						)}

						{/* root notes get a ring on top regardless of color, so root is always identifiable */}
						{spot.isRoot && (
							<circle
								cx={cx}
								cy={cy}
								r={r + 2.5}
								fill="none"
								stroke="white"
								strokeWidth={1.5}
								opacity={0.8}
							/>
						)}
					</g>
				);
			})}
		</g>
	);
});

function PieDot({
	cx,
	cy,
	r,
	colors,
}: {
	cx: number;
	cy: number;
	r: number;
	colors: string[];
}) {
	const slice = 360 / colors.length;
	return (
		<>
			{colors.map((color, i) => (
				<path
					key={i}
					d={describeWedge(cx, cy, r, i * slice, (i + 1) * slice)}
					fill={color}
				/>
			))}
		</>
	);
}

function describeWedge(
	cx: number,
	cy: number,
	r: number,
	startAngle: number,
	endAngle: number,
): string {
	const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
	const start = {
		x: cx + r * Math.cos(toRad(startAngle)),
		y: cy + r * Math.sin(toRad(startAngle)),
	};
	const end = {
		x: cx + r * Math.cos(toRad(endAngle)),
		y: cy + r * Math.sin(toRad(endAngle)),
	};
	const largeArc = endAngle - startAngle > 180 ? 1 : 0;
	return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}
