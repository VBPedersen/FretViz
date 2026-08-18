import {HomePage} from "./pages/HomePage.tsx";
import {ThemeProvider} from "./context/ThemeContext.tsx";

export default function App() {
    return (
        <ThemeProvider>
            <HomePage />
        </ThemeProvider>
    );
}
