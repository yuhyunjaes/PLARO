// 모바일에서 보여질 헤더

import { Link } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX, faAngleDown, faUser, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {menuData} from "./MenuData";
import {AuthUser} from "../../Types/HomeTypes";

interface MobileSidebarProps {
    sideBar: boolean;
    setSideBar: Dispatch<SetStateAction<boolean>>;
    auth: {
        user: AuthUser | null;
    };
}

export default function MobileSidebar({ sideBar, setSideBar, auth } : MobileSidebarProps) {

    const [openStates, setOpenStates] = useState<boolean[]>(menuData.map(() => false));
    const [fadeSideBar, setFadeSideBar] = useState(false);

    const toggleMenu = (index: number) => {
        setOpenStates(prev => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
    };

    useEffect(() => {
        if (!sideBar) setOpenStates([]);
    }, [sideBar]);

    const handleResize = useCallback(() => {
        if (window.innerWidth >= 768) setSideBar(false);
    }, []);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [handleResize]);

    const CloseSideBar = () => {
        setFadeSideBar(true);
        setTimeout(()=> {
            setFadeSideBar(false);
            setSideBar(false);
        }, 400)
    }

    if (!sideBar) return null;

    return (
        <div className={`fixed top-0 left-0 w-screen h-screen z-[999] md:hidden ${fadeSideBar ? 'animate-fadeOutSideBar' : 'animate-fadeInsideBar'}`}>
            <div className="w-[calc(100%-230px)] h-full absolute top-0 left-0" onClick={CloseSideBar}></div>
            <div className="w-[230px] h-full absolute top-0 right-0 bg-white shadow dark:shadow-gray-800 dark:bg-gray-950">
                <header className="w-full px-5 h-[70px] flex justify-between items-center">
                    {!auth?.user && (
                        <Link href="/login" className="m-0 h-full flex items-center text-gray-950 dark:text-white font-semibold space-x-3">
                            <FontAwesomeIcon icon={faUser} />
                            <span>로그인</span>
                            <FontAwesomeIcon icon={faAngleRight} />
                        </Link>
                    )}

                    <button className="m-0" onClick={CloseSideBar}>
                        <FontAwesomeIcon icon={faX} className="text-gray-950 dark:text-white text-xl" />
                    </button>
                </header>

                <main className="w-full px-5 space-y-5 h-[calc(100vh-70px)] overflow-y-auto overflow-x-hidden">
                    {menuData.map((menu, index) => (
                        <div key={index} className="mt-5">
                            <button
                                className="flex justify-between items-center text-gray-950 dark:text-white cursor-pointer w-full"
                                onClick={() => toggleMenu(index)}
                            >
                                <p className="font-semibold text-sm">{menu.title}</p>
                                <FontAwesomeIcon
                                    icon={faAngleDown}
                                    className={`text-sm transition-transform duration-150 ${openStates[index] ? "rotate-180" : ""}`}
                                />
                            </button>

                            <div
                                className={`overflow-hidden transition-[max-height] duration-150
                            ${openStates[index] ? "max-h-[200px]" : "max-h-0"}`}
                            >
                                {menu.links.map((link, i) => (
                                    <Link key={i} href={link.href} className="block my-2 text-gray-950 dark:text-white text-xs font-light">
                                        - {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
}
