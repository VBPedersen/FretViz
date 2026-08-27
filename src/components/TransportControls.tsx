interface TransportControlsProps {
    isPlaying: boolean;
    isReady: boolean;
    speed: number;
    onPlayPause: () => void;
    onStop: () => void;
    onSpeedChange: (speed: number) => void;
}

// Speed constants
const SPEED_MIN = 0.25;
const SPEED_MAX = 2.0;
const SPEED_STEP = 0.05;

/**
 * Controls component for controlling the playing of a sheet of music (e.g. songs as .gp* files)
 * @param isPlaying - is it currently playing
 * @param isReady - is controller ready
 * @param onPlayPause - callback: what to do when clicking play/pause
 * @param onSpeedChange - callback: what to do when changing speed via controls
 * @constructor
 */
export function TransportControls({
                                      isPlaying,
                                      isReady,
                                      onPlayPause,
                                      onSpeedChange,
    onStop, speed
                                  }: TransportControlsProps) {
    function clampSpeed(v: number) {
        return Math.min(SPEED_MAX, Math.max(SPEED_MIN, v));
    }

    return (
        <div className="flex items-center gap-4">
            <button onClick={onPlayPause} disabled={!isReady} className="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-500 disabled:opacity-40">
                {isPlaying ? "Pause" : "Play"}
            </button>
            <button onClick={onStop} disabled={!isReady} className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 disabled:opacity-40">
                Stop
            </button>

            <div
                className="flex items-center gap-1 text-sm text-neutral-400"
                onWheel={(e) => {
                    e.preventDefault();
                    onSpeedChange(clampSpeed(speed + (e.deltaY < 0 ? SPEED_STEP : -SPEED_STEP)));
                }}
            >
                <button onClick={() => onSpeedChange(clampSpeed(speed - SPEED_STEP))} className="px-2 rounded bg-neutral-800 hover:bg-neutral-700">−</button>
                <input
                    type="number"
                    value={speed.toFixed(2)}
                    step={SPEED_STEP}
                    min={SPEED_MIN}
                    max={SPEED_MAX}
                    onChange={(e) => onSpeedChange(clampSpeed(Number(e.target.value)))}
                    className="w-16 rounded bg-neutral-800 px-2 py-1 text-center text-neutral-100 [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button onClick={() => onSpeedChange(clampSpeed(speed + SPEED_STEP))} className="px-2 rounded bg-neutral-800 hover:bg-neutral-700">+</button>
            </div>
        </div>
    );
}