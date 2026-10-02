interface PositionPickerProps {
    positionIndex: number;
    totalPositions: number;
    onChange: (index: number) => void;
}

export function PositionPicker({ positionIndex, totalPositions, onChange }: PositionPickerProps) {
    console.log(positionIndex, totalPositions, positionIndex);
    if (totalPositions <= 1) return null; // nothing to page through

    return (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
            <button
                onClick={() => onChange(Math.max(0, positionIndex - 1))}
                disabled={positionIndex === 0}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
            >
                ←
            </button>
            <span>Position {positionIndex + 1} / {totalPositions}</span>
            <button
                onClick={() => onChange(Math.min(totalPositions - 1, positionIndex + 1))}
                disabled={positionIndex === totalPositions - 1}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30"
            >
                →
            </button>
        </div>
    );
}