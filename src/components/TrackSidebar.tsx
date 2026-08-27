import { useState } from "react";

interface TrackRowState {
    index: number;
    name: string;
    muted: boolean;
    solo: boolean;
    volume: number;
    instrument?: string; // e.g. "guitar", "bass", "drums" — drives the icon
}

interface TrackSidebarProps {
    tracks: TrackRowState[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onMuteToggle: (index: number) => void;
    onSoloToggle: (index: number) => void;
    onVolumeChange: (index: number, volume: number) => void;
}

const COLLAPSED_WIDTH = "w-14";
const EXPANDED_WIDTH = "w-64";

export function TrackSidebar({
     tracks, selectedIndex, onSelect, onMuteToggle, onSoloToggle, onVolumeChange
}: TrackSidebarProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            className={`shrink-0 border-l border-neutral-800 bg-neutral-950 p-2 flex flex-col gap-1 
            transition-[width] duration-150 ease-out overflow-hidden ${expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH}`}
        >
            {tracks.map((t) => (
                <div
                    key={t.index}
                    onClick={() => onSelect(t.index)}
                    className={`rounded p-2 cursor-pointer flex items-center gap-2 ${
                        t.index === selectedIndex ? "bg-pink-600/20 border border-pink-600" : "hover:bg-neutral-800"
                    }`}
                >
                    <TrackIcon instrument={t.instrument} muted={t.muted} solo={t.solo} />

                    {/* everything below only makes sense once expanded — hidden via width+overflow, not display:none, so the transition doesn't jump */}
                    {expanded && (
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-sm">
                                <span className="truncate">{t.name}</span>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onMuteToggle(t.index); }}
                                        className={`text-xs px-1.5 rounded ${t.muted ? "bg-red-600" : "bg-neutral-800"}`}
                                    >Mute</button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSoloToggle(t.index); }}
                                        className={`text-xs px-1.5 rounded ${t.solo ? "bg-yellow-500 text-black" : "bg-neutral-800"}`}
                                    >Solo</button>
                                </div>
                            </div>
                            <input
                                type="range" min={0} max={1} step={0.05} value={t.volume}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => onVolumeChange(t.index, Number(e.target.value))}
                                className="w-full accent-pink-600 mt-1"
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
function TrackIcon({ instrument, muted, solo }: { instrument?: string; muted: boolean; solo: boolean }) {
    const glyphs: Record<string, string> = {
        guitar: "🎸",
        bass: "🎸", // TODO distinct glyph/icon; emoji set has no dedicated bass symbol
        drums: "🥁",
        piano: "🎹",
        strings: "🎻",
        synth: "🎶",
        other: "🎵",
    };
    const glyph = glyphs[instrument ?? "other"] ?? "🎵";

    return (
        <div className="relative shrink-0 w-6 h-6 flex items-center justify-center text-base" title={instrument}>
            <span className={muted ? "opacity-30" : ""}>{glyph}</span>
            {solo && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400" />}
        </div>
    );
}
