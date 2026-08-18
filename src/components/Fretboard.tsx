import { useMemo } from "react";
import type { ActiveNote, FretDot } from "../types";

interface FretboardProps {
    scaleDots: FretDot[];
    activeNotes: ActiveNote[];
    numFrets?: number;
    numStrings?: number;
    onFretClick?: (string: number, fret: number) => void;
}

const FRET_WIDTH = 60;
const STRING_HEIGHT = 30;
const MARGIN = 40;

// Frets with single or double marker inlays
const SINGLE_MARKER_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_MARKER_FRETS = [12, 24];

export function Fretboard({
                              scaleDots,
                              activeNotes,
                              numFrets = 21,
                              numStrings = 6,
                              onFretClick,
                          }: FretboardProps) {
    const width = MARGIN * 2 + numFrets * FRET_WIDTH;
    const height = MARGIN * 2 + (numStrings - 1) * STRING_HEIGHT;

    const activeSet = useMemo(
        () => new Set(activeNotes.map((n) => `${n.string}-${n.fret}`)),
        [activeNotes]
    );

    const dotByKey = useMemo(() => {
        const map = new Map<string, FretDot>();
        for (const dot of scaleDots) map.set(`${dot.string}-${dot.fret}`, dot);
        return map;
    }, [scaleDots]);

    function x(fret: number) {
        return fret === 0 ? MARGIN / 2 : MARGIN + (fret - 0.5) * FRET_WIDTH;
    }
    function y(stringNum: number) {
        return MARGIN + (numStrings - stringNum) * STRING_HEIGHT;
    }

    // Midpoint Y for single fret markers (center of the fretboard)
    const centerY = MARGIN + ((numStrings - 1) * STRING_HEIGHT) / 2;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Fretboard">
            {/* ------------------------------------------------------------------- */}
            {/* LAYER 1: FRET INLAY MARKERS & NUMBERS (Drawn underneath everything) */}
            {/* ------------------------------------------------------------------- */}
            {Array.from({ length: numFrets }, (_, i) => {
                const fret = i + 1;
                const fretX = x(fret);
                const isSingle = SINGLE_MARKER_FRETS.includes(fret);
                const isDouble = DOUBLE_MARKER_FRETS.includes(fret);

                return (
                    <g key={`inlay-${fret}`}>
                        {/* Single Inlay Circle */}
                        {isSingle && (
                            <circle
                                cx={fretX}
                                cy={centerY}
                                r={6}
                                fill="var(--fret-marker, rgba(255, 255, 255, 0.15))"
                            />
                        )}

                        {/* Double Inlay Circles (12th / 24th frets) */}
                        {isDouble && (
                            <>
                                <circle
                                    cx={fretX}
                                    cy={y(2.5)}
                                    r={6}
                                    fill="var(--fret-marker, rgba(255, 255, 255, 0.15))"
                                />
                                <circle
                                    cx={fretX}
                                    cy={y(numStrings - 1.5)}
                                    r={6}
                                    fill="var(--fret-marker, rgba(255, 255, 255, 0.15))"
                                />
                            </>
                        )}

                        {/* Fret Number Label Below the Neck */}
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

            {/* ------------------------------------------------------------------- */}
            {/* LAYER 2: FRET LINES                                                 */}
            {/* ------------------------------------------------------------------- */}
            {Array.from({ length: numFrets + 1 }, (_, f) => (
                <line
                    key={`fret-${f}`}
                    x1={MARGIN + f * FRET_WIDTH}
                    y1={MARGIN}
                    x2={MARGIN + f * FRET_WIDTH}
                    y2={height - MARGIN}
                    stroke="var(--fret-line)"
                    strokeWidth={f === 0 ? 4 : 1}
                />
            ))}

            {/* ------------------------------------------------------------------- */}
            {/* LAYER 3: Guitar strings                                             */}
            {/* ------------------------------------------------------------------- */}
            {Array.from({ length: numStrings }, (_, i) => {
                const stringNum = i + 1;
                return (
                    <line
                        key={`string-${stringNum}`}
                        x1={MARGIN}
                        y1={y(stringNum)}
                        x2={width - MARGIN}
                        y2={y(stringNum)}
                        stroke="var(--string-line)"
                        strokeWidth={1 + (numStrings - stringNum) * 0.3}
                    />
                );
            })}

            {/* ------------------------------------------------------------------- */}
            {/* LAYER 4: INTERACTIVE NOTE DOTS & ACTIVE HIGHLIGHTS                  */}
            {/* ------------------------------------------------------------------- */}
            {Array.from({ length: numStrings }, (_, si) =>
                Array.from({ length: numFrets + 1 }, (_, fret) => {
                    const stringNum = si + 1;
                    const key = `${stringNum}-${fret}`;
                    const dot = dotByKey.get(key);
                    const isActive = activeSet.has(key);

                    return (
                        <g
                            key={key}
                            onClick={() => onFretClick?.(stringNum, fret)}
                            style={{ cursor: onFretClick ? "pointer" : "default" }}
                        >
                            <circle cx={x(fret)} cy={y(stringNum)} r={12} fill="transparent" />
                            {dot && !isActive && (
                                <circle
                                    cx={x(fret)}
                                    cy={y(stringNum)}
                                    r={8}
                                    fill={dot.role === "root" ? "var(--root-color)" : "var(--scale-color)"}
                                />
                            )}
                            {isActive && (
                                <circle
                                    cx={x(fret)}
                                    cy={y(stringNum)}
                                    r={10}
                                    fill="var(--active-color)"
                                    style={{ transition: "cx 80ms linear, cy 80ms linear" }}
                                />
                            )}
                        </g>
                    );
                })
            )}
        </svg>
    );
}