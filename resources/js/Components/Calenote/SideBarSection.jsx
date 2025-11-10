import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faHouse, faClipboard, faCalendar, faX } from "@fortawesome/free-solid-svg-icons";
import {faSquareCaretLeft, faSquareCaretRight} from "@fortawesome/free-regular-svg-icons";
import {CalenoteSectionsData} from "@/Components/Calenote/CalenoteSectionsData.js";
import {Link, usePage} from "@inertiajs/react";

export default function SideBarSection({sideBar, setSideBar, sideBarToggle, setSideBarToggle }) {
    const {url} = usePage();
    const icons = {
        faHouse,
        faClipboard,
        faCalendar
    };

    return (
        <aside
            className={`
                h-full bg-gray-100 dark:bg-gray-950 transition-[width] duration-300 overflow-hidden
                ${sideBarToggle && "fixed inset-0 top-[70px]"}
            `}
            style={sideBarToggle ? {width: "100%"} : {width: `${sideBar}px`}}
            >
            {!sideBarToggle && (
                <div
                    className={`px-5 border-b border-gray-200 dark:border-gray-800 py-2 flex ${(sideBar > 50) ? "justify-end" : "justify-center"}`}>
                    <button
                        className="normal-text cursor-pointer"
                        onClick={() => {
                            (sideBar > 50) ? setSideBar(50) : setSideBar(250);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={(sideBar > 50) ? faSquareCaretLeft : faSquareCaretRight}
                        />
                    </button>
                </div>
            )}

            <div className="my-3">
                {
                    CalenoteSectionsData.map((section, index) => (
                        <Link
                            key={index}
                            href={section.link}
                            className={`
                            ${(sideBar > 50 || sideBarToggle) ? "btn justify-start" : "justify-center rounded"} transition-colors duration-300 w-full flex items-center px-0 py-2
                            ${(url === section.link)
                                ? "bg-gray-200 dark:bg-gray-600 text-gray-950 dark:text-white"
                                : "text-gray-950 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"}
                        `}
                            onClick={() => {
                                setSideBarToggle(false);
                            }}
                        >

                            <FontAwesomeIcon icon={icons[section.icon]} />
                            {
                                (sideBar > 50 || sideBarToggle) && (
                                    <span className="ml-1">
                                            {section.title}
                                        </span>
                                )
                            }
                        </Link>
                    ))
                }
            </div>
            <div className="h-[200px] sm:h-[70px] bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 flex justify-center items-center">
                {(sideBarToggle) && (
                    <button className="size-8 rounded-full shadow bg-gray-950 dark:bg-white text-white dark:text-gray-950" onClick={() => {
                        setSideBarToggle(false);
                    }}>
                        <FontAwesomeIcon icon={faX} />
                    </button>
                )}
            </div>
        </aside>
    );
}
