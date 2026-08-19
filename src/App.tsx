import {ThemeProvider} from "./context/ThemeContext.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SongsPage } from "./pages/SongsPage";
import { PlayerPage } from "./pages/PlayerPage";
import { TabsPage } from "./pages/TabsPage";
import { ScaleVisualizerPage } from "./pages/ScaleVisualizerPage";
import { SettingsPage } from "./pages/SettingsPage";
import {Sidebar} from "./components/Sidebar.tsx";

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <div className="flex h-screen bg-neutral-900 text-neutral-100">
                    <Sidebar />
                    <div className="flex-1 overflow-auto">
                        <Routes>
                            <Route path="/" element={<SongsPage />} />
                            <Route path="/player/:songId" element={<PlayerPage />} />
                            <Route path="/tabs" element={<TabsPage />} />
                            <Route path="/scales" element={<ScaleVisualizerPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                    </div>
                </div>
            </BrowserRouter>
        </ThemeProvider>
    );
}
