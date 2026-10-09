import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { PlayerPage } from "./pages/PlayerPage";
import { ScaleVisualizerPage } from "./pages/ScaleVisualizerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SongsPage } from "./pages/SongsPage";
import { TabsPage } from "./pages/TabsPage";

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
