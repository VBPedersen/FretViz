import { NavLink } from "react-router-dom";

const links = [
    { to: "/", label: "My Songs" },
    { to: "/tabs", label: "My Tabs" },
    { to: "/scales", label: "Scale Visualizer" },
    { to: "/settings", label: "Settings" },
];

export function Sidebar() {
    return (
        <nav className="w-48 shrink-0 border-r border-neutral-800 bg-neutral-950 p-3">
            <h1 className="mb-4 px-2 text-lg font-semibold">FretViz</h1>
            <ul className="flex flex-col gap-1">
                {links.map((link) => (
                    <li key={link.to}>
                        <NavLink
                            to={link.to}
                            className={({ isActive }) =>
                                `block rounded px-3 py-2 text-sm ${
                                    isActive
                                        ? "bg-pink-600 text-white"
                                        : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}