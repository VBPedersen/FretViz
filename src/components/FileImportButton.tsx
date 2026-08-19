interface FileImportButtonProps {
    onFileSelected: (file: File) => void;
}

/**
 * File import button component to allow for importing songs as .gp* files
 * @param onFileSelected - callback: what to do when file is selected
 * @constructor
 */
export function FileImportButton({ onFileSelected }: FileImportButtonProps) {
    return (
        <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-neutral-200">
            <span>Import</span>
            <input
                type="file"
                accept=".gp,.gp3,.gp4,.gp5,.gpx"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelected(file);
                }}
            />
        </label>
    );
}