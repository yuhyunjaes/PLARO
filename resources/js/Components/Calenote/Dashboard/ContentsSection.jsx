import Weather from "@/Components/Calenote/Dashboard/ContentsSection/Weather.jsx";
import Calendar from "@/Components/Calenote/Dashboard/ContentsSection/Calendar.jsx";
import Notepad from "@/Components/Calenote/Dashboard/ContentsSection/Notepad.jsx";
import LifeBot from "@/Components/Calenote/Dashboard/ContentsSection/LifeBot.jsx";

export default function ContentsSection() {
    const components = {
        Weather,
        Calendar,
        Notepad,
        LifeBot,
    };

    return (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 gap-5">
            {Object.entries(components).map(([name, Component], index) => (
                <div
                    key={index}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3 lg:p-5 h-full"
                >
                    <Component />
                </div>
            ))}
        </div>
    );
}
