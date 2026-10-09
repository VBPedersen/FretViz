type VisualizerMode = "scale" | "triad" | "chord";

interface VisualizerModePickerProps {
	mode: VisualizerMode;
	onChange: (mode: VisualizerMode) => void;
}

const MODES: { value: VisualizerMode; label: string }[] = [
	{ value: "scale", label: "Scale" },
	{ value: "triad", label: "Triad" },
	{ value: "chord", label: "Chord" },
];

export function VisualizerModePicker({
	mode,
	onChange,
}: VisualizerModePickerProps) {
	return (
		<div className="flex rounded bg-neutral-800 p-0.5">
			{MODES.map((m) => (
				<button
					key={m.value}
					onClick={() => onChange(m.value)}
					className={`px-3 py-1 text-sm rounded ${
						mode === m.value
							? "bg-pink-600 text-white"
							: "text-neutral-400 hover:text-neutral-200"
					}`}
				>
					{m.label}
				</button>
			))}
		</div>
	);
}
