import Dexie, { type Table } from "dexie";
import type { TabEntry } from "../types";

// Single storage layer that works identically in the browser
// and inside the Tauri webview
class FretVizDB extends Dexie {
    tabs!: Table<TabEntry, string>;

    constructor() {
        super("fretviz");
        this.version(1).stores({
            // indexes: id (pk), title for search, updatedAt for sorting recents
            tabs: "id, title, updatedAt",
        });
    }
}

export const db = new FretVizDB();

export async function saveTab(entry: TabEntry) {
    await db.tabs.put(entry);
}

export async function listTabs(): Promise<TabEntry[]> {
    return db.tabs.orderBy("updatedAt").reverse().toArray();
}

export async function deleteTab(id: string) {
    await db.tabs.delete(id);
}

export async function getTab(id: string): Promise<TabEntry | undefined> {
    return db.tabs.get(id);
}