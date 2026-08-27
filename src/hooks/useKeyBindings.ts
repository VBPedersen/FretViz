import { useEffect, useRef } from "react";

type ActionHandler = () => void;

interface KeyBindingConfig {
    key: string;           // e.g. "Space", "ArrowRight"
    action: string;        // e.g. "playPause", "loopExtendRight"
    doublePressWindowMs?: number; // if set, fires "{action}Double" on rapid double-press
}

const DEFAULT_BINDINGS: KeyBindingConfig[] = [
    { key: "Space", action: "playPause", doublePressWindowMs: 350 },
    { key: "ArrowRight", action: "loopExtendRight" },
    { key: "ArrowLeft", action: "loopExtendLeft" },
];

export function useKeyBindings(
    handlers: Record<string, ActionHandler | undefined>,
    bindings: KeyBindingConfig[] = DEFAULT_BINDINGS
) {
    const lastPressRef = useRef<Record<string, number>>({});
    const handlersRef = useRef(handlers);
    useEffect(() => { handlersRef.current = handlers; }, [handlers]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            // ignore when typing in inputs (e.g. the speed number field)
            if (e.target instanceof HTMLInputElement) return;

            const binding = bindings.find((b) => b.key === e.code);
            if (!binding) return;
            e.preventDefault();

            if (binding.doublePressWindowMs) {
                const now = performance.now();
                const last = lastPressRef.current[binding.key] ?? 0;
                lastPressRef.current[binding.key] = now;

                if (now - last < binding.doublePressWindowMs) {
                    handlersRef.current[`${binding.action}Double`]?.();
                    return;
                }
            }

            handlersRef.current[binding.action]?.();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [bindings]);
}