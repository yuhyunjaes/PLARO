// 캘리노트 사이드바 영역

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faChartLine, faClipboard, faCalendar, faX } from "@fortawesome/free-solid-svg-icons";
import {faSquareCaretLeft, faSquareCaretRight} from "@fortawesome/free-regular-svg-icons";
import {Link, usePage} from "@inertiajs/react";
import {Dispatch, SetStateAction, useCallback, useEffect, useRef} from "react";
import {CalenoteSectionsData} from "./CalenoteSectionsData";

interface SideBarSectionProps {
    sideBar: number;
    setSideBar: Dispatch<SetStateAction<number>>;
    sideBarToggle: boolean;
    setSideBarToggle: Dispatch<SetStateAction<boolean>>;
}

export default function SideBarSection({sideBar, setSideBar, sideBarToggle, setSideBarToggle } : SideBarSectionProps) {
    const {url} = usePage();
    const icons = {
        faChartLine,
        faClipboard,
        faCalendar
    };

    const sidebarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside= (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                if(!sideBarToggle) return;
                setSideBarToggle(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sideBarToggle]);

    return (
        <aside
            ref={sidebarRef}
            className={`
                fixed top-[70px] left-0 z-[10] h-[calc(100vh-70px)]
                bg-white dark:bg-gray-950 overflow-hidden border-r border-gray-300 dark:border-gray-800 transition-[width] duration-150
                ${sideBarToggle ? "pointer-events-auto" : "pointer-events-none"}
                md:relative md:top-0 md:left-auto md:z-auto md:h-full md:pointer-events-auto
            `}
            style={sideBarToggle ? {width: "230px"} : {width: `${sideBar}px`}}
            >
            {!sideBarToggle ? (
                <div
                    className={`px-5 border-b border-gray-300 dark:border-gray-800 py-2 flex ${(sideBar > 50) ? "justify-end" : "justify-center"}`}>
                    <button
                        className="normal-text cursor-pointer"
                        onClick={() => {
                            (sideBar > 50) ? setSideBar(50) : setSideBar(230);
                        }}
                    >
                        <FontAwesomeIcon
                            className="text-xl"
                            icon={(sideBar > 50) ? faSquareCaretLeft : faSquareCaretRight}
                        />
                    </button>
                </div>
            ) : ""}

            <div className="my-3">
                {
                    CalenoteSectionsData.map((section, index) => (
                        <Link
                            key={index}
                            href={section.link}
                            className={`
                            ${(sideBar > 50 || sideBarToggle) ? "btn justify-start" : "justify-center"} transition-colors duration-300 w-full flex items-center px-0 py-2
                            ${((index !== 0) ? (url.includes(section.link)) : (url === section.link))
                                ? "bg-blue-500 text-white"
                                : "text-gray-950 dark:text-white hover:bg-blue-500/80 hover:text-white"}
                        `}>

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
        </aside>
    );
}
