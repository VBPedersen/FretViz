interface TransportControlsProps {
    isPlaying: boolean;
    isReady: boolean;
    onPlayPause: () => void;
    onSpeedChange: (speed: number) => void;
}

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
                                  }: TransportControlsProps) {
    return (
        <div className="flex items-center gap-4">
            <button
                onClick={onPlayPause}
                disabled={!isReady}
                className="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-500 disabled:opacity-40 transition-colors"
            >
                {isPlaying ? "Pause" : "Play"}
            </button>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
                Speed
                <input
                    type="range"
                    min={0.25}
                    max={1.5}
                    step={0.05}
                    defaultValue={1}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    className="accent-pink-600"
                />
            </label>
        </div>
    );
}