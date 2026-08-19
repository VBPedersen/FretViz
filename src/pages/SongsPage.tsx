import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileImportButton } from "../components/FileImportButton";
import { db } from "../lib/db";
import type { TabEntry } from "../types";

/**
 * My songs page, that shows and allows for upload of .gp* files
 * @constructor
 */
export function SongsPage() {
    const [songs, setSongs] = useState<TabEntry[]>([]);
    const navigate = useNavigate();

    async function refresh() {
        const all = await db.tabs.orderBy("updatedAt").reverse().toArray();
        setSongs(all);
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleImport(file: File) {
        const buffer = await file.arrayBuffer();
        const id = crypto.randomUUID();
        const now = Date.now();

        const entry: TabEntry = {
            id,
            title: file.name.replace(/\.(gp3|gp4|gp5|gpx|gp)$/i, ""),
            source: "upload",
            createdAt: now,
            updatedAt: now,
            format: "gp",
            content: buffer,
        };

        await db.tabs.put(entry);
        navigate(`/player/${id}`);
    }

    async function handleDelete(id: string) {
        await db.tabs.delete(id);
        refresh();
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <header className="flex items-center gap-6 border-b border-neutral-800 pb-3">
                <h2 className="text-lg font-semibold">My Songs</h2>
                <FileImportButton onFileSelected={handleImport} />
            </header>

            {songs.length === 0 ? (
                <p className="text-neutral-500 text-sm">No songs imported yet.</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {songs.map((song) => (
                        <li
                            key={song.id}
                            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 hover:border-neutral-700"
                        >
                            <button
                                onClick={() => navigate(`/player/${song.id}`)}
                                className="text-left flex-1"
                            >
                                <div className="font-medium">{song.title}</div>
                                <div className="text-xs text-neutral-500">
                                    {new Date(song.updatedAt).toLocaleDateString()}
                                </div>
                            </button>
                            <button
                                onClick={() => handleDelete(song.id)}
                                className="text-xs text-neutral-500 hover:text-red-400 ml-4"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
