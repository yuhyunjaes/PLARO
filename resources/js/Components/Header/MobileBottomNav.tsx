import { Link, usePage } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faBook, faChartLine, faRobot } from "@fortawesome/free-solid-svg-icons";

interface MobileBottomNavItem {
    label: string;
    href: string;
    icon: any;
}

const mobileNavItems: MobileBottomNavItem[] = [
    { label: "캘린더", href: "/calendar", icon: faCalendarDays },
    { label: "메모장", href: "/notepad", icon: faBook },
    { label: "PlaroAI", href: "/plaroai", icon: faRobot },
    { label: "대시보드", href: "/dashboard", icon: faChartLine },
];

export default function MobileBottomNav() {
    const { url } = usePage();
    const currentPath = (url ?? "").split("?")[0] ?? "";

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[40] border-t border-gray-300 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[padding:max(0px)]:pb-[env(safe-area-inset-bottom)]">
            <ul className="grid grid-cols-4 h-16">
                {mobileNavItems.map((item) => {
                    const active = currentPath.startsWith(item.href);
                    return (
                        <li key={item.href} className="h-full">
                            <Link
                                href={item.href}
                                className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                                    active
                                        ? "text-blue-600 dark:text-blue-300"
                                        : "text-gray-600 dark:text-gray-300"
                                }`}
                            >
                                <FontAwesomeIcon icon={item.icon} className="text-sm" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

