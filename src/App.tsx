import { useEffect, useRef } from "react";
import { AlphaTabApi } from "@coderline/alphatab";

export default function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<AlphaTabApi | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const api = new AlphaTabApi(containerRef.current, {
            core: {
                file: "/tabs/test-tabs/test1.gpx",
                fontDirectory: "/alphatab/font/",
                scriptFile: "/alphatab/alphaTab.worker.mjs",
            },
            player: {
                enablePlayer: true,
                soundFont: "/soundfonts/sonivox.sf2",
            },
        });

        apiRef.current = api;

        api.renderFinished.on(() => console.log("rendered ok"));
        api.playerStateChanged.on((e) => console.log("player state:", e.state));
        api.playerReady.on(() => console.log("player ready"));

        // SoundFont events
        api.soundFontLoad.on((e) => {
            console.log(`Loading SoundFont: ${e.loaded} / ${e.total} bytes`);
        });

        api.soundFontLoaded.on(() => {
            console.log("SoundFont fully loaded!");
        });



        api.tex("\\tempo 120 . 3.3 5.3 | 3.2 5.2 7.2 | 5.2 9.1 7.1 |");


        console.log(api.masterVolume);

        return () => {
            api.destroy();
            apiRef.current = null;
        };
    }, []);

    return (
        <div>
            <div ref={containerRef} style={{ width: "100%", minHeight: 400 }} />
            <button onClick={() => apiRef.current?.playPause()}>Play</button>
        </div>
    );
}
